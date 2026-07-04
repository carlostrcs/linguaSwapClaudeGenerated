using LinguaSwap.Api.Dtos;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Pure statistics aggregation — no EF, no I/O — so it stays unit-testable and keeps
/// <see cref="Controllers.StatsController"/> thin (per the "logic in Services" convention).
/// </summary>
public static class StatsCalculator
{
    /// <summary>Correct-as-percent-of-total, rounded to a whole number. 0 when no attempts.</summary>
    public static int Pct(int correct, int total) =>
        total == 0 ? 0 : (int)Math.Round(100.0 * correct / total);

    /// <summary>Words never practised in any direction: total words minus distinct seen entries (never negative).</summary>
    public static int Unseen(int words, IEnumerable<int> seenEntryIds) =>
        Math.Max(0, words - seenEntryIds.Distinct().Count());

    /// <summary>Consecutive days (ending today, or yesterday if today is empty) with practice.</summary>
    public static int StudyStreak(IEnumerable<DateTime> attemptTimes, DateTime now)
    {
        var days = attemptTimes.Select(t => t.Date).ToHashSet();
        var day = now.Date;
        if (!days.Contains(day)) day = day.AddDays(-1);

        var streak = 0;
        while (days.Contains(day))
        {
            streak++;
            day = day.AddDays(-1);
        }
        return streak;
    }

    /// <summary>
    /// One <see cref="DailyActivity"/> per UTC day (within the last <paramref name="days"/> days,
    /// inclusive of today) that has attempts, ascending by date. Empty days are omitted.
    /// </summary>
    public static List<DailyActivity> DailyActivitySeries(
        IEnumerable<(DateTime AnsweredAt, bool IsCorrect)> attempts, DateTime now, int days = 365)
    {
        var since = now.Date.AddDays(-(days - 1));
        return attempts
            .Where(a => a.AnsweredAt.Date >= since)
            .GroupBy(a => a.AnsweredAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new DailyActivity(
                g.Key.ToString("yyyy-MM-dd"),
                g.Count(),
                g.Count(a => a.IsCorrect)))
            .ToList();
    }
}
