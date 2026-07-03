namespace LinguaSwap.Api.Models;

/// <summary>
/// A user's saved progress in <see cref="PracticeMode.Journey"/> for one library in one direction.
/// Journey's rules (learned / grow / order) all live in the frontend engine, so the server just
/// stores the client's state as an opaque JSON blob (<see cref="StateJson"/>) and hands it back on
/// the next start. One row per (user, library, source → target) — the same per-direction keying as
/// <see cref="LearningState"/>.
/// </summary>
public class JourneyState
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public int LibraryId { get; set; }
    public string SourceLanguage { get; set; } = string.Empty;
    public string TargetLanguage { get; set; } = string.Empty;

    /// <summary>Serialized <c>JourneyStateDto</c> (active-set size + per-word progress).</summary>
    public string StateJson { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Library? Library { get; set; }
}
