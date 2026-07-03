namespace LinguaSwap.Api.Models;

/// <summary>
/// Which practice *system* a session runs. Each mode chooses which words to surface (see
/// <c>Services/PracticeSelectors</c>) and whether answers reschedule the Leitner boxes.
/// SmartReview is the free default and keeps the original spaced-repetition behaviour; the
/// others are premium.
/// </summary>
public enum PracticeMode
{
    /// <summary>Leitner spaced repetition: due words first, then new, then not-yet-due. Reschedules.</summary>
    SmartReview,

    /// <summary>Only never-seen words, drip-fed with in-session reinforcement. Reschedules.</summary>
    LearnNew,

    /// <summary>The whole library, shuffled, ignoring the schedule. Practice-only (no rescheduling).</summary>
    Cram,

    /// <summary>The lowest-box / most-missed words first. Reschedules.</summary>
    Weak,

    /// <summary>
    /// Work through the whole library in order, a growing set at a time. Endless, driven entirely
    /// client-side (see frontend JourneyRunner); the selector just hands over the library in order.
    /// Practice-only (no rescheduling).
    /// </summary>
    Journey
}
