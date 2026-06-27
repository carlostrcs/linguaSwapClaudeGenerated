using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

/// <summary>Redirect URL for a Stripe-hosted page (checkout or customer portal).</summary>
public record CheckoutUrlResponse(string Url);

/// <summary>Confirms a returned Checkout session so premium can be granted (dev path).</summary>
public record ConfirmCheckoutRequest([Required] string SessionId);
