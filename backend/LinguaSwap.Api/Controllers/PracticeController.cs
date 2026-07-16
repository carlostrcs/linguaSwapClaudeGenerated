using System.Text.Json;
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
    HintService hintService,
    PremiumService premium,
    PracticeSelectorResolver selectors) : ControllerBase
{
    [HttpPost("sessions")]
    public async Task<IActionResult> Start(StartSessionRequest req)
    {
        var userId = User.GetUserId();
        var src = req.SourceLanguage.Trim().ToLowerInvariant();
        var tgt = req.TargetLanguage.Trim().ToLowerInvariant();

        if (src == tgt)
            return BadRequest(new { message = "Choose two different languages." });
        var isPremium = await premium.IsPremiumAsync(userId);
        // Smart Review is free; the other practice systems are premium (DB is authoritative).
        if (req.Mode != PracticeMode.SmartReview && !isPremium)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "This practice mode is a premium feature." });
        // Hidden libraries can't be practised while free.
        if (!await premium.VisibleLibraries(userId, isPremium).AnyAsync(l => l.Id == req.LibraryId))
            return NotFound();

        // Only visible words are practised (hidden over-limit words are excluded while free).
        var entries = await premium.VisibleEntries(req.LibraryId, isPremium)
            .Include(e => e.Translations)
            .Include(e => e.LearningStates.Where(s => s.SourceLanguage == src && s.TargetLanguage == tgt))
            .ToListAsync();

        var now = DateTime.UtcNow;
        var candidates = new List<Candidate>();
        foreach (var e in entries)
        {
            var prompt = e.Translations.FirstOrDefault(t => t.LanguageCode == src)?.Text;
            var answer = e.Translations.FirstOrDefault(t => t.LanguageCode == tgt)?.Text;
            if (prompt is null || answer is null) continue;
            candidates.Add(new Candidate(e, prompt, answer, e.LearningStates.FirstOrDefault()));
        }

        if (candidates.Count == 0)
            return BadRequest(new { message = $"This library has no words with both '{src}' and '{tgt}'." });

        // Each practice mode picks and orders its own words (see Services/PracticeSelectors).
        var selected = selectors.For(req.Mode).Select(candidates, now);
        if (selected.Count == 0)
            return BadRequest(new { message = req.Mode switch
            {
                PracticeMode.LearnNew => "No new words left to learn in this direction — try Smart Review.",
                PracticeMode.Weak => "No practised words to review yet — learn some first.",
                _ => "There are no words to practise here.",
            } });

        var session = new PracticeSession
        {
            UserId = userId,
            LibraryId = req.LibraryId,
            SourceLanguage = src,
            TargetLanguage = tgt,
            Difficulty = req.Difficulty,
            Mode = req.Mode,
            StartedAt = now,
        };
        db.PracticeSessions.Add(session);
        await db.SaveChangesAsync();

        var words = selected.Select(c =>
        {
            var primary = AnswerChecker.PrimaryAnswer(c.Answer);
            var hint = hintService.BuildHint(primary, req.Difficulty);
            var length = req.Difficulty == Difficulty.Hard ? 0 : primary.Length;
            // The full answer ships at every difficulty so the client can grade instantly (a
            // per-word round trip made practice too slow to drill against). This exposes nothing new:
            // GET /api/entries already sends every translation to the same page for the same user, and
            // the practice screen cannot even render its language picker without them. The server still
            // re-checks in Answer — it stays the authority for the Attempt/Leitner record.
            return new PracticeWordDto(c.Entry.Id, c.Prompt, hint, length, c.Answer, c.State?.BoxLevel ?? 0, c.Entry.Notes);
        }).ToList();

        // Journey mode resumes where the user left off: hand back the saved state (if any).
        JourneyStateDto? journey = null;
        if (req.Mode == PracticeMode.Journey)
        {
            var saved = await db.JourneyStates
                .FirstOrDefaultAsync(j => j.UserId == userId && j.LibraryId == req.LibraryId
                    && j.SourceLanguage == src && j.TargetLanguage == tgt);
            if (saved is not null)
                journey = JsonSerializer.Deserialize<JourneyStateDto>(saved.StateJson);
        }

        return Ok(new StartSessionResponse(session.Id, req.Difficulty, req.Mode, src, tgt, words, journey));
    }

    /// <summary>Save the user's Journey progress for a library+direction (upsert). Premium-only.</summary>
    [HttpPut("journey")]
    public async Task<IActionResult> SaveJourney(SaveJourneyRequest req)
    {
        var userId = User.GetUserId();
        var src = req.SourceLanguage.Trim().ToLowerInvariant();
        var tgt = req.TargetLanguage.Trim().ToLowerInvariant();

        if (!await premium.IsPremiumAsync(userId))
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "This practice mode is a premium feature." });
        if (!await db.Libraries.AnyAsync(l => l.Id == req.LibraryId && l.UserId == userId))
            return NotFound();

        var json = JsonSerializer.Serialize(req.State);
        var existing = await db.JourneyStates
            .FirstOrDefaultAsync(j => j.UserId == userId && j.LibraryId == req.LibraryId
                && j.SourceLanguage == src && j.TargetLanguage == tgt);
        if (existing is null)
        {
            db.JourneyStates.Add(new JourneyState
            {
                UserId = userId,
                LibraryId = req.LibraryId,
                SourceLanguage = src,
                TargetLanguage = tgt,
                StateJson = json,
                UpdatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.StateJson = json;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        return NoContent();
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

        var correct = answerChecker.IsCorrect(expected, req.Answer ?? string.Empty,
            LanguageRules.IsCaseSensitive(tgt));

        var state = entry.LearningStates.FirstOrDefault();

        // Practice-only modes (Cram) record the attempt for stats but never move Leitner boxes,
        // so cramming can't disrupt the spaced-repetition schedule.
        if (selectors.For(session.Mode).Reschedules)
        {
            if (state is null)
            {
                state = new LearningState { EntryId = entry.Id, SourceLanguage = src, TargetLanguage = tgt, BoxLevel = 1 };
                db.LearningStates.Add(state);
            }
            leitner.ApplyAnswer(state, correct, DateTime.UtcNow);
        }

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
            state?.BoxLevel ?? 0,
            state is not null && leitner.IsMastered(state),
            state?.NextReviewAt));
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
