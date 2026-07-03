using Microsoft.AspNetCore.Identity;

namespace LinguaSwap.Api.Models;

/// <summary>
/// The app's user. Extends ASP.NET Identity's user with a display name.
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }

    /// <summary>True while the user has an active premium subscription. The DB is the
    /// authoritative source for every premium gate (never trust a JWT claim, which goes
    /// stale the moment a user upgrades or cancels).</summary>
    public bool IsPremium { get; set; }

    /// <summary>Stripe customer id (created on first checkout), used to map webhook events
    /// back to this user.</summary>
    public string? StripeCustomerId { get; set; }

    /// <summary>The current Stripe subscription id, if any.</summary>
    public string? StripeSubscriptionId { get; set; }

    /// <summary>When the user's one-time free trial began. Non-null means the trial has been used
    /// (it can never be started again), even after it has expired.</summary>
    public DateTime? TrialStartedAt { get; set; }

    /// <summary>When the free trial ends. The user has full premium access while this is in the
    /// future; after it passes they revert to free unless <see cref="IsPremium"/> is set.</summary>
    public DateTime? TrialEndsAt { get; set; }

    /// <summary>Whether the user currently has premium access — a paid subscription
    /// (<see cref="IsPremium"/>) or an unexpired free trial. Single definition of "effective
    /// premium" reused by every gate and serialization site.</summary>
    public bool HasPremiumAccess(DateTime nowUtc) =>
        IsPremium || (TrialEndsAt.HasValue && TrialEndsAt.Value > nowUtc);

    public ICollection<Library> Libraries { get; set; } = new List<Library>();
    public ICollection<PracticeSession> PracticeSessions { get; set; } = new List<PracticeSession>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
