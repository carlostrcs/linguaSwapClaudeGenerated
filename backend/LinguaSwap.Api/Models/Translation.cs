namespace LinguaSwap.Api.Models;

/// <summary>
/// One language's text for an entry (e.g. LanguageCode "es", Text "perro").
/// </summary>
public class Translation
{
    public int Id { get; set; }
    public int EntryId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;

    public Entry? Entry { get; set; }
}
