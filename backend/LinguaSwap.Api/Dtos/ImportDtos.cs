using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

/// <summary>One entry in an import file: translations keyed by language code + optional notes.
/// <paramref name="NotesI18n"/> is used only by the curated default-library files (a note translated
/// per language); user imports leave it null and their note shows as typed.</summary>
public record ImportEntryDto(
    string? Notes,
    Dictionary<string, string>? Translations,
    Dictionary<string, string>? NotesI18n = null);

public record ImportRequest(List<ImportEntryDto> Entries);

public record ImportError(int Index, string Message);

public record ImportResult(int Imported, int Skipped);

/// <summary>Create a brand-new library and import the file's entries into it atomically.</summary>
public record CreateLibraryImportRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description,
    List<ImportEntryDto> Entries);

public record LibraryImportResult(LibrarySummary Library, int Imported, int Skipped);
