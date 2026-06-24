using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LinguaSwap.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Creates signed JWTs for authenticated users.
/// </summary>
public class TokenService(IConfiguration config)
{
    public (string Token, DateTime ExpiresAt) CreateToken(ApplicationUser user)
    {
        var jwt = config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddHours(double.Parse(jwt["ExpiryHours"] ?? "12"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
