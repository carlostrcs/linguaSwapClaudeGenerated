using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

public record LibrarySummary(int Id, string Name, string? Description, DateTime CreatedAt, int EntryCount);

public record CreateLibraryRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description);

public record UpdateLibraryRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description);
