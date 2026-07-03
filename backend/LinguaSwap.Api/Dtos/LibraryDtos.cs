using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

// EntryCount is the *visible* word count (capped at the free limit for free users); HiddenEntryCount
// is how many words in this library are hidden by that cap (0 for premium users).
public record LibrarySummary(
    int Id, string Name, string? Description, DateTime CreatedAt, int EntryCount, int HiddenEntryCount);

public record CreateLibraryRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description);

public record UpdateLibraryRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description);
