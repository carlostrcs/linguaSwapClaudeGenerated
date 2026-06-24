namespace LinguaSwap.Api.Models;

/// <summary>
/// A single practice run over a library in a chosen direction and difficulty.
/// </summary>
public class PracticeSession
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;

    /// <summary>Nullable so past sessions survive if their library is deleted.</summary>
    public int? LibraryId { get; set; }

    public string SourceLanguage { get; set; } = string.Empty;
    public string TargetLanguage { get; set; } = string.Empty;
    public Difficulty Difficulty { get; set; } = Difficulty.Medium;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }

    public ApplicationUser? User { get; set; }
    public Library? Library { get; set; }
    public ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();
}
