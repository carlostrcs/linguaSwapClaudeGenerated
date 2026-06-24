namespace LinguaSwap.Api.Models;

/// <summary>
/// One answered prompt within a practice session (kept for statistics).
/// </summary>
public class Attempt
{
    public int Id { get; set; }
    public int SessionId { get; set; }

    /// <summary>Nullable so history survives if the entry is later deleted.</summary>
    public int? EntryId { get; set; }

    public string Prompt { get; set; } = string.Empty;
    public string ExpectedAnswer { get; set; } = string.Empty;
    public string? UserAnswer { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

    public PracticeSession? Session { get; set; }
    public Entry? Entry { get; set; }
}
