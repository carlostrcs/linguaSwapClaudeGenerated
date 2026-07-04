using LinguaSwap.Api.Services;
using Xunit;

namespace LinguaSwap.Tests;

public class StatsCalculatorTests
{
    private static readonly DateTime Now = new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(1, 2, 50)]
    [InlineData(1, 3, 33)]   // 33.33 rounds down
    [InlineData(2, 3, 67)]   // 66.66 rounds up
    [InlineData(5, 5, 100)]
    public void Pct_RoundsToWholePercent(int correct, int total, int expected)
    {
        Assert.Equal(expected, StatsCalculator.Pct(correct, total));
    }

    [Fact]
    public void Unseen_IsWordsMinusDistinctSeenEntries()
    {
        // A word practised in two directions yields two state rows for the same entry id;
        // it must count once, and unseen must not go negative.
        var seen = new[] { 1, 1, 2 };           // entries 1 & 2 seen (1 in two directions)
        Assert.Equal(3, StatsCalculator.Unseen(words: 5, seen));
        Assert.Equal(0, StatsCalculator.Unseen(words: 2, seen));   // never negative
        Assert.Equal(4, StatsCalculator.Unseen(words: 4, Array.Empty<int>()));
    }

    [Fact]
    public void StudyStreak_CountsConsecutiveDaysEndingToday()
    {
        var days = new[]
        {
            Now,                    // today
            Now.AddDays(-1),        // yesterday
            Now.AddDays(-2),        // two days ago
            Now.AddDays(-4),        // gap at day -3 breaks the streak
        };
        Assert.Equal(3, StatsCalculator.StudyStreak(days, Now));
    }

    [Fact]
    public void StudyStreak_AllowsTodayEmpty_CountingFromYesterday()
    {
        var days = new[] { Now.AddDays(-1), Now.AddDays(-2) };   // nothing today
        Assert.Equal(2, StatsCalculator.StudyStreak(days, Now));
    }

    [Fact]
    public void StudyStreak_IsZeroWhenNeitherTodayNorYesterday()
    {
        var days = new[] { Now.AddDays(-3) };
        Assert.Equal(0, StatsCalculator.StudyStreak(days, Now));
    }

    [Fact]
    public void DailyActivitySeries_GroupsPerDay_Ascending_WithCorrectCounts()
    {
        var attempts = new (DateTime, bool)[]
        {
            (Now, true),
            (Now, false),
            (Now.AddHours(-2), true),          // same UTC day as today
            (Now.AddDays(-1), true),
        };

        var series = StatsCalculator.DailyActivitySeries(attempts, Now);

        Assert.Equal(2, series.Count);
        Assert.Equal(Now.AddDays(-1).ToString("yyyy-MM-dd"), series[0].Date);  // ascending
        Assert.Equal(1, series[0].Total);
        Assert.Equal(1, series[0].Correct);
        Assert.Equal(Now.ToString("yyyy-MM-dd"), series[1].Date);
        Assert.Equal(3, series[1].Total);
        Assert.Equal(2, series[1].Correct);
    }

    [Fact]
    public void DailyActivitySeries_ExcludesDaysBeyondWindow()
    {
        var attempts = new (DateTime, bool)[]
        {
            (Now, true),
            (Now.AddDays(-400), true),   // outside the default 365-day window
        };

        var series = StatsCalculator.DailyActivitySeries(attempts, Now);

        Assert.Single(series);
        Assert.Equal(Now.ToString("yyyy-MM-dd"), series[0].Date);
    }
}
