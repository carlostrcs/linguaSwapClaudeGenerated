using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    string? DisplayName);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    string UserId,
    string Email,
    string? DisplayName,
    bool IsPremium);
