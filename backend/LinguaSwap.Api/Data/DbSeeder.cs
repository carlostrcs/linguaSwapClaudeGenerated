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
        var env = services.GetRequiredService<IHostEnvironment>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        // The demo account has a password that is published in the repo and the README, so it must
        // never exist in a real deployment — a fresh production database is empty, which is exactly
        // the condition the old "seed if no users" check treated as "please seed the demo user".
        if (env.IsDevelopment())
            await SeedDemoUserAsync(db, users);

        // The curated featured libraries are wanted in every environment.
        await SeedDefaultLibrariesAsync(db, users, logger);
    }

    /// <summary>Development only (gated in <see cref="SeedAsync"/>). Idempotent: creates the demo
    /// account and its sample library if the account isn't there yet.</summary>
    private static async Task SeedDemoUserAsync(AppDbContext db, UserManager<ApplicationUser> users)
    {
        if (await users.FindByEmailAsync(DemoEmail) is not null) return;

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
    /// (matched by name), creates it if missing or **reconciles** an existing master to the file —
    /// adding new entries, removing ones the file no longer contains, and syncing notes. The file
    /// is the source of truth, so a corrected word replaces the broken one instead of sitting
    /// alongside it. Existing user copies are snapshots and are not rewritten here.</summary>
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

        foreach (var file in LoadDefaultLibraryFiles(logger))
        {
            // Saved per library, not once at the end. The curated set is thousands of
            // entries (each with six translations); batching them all into a single
            // transaction over a pooled remote connection is slow enough to time out,
            // and because this runs during startup a throw here means the app never
            // boots. Per-library saves keep each transaction small and make progress
            // durable — a failure keeps what already landed and the next boot resumes.
            var changed = false;
            try
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
                    // Reconcile the master to the file, rather than only appending. Append-only
                    // meant a CORRECTION could never land: fixing "change (money back)" to
                    // "change" in the JSON added the fixed row and left the broken one in place,
                    // so every already-seeded database (including production) kept serving a word
                    // whose annotation the learner had to type to be graded correct.
                    var (deduped, _) = EntryImport.Deduplicate(built, new HashSet<string>());
                    var wanted = deduped.ToDictionary(
                        e => EntryImport.Signature(e.Translations.Select(t => (t.LanguageCode, t.Text))));

                    var removed = 0;
                    foreach (var entry in master.Entries.ToList())
                    {
                        var signature = EntryImport.Signature(
                            entry.Translations.Select(t => (t.LanguageCode, t.Text)));
                        if (wanted.Remove(signature, out var match))
                        {
                            // Already present — keep the row (and its learning history) and just
                            // sync the note, which is the only field that can change in place.
                            if (entry.Notes != match.Notes)
                            {
                                entry.Notes = match.Notes;
                                changed = true;
                            }
                        }
                        else
                        {
                            // No longer in the file: a corrected or retired word.
                            master.Entries.Remove(entry);
                            removed++;
                        }
                    }

                    foreach (var entry in wanted.Values) master.Entries.Add(entry);

                    var descChanged = master.Description != file.Description;
                    if (descChanged) master.Description = file.Description;
                    if (wanted.Count > 0 || removed > 0 || descChanged) changed = true;
                    if (wanted.Count > 0 || removed > 0)
                        logger.LogInformation(
                            "Reconciled default library '{Name}': +{Added} / -{Removed} words.",
                            file.Name, wanted.Count, removed);
                    }

                if (changed) await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Curated content is not worth failing a boot over: the API is fully
                // usable with a stale shelf, but useless if it will not start. Log it,
                // drop the tracked changes so the next file starts clean, and continue.
                logger.LogError(ex, "Failed to seed default library '{Name}'; skipping.", file.Name);
                foreach (var entry in db.ChangeTracker.Entries().ToList())
                    entry.State = EntityState.Detached;
            }
        }
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
