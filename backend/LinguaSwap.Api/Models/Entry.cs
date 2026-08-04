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

    /// <summary>Translations of <see cref="Notes"/> keyed by language code, as a small JSON map
    /// (<c>{"es":"…"}</c>). Only curated (seeded) entries carry one; user-authored notes leave it
    /// null and always show <see cref="Notes"/>. Resolved per request from the caller's UI language
    /// via <see cref="Services.Localized"/>.</summary>
    public string? NotesI18nJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Library? Library { get; set; }
    public ICollection<Translation> Translations { get; set; } = new List<Translation>();
    public ICollection<LearningState> LearningStates { get; set; } = new List<LearningState>();
}
