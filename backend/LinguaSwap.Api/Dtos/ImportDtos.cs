using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

/// <summary>One entry in an import file: translations keyed by language code + optional notes.</summary>
public record ImportEntryDto(string? Notes, Dictionary<string, string>? Translations);

public record ImportRequest(List<ImportEntryDto> Entries);

public record ImportError(int Index, string Message);

public record ImportResult(int Imported, int Skipped);

/// <summary>Create a brand-new library and import the file's entries into it atomically.</summary>
public record CreateLibraryImportRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description,
    List<ImportEntryDto> Entries);

public record LibraryImportResult(LibrarySummary Library, int Imported, int Skipped);
