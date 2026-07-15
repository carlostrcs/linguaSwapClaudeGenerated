using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController(
    UserManager<ApplicationUser> users,
    TokenService tokens,
    RefreshTokenService refreshTokens,
    EmailConfirmationService confirmations,
    PasswordResetService passwordResets) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        if (await users.FindByEmailAsync(req.Email) is not null)
            return Conflict(new { message = "That email is already registered." });

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            DisplayName = req.DisplayName
        };

        var result = await users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToArray();
            return BadRequest(new { message = string.Join(" ", errors), errors });
        }

        // New accounts start their one-time free trial automatically.
        var now = DateTime.UtcNow;
        user.TrialStartedAt = now;
        user.TrialEndsAt = now.AddDays(PremiumService.TrialDays);
        await users.UpdateAsync(user);

        // Email the confirmation link (best-effort — a mail failure won't fail registration).
        await confirmations.SendConfirmationEmailAsync(user);

        return Ok(await BuildAuthResponseAsync(user));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await users.FindByEmailAsync(req.Email);
        if (user is null)
            return Unauthorized(new { message = "Invalid email or password." });

        // Identity's lockout counters are only maintained if we drive them ourselves —
        // CheckPasswordAsync does not. Without this, password guessing is unlimited.
        if (await users.IsLockedOutAsync(user))
            return Unauthorized(new { message = "Too many failed attempts. Try again later." });

        if (!await users.CheckPasswordAsync(user, req.Password))
        {
            await users.AccessFailedAsync(user);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        await users.ResetAccessFailedCountAsync(user);
        return Ok(await BuildAuthResponseAsync(user));
    }

    /// <summary>Exchange a valid refresh token for a fresh access token + a rotated refresh token.</summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest req)
    {
        var rotated = await refreshTokens.ValidateAndRotateAsync(req.RefreshToken);
        if (rotated is null)
            return Unauthorized(new { message = "Invalid or expired refresh token." });

        var (user, newRefreshToken) = rotated.Value;
        var (token, expiresAt) = tokens.CreateToken(user);
        return Ok(new AuthResponse(
            token, expiresAt, newRefreshToken, user.Id, user.Email!, user.DisplayName,
            user.HasPremiumAccess(DateTime.UtcNow), user.IsPremium, user.TrialEndsAt,
            user.EmailConfirmed));
    }

    /// <summary>Revoke a refresh token so it can no longer renew a session.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest req)
    {
        await refreshTokens.RevokeAsync(req.RefreshToken);
        return NoContent();
    }

    /// <summary>Confirm an email address from the link in the confirmation email.</summary>
    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailRequest req)
    {
        if (await confirmations.ConfirmAsync(req.UserId, req.Token))
            return Ok(new { confirmed = true });

        return BadRequest(new { message = "This confirmation link is invalid or has expired." });
    }

    /// <summary>Start a password reset: email a reset link if the address maps to an account.
    /// Always returns 204 regardless of whether the account exists — replying differently would let
    /// an attacker enumerate which emails are registered.</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest req)
    {
        var user = await users.FindByEmailAsync(req.Email);
        if (user is not null)
            await passwordResets.SendResetEmailAsync(user);

        return NoContent();
    }

    /// <summary>Finish a password reset using the token from the emailed link.</summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req)
    {
        var result = await passwordResets.ResetAsync(req.UserId, req.Token, req.NewPassword);
        if (result.Succeeded)
            return NoContent();

        var errors = result.Errors.Select(e => e.Description).ToArray();
        return BadRequest(new { message = string.Join(" ", errors), errors });
    }

    /// <summary>Re-send the confirmation email to the signed-in user (from the in-app banner).</summary>
    [Authorize]
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation()
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();

        // Idempotent no-op if already confirmed.
        if (!user.EmailConfirmed)
            await confirmations.SendConfirmationEmailAsync(user);

        return NoContent();
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(ApplicationUser user)
    {
        var (token, expiresAt) = tokens.CreateToken(user);
        var refreshToken = await refreshTokens.IssueAsync(user.Id);
        return new AuthResponse(
            token, expiresAt, refreshToken, user.Id, user.Email!, user.DisplayName,
            user.HasPremiumAccess(DateTime.UtcNow), user.IsPremium, user.TrialEndsAt,
            user.EmailConfirmed);
    }
}
