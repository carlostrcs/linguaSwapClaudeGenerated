using System.Text;
using LinguaSwap.Api.Models;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Builds the masked hint shown during practice. Letters/digits are either revealed
/// (shown as-is) or hidden (shown as '_'); spaces and punctuation are always shown so
/// word boundaries stay visible.
///   Easy   -> reveal every other letter (~half)
///   Medium -> reveal only the first letter
///   Hard   -> reveal nothing, and not even the length (empty hint)
/// </summary>
public class HintService
{
    public string BuildHint(string answer, Difficulty difficulty)
    {
        if (difficulty == Difficulty.Hard) return string.Empty;

        var sb = new StringBuilder(answer.Length);
        var letterIndex = 0;
        foreach (var ch in answer)
        {
            if (!char.IsLetterOrDigit(ch))
            {
                sb.Append(ch); // keep spaces, hyphens, etc. visible
                continue;
            }

            var reveal = difficulty switch
            {
                Difficulty.Easy => letterIndex % 2 == 0,
                Difficulty.Medium => letterIndex == 0,
                _ => false,
            };
            sb.Append(reveal ? ch : '_');
            letterIndex++;
        }
        return sb.ToString();
    }
}
