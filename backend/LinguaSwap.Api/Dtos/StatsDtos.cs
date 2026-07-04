namespace LinguaSwap.Api.Dtos;

public record BoxCount(int Box, int Count);

/// <summary>Practice volume for a single UTC day. <c>Date</c> is "yyyy-MM-dd".</summary>
public record DailyActivity(string Date, int Total, int Correct);

public record LibraryStats(
    int LibraryId,
    string Name,
    int Words,
    int TotalAttempts,
    int CorrectAttempts,
    int Accuracy,
    int Mastered,
    int DueNow,
    int Unseen,
    IReadOnlyList<BoxCount> BoxDistribution);

public record OverviewStats(
    int Libraries,
    int Words,
    int TotalAttempts,
    int CorrectAttempts,
    int Accuracy,
    int Mastered,
    int DueNow,
    int StudyStreakDays,
    IReadOnlyList<LibraryStats> PerLibrary,
    IReadOnlyList<DailyActivity> Activity);
