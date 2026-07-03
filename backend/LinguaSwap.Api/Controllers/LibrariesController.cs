using LinguaSwap.Api.Data;
using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api/libraries")]
[Authorize]
public class LibrariesController(AppDbContext db, PremiumService premium) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = User.GetUserId();
        var isPremium = await premium.IsPremiumAsync(userId);
        // Free users only see their oldest FreeLibraryLimit libraries; the rest are hidden.
        var rows = await premium.VisibleLibraries(userId, isPremium)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new { l.Id, l.Name, l.Description, l.CreatedAt, Total = l.Entries.Count })
            .ToListAsync();
        var items = rows
            .Select(r => ToSummary(r.Id, r.Name, r.Description, r.CreatedAt, r.Total, isPremium))
            .ToList();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var userId = User.GetUserId();
        var isPremium = await premium.IsPremiumAsync(userId);
        var row = await premium.VisibleLibraries(userId, isPremium)
            .Where(l => l.Id == id)
            .Select(l => new { l.Id, l.Name, l.Description, l.CreatedAt, Total = l.Entries.Count })
            .FirstOrDefaultAsync();
        return row is null
            ? NotFound()
            : Ok(ToSummary(row.Id, row.Name, row.Description, row.CreatedAt, row.Total, isPremium));
    }

    /// <summary>Build a summary, capping the word count at the free limit and reporting how many
    /// words are hidden for free users.</summary>
    private static LibrarySummary ToSummary(
        int id, string name, string? description, DateTime createdAt, int totalEntries, bool isPremium)
    {
        var visible = isPremium
            ? totalEntries
            : Math.Min(totalEntries, PremiumService.FreeWordsPerLibrary);
        return new LibrarySummary(id, name, description, createdAt, visible, totalEntries - visible);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateLibraryRequest req)
    {
        var userId = User.GetUserId();
        if (!await premium.IsPremiumAsync(userId)
            && await db.Libraries.CountAsync(l => l.UserId == userId) >= PremiumService.FreeLibraryLimit)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = $"Free accounts are limited to {PremiumService.FreeLibraryLimit} libraries. " +
                          "Upgrade to premium for unlimited libraries."
            });
        }

        var lib = new Library
        {
            UserId = userId,
            Name = req.Name.Trim(),
            Description = req.Description?.Trim()
        };
        db.Libraries.Add(lib);
        await db.SaveChangesAsync();

        var dto = new LibrarySummary(lib.Id, lib.Name, lib.Description, lib.CreatedAt, 0, 0);
        return CreatedAtAction(nameof(Get), new { id = lib.Id }, dto);
    }

    /// <summary>Create a new library and import the file's entries into it in one transaction.</summary>
    [HttpPost("import")]
    public async Task<IActionResult> Import(CreateLibraryImportRequest req)
    {
        if (!await premium.IsPremiumAsync(User.GetUserId()))
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Importing words is a premium feature." });

        var items = req.Entries ?? [];
        if (items.Count == 0)
            return BadRequest(new { message = "The file contained no entries." });

        var (entries, errors) = EntryImport.BuildEntries(items);
        // Atomic: invalid file => nothing is created (no orphan empty library).
        if (errors.Count > 0)
            return BadRequest(new { message = "Some entries are invalid; nothing was imported.", errors });

        // New library starts empty, so dedup only collapses repeats within the file.
        var (kept, skipped) = EntryImport.Deduplicate(entries, new HashSet<string>());

        var lib = new Library
        {
            UserId = User.GetUserId(),
            Name = req.Name.Trim(),
            Description = req.Description?.Trim(),
            Entries = kept,
        };
        db.Libraries.Add(lib);
        await db.SaveChangesAsync();

        // Import is premium-only, so nothing is hidden.
        var summary = new LibrarySummary(lib.Id, lib.Name, lib.Description, lib.CreatedAt, kept.Count, 0);
        return Ok(new LibraryImportResult(summary, kept.Count, skipped));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateLibraryRequest req)
    {
        var userId = User.GetUserId();
        var isPremium = await premium.IsPremiumAsync(userId);
        // Hidden libraries can't be edited (treated as not-found while free).
        if (!await premium.VisibleLibraries(userId, isPremium).AnyAsync(l => l.Id == id))
            return NotFound();

        var lib = await db.Libraries.FirstAsync(l => l.Id == id && l.UserId == userId);
        lib.Name = req.Name.Trim();
        lib.Description = req.Description?.Trim();
        await db.SaveChangesAsync();

        var total = await db.Entries.CountAsync(e => e.LibraryId == lib.Id);
        return Ok(ToSummary(lib.Id, lib.Name, lib.Description, lib.CreatedAt, total, isPremium));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var isPremium = await premium.IsPremiumAsync(userId);
        // Only visible libraries can be deleted; removing a visible one may promote a hidden one.
        if (!await premium.VisibleLibraries(userId, isPremium).AnyAsync(l => l.Id == id))
            return NotFound();

        var lib = await db.Libraries.FirstAsync(l => l.Id == id && l.UserId == userId);
        db.Libraries.Remove(lib); // cascades entries -> translations -> learning states
        await db.SaveChangesAsync();
        return NoContent();
    }
}
