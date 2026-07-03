using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

// IsPremium is the *effective* flag (paid OR active trial); SubscriptionActive is the raw paid flag;
// TrialEndsAt drives the trial countdown; HiddenLibraries is how many of the user's libraries are
// currently hidden by the free-tier cap (0 for premium users).
public record AccountResponse(
    string UserId,
    string Email,
    string? DisplayName,
    bool IsPremium,
    bool SubscriptionActive,
    DateTime? TrialEndsAt,
    int HiddenLibraries,
    bool EmailConfirmed);

public record UpdateProfileRequest(
    [Required, EmailAddress] string Email,
    string? DisplayName);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(6)] string NewPassword);
