import type { PriceInfo } from '../api/billing';

/**
 * Format a Stripe price for display, in the reader's language.
 *
 * `Intl.NumberFormat` does the currency symbol, its position and the decimal separator per locale —
 * €5.00, 5,00 €, and 5,00 € are all the same price written the way each reader expects. Hard-coding
 * a symbol would get this wrong for six of the seven locales.
 */
export function formatAmount(price: PriceInfo, lang: string): string {
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: price.currency.toUpperCase(),
  }).format(price.amountMinorUnits / 100);
}

/**
 * i18n key for the billing period. Stripe's `interval` is one of day/week/month/year; anything
 * else, or a multi-period interval (`every 3 months`), falls back to the generic key so a price is
 * never described wrongly.
 */
export function intervalKey(price: PriceInfo): string {
  if (price.intervalCount !== 1) return 'premium.perPeriod';
  switch (price.interval) {
    case 'month':
      return 'premium.perMonth';
    case 'year':
      return 'premium.perYear';
    case 'week':
      return 'premium.perWeek';
    default:
      return 'premium.perPeriod';
  }
}
