using LinguaSwap.Api.Data;
using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api/practice")]
[Authorize]
public class PracticeController(
    AppDbContext db,
    LeitnerService leitner,
    AnswerChecker answerChecker,
    HintService hintService) : ControllerBase
{
    private const int SessionSize = 20;

    [HttpPost("sessions")]
    public async Task<IActionResult> Start(StartSessionRequest req)
    {
        var userId = User.GetUserId();
        var src = req.SourceLanguage.Trim().ToLowerInvariant();
        var tgt = req.TargetLanguage.Trim().ToLowerInvariant();

        if (src == tgt)
            return BadRequest(new { message = "Choose two different languages." });
        if (!await db.Libraries.AnyAsync(l => l.Id == req.LibraryId && l.UserId == userId))
            return NotFound();

        var entries = await db.Entries
            .Where(e => e.LibraryId == req.LibraryId)
            .Include(e => e.Translations)
            .Include(e => e.LearningStates.Where(s => s.SourceLanguage == src && s.TargetLanguage == tgt))
            .ToListAsync();

        var now = DateTime.UtcNow;
        var candidates = new List<(Entry Entry, string Prompt, string Answer, LearningState? State)>();
        foreach (var e in entries)
        {
            var prompt = e.Translations.FirstOrDefault(t => t.LanguageCode == src)?.Text;
            var answer = e.Translations.FirstOrDefault(t => t.LanguageCode == tgt)?.Text;
            if (prompt is null || answer is null) continue;
            candidates.Add((e, prompt, answer, e.LearningStates.FirstOrDefault()));
        }

        if (candidates.Count == 0)
            return BadRequest(new { message = $"This library has no words with both '{src}' and '{tgt}'." });

        // Priority: due words first (lowest box first), then never-seen words, then not-yet-due.
        var selected = candidates
            .OrderBy(c => c.State == null ? 1 : (c.State.NextReviewAt is null || c.State.NextReviewAt <= now ? 0 : 2))
            .ThenBy(c => c.State?.BoxLevel ?? 0)
            .ThenBy(c => c.State?.NextReviewAt ?? DateTime.MaxValue)
            .Take(SessionSize)
            .OrderBy(_ => Random.Shared.Next()) // shuffle the chosen words for variety
            .ToList();

        var session = new PracticeSession
        {
            UserId = userId,
            LibraryId = req.LibraryId,
            SourceLanguage = src,
            TargetLanguage = tgt,
            Difficulty = req.Difficulty,
            StartedAt = now,
        };
        db.PracticeSessions.Add(session);
        await db.SaveChangesAsync();

        var words = selected.Select(c =>
        {
            var primary = AnswerChecker.PrimaryAnswer(c.Answer);
            var hint = hintService.BuildHint(primary, req.Difficulty);
            var length = req.Difficulty == Difficulty.Hard ? 0 : primary.Length;
            var expectedForClient = req.Difficulty == Difficulty.Easy ? primary : null;
            return new PracticeWordDto(c.Entry.Id, c.Prompt, hint, length, expectedForClient, c.Entry.Notes);
        }).ToList();

        return Ok(new StartSessionResponse(session.Id, req.Difficulty, src, tgt, words));
    }

    [HttpPost("sessions/{id:int}/answer")]
    public async Task<IActionResult> Answer(int id, AnswerRequest req)
    {
        var userId = User.GetUserId();
        var session = await db.PracticeSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session is null) return NotFound();
        if (session.EndedAt is not null) return BadRequest(new { message = "This session has already ended." });

        var src = session.SourceLanguage;
        var tgt = session.TargetLanguage;

        var entry = await db.Entries
            .Include(e => e.Translations)
            .Include(e => e.LearningStates.Where(s => s.SourceLanguage == src && s.TargetLanguage == tgt))
            .FirstOrDefaultAsync(e => e.Id == req.EntryId && e.Library!.UserId == userId);
        if (entry is null) return NotFound();

        var prompt = entry.Translations.FirstOrDefault(t => t.LanguageCode == src)?.Text;
        var expected = entry.Translations.FirstOrDefault(t => t.LanguageCode == tgt)?.Text;
        if (prompt is null || expected is null)
            return BadRequest(new { message = "This word no longer has both languages." });

        var correct = answerChecker.IsCorrect(expected, req.Answer ?? string.Empty);

        var state = entry.LearningStates.FirstOrDefault();
        if (state is null)
        {
            state = new LearningState { EntryId = entry.Id, SourceLanguage = src, TargetLanguage = tgt, BoxLevel = 1 };
            db.LearningStates.Add(state);
        }
        leitner.ApplyAnswer(state, correct, DateTime.UtcNow);

        db.Attempts.Add(new Attempt
        {
            SessionId = session.Id,
            EntryId = entry.Id,
            Prompt = prompt,
            ExpectedAnswer = expected,
            UserAnswer = req.Answer,
            IsCorrect = correct,
            AnsweredAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        return Ok(new AnswerResponse(
            correct,
            AnswerChecker.PrimaryAnswer(expected),
            state.BoxLevel,
            leitner.IsMastered(state),
            state.NextReviewAt));
    }

    [HttpPost("sessions/{id:int}/end")]
    public async Task<IActionResult> End(int id)
    {
        var userId = User.GetUserId();
        var session = await db.PracticeSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session is null) return NotFound();
        if (session.EndedAt is null)
        {
            session.EndedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        return NoContent();
    }
}
