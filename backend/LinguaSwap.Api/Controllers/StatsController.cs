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
public class StatsController(AppDbContext db) : ControllerBase
{
    private record StateRow(int LibraryId, int BoxLevel, DateTime? NextReviewAt);
    private record AttemptRow(int? LibraryId, bool IsCorrect, DateTime AnsweredAt);

    [HttpGet("overview")]
    public async Task<IActionResult> Overview()
    {
        var userId = User.GetUserId();
        var now = DateTime.UtcNow;

        var libs = await db.Libraries
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new { l.Id, l.Name, Words = l.Entries.Count })
            .ToListAsync();

        var states = await db.LearningStates
            .Where(s => s.Entry!.Library!.UserId == userId)
            .Select(s => new StateRow(s.Entry!.LibraryId, s.BoxLevel, s.NextReviewAt))
            .ToListAsync();

        var attempts = await db.Attempts
            .Where(a => a.Session!.UserId == userId)
            .Select(a => new AttemptRow(a.Session!.LibraryId, a.IsCorrect, a.AnsweredAt))
            .ToListAsync();

        var perLibrary = libs
            .Select(l => BuildLibraryStats(l.Id, l.Name, l.Words, states, attempts, now))
            .ToList();

        var totalAttempts = attempts.Count;
        var correct = attempts.Count(a => a.IsCorrect);
        var mastered = states.Count(s => s.BoxLevel >= LeitnerService.MaxBox);
        var due = states.Count(s => s.NextReviewAt is null || s.NextReviewAt <= now);

        var overview = new OverviewStats(
            libs.Count,
            libs.Sum(l => l.Words),
            totalAttempts,
            correct,
            Pct(correct, totalAttempts),
            mastered,
            due,
            StudyStreak(attempts.Select(a => a.AnsweredAt), now),
            perLibrary);

        return Ok(overview);
    }

    [HttpGet("libraries/{id:int}")]
    public async Task<IActionResult> Library(int id)
    {
        var userId = User.GetUserId();
        var now = DateTime.UtcNow;

        var lib = await db.Libraries
            .Where(l => l.Id == id && l.UserId == userId)
            .Select(l => new { l.Id, l.Name, Words = l.Entries.Count })
            .FirstOrDefaultAsync();
        if (lib is null) return NotFound();

        var states = await db.LearningStates
            .Where(s => s.Entry!.LibraryId == id && s.Entry!.Library!.UserId == userId)
            .Select(s => new StateRow(s.Entry!.LibraryId, s.BoxLevel, s.NextReviewAt))
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
            at.Count, correct, Pct(correct, at.Count),
            ls.Count(s => s.BoxLevel >= LeitnerService.MaxBox),
            ls.Count(s => s.NextReviewAt is null || s.NextReviewAt <= now),
            distribution);
    }

    private static int Pct(int correct, int total) =>
        total == 0 ? 0 : (int)Math.Round(100.0 * correct / total);

    /// <summary>Consecutive days (ending today, or yesterday if today is empty) with practice.</summary>
    private static int StudyStreak(IEnumerable<DateTime> attemptTimes, DateTime now)
    {
        var days = attemptTimes.Select(t => t.Date).ToHashSet();
        var day = now.Date;
        if (!days.Contains(day)) day = day.AddDays(-1);

        var streak = 0;
        while (days.Contains(day))
        {
            streak++;
            day = day.AddDays(-1);
        }
        return streak;
    }
}
