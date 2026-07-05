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

    /// <summary>True for curated "default" libraries owned by the system account and offered to
    /// users on the Libraries page (premium can add a copy; free users only see the card).</summary>
    public bool IsDefault { get; set; }

    /// <summary>On a user's copy of a default library, the id of the master it was cloned from.
    /// Lets us hide already-added sets from the featured shelf (and show them again if deleted).
    /// A plain soft reference — no FK, so deleting a master never touches copies.</summary>
    public int? SourceDefaultId { get; set; }

    public ApplicationUser? User { get; set; }
    public ICollection<Entry> Entries { get; set; } = new List<Entry>();
}
