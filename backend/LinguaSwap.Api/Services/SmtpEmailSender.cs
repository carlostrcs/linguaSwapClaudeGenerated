using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace LinguaSwap.Api.Services;

/// <summary>
/// SMTP implementation of <see cref="IEmailSender"/> (MailKit). Driven entirely by the "Email"
/// config section, so the same code points at Gmail in dev and any SMTP host in production.
/// Real credentials come from user-secrets / env vars (appsettings ships empty placeholders).
/// </summary>
public class SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    /// <summary>Milliseconds. A blocked SMTP port must fail in seconds, not minutes.</summary>
    private const int SmtpTimeout = 15_000;

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var email = config.GetSection("Email");
        var smtp = email.GetSection("Smtp");
        var host = smtp["Host"];
        var user = smtp["User"];
        var password = smtp["Password"];

        // Dev fallback: with no SMTP configured we log the message (link included) instead of
        // throwing, so the whole confirmation flow is testable before any secrets are set.
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user))
        {
            logger.LogWarning(
                "Email SMTP not configured — would have sent to {To} with subject \"{Subject}\":\n{Body}",
                toEmail, subject, htmlBody);
            return;
        }

        var fromAddress = string.IsNullOrWhiteSpace(email["FromAddress"]) ? user : email["FromAddress"]!;
        var fromName = email["FromName"] ?? "LinguaSwap";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        var port = int.TryParse(smtp["Port"], out var p) ? p : 587;
        var useStartTls = !bool.TryParse(smtp["UseStartTls"], out var s) || s; // default true
        var secure = useStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.SslOnConnect;

        // Bound the whole exchange. Many hosts (Render included) blackhole outbound SMTP, and
        // MailKit's default 2-minute timeout would otherwise tie up a background worker for
        // minutes per message. Fail fast and let the caller log it.
        using var client = new SmtpClient { Timeout = SmtpTimeout };
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromMilliseconds(SmtpTimeout));

        await client.ConnectAsync(host, port, secure, cts.Token);
        await client.AuthenticateAsync(user, password ?? string.Empty, cts.Token);
        await client.SendAsync(message, cts.Token);
        await client.DisconnectAsync(true, cts.Token);
    }
}
