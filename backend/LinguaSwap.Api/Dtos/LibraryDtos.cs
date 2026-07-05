using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

// EntryCount is the *visible* word count (capped at the free limit for free users); HiddenEntryCount
// is how many words in this library are hidden by that cap (0 for premium users).
public record LibrarySummary(
    int Id, string Name, string? Description, DateTime CreatedAt, int EntryCount, int HiddenEntryCount);

// A curated "default" library as shown on the featured shelf. WordCount is the full size of the set;
// SampleWords is a short teaser (blurred for free users, a preview for premium) so a user can see
// what the set contains before adding it.
public record FeaturedLibrarySummary(
    int Id, string Name, string? Description, int WordCount, IReadOnlyList<string> SampleWords);

public record CreateLibraryRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description);

public record UpdateLibraryRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description);
