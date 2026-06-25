using LinguaSwap.Api.Data;
using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class EntriesController(AppDbContext db) : ControllerBase
{
    [HttpGet("libraries/{libraryId:int}/entries")]
    public async Task<IActionResult> ListForLibrary(int libraryId)
    {
        var userId = User.GetUserId();
        if (!await db.Libraries.AnyAsync(l => l.Id == libraryId && l.UserId == userId))
            return NotFound();

        var entries = await db.Entries
            .Where(e => e.LibraryId == libraryId)
            .OrderBy(e => e.Id)
            .Select(e => new EntryDto(
                e.Id, e.Notes, e.CreatedAt,
                e.Translations.Select(t => new TranslationDto(t.LanguageCode, t.Text)).ToList()))
            .ToListAsync();
        return Ok(entries);
    }

    [HttpGet("entries/{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var userId = User.GetUserId();
        var entry = await db.Entries
            .Where(e => e.Id == id && e.Library!.UserId == userId)
            .Select(e => new EntryDto(
                e.Id, e.Notes, e.CreatedAt,
                e.Translations.Select(t => new TranslationDto(t.LanguageCode, t.Text)).ToList()))
            .FirstOrDefaultAsync();
        return entry is null ? NotFound() : Ok(entry);
    }

    [HttpPost("libraries/{libraryId:int}/entries")]
    public async Task<IActionResult> Create(int libraryId, SaveEntryRequest req)
    {
        var userId = User.GetUserId();
        if (!await db.Libraries.AnyAsync(l => l.Id == libraryId && l.UserId == userId))
            return NotFound();

        var translations = EntryImport.NormalizeTranslations(req.Translations);
        if (translations is null) return BadRequest(new { message = "Each language can appear at most once." });

        var entry = new Entry
        {
            LibraryId = libraryId,
            Notes = req.Notes?.Trim(),
            Translations = translations.Select(t => new Translation { LanguageCode = t.Key, Text = t.Value }).ToList()
        };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = entry.Id }, ToDto(entry));
    }

    [HttpPut("entries/{id:int}")]
    public async Task<IActionResult> Update(int id, SaveEntryRequest req)
    {
        var userId = User.GetUserId();
        var entry = await db.Entries
            .Include(e => e.Translations)
            .FirstOrDefaultAsync(e => e.Id == id && e.Library!.UserId == userId);
        if (entry is null) return NotFound();

        var translations = EntryImport.NormalizeTranslations(req.Translations);
        if (translations is null) return BadRequest(new { message = "Each language can appear at most once." });

        entry.Notes = req.Notes?.Trim();

        // Merge in place (update existing, remove absent, add new) so we never
        // delete-then-insert the same (EntryId, LanguageCode) in one SaveChanges.
        foreach (var existing in entry.Translations.ToList())
        {
            if (translations.TryGetValue(existing.LanguageCode, out var text)) existing.Text = text;
            else entry.Translations.Remove(existing);
        }
        var existingLangs = entry.Translations.Select(t => t.LanguageCode).ToHashSet();
        foreach (var (lang, text) in translations.Where(t => !existingLangs.Contains(t.Key)))
            entry.Translations.Add(new Translation { LanguageCode = lang, Text = text });

        await db.SaveChangesAsync();
        return Ok(ToDto(entry));
    }

    [HttpPost("libraries/{libraryId:int}/import")]
    public async Task<IActionResult> Import(int libraryId, ImportRequest req)
    {
        var userId = User.GetUserId();
        if (!await db.Libraries.AnyAsync(l => l.Id == libraryId && l.UserId == userId))
            return NotFound();

        var items = req.Entries ?? [];
        if (items.Count == 0)
            return BadRequest(new { message = "The file contained no entries." });

        var (entries, errors) = EntryImport.BuildEntries(items);
        // Atomic: if anything is invalid, import nothing and report the offending rows.
        if (errors.Count > 0)
            return BadRequest(new { message = "Some entries are invalid; nothing was imported.", errors });

        // Skip words already in this library (and repeats within the file).
        var existingSignatures = (await db.Entries
                .Where(e => e.LibraryId == libraryId)
                .Select(e => e.Translations.Select(t => new TranslationDto(t.LanguageCode, t.Text)).ToList())
                .ToListAsync())
            .Select(list => EntryImport.Signature(list.Select(d => (d.LanguageCode, d.Text))))
            .ToHashSet();

        var (kept, skipped) = EntryImport.Deduplicate(entries, existingSignatures);
        foreach (var entry in kept) entry.LibraryId = libraryId;
        db.Entries.AddRange(kept);
        await db.SaveChangesAsync();
        return Ok(new ImportResult(kept.Count, skipped));
    }

    [HttpDelete("entries/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var entry = await db.Entries.FirstOrDefaultAsync(e => e.Id == id && e.Library!.UserId == userId);
        if (entry is null) return NotFound();

        db.Entries.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static EntryDto ToDto(Entry e) => new(
        e.Id, e.Notes, e.CreatedAt,
        e.Translations.Select(t => new TranslationDto(t.LanguageCode, t.Text)).ToList());
}
