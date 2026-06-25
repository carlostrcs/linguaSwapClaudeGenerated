using System.Text;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Decides whether a typed answer matches the expected translation. Comparison is
/// trimmed and case-insensitive, but **accent-sensitive** — "camion" does not match
/// "camión". The expected text may list several acceptable answers separated by commas
/// (e.g. "thank you, thanks").
/// </summary>
public class AnswerChecker
{
    public bool IsCorrect(string expected, string actual)
    {
        var normalizedActual = Normalize(actual);
        return SplitAcceptable(expected).Any(option => Normalize(option) == normalizedActual);
    }

    public static IEnumerable<string> SplitAcceptable(string expected) =>
        expected.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>The first acceptable answer — used to build hints and length.</summary>
    public static string PrimaryAnswer(string expected) =>
        SplitAcceptable(expected).FirstOrDefault() ?? expected.Trim();

    /// <summary>
    /// Trim + lowercase, keeping accents/diacritics significant. Normalised to Unicode FormC so a
    /// precomposed character (e.g. "ó") and the same character typed as a base letter + combining
    /// accent compare equal.
    /// </summary>
    public static string Normalize(string value) =>
        value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormC);
}
