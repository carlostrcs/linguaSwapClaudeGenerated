namespace LinguaSwap.Api.Models;

/// <summary>
/// A collection of word entries owned by a user (e.g. "Travel Spanish").
/// </summary>
public class Library
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
    public ICollection<Entry> Entries { get; set; } = new List<Entry>();
}
