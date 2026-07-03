using LinguaSwap.Api.Dtos;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace LinguaSwap.Api.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController(
    UserManager<ApplicationUser> users,
    StripeService stripe,
    PremiumService premium,
    ILogger<BillingController> logger) : ControllerBase
{
    /// <summary>Start a subscription checkout; returns the Stripe-hosted URL to redirect to.</summary>
    [Authorize]
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout()
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();
        if (user.IsPremium) return BadRequest(new { message = "You already have premium." });

        try
        {
            var url = await stripe.CreateCheckoutSessionAsync(user);
            return Ok(new CheckoutUrlResponse(url));
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe checkout session creation failed");
            return StatusCode(StatusCodes.Status502BadGateway,
                new { message = "Could not start checkout. Please try again later." });
        }
    }

    /// <summary>
    /// Confirm a returned Checkout session and grant premium (dev-friendly path that works
    /// without webhooks). Returns the refreshed account so the client can update immediately.
    /// </summary>
    [Authorize]
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(ConfirmCheckoutRequest req)
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();

        try
        {
            var granted = await stripe.GrantFromSessionAsync(req.SessionId, user.Id);
            if (!granted) return BadRequest(new { message = "Payment could not be confirmed." });
            return Ok(await BuildAccountResponseAsync(user));
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe session confirmation failed");
            return StatusCode(StatusCodes.Status502BadGateway,
                new { message = "Could not confirm payment. Please try again later." });
        }
    }

    /// <summary>Start the user's one-time free trial (no payment). Returns the refreshed account, or
    /// 400 if the trial has already been used.</summary>
    [Authorize]
    [HttpPost("trial")]
    public async Task<IActionResult> StartTrial()
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();

        // StartTrialAsync mutates the same tracked user entity (shared request-scoped DbContext),
        // so `user` already reflects the new trial window after this returns.
        var started = await premium.StartTrialAsync(user.Id, DateTime.UtcNow);
        if (!started)
            return BadRequest(new { message = "You have already used your free trial." });

        return Ok(await BuildAccountResponseAsync(user));
    }

    /// <summary>Build the account DTO with effective-premium + trial + hidden-library fields.</summary>
    private async Task<AccountResponse> BuildAccountResponseAsync(ApplicationUser user)
    {
        var isPremium = user.HasPremiumAccess(DateTime.UtcNow);
        var hiddenLibraries = await premium.HiddenLibraryCountAsync(user.Id, isPremium);
        return new AccountResponse(
            user.Id, user.Email!, user.DisplayName,
            isPremium, user.IsPremium, user.TrialEndsAt, hiddenLibraries);
    }

    /// <summary>Open the Stripe Customer Portal so the user can manage/cancel their subscription.</summary>
    [Authorize]
    [HttpPost("portal")]
    public async Task<IActionResult> Portal()
    {
        var user = await users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();

        try
        {
            var url = await stripe.CreatePortalSessionAsync(user);
            if (url is null) return BadRequest(new { message = "No billing account yet." });
            return Ok(new CheckoutUrlResponse(url));
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe portal session creation failed");
            return StatusCode(StatusCodes.Status502BadGateway,
                new { message = "Could not open the billing portal. Please try again later." });
        }
    }

    /// <summary>Stripe webhook endpoint (signature-verified). The production-correct way premium
    /// is granted/revoked. Anonymous because Stripe calls it directly.</summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();
        try
        {
            await stripe.HandleWebhookAsync(json, Request.Headers["Stripe-Signature"]!);
            return Ok();
        }
        catch (StripeException ex)
        {
            logger.LogWarning(ex, "Stripe webhook rejected (signature/handling)");
            return BadRequest();
        }
    }
}
