namespace LinguaSwap.Api.Services;

/// <summary>
/// Authoritative per-language grading rules. Today this is just which languages must be checked
/// case-sensitively: in German (and a few others) capitalization is grammatical — every noun is
/// Capitalized — so "haus" must not match "Haus". Other languages stay case-insensitive.
///
/// The frontend mirrors this for its live border and the no-account demo (see
/// <c>frontend/src/lib/languages.ts</c>); keep the two in sync.
/// </summary>
public static class LanguageRules
{
    private static readonly HashSet<string> CaseSensitive =
        new(StringComparer.OrdinalIgnoreCase) { "de" };

    public static bool IsCaseSensitive(string? languageCode) =>
        languageCode is not null && CaseSensitive.Contains(languageCode.Trim());
}
