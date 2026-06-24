using Microsoft.AspNetCore.Identity;

namespace LinguaSwap.Api.Models;

/// <summary>
/// The app's user. Extends ASP.NET Identity's user with a display name.
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }

    public ICollection<Library> Libraries { get; set; } = new List<Library>();
    public ICollection<PracticeSession> PracticeSessions { get; set; } = new List<PracticeSession>();
}
