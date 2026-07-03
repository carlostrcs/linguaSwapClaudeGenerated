using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

public record RegisterRequest(
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")] string Email,
    // Complexity (length + character mix) is enforced by Identity in Program.cs so the
    // rules live in one place; here we only guarantee a value is present.
    [Required(ErrorMessage = "Password is required.")] string Password,
    string? DisplayName);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RefreshRequest(
    [Required] string RefreshToken);

public record LogoutRequest(
    string? RefreshToken);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    string RefreshToken,
    string UserId,
    string Email,
    string? DisplayName,
    // IsPremium is the *effective* premium flag (paid subscription OR active trial); the client
    // gates every premium UI on it. SubscriptionActive is the raw paid flag and TrialEndsAt lets
    // the UI distinguish a trial from a paid plan and show a countdown.
    bool IsPremium,
    bool SubscriptionActive,
    DateTime? TrialEndsAt);
