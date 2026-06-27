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

    public ICollection<Library> Libraries { get; set; } = new List<Library>();
    public ICollection<PracticeSession> PracticeSessions { get; set; } = new List<PracticeSession>();
}
