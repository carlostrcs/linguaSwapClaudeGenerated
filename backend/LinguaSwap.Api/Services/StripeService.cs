using LinguaSwap.Api.Data;
using LinguaSwap.Api.Models;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace LinguaSwap.Api.Services;

/// <summary>
/// Thin wrapper over the Stripe SDK for the premium subscription flow:
/// create a Checkout session, confirm a returned session, and react to webhook events.
/// All premium state changes ultimately set <see cref="ApplicationUser.IsPremium"/> in the DB.
/// </summary>
public class StripeService(AppDbContext db, IConfiguration config, ILogger<StripeService> logger)
{
    private IConfigurationSection Cfg => config.GetSection("Stripe");
    private string FrontendBaseUrl => config["FrontendBaseUrl"] ?? "http://localhost:5173";

    /// <summary>Create a subscription Checkout session and return its hosted URL.</summary>
    public async Task<string> CreateCheckoutSessionAsync(ApplicationUser user)
    {
        // Ensure a Stripe customer exists so webhook events can be mapped back to this user.
        if (string.IsNullOrEmpty(user.StripeCustomerId))
        {
            var customer = await new CustomerService().CreateAsync(new CustomerCreateOptions
            {
                Email = user.Email,
                Name = user.DisplayName,
                Metadata = new Dictionary<string, string> { ["userId"] = user.Id },
            });
            user.StripeCustomerId = customer.Id;
            await db.SaveChangesAsync();
        }

        var session = await new SessionService().CreateAsync(new SessionCreateOptions
        {
            Mode = "subscription",
            Customer = user.StripeCustomerId,
            ClientReferenceId = user.Id,
            LineItems = [new SessionLineItemOptions { Price = Cfg["PriceId"], Quantity = 1 }],
            SuccessUrl = $"{FrontendBaseUrl}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{FrontendBaseUrl}/account",
        });
        return session.Url;
    }

    /// <summary>
    /// Dev-friendly confirmation: re-read the Checkout session on the return URL and grant
    /// premium if it's paid and belongs to this user. Lets the flow work without webhook infra.
    /// </summary>
    public async Task<bool> GrantFromSessionAsync(string sessionId, string userId)
    {
        var session = await new SessionService().GetAsync(sessionId);
        if (session.ClientReferenceId != userId) return false;
        if (session.PaymentStatus != "paid" && session.Status != "complete") return false;

        await GrantAsync(userId, session.CustomerId, session.SubscriptionId);
        return true;
    }

    /// <summary>Verify and dispatch a Stripe webhook event.</summary>
    public async Task HandleWebhookAsync(string json, string signature)
    {
        var stripeEvent = EventUtility.ConstructEvent(json, signature, Cfg["WebhookSecret"]);

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
                if (stripeEvent.Data.Object is Session session && session.ClientReferenceId is { } uid)
                    await GrantAsync(uid, session.CustomerId, session.SubscriptionId);
                break;

            case "customer.subscription.deleted":
                if (stripeEvent.Data.Object is Subscription deleted)
                    await RevokeByCustomerAsync(deleted.CustomerId);
                break;

            case "customer.subscription.updated":
                // Treat anything that isn't an active/trialing subscription as a loss of premium.
                if (stripeEvent.Data.Object is Subscription updated
                    && updated.Status is not ("active" or "trialing"))
                    await RevokeByCustomerAsync(updated.CustomerId);
                break;

            default:
                logger.LogDebug("Unhandled Stripe event type {Type}", stripeEvent.Type);
                break;
        }
    }

    private async Task GrantAsync(string userId, string? customerId, string? subscriptionId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return;
        user.IsPremium = true;
        if (!string.IsNullOrEmpty(customerId)) user.StripeCustomerId = customerId;
        if (!string.IsNullOrEmpty(subscriptionId)) user.StripeSubscriptionId = subscriptionId;
        await db.SaveChangesAsync();
    }

    private async Task RevokeByCustomerAsync(string? customerId)
    {
        if (string.IsNullOrEmpty(customerId)) return;
        var user = await db.Users.FirstOrDefaultAsync(u => u.StripeCustomerId == customerId);
        if (user is null) return;
        user.IsPremium = false;
        user.StripeSubscriptionId = null;
        await db.SaveChangesAsync();
    }

    /// <summary>Create a Stripe Customer Portal session so the user can manage/cancel.</summary>
    public async Task<string?> CreatePortalSessionAsync(ApplicationUser user)
    {
        if (string.IsNullOrEmpty(user.StripeCustomerId)) return null;
        var session = await new Stripe.BillingPortal.SessionService().CreateAsync(
            new Stripe.BillingPortal.SessionCreateOptions
            {
                Customer = user.StripeCustomerId,
                ReturnUrl = $"{FrontendBaseUrl}/account",
            });
        return session.Url;
    }
}
