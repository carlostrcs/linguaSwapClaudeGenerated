using System.Security.Cryptography;
using System.Text;
using LinguaSwap.Api.Data;
using LinguaSwap.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Owns the refresh-token lifecycle: issuing, rotating (validate + replace on use) and revoking.
/// Refresh tokens are long-lived and DB-backed so a session survives across days while staying
/// revocable. The raw token is returned to the caller once; only its hash is stored.
/// </summary>
public class RefreshTokenService(AppDbContext db, IConfiguration config)
{
    private double RefreshDays => double.Parse(config.GetSection("Jwt")["RefreshTokenDays"] ?? "30");

    /// <summary>Generate, persist and return a fresh raw refresh token for the user.</summary>
    public async Task<string> IssueAsync(string userId)
    {
        // Tidy up the user's spent tokens so the table doesn't grow without bound.
        await PruneAsync(userId);

        var raw = GenerateRawToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = Hash(raw),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshDays),
        });
        await db.SaveChangesAsync();
        return raw;
    }

    /// <summary>
    /// Validate a raw refresh token and, if active, rotate it: the presented token is revoked and a
    /// brand-new one is issued in the same transaction. Returns the owning user and the new raw token,
    /// or null when the token is unknown / expired / already used.
    /// </summary>
    public async Task<(ApplicationUser User, string NewRawToken)?> ValidateAndRotateAsync(string rawToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken)) return null;

        var hash = Hash(rawToken);
        var existing = await db.RefreshTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == hash);

        if (existing is null || !existing.IsActive) return null;

        existing.RevokedAt = DateTime.UtcNow;

        var raw = GenerateRawToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = existing.UserId,
            TokenHash = Hash(raw),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshDays),
        });

        await db.SaveChangesAsync();
        return (existing.User, raw);
    }

    /// <summary>Revoke a raw refresh token if it exists (logout). Silent when not found.</summary>
    public async Task RevokeAsync(string? rawToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken)) return;

        var hash = Hash(rawToken);
        var existing = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash);
        if (existing is { RevokedAt: null })
        {
            existing.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
    }

    private async Task PruneAsync(string userId)
    {
        var now = DateTime.UtcNow;
        await db.RefreshTokens
            .Where(t => t.UserId == userId && (t.RevokedAt != null || t.ExpiresAt < now))
            .ExecuteDeleteAsync();
    }

    private static string GenerateRawToken() =>
        Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

    private static string Hash(string raw) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
