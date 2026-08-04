using System.Text.Json;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Helpers for content that ships in several languages beside a canonical (English) fallback —
/// entry notes and curated library name/description. The translations live in a small JSON map
/// column (e.g. <c>Entry.NotesI18nJson</c>) as <c>{"es":"…","fr":"…"}</c>; the fallback is the plain
/// column (<c>Entry.Notes</c>). User-authored content has a null map and always shows its own text.
///
/// Stored as a JSON string (like <c>JourneyState.StateJson</c>) rather than a jsonb-mapped
/// dictionary to keep EF mapping trivial and the seeder's reconcile a plain string compare —
/// <see cref="Serialize"/> sorts the keys so the same map always produces the same string.
/// </summary>
public static class Localized
{
    /// <summary>Canonical JSON for a map (keys lower-cased and sorted), or null when it has no usable
    /// entries — so an absent map and an empty one are stored identically and never show a spurious
    /// diff on reconcile.</summary>
    public static string? Serialize(IReadOnlyDictionary<string, string>? map)
    {
        if (map is null) return null;
        var sorted = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (rawKey, rawValue) in map)
        {
            var key = rawKey.Trim().ToLowerInvariant();
            var value = rawValue?.Trim();
            if (key.Length > 0 && !string.IsNullOrEmpty(value)) sorted[key] = value;
        }
        return sorted.Count == 0 ? null : JsonSerializer.Serialize(sorted);
    }

    /// <summary>The value for <paramref name="uiLang"/> from the JSON map, else
    /// <paramref name="fallback"/>. A null/unknown language or a malformed map yields the fallback —
    /// never throws.</summary>
    public static string? Resolve(string? fallback, string? i18nJson, string? uiLang)
    {
        if (string.IsNullOrEmpty(i18nJson) || string.IsNullOrWhiteSpace(uiLang)) return fallback;
        try
        {
            var map = JsonSerializer.Deserialize<Dictionary<string, string>>(i18nJson);
            if (map is not null && map.TryGetValue(uiLang, out var value) && !string.IsNullOrWhiteSpace(value))
                return value;
        }
        catch (JsonException)
        {
            // Malformed map (shouldn't happen — we always write it via Serialize) → fall back.
        }
        return fallback;
    }
}
