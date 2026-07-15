using LinguaSwap.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Owns the forgot/reset-password flow: generate an Identity password-reset token, mail the user a
/// link back to the frontend, and validate the token + set the new password when they return.
/// Mirrors <see cref="EmailConfirmationService"/> — the token is generated in-request (a fast DB
/// call) but the email is queued (<see cref="EmailQueue"/>) and sent on a background worker, never
/// awaited inside the HTTP request.
/// </summary>
public class PasswordResetService(
    UserManager<ApplicationUser> users,
    EmailQueue email,
    IConfiguration config,
    ILogger<PasswordResetService> logger)
{
    private string FrontendBaseUrl => config["FrontendBaseUrl"] ?? "http://localhost:5173";

    /// <summary>Generate a reset token for the user and queue an email with the reset link.</summary>
    public async Task SendResetEmailAsync(ApplicationUser user)
    {
        try
        {
            var token = await users.GeneratePasswordResetTokenAsync(user);
            // Escaping is mandatory: default Identity tokens contain +, / and = characters.
            var link = $"{FrontendBaseUrl}/reset-password" +
                       $"?userId={Uri.EscapeDataString(user.Id)}" +
                       $"&token={Uri.EscapeDataString(token)}";

            var name = string.IsNullOrWhiteSpace(user.DisplayName) ? "there" : user.DisplayName;
            var html =
                $"""
                 <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
                 <p>We received a request to reset your LinguaSwap password. Click the link below to
                 choose a new one:</p>
                 <p><a href="{link}">Reset my password</a></p>
                 <p>If the button doesn't work, copy and paste this link into your browser:</p>
                 <p>{link}</p>
                 <p>This link expires shortly. If you didn't request a password reset, you can safely
                 ignore this email — your password won't change.</p>
                 """;

            if (!email.TryEnqueue(new OutboundEmail(user.Email!, "Reset your LinguaSwap password", html)))
                logger.LogWarning("Email queue full — dropped password-reset email for {Email}", user.Email);
        }
        catch (Exception ex)
        {
            // Non-fatal: the endpoint returns the same neutral response whether or not this succeeds
            // (anti-enumeration), so a mail hiccup must never surface to the caller.
            logger.LogError(ex, "Failed to queue password-reset email to {Email}", user.Email);
        }
    }

    /// <summary>Validate the reset token and set the new password. Returns the Identity result so the
    /// controller can surface why a reset failed (bad token vs. weak password).</summary>
    public async Task<IdentityResult> ResetAsync(string userId, string token, string newPassword)
    {
        var user = await users.FindByIdAsync(userId);
        // Don't reveal whether the user exists; a missing user looks like an invalid token.
        if (user is null)
            return IdentityResult.Failed(new IdentityError
            {
                Code = "InvalidToken",
                Description = "This reset link is invalid or has expired."
            });

        var result = await users.ResetPasswordAsync(user, token, newPassword);

        // A successful reset proves ownership of the address, so clear any brute-force lockout —
        // otherwise a user who reset *because* they were locked out still couldn't log in.
        if (result.Succeeded)
        {
            await users.SetLockoutEndDateAsync(user, null);
            await users.ResetAccessFailedCountAsync(user);
        }

        return result;
    }
}
