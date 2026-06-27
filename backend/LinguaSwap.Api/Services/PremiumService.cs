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

    /// <summary>Whether the given user currently has premium.</summary>
    public Task<bool> IsPremiumAsync(string userId) =>
        db.Users.Where(u => u.Id == userId).Select(u => u.IsPremium).FirstAsync();
}
