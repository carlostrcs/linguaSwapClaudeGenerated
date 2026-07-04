using LinguaSwap.Api.Data;
using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController(AppDbContext db, PremiumService premium) : ControllerBase
{
    private record StateRow(int LibraryId, int EntryId, int BoxLevel, DateTime? NextReviewAt);
    private record AttemptRow(int? LibraryId, bool IsCorrect, DateTime AnsweredAt);

    [HttpGet("overview")]
    public async Task<IActionResult> Overview()
    {
        var userId = User.GetUserId();
        var now = DateTime.UtcNow;
        var isPremium = await premium.IsPremiumAsync(userId);

        // Hidden libraries are excluded from every stat; visible library word counts are capped.
        var libs = await premium.VisibleLibraries(userId, isPremium)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new { l.Id, l.Name, Total = l.Entries.Count })
            .ToListAsync();
        var visibleLibIds = libs.Select(l => l.Id).ToList();

        var states = await db.LearningStates
            .Where(s => s.Entry!.Library!.UserId == userId && visibleLibIds.Contains(s.Entry!.LibraryId))
            .Select(s => new StateRow(s.Entry!.LibraryId, s.EntryId, s.BoxLevel, s.NextReviewAt))
            .ToListAsync();

        // Keep attempts whose library was deleted (null LibraryId); drop those in hidden libraries.
        var attempts = await db.Attempts
            .Where(a => a.Session!.UserId == userId
                && (a.Session!.LibraryId == null || visibleLibIds.Contains(a.Session!.LibraryId.Value)))
            .Select(a => new AttemptRow(a.Session!.LibraryId, a.IsCorrect, a.AnsweredAt))
            .ToListAsync();

        int VisibleWords(int total) =>
            isPremium ? total : Math.Min(total, PremiumService.FreeWordsPerLibrary);

        // The per-library breakdown (incl. Leitner box distribution) is a premium feature.
        // Free users still get the top-line summary below.
        var perLibrary = isPremium
            ? libs.Select(l => BuildLibraryStats(l.Id, l.Name, VisibleWords(l.Total), states, attempts, now)).ToList()
            : new List<LibraryStats>();

        var totalAttempts = attempts.Count;
        var correct = attempts.Count(a => a.IsCorrect);
        var mastered = states.Count(s => s.BoxLevel >= LeitnerService.MaxBox);
        var due = states.Count(s => s.NextReviewAt is null || s.NextReviewAt <= now);

        // The daily activity series feeds the (free) heatmap and the (premium) accuracy trend; it is
        // aggregate day counts, so it ships to every user and the client gates the trend view.
        var activity = StatsCalculator.DailyActivitySeries(
            attempts.Select(a => (a.AnsweredAt, a.IsCorrect)), now);

        var overview = new OverviewStats(
            libs.Count,
            libs.Sum(l => VisibleWords(l.Total)),
            totalAttempts,
            correct,
            StatsCalculator.Pct(correct, totalAttempts),
            mastered,
            due,
            StatsCalculator.StudyStreak(attempts.Select(a => a.AnsweredAt), now),
            perLibrary,
            activity);

        return Ok(overview);
    }

    [HttpGet("libraries/{id:int}")]
    public async Task<IActionResult> Library(int id)
    {
        var userId = User.GetUserId();
        if (!await premium.IsPremiumAsync(userId))
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Detailed per-library statistics are a premium feature." });

        var now = DateTime.UtcNow;

        var lib = await db.Libraries
            .Where(l => l.Id == id && l.UserId == userId)
            .Select(l => new { l.Id, l.Name, Words = l.Entries.Count })
            .FirstOrDefaultAsync();
        if (lib is null) return NotFound();

        var states = await db.LearningStates
            .Where(s => s.Entry!.LibraryId == id && s.Entry!.Library!.UserId == userId)
            .Select(s => new StateRow(s.Entry!.LibraryId, s.EntryId, s.BoxLevel, s.NextReviewAt))
            .ToListAsync();

        var attempts = await db.Attempts
            .Where(a => a.Session!.UserId == userId && a.Session!.LibraryId == id)
            .Select(a => new AttemptRow(a.Session!.LibraryId, a.IsCorrect, a.AnsweredAt))
            .ToListAsync();

        return Ok(BuildLibraryStats(lib.Id, lib.Name, lib.Words, states, attempts, now));
    }

    private static LibraryStats BuildLibraryStats(
        int id, string name, int words,
        IEnumerable<StateRow> states, IEnumerable<AttemptRow> attempts, DateTime now)
    {
        var ls = states.Where(s => s.LibraryId == id).ToList();
        var at = attempts.Where(a => a.LibraryId == id).ToList();
        var correct = at.Count(a => a.IsCorrect);
        var distribution = Enumerable.Range(1, LeitnerService.MaxBox)
            .Select(b => new BoxCount(b, ls.Count(s => s.BoxLevel == b)))
            .ToList();

        return new LibraryStats(
            id, name, words,
            at.Count, correct, StatsCalculator.Pct(correct, at.Count),
            ls.Count(s => s.BoxLevel >= LeitnerService.MaxBox),
            ls.Count(s => s.NextReviewAt is null || s.NextReviewAt <= now),
            StatsCalculator.Unseen(words, ls.Select(s => s.EntryId)),
            distribution);
    }
}
