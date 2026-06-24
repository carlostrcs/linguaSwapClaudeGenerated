using System.ComponentModel.DataAnnotations;
using LinguaSwap.Api.Models;

namespace LinguaSwap.Api.Dtos;

public record StartSessionRequest(
    [Required] int LibraryId,
    [Required, MaxLength(10)] string SourceLanguage,
    [Required, MaxLength(10)] string TargetLanguage,
    Difficulty Difficulty);

/// <summary>One word to practise. ExpectedAnswer is only populated for Easy difficulty
/// (so the UI can colour the input live); it stays null for Medium/Hard.</summary>
public record PracticeWordDto(
    int EntryId,
    string Prompt,
    string Hint,
    int AnswerLength,
    string? ExpectedAnswer);

public record StartSessionResponse(
    int SessionId,
    Difficulty Difficulty,
    string SourceLanguage,
    string TargetLanguage,
    IReadOnlyList<PracticeWordDto> Words);

public record AnswerRequest(
    [Required] int EntryId,
    string Answer);

public record AnswerResponse(
    bool IsCorrect,
    string ExpectedAnswer,
    int BoxLevel,
    bool Mastered,
    DateTime? NextReviewAt);
