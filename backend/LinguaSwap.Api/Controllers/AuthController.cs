using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> users,
    TokenService tokens,
    RefreshTokenService refreshTokens) : ControllerBase
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

        return Ok(await BuildAuthResponseAsync(user));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await users.FindByEmailAsync(req.Email);
        if (user is null || !await users.CheckPasswordAsync(user, req.Password))
            return Unauthorized(new { message = "Invalid email or password." });

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
            user.HasPremiumAccess(DateTime.UtcNow), user.IsPremium, user.TrialEndsAt));
    }

    /// <summary>Revoke a refresh token so it can no longer renew a session.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest req)
    {
        await refreshTokens.RevokeAsync(req.RefreshToken);
        return NoContent();
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(ApplicationUser user)
    {
        var (token, expiresAt) = tokens.CreateToken(user);
        var refreshToken = await refreshTokens.IssueAsync(user.Id);
        return new AuthResponse(
            token, expiresAt, refreshToken, user.Id, user.Email!, user.DisplayName,
            user.HasPremiumAccess(DateTime.UtcNow), user.IsPremium, user.TrialEndsAt);
    }
}
