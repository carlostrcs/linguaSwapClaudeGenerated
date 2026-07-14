using LinguaSwap.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Owns the email-confirmation flow: generate an Identity confirmation token, mail the user a
/// link back to the frontend, and validate the token when they return. Sending is best-effort —
/// a mail failure is logged but never propagated, so it can't break registration (soft mode:
/// the user is signed in regardless and can resend from the in-app banner).
/// </summary>
public class EmailConfirmationService(
    UserManager<ApplicationUser> users,
    EmailQueue email,
    IConfiguration config,
    ILogger<EmailConfirmationService> logger)
{
    private string FrontendBaseUrl => config["FrontendBaseUrl"] ?? "http://localhost:5173";

    /// <summary>Generate a confirmation token and <b>queue</b> the confirmation link for delivery.
    /// The token comes from the DB (fast), but the mail itself is handed to <see cref="EmailQueue"/>
    /// and sent on a background worker — awaiting SMTP here once hung registration for two minutes
    /// when the host blocked outbound mail.</summary>
    public async Task SendConfirmationEmailAsync(ApplicationUser user)
    {
        try
        {
            var token = await users.GenerateEmailConfirmationTokenAsync(user);
            // Escaping is mandatory: default Identity tokens contain +, / and = characters.
            var link = $"{FrontendBaseUrl}/confirm-email" +
                       $"?userId={Uri.EscapeDataString(user.Id)}" +
                       $"&token={Uri.EscapeDataString(token)}";

            var name = string.IsNullOrWhiteSpace(user.DisplayName) ? "there" : user.DisplayName;
            var html =
                $"""
                 <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
                 <p>Thanks for signing up for LinguaSwap. Please confirm your email address to finish
                 setting up your account:</p>
                 <p><a href="{link}">Confirm my email</a></p>
                 <p>If the button doesn't work, copy and paste this link into your browser:</p>
                 <p>{link}</p>
                 <p>If you didn't create a LinguaSwap account, you can safely ignore this email.</p>
                 """;

            if (!email.TryEnqueue(new OutboundEmail(user.Email!, "Confirm your LinguaSwap email", html)))
                logger.LogWarning("Email queue full — dropped confirmation email for {Email}", user.Email);
        }
        catch (Exception ex)
        {
            // Non-fatal by design — never let a mail hiccup fail the caller (register/resend).
            logger.LogError(ex, "Failed to queue confirmation email to {Email}", user.Email);
        }
    }

    /// <summary>Validate a confirmation token and mark the address confirmed. Returns false if invalid.</summary>
    public async Task<bool> ConfirmAsync(string userId, string token)
    {
        var user = await users.FindByIdAsync(userId);
        if (user is null) return false;

        var result = await users.ConfirmEmailAsync(user, token);
        return result.Succeeded;
    }
}
