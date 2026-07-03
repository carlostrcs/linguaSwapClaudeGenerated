using System.Text;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Decides whether a typed answer matches the expected translation. Comparison is trimmed and
/// **accent-sensitive** — "camion" does not match "camión". It is case-insensitive by default, but
/// the caller can pass <c>caseSensitive: true</c> for languages where capitalization is grammatical
/// (e.g. German nouns — see <see cref="LanguageRules"/>). The expected text may list several
/// acceptable answers separated by commas (e.g. "thank you, thanks").
/// </summary>
public class AnswerChecker
{
    public bool IsCorrect(string expected, string actual, bool caseSensitive = false)
    {
        var normalizedActual = Normalize(actual, caseSensitive);
        return SplitAcceptable(expected).Any(option => Normalize(option, caseSensitive) == normalizedActual);
    }

    public static IEnumerable<string> SplitAcceptable(string expected) =>
        expected.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>The first acceptable answer — used to build hints and length.</summary>
    public static string PrimaryAnswer(string expected) =>
        SplitAcceptable(expected).FirstOrDefault() ?? expected.Trim();

    /// <summary>
    /// Trim (and lowercase unless <paramref name="caseSensitive"/>), keeping accents/diacritics
    /// significant. Normalised to Unicode FormC so a precomposed character (e.g. "ó") and the same
    /// character typed as a base letter + combining accent compare equal.
    /// </summary>
    public static string Normalize(string value, bool caseSensitive = false)
    {
        var trimmed = value.Trim();
        if (!caseSensitive) trimmed = trimmed.ToLowerInvariant();
        return trimmed.Normalize(NormalizationForm.FormC);
    }
}
