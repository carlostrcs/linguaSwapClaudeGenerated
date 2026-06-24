namespace LinguaSwap.Api.Models;

/// <summary>
/// One concept inside a library (e.g. "dog"), holding its translations in
/// several languages and the per-direction learning states.
/// </summary>
public class Entry
{
    public int Id { get; set; }
    public int LibraryId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Library? Library { get; set; }
    public ICollection<Translation> Translations { get; set; } = new List<Translation>();
    public ICollection<LearningState> LearningStates { get; set; } = new List<LearningState>();
}
