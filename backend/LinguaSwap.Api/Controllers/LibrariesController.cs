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
public class LibrariesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = User.GetUserId();
        var items = await db.Libraries
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LibrarySummary(l.Id, l.Name, l.Description, l.CreatedAt, l.Entries.Count))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var userId = User.GetUserId();
        var lib = await db.Libraries
            .Where(l => l.Id == id && l.UserId == userId)
            .Select(l => new LibrarySummary(l.Id, l.Name, l.Description, l.CreatedAt, l.Entries.Count))
            .FirstOrDefaultAsync();
        return lib is null ? NotFound() : Ok(lib);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateLibraryRequest req)
    {
        var lib = new Library
        {
            UserId = User.GetUserId(),
            Name = req.Name.Trim(),
            Description = req.Description?.Trim()
        };
        db.Libraries.Add(lib);
        await db.SaveChangesAsync();

        var dto = new LibrarySummary(lib.Id, lib.Name, lib.Description, lib.CreatedAt, 0);
        return CreatedAtAction(nameof(Get), new { id = lib.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateLibraryRequest req)
    {
        var userId = User.GetUserId();
        var lib = await db.Libraries.FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
        if (lib is null) return NotFound();

        lib.Name = req.Name.Trim();
        lib.Description = req.Description?.Trim();
        await db.SaveChangesAsync();

        var count = await db.Entries.CountAsync(e => e.LibraryId == lib.Id);
        return Ok(new LibrarySummary(lib.Id, lib.Name, lib.Description, lib.CreatedAt, count));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var lib = await db.Libraries.FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
        if (lib is null) return NotFound();

        db.Libraries.Remove(lib); // cascades entries -> translations -> learning states
        await db.SaveChangesAsync();
        return NoContent();
    }
}
