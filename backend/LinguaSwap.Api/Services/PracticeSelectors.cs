using LinguaSwap.Api.Models;

namespace LinguaSwap.Api.Services;

/// <summary>
/// One practisable word in a chosen direction, with its learning state for that direction
/// (<c>null</c> = never seen). Promoted from the tuple PracticeController used to build inline.
/// </summary>
public record Candidate(Entry Entry, string Prompt, string Answer, LearningState? State);

/// <summary>
/// A practice *system*: given every practisable candidate in a library/direction, choose and order
/// the ones to show this session. Pure logic (no database) so each strategy is unit-testable.
/// <see cref="Reschedules"/> tells the controller whether answers in this mode move Leitner boxes.
/// </summary>
public interface IPracticeSelector
{
    PracticeMode Mode { get; }

    /// <summary>Whether answers in this mode update the Leitner schedule. Cram is practice-only.</summary>
    bool Reschedules { get; }

    IReadOnlyList<Candidate> Select(IReadOnlyList<Candidate> candidates, DateTime now);
}

public static class PracticeSelection
{
    /// <summary>Words per session for the capped modes (SmartReview / LearnNew / Weak).</summary>
    public const int SessionSize = 20;
}

/// <summary>
/// The default Leitner system: due words first (lowest box, then most overdue), then never-seen
/// words, then not-yet-due. Capped and shuffled. This reproduces the original selection verbatim,
/// so existing users see no behaviour change.
/// </summary>
public class SmartReviewSelector : IPracticeSelector
{
    public PracticeMode Mode => PracticeMode.SmartReview;
    public bool Reschedules => true;

    public IReadOnlyList<Candidate> Select(IReadOnlyList<Candidate> candidates, DateTime now) =>
        candidates
            // Priority: due words first (0), then never-seen (1), then not-yet-due (2).
            .OrderBy(c => c.State == null ? 1 : (c.State.NextReviewAt is null || c.State.NextReviewAt <= now ? 0 : 2))
            .ThenBy(c => c.State?.BoxLevel ?? 0)
            .ThenBy(c => c.State?.NextReviewAt ?? DateTime.MaxValue)
            .Take(PracticeSelection.SessionSize)
            .OrderBy(_ => Random.Shared.Next()) // shuffle the chosen words for variety
            .ToList();
}

/// <summary>
/// Learn New: only never-seen words (no LearningState yet), shuffled and capped — the fresh batch to
/// learn this session. The client (LearnNewRunner) owns the flow: a preview pass showing each word +
/// translation, then endless drilling of the batch until every word is learned (no auto-finish).
/// Answers still <see cref="Reschedules"/> the Leitner boxes, so a learned word graduates out of
/// "never-seen" and the next session pulls the next batch.
/// </summary>
public class LearnNewSelector : IPracticeSelector
{
    public PracticeMode Mode => PracticeMode.LearnNew;
    public bool Reschedules => true;

    public IReadOnlyList<Candidate> Select(IReadOnlyList<Candidate> candidates, DateTime now) =>
        candidates
            .Where(c => c.State == null)
            .OrderBy(_ => Random.Shared.Next())
            .Take(PracticeSelection.SessionSize)
            .ToList();
}

/// <summary>
/// Cram: the whole library, shuffled, ignoring the schedule and the per-session cap. Practice-only
/// — answers are recorded for stats but never move Leitner boxes (<see cref="Reschedules"/> false).
/// </summary>
public class CramSelector : IPracticeSelector
{
    public PracticeMode Mode => PracticeMode.Cram;
    public bool Reschedules => false;

    public IReadOnlyList<Candidate> Select(IReadOnlyList<Candidate> candidates, DateTime now) =>
        candidates
            .OrderBy(_ => Random.Shared.Next())
            .ToList();
}

/// <summary>
/// Weak words: only words already seen in this direction, lowest Leitner box first, then the most
/// frequently missed. Capped and shuffled. Never-seen words are excluded (that is Learn New's job).
/// </summary>
public class WeakSelector : IPracticeSelector
{
    public PracticeMode Mode => PracticeMode.Weak;
    public bool Reschedules => true;

    public IReadOnlyList<Candidate> Select(IReadOnlyList<Candidate> candidates, DateTime now) =>
        candidates
            .Where(c => c.State != null)
            .OrderBy(c => c.State!.BoxLevel)
            .ThenByDescending(c => c.State!.IncorrectCount)
            .Take(PracticeSelection.SessionSize)
            .OrderBy(_ => Random.Shared.Next())
            .ToList();
}

/// <summary>
/// Journey: the whole library in stable library order (by entry id, i.e. the order words were
/// added — "start to end"), no cap and no shuffle. The client (JourneyRunner) owns the endless
/// loop: it activates a small set, grows it as words are learned, and reshuffles per iteration.
/// Practice-only, like Cram, so the endless drilling can't distort the Leitner schedule.
/// </summary>
public class JourneySelector : IPracticeSelector
{
    public PracticeMode Mode => PracticeMode.Journey;
    public bool Reschedules => false;

    public IReadOnlyList<Candidate> Select(IReadOnlyList<Candidate> candidates, DateTime now) =>
        candidates
            .OrderBy(c => c.Entry.Id)
            .ToList();
}

/// <summary>Resolves the selector for a mode. All <see cref="IPracticeSelector"/>s are DI-registered.</summary>
public class PracticeSelectorResolver
{
    private readonly Dictionary<PracticeMode, IPracticeSelector> _byMode;

    public PracticeSelectorResolver(IEnumerable<IPracticeSelector> selectors) =>
        _byMode = selectors.ToDictionary(s => s.Mode);

    public IPracticeSelector For(PracticeMode mode) => _byMode[mode];
}
