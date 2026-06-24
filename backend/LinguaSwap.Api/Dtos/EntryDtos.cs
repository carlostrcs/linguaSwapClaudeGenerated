using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

public record TranslationDto(
    [Required, MaxLength(10)] string LanguageCode,
    [Required, MaxLength(500)] string Text);

public record EntryDto(int Id, string? Notes, DateTime CreatedAt, IReadOnlyList<TranslationDto> Translations);

/// <summary>Shape used for both creating and updating an entry.</summary>
public record SaveEntryRequest(
    [MaxLength(2000)] string? Notes,
    [Required, MinLength(1)] List<TranslationDto> Translations);
