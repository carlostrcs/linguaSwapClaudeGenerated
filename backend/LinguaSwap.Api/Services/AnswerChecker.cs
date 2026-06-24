using System.Globalization;
using System.Text;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Decides whether a typed answer matches the expected translation. Comparison is
/// trimmed, case-insensitive and accent-insensitive. The expected text may list
/// several acceptable answers separated by commas (e.g. "thank you, thanks").
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

    public static string Normalize(string value)
    {
        var lowered = value.Trim().ToLowerInvariant();
        var decomposed = lowered.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                sb.Append(ch);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
