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
    private const int MaxImport = 500;

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

        var translations = Normalize(req.Translations);
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

        var translations = Normalize(req.Translations);
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
        if (items.Count > MaxImport)
            return BadRequest(new { message = $"Too many entries (maximum {MaxImport})." });

        var errors = new List<ImportError>();
        var toCreate = new List<Entry>();
        for (var i = 0; i < items.Count; i++)
        {
            var translations = (items[i].Translations ?? [])
                .Select(kv => new TranslationDto(kv.Key, kv.Value));
            var normalized = Normalize(translations);
            if (normalized is null || normalized.Count == 0)
            {
                errors.Add(new ImportError(i, "Each entry needs at least one language with text, and no repeated language."));
                continue;
            }
            toCreate.Add(new Entry
            {
                LibraryId = libraryId,
                Notes = items[i].Notes?.Trim(),
                Translations = normalized.Select(t => new Translation { LanguageCode = t.Key, Text = t.Value }).ToList()
            });
        }

        // Atomic: if anything is invalid, import nothing and report the offending rows.
        if (errors.Count > 0)
            return BadRequest(new { message = "Some entries are invalid; nothing was imported.", errors });

        db.Entries.AddRange(toCreate);
        await db.SaveChangesAsync();
        return Ok(new ImportResult(toCreate.Count));
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

    /// <summary>
    /// Trim + lowercase language codes into a (lang -> text) map.
    /// Returns null if a language code repeats.
    /// </summary>
    private static Dictionary<string, string>? Normalize(IEnumerable<TranslationDto> translations)
    {
        var cleaned = translations
            .Select(t => (Lang: t.LanguageCode.Trim().ToLowerInvariant(), Text: t.Text.Trim()))
            .Where(t => t.Lang.Length > 0 && t.Text.Length > 0)
            .ToList();
        if (cleaned.Select(t => t.Lang).Distinct().Count() != cleaned.Count) return null;
        return cleaned.ToDictionary(t => t.Lang, t => t.Text);
    }

    private static EntryDto ToDto(Entry e) => new(
        e.Id, e.Notes, e.CreatedAt,
        e.Translations.Select(t => new TranslationDto(t.LanguageCode, t.Text)).ToList());
}
