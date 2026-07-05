using System.Text.Json;
using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Data;

/// <summary>
/// Seeds a demo user with a sample library the first time the app runs on an
/// empty database, so there's something to log in to and practise immediately.
/// Demo login: demo@linguaswap.app / Demo123!
///
/// Also seeds the curated "default" libraries (owned by a hidden system account) on every
/// startup — idempotently — so the featured shelf always has content, even on an existing DB.
/// </summary>
public static class DbSeeder
{
    public const string DemoEmail = "demo@linguaswap.app";
    public const string DemoPassword = "Demo123!";

    /// <summary>Hidden account that owns the curated default libraries. It never logs in (random
    /// password) and is never listed anywhere, so its libraries are unreachable except through the
    /// featured-shelf "add" flow, which clones them into the calling user's account.</summary>
    public const string SystemEmail = "system@linguaswap.app";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var users = services.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await SeedDemoUserAsync(db, users);
        await SeedDefaultLibrariesAsync(db, users, logger);
    }

    private static async Task SeedDemoUserAsync(AppDbContext db, UserManager<ApplicationUser> users)
    {
        // Only do the full demo seed when there are no users yet. On an existing database
        // (e.g. created before premium existed) just make sure the demo account is premium
        // so every feature stays testable without paying.
        if (await db.Users.AnyAsync())
        {
            var existingDemo = await users.FindByEmailAsync(DemoEmail);
            if (existingDemo is not null && !existingDemo.IsPremium)
            {
                existingDemo.IsPremium = true;
                await users.UpdateAsync(existingDemo);
            }
            return;
        }

        var demo = new ApplicationUser
        {
            UserName = DemoEmail,
            Email = DemoEmail,
            DisplayName = "Demo User",
            EmailConfirmed = true,
            // The demo account is premium so it can exercise every feature without paying.
            IsPremium = true
        };
        var created = await users.CreateAsync(demo, DemoPassword);
        if (!created.Succeeded) return;

        var library = new Library
        {
            UserId = demo.Id,
            Name = "Spanish Basics",
            Description = "A few everyday words to get started (English / Spanish).",
            Entries =
            [
                NewEntry(("en", "dog"), ("es", "perro")),
                NewEntry(("en", "cat"), ("es", "gato")),
                NewEntry(("en", "house"), ("es", "casa")),
                NewEntry(("en", "water"), ("es", "agua")),
                NewEntry(("en", "thank you"), ("es", "gracias")),
            ]
        };

        db.Libraries.Add(library);
        await db.SaveChangesAsync();
    }

    /// <summary>Ensure the system account and the curated default libraries exist. Idempotent:
    /// loads each <c>Data/DefaultLibraries/*.json</c> file on every startup and, per library
    /// (matched by name), creates it if missing or **appends only the new entries** (deduped by
    /// translation signature) to an existing master. Growing a file therefore tops up its master;
    /// existing user copies are untouched.</summary>
    private static async Task SeedDefaultLibrariesAsync(
        AppDbContext db, UserManager<ApplicationUser> users, ILogger logger)
    {
        var system = await users.FindByEmailAsync(SystemEmail);
        if (system is null)
        {
            system = new ApplicationUser
            {
                UserName = SystemEmail,
                Email = SystemEmail,
                DisplayName = "LinguaSwap",
                EmailConfirmed = true,
                IsPremium = false,
            };
            // Random unusable password — this account is never meant to be logged into.
            var created = await users.CreateAsync(system, $"Sys!{Guid.NewGuid():N}aA1");
            if (!created.Succeeded) return;
        }

        var changed = false;
        foreach (var file in LoadDefaultLibraryFiles(logger))
        {
            var (built, errors) = EntryImport.BuildEntries(file.Entries);
            if (errors.Count > 0)
            {
                logger.LogWarning(
                    "Default library '{Name}' has {Count} invalid entries; skipping the file.",
                    file.Name, errors.Count);
                continue;
            }

            var master = await db.Libraries
                .Include(l => l.Entries).ThenInclude(e => e.Translations)
                .FirstOrDefaultAsync(l => l.IsDefault && l.UserId == system.Id && l.Name == file.Name);

            if (master is null)
            {
                var (kept, _) = EntryImport.Deduplicate(built, new HashSet<string>());
                db.Libraries.Add(new Library
                {
                    UserId = system.Id,
                    Name = file.Name,
                    Description = file.Description,
                    IsDefault = true,
                    Entries = kept,
                });
                changed = true;
                logger.LogInformation("Seeding default library '{Name}' with {Count} words.", file.Name, kept.Count);
            }
            else
            {
                // Append only entries whose signature isn't already on the master.
                var existing = new HashSet<string>(master.Entries
                    .Select(e => EntryImport.Signature(e.Translations.Select(t => (t.LanguageCode, t.Text)))));
                var (kept, _) = EntryImport.Deduplicate(built, existing);
                foreach (var entry in kept) master.Entries.Add(entry);

                var descChanged = master.Description != file.Description;
                if (descChanged) master.Description = file.Description;
                if (kept.Count > 0 || descChanged) changed = true;
                if (kept.Count > 0)
                    logger.LogInformation("Added {Count} new words to default library '{Name}'.", kept.Count, file.Name);
            }
        }
        if (changed) await db.SaveChangesAsync();
    }

    /// <summary>Read and deserialize the curated default-library JSON files shipped alongside the app
    /// (copied to the output directory). Malformed/empty files are logged and skipped, never fatal.</summary>
    private static IEnumerable<DefaultLibraryFile> LoadDefaultLibraryFiles(ILogger logger)
    {
        var dir = Path.Combine(AppContext.BaseDirectory, "Data", "DefaultLibraries");
        if (!Directory.Exists(dir))
        {
            logger.LogWarning("Default libraries folder not found at {Dir}; no featured content seeded.", dir);
            yield break;
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        foreach (var path in Directory.EnumerateFiles(dir, "*.json").OrderBy(p => p, StringComparer.Ordinal))
        {
            DefaultLibraryFile? file = null;
            try
            {
                file = JsonSerializer.Deserialize<DefaultLibraryFile>(File.ReadAllText(path), options);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to read default library file {Path}; skipping.", path);
            }

            if (file is null || string.IsNullOrWhiteSpace(file.Name) || file.Entries is null || file.Entries.Count == 0)
            {
                logger.LogWarning("Default library file {Path} is empty or missing a name; skipping.", path);
                continue;
            }
            yield return file;
        }
    }

    /// <summary>Shape of a <c>Data/DefaultLibraries/*.json</c> file: a library header plus entries in
    /// the same format as an import file (<see cref="ImportEntryDto"/>).</summary>
    private record DefaultLibraryFile(string Name, string? Description, List<ImportEntryDto> Entries);

    private static Entry NewEntry(params (string Lang, string Text)[] translations) => new()
    {
        Translations = translations
            .Select(t => new Translation { LanguageCode = t.Lang, Text = t.Text })
            .ToList()
    };
}
