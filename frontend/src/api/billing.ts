import { api } from './client';
import type { Account } from './types';

interface CheckoutUrl {
  url: string;
}

/** Start a subscription checkout; the caller redirects to the returned Stripe URL. */
export const createCheckoutSession = () =>
  api<CheckoutUrl>('/billing/checkout', { method: 'POST' });

/** Confirm a returned checkout session; returns the refreshed account (with isPremium). */
export const confirmCheckout = (sessionId: string) =>
  api<Account>('/billing/confirm', { method: 'POST', body: JSON.stringify({ sessionId }) });

/** Start the one-time free trial (no payment); returns the refreshed account. */
export const startTrial = () => api<Account>('/billing/trial', { method: 'POST' });

/** Open the Stripe Customer Portal to manage/cancel the subscription. */
export const openPortal = () => api<CheckoutUrl>('/billing/portal', { method: 'POST' });

/** Amount is in the currency's minor unit (cents), as Stripe reports it. */
export interface PriceInfo {
  amountMinorUnits: number;
  currency: string;
  interval: string;
  intervalCount: number;
}

/**
 * What premium costs, straight from Stripe. `undefined` when the API answers 204 (no price
 * configured) — the caller hides the price rather than guessing one, because a quoted price that
 * disagrees with the charged price is worse than no quoted price.
 */
export const getPrice = () => api<PriceInfo | undefined>('/billing/price');
