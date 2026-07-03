using System.ComponentModel.DataAnnotations;
using LinguaSwap.Api.Models;

namespace LinguaSwap.Api.Dtos;

public record StartSessionRequest(
    [Required] int LibraryId,
    [Required, MaxLength(10)] string SourceLanguage,
    [Required, MaxLength(10)] string TargetLanguage,
    Difficulty Difficulty,
    PracticeMode Mode = PracticeMode.SmartReview);

/// <summary>One word to practise. ExpectedAnswer is only populated for Easy difficulty
/// (so the UI can colour the input live); it stays null for Medium/Hard.</summary>
public record PracticeWordDto(
    int EntryId,
    string Prompt,
    string Hint,
    int AnswerLength,
    string? ExpectedAnswer,
    string? Notes);

public record StartSessionResponse(
    int SessionId,
    Difficulty Difficulty,
    PracticeMode Mode,
    string SourceLanguage,
    string TargetLanguage,
    IReadOnlyList<PracticeWordDto> Words,
    JourneyStateDto? Journey = null);

/// <summary>Persisted per-word progress for Journey mode. Streak = consecutive correct answers.</summary>
public record JourneyWordDto(int EntryId, int Attempts, int Correct, int Streak);

/// <summary>A saved Journey position: active-set size + per-word progress. Opaque to the server.</summary>
public record JourneyStateDto(int ActiveCount, IReadOnlyList<JourneyWordDto> Words);

public record SaveJourneyRequest(
    [Required] int LibraryId,
    [Required, MaxLength(10)] string SourceLanguage,
    [Required, MaxLength(10)] string TargetLanguage,
    [Required] JourneyStateDto State);

public record AnswerRequest(
    [Required] int EntryId,
    string Answer);

public record AnswerResponse(
    bool IsCorrect,
    string ExpectedAnswer,
    int BoxLevel,
    bool Mastered,
    DateTime? NextReviewAt);
