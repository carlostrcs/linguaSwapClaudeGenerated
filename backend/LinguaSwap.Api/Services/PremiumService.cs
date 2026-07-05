using LinguaSwap.Api.Models;
using LinguaSwap.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Single source of truth for premium gating rules. Controllers consult this instead of
/// hard-coding limits, and always read the flag from the DB (never a JWT claim) so an
/// upgrade/cancel takes effect immediately.
/// </summary>
public class PremiumService(AppDbContext db)
{
    /// <summary>Free users may own at most this many libraries.</summary>
    public const int FreeLibraryLimit = 5;

    /// <summary>Free users may hold at most this many words in a single library.</summary>
    public const int FreeWordsPerLibrary = 500;

    /// <summary>Length of the one-time free trial, in days.</summary>
    public const int TrialDays = 14;

    /// <summary>Whether the given user currently has premium access — a paid subscription or an
    /// unexpired free trial (see <see cref="ApplicationUser.HasPremiumAccess"/>).</summary>
    public async Task<bool> IsPremiumAsync(string userId)
    {
        var now = DateTime.UtcNow;
        var u = await db.Users.Where(u => u.Id == userId)
            .Select(u => new { u.IsPremium, u.TrialEndsAt })
            .FirstAsync();
        return u.IsPremium || (u.TrialEndsAt.HasValue && u.TrialEndsAt.Value > now);
    }

    /// <summary>Start the user's one-time free trial. Returns false (and does nothing) if the trial
    /// has already been used — it can never be started twice.</summary>
    public async Task<bool> StartTrialAsync(string userId, DateTime nowUtc)
    {
        var user = await db.Users.FirstAsync(u => u.Id == userId);
        if (user.TrialStartedAt.HasValue) return false;
        user.TrialStartedAt = nowUtc;
        user.TrialEndsAt = nowUtc.AddDays(TrialDays);
        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>The libraries a user may currently see. Premium users see all of theirs; free users
    /// see only their oldest <see cref="FreeLibraryLimit"/> (the rest are hidden, not deleted, and
    /// reappear if they regain premium).</summary>
    public IQueryable<Library> VisibleLibraries(string userId, bool isPremium)
    {
        var q = db.Libraries.Where(l => l.UserId == userId);
        return isPremium ? q : q.OrderBy(l => l.CreatedAt).ThenBy(l => l.Id).Take(FreeLibraryLimit);
    }

    /// <summary>The entries within a library a user may currently see. Premium users see all; free
    /// users see only the oldest <see cref="FreeWordsPerLibrary"/>.</summary>
    public IQueryable<Entry> VisibleEntries(int libraryId, bool isPremium)
    {
        var q = db.Entries.Where(e => e.LibraryId == libraryId);
        return isPremium ? q : q.OrderBy(e => e.Id).Take(FreeWordsPerLibrary);
    }

    /// <summary>The curated "default" libraries (owned by the system account). Shown on the featured
    /// shelf to everyone; only premium users may add a copy.</summary>
    public IQueryable<Library> DefaultLibraries() => db.Libraries.Where(l => l.IsDefault);

    /// <summary>How many of the user's libraries are currently hidden by the free-tier cap.</summary>
    public async Task<int> HiddenLibraryCountAsync(string userId, bool isPremium) =>
        isPremium
            ? 0
            : Math.Max(0, await db.Libraries.CountAsync(l => l.UserId == userId) - FreeLibraryLimit);
}
