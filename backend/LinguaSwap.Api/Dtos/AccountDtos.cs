using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

public record AccountResponse(string UserId, string Email, string? DisplayName);

public record UpdateProfileRequest(
    [Required, EmailAddress] string Email,
    string? DisplayName);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(6)] string NewPassword);
