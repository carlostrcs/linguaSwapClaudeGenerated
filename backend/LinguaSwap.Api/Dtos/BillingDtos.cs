using System.ComponentModel.DataAnnotations;

namespace LinguaSwap.Api.Dtos;

/// <summary>Redirect URL for a Stripe-hosted page (checkout or customer portal).</summary>
public record CheckoutUrlResponse(string Url);

/// <summary>Confirms a returned Checkout session so premium can be granted (dev path).</summary>
public record ConfirmCheckoutRequest([Required] string SessionId);

/// <summary>
/// What the subscription costs, read from Stripe rather than configured here, so the price shown
/// to a user can never disagree with the price their card is charged. Amount is in the currency's
/// minor unit (cents), which is how Stripe reports it.
/// </summary>
public record PriceResponse(long AmountMinorUnits, string Currency, string Interval, int IntervalCount);
