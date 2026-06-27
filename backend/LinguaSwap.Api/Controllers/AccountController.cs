using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api/account")]
[Authorize]
public class AccountController(UserManager<ApplicationUser> users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();
        return Ok(new AccountResponse(user.Id, user.Email!, user.DisplayName, user.IsPremium));
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdateProfileRequest req)
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();

        if (!string.Equals(user.Email, req.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await users.FindByEmailAsync(req.Email) is not null)
                return Conflict(new { message = "That email is already in use." });

            var setEmail = await users.SetEmailAsync(user, req.Email);
            if (!setEmail.Succeeded)
                return BadRequest(new { errors = setEmail.Errors.Select(e => e.Description) });
            await users.SetUserNameAsync(user, req.Email);
        }

        user.DisplayName = req.DisplayName;
        var update = await users.UpdateAsync(user);
        if (!update.Succeeded)
            return BadRequest(new { errors = update.Errors.Select(e => e.Description) });

        return Ok(new AccountResponse(user.Id, user.Email!, user.DisplayName, user.IsPremium));
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();

        var result = await users.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();

        // Deleting the user cascades to all their libraries, words and practice data
        // via the foreign keys configured in AppDbContext.
        var result = await users.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return NoContent();
    }
}
