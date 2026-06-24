using LinguaSwap.Api.Models;

namespace LinguaSwap.Api.Services;

/// <summary>
/// The Leitner spaced-repetition rules. Pure logic (no database) so it can be unit tested.
/// Boxes run 1..5; a correct answer promotes a word (longer interval), a wrong answer
/// sends it back to box 1.
/// </summary>
public class LeitnerService
{
    public const int MaxBox = 5;

    /// <summary>How long until a word in the given box should be reviewed again.</summary>
    public TimeSpan IntervalForBox(int box) => box switch
    {
        <= 1 => TimeSpan.FromDays(1),
        2 => TimeSpan.FromDays(2),
        3 => TimeSpan.FromDays(4),
        4 => TimeSpan.FromDays(8),
        _ => TimeSpan.FromDays(16),
    };

    /// <summary>Updates a learning state in place based on whether the answer was correct.</summary>
    public void ApplyAnswer(LearningState state, bool correct, DateTime now)
    {
        state.LastReviewedAt = now;
        if (correct)
        {
            state.BoxLevel = Math.Min(state.BoxLevel + 1, MaxBox);
            state.CorrectCount++;
            state.Streak++;
        }
        else
        {
            state.BoxLevel = 1;
            state.IncorrectCount++;
            state.Streak = 0;
        }
        state.NextReviewAt = now + IntervalForBox(state.BoxLevel);
    }

    public bool IsMastered(LearningState state) => state.BoxLevel >= MaxBox;
}
