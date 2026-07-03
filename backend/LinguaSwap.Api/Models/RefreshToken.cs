namespace LinguaSwap.Api.Models;

/// <summary>
/// A long-lived, server-side refresh token. Unlike the stateless JWT, these live in the DB so
/// they can be rotated on every use and revoked (logout / compromise). Only a hash of the raw
/// token is stored — the raw value is shown to the client once and never persisted.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }

    public string UserId { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;

    /// <summary>SHA-256 (hex) of the raw token. We never store the raw token itself.</summary>
    public string TokenHash { get; set; } = default!;

    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    /// <summary>Set when the token is rotated (superseded) or explicitly revoked on logout.</summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>Usable only while neither revoked nor past its expiry.</summary>
    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;
}
