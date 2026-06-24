using LinguaSwap.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Data;

/// <summary>
/// Seeds a demo user with a sample library the first time the app runs on an
/// empty database, so there's something to log in to and practise immediately.
/// Demo login: demo@linguaswap.app / Demo123!
/// </summary>
public static class DbSeeder
{
    public const string DemoEmail = "demo@linguaswap.app";
    public const string DemoPassword = "Demo123!";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var users = services.GetRequiredService<UserManager<ApplicationUser>>();

        // Only seed when there are no users yet.
        if (await db.Users.AnyAsync()) return;

        var demo = new ApplicationUser
        {
            UserName = DemoEmail,
            Email = DemoEmail,
            DisplayName = "Demo User",
            EmailConfirmed = true
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

    private static Entry NewEntry(params (string Lang, string Text)[] translations) => new()
    {
        Translations = translations
            .Select(t => new Translation { LanguageCode = t.Lang, Text = t.Text })
            .ToList()
    };
}
