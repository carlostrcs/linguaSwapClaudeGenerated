using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Xunit;

namespace LinguaSwap.Tests;

public class EntryImportTests
{
    private static Entry Entry(params (string Lang, string Text)[] translations) => new()
    {
        Translations = translations.Select(t => new Translation { LanguageCode = t.Lang, Text = t.Text }).ToList(),
    };

    [Fact]
    public void Signature_IsOrderCaseAndWhitespaceInsensitive()
    {
        var a = EntryImport.Signature([("en", "Dog"), ("es", " perro ")]);
        var b = EntryImport.Signature([("es", "PERRO"), ("en", "dog")]);
        Assert.Equal(a, b);
    }

    [Fact]
    public void Signature_DiffersWhenAnyTranslationDiffers()
    {
        var a = EntryImport.Signature([("en", "dog"), ("es", "perro")]);
        var b = EntryImport.Signature([("en", "dog"), ("es", "can")]);
        Assert.NotEqual(a, b);
    }

    [Fact]
    public void Deduplicate_CollapsesRepeatsWithinTheBatch()
    {
        var built = new List<Entry>
        {
            Entry(("en", "dog"), ("es", "perro")),
            Entry(("en", "dog"), ("es", "perro")),
            Entry(("en", "cat"), ("es", "gato")),
        };

        var (kept, skipped) = EntryImport.Deduplicate(built, new HashSet<string>());

        Assert.Equal(2, kept.Count);
        Assert.Equal(1, skipped);
    }

    [Fact]
    public void Deduplicate_SkipsEntriesAlreadyPresent()
    {
        var existing = new HashSet<string> { EntryImport.Signature([("en", "dog"), ("es", "perro")]) };
        var built = new List<Entry>
        {
            Entry(("en", "dog"), ("es", "perro")), // already exists -> skipped
            Entry(("en", "cat"), ("es", "gato")),  // new -> kept
        };

        var (kept, skipped) = EntryImport.Deduplicate(built, existing);

        Assert.Single(kept);
        Assert.Equal("cat", kept[0].Translations.First(t => t.LanguageCode == "en").Text);
        Assert.Equal(1, skipped);
    }

    [Fact]
    public void Deduplicate_KeepsEntryWhenAnyTranslationDiffers()
    {
        var existing = new HashSet<string> { EntryImport.Signature([("en", "dog"), ("es", "perro")]) };
        var built = new List<Entry> { Entry(("en", "dog"), ("es", "can")) };

        var (kept, skipped) = EntryImport.Deduplicate(built, existing);

        Assert.Single(kept);
        Assert.Equal(0, skipped);
    }
}
