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

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, secure, ct);
        await client.AuthenticateAsync(user, password ?? string.Empty, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
