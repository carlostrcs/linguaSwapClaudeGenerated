using System.Threading.Channels;

namespace LinguaSwap.Api.Services;

/// <summary>A message waiting to be sent.</summary>
public record OutboundEmail(string To, string Subject, string HtmlBody);

/// <summary>
/// In-process outbox. Callers hand a message over and return immediately — sending an email is a
/// network round-trip to a third party and must never sit on an HTTP request's critical path.
/// (Registration used to await the SMTP send: when the host blocked outbound SMTP, the connect
/// blackholed and MailKit's 2-minute default timeout hung the whole request.)
///
/// Bounded + DropWrite: if the sender falls badly behind we shed confirmation emails rather than
/// grow the queue without limit. Losing one is survivable — the user can resend from the in-app banner.
/// </summary>
public class EmailQueue
{
    private readonly Channel<OutboundEmail> _channel = Channel.CreateBounded<OutboundEmail>(
        new BoundedChannelOptions(500) { FullMode = BoundedChannelFullMode.DropWrite });

    public bool TryEnqueue(OutboundEmail email) => _channel.Writer.TryWrite(email);

    public IAsyncEnumerable<OutboundEmail> ReadAllAsync(CancellationToken ct) =>
        _channel.Reader.ReadAllAsync(ct);
}

/// <summary>Drains <see cref="EmailQueue"/> in the background. A send failure is logged and dropped —
/// it must never take the process down, and the caller is long gone by now.</summary>
public class EmailBackgroundSender(
    EmailQueue queue,
    IServiceScopeFactory scopes,
    ILogger<EmailBackgroundSender> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                // IEmailSender is scoped; the request scope that queued this is already disposed.
                using var scope = scopes.CreateScope();
                var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await sender.SendAsync(message.To, message.Subject, message.HtmlBody, stoppingToken);
                logger.LogInformation("Sent email to {To}", message.To);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break; // shutting down
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send email to {To}", message.To);
            }
        }
    }
}
