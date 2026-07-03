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
