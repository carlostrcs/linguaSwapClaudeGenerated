namespace LinguaSwap.Api.Models;

/// <summary>
/// Leitner learning progress for one entry in one practice direction
/// (SourceLanguage -> TargetLanguage). Knowing "perro -> dog" is tracked
/// separately from "dog -> perro".
/// </summary>
public class LearningState
{
    public int Id { get; set; }
    public int EntryId { get; set; }
    public string SourceLanguage { get; set; } = string.Empty;
    public string TargetLanguage { get; set; } = string.Empty;

    /// <summary>Leitner box (1 = new/struggling, higher = better known).</summary>
    public int BoxLevel { get; set; } = 1;

    public DateTime? NextReviewAt { get; set; }
    public DateTime? LastReviewedAt { get; set; }

    public int CorrectCount { get; set; }
    public int IncorrectCount { get; set; }
    public int Streak { get; set; }

    public Entry? Entry { get; set; }
}
