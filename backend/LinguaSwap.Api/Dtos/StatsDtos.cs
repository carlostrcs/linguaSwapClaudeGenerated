namespace LinguaSwap.Api.Dtos;

public record BoxCount(int Box, int Count);

public record LibraryStats(
    int LibraryId,
    string Name,
    int Words,
    int TotalAttempts,
    int CorrectAttempts,
    int Accuracy,
    int Mastered,
    int DueNow,
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
    IReadOnlyList<LibraryStats> PerLibrary);
