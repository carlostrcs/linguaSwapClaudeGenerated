using System.Security.Claims;

namespace LinguaSwap.Api.Services;

public static class ClaimsPrincipalExtensions
{
    /// <summary>The current user's id, taken from the JWT. Throws if missing.</summary>
    public static string GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("User id claim is missing from the token.");
}
