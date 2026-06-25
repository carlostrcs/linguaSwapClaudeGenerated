using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Shared word-entry validation/normalization, used by manual create/update and by both
/// import paths so the rules live in exactly one place.
/// </summary>
public static class EntryImport
{
    /// <summary>
    /// Trim + lowercase language codes into a (lang -> text) map.
    /// Returns null if a language code repeats (e.g. "EN" and "en").
    /// </summary>
    public static Dictionary<string, string>? NormalizeTranslations(IEnumerable<TranslationDto> translations)
    {
        var cleaned = translations
            .Select(t => (Lang: t.LanguageCode.Trim().ToLowerInvariant(), Text: t.Text.Trim()))
            .Where(t => t.Lang.Length > 0 && t.Text.Length > 0)
            .ToList();
        if (cleaned.Select(t => t.Lang).Distinct().Count() != cleaned.Count) return null;
        return cleaned.ToDictionary(t => t.Lang, t => t.Text);
    }

    /// <summary>
    /// Build Entry + Translation objects from import items (LibraryId left unset — the caller
    /// assigns it or attaches them to a Library). Collects a per-index error for any invalid entry.
    /// </summary>
    public static (List<Entry> Entries, List<ImportError> Errors) BuildEntries(IReadOnlyList<ImportEntryDto> items)
    {
        var entries = new List<Entry>();
        var errors = new List<ImportError>();
        for (var i = 0; i < items.Count; i++)
        {
            var translations = (items[i].Translations ?? new Dictionary<string, string>())
                .Select(kv => new TranslationDto(kv.Key, kv.Value));
            var normalized = NormalizeTranslations(translations);
            if (normalized is null || normalized.Count == 0)
            {
                errors.Add(new ImportError(i, "Each entry needs at least one language with text, and no repeated language."));
                continue;
            }
            entries.Add(new Entry
            {
                Notes = items[i].Notes?.Trim(),
                Translations = normalized.Select(t => new Translation { LanguageCode = t.Key, Text = t.Value }).ToList(),
            });
        }
        return (entries, errors);
    }
}
