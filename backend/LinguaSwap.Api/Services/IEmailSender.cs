namespace LinguaSwap.Api.Services;

/// <summary>
/// Sends transactional email (currently just account-confirmation messages). Kept as an
/// abstraction so the transport (SMTP today) is swappable and easy to fake in tests.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default);
}
