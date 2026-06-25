namespace LinguaSwap.Api.Dtos;

/// <summary>One entry in an import file: translations keyed by language code + optional notes.</summary>
public record ImportEntryDto(string? Notes, Dictionary<string, string>? Translations);

public record ImportRequest(List<ImportEntryDto> Entries);

public record ImportError(int Index, string Message);

public record ImportResult(int Imported);
