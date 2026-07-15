using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Sends transactional email via Resend's HTTPS API (https://resend.com). Unlike SMTP — port 587,
/// which many container hosts (Render included) block outbound — this is plain HTTPS to
/// api.resend.com, so it works from anywhere. Selected when <c>Email:Provider = "Resend"</c>.
///
/// Requires <c>Email:Resend:ApiKey</c> (an <c>re_…</c> key) and <c>Email:FromAddress</c> on a domain
/// verified in the Resend dashboard. A send failure throws; the background worker logs and drops it.
/// </summary>
public class ResendEmailSender(HttpClient http, IConfiguration config, ILogger<ResendEmailSender> logger)
    : IEmailSender
{
    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var email = config.GetSection("Email");
        var apiKey = email["Resend:ApiKey"];

        // Mirror the SMTP sender's dev fallback: with no key configured, log instead of throwing so
        // the flow is exercisable before secrets are set.
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning(
                "Resend API key not configured — would have sent to {To} with subject \"{Subject}\":\n{Body}",
                toEmail, subject, htmlBody);
            return;
        }

        var fromAddress = email["FromAddress"];
        if (string.IsNullOrWhiteSpace(fromAddress))
            throw new InvalidOperationException(
                "Email:FromAddress must be set to an address on a domain verified in Resend.");
        var fromName = email["FromName"] ?? "LinguaSwap";

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(new
        {
            from = $"{fromName} <{fromAddress}>",
            to = new[] { toEmail },
            subject,
            html = htmlBody,
        });

        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            // Surface Resend's error so the worker log says *why* (bad key, unverified domain, …).
            throw new InvalidOperationException($"Resend API returned {(int)response.StatusCode}: {body}");
        }
    }
}
