// The legal documents, as data. Build-time only — this never reaches the client bundle.
//
// NOT LEGAL ADVICE. These are drafted to describe accurately what this application actually does
// (which is the part a lawyer cannot know and the part that is expensive to get wrong), but the
// business and jurisdictional decisions are marked PLACEHOLDER below and must be completed, and
// the result should be reviewed by someone qualified before you rely on it.
//
// Everything asserted here was checked against the code:
//   - what is stored            -> Models/, AppDbContext
//   - what leaves the server    -> StripeService, IEmailSender, and nothing else
//   - what the browser keeps    -> api/client.ts, ThemeProvider, I18nProvider, lib/offlineQueue
//   - what deleting does        -> AccountController.Delete (cascade + Stripe cancellation)
//   - the free-plan limits      -> Services/PremiumService
// If any of those change, change this file in the same commit. A privacy policy that describes a
// previous version of the software is worse than none, because it is a written misstatement.

import type { LegalKey } from '../../src/content/legal';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  key: LegalKey;
  title: string;
  description: string;
  heading: string;
  lede: string;
  sections: LegalSection[];
}

/**
 * PLACEHOLDER — replace every value here with the real operator details, then rebuild.
 *
 * While any value still starts with `PLACEHOLDER`, the generator marks these pages `noindex` and
 * prints a build warning, so an unfinished policy cannot quietly get indexed as the real thing.
 * See `isDraft()` below and its use in build/routes.ts.
 */
export const PROVIDER = {
  /** The legal entity or individual operating LinguaSwap ("Sole trader, Jane Doe" / "Acme S.L."). */
  name: 'PLACEHOLDER — operator legal name',
  /** Registered address, or at least the country of establishment. */
  address: 'PLACEHOLDER — registered address',
  /** A monitored address. Data-protection requests and refund requests both arrive here. */
  email: 'PLACEHOLDER — contact@yourdomain',
  /** Country whose law governs the terms, and whose courts hear disputes. */
  jurisdiction: 'PLACEHOLDER — country',
  /** Supervisory authority for data-protection complaints (e.g. the AEPD in Spain). */
  supervisoryAuthority: 'PLACEHOLDER — your national data protection authority',
  /** Business decision: how long after a charge you will refund. The EU withdrawal right is 14 days. */
  refundWindowDays: 14,
  /** Shown as "last updated" on every document. Bump when you change the text. */
  lastUpdated: '2026-08-05',
} as const;

/** True while any operator detail is still a placeholder. */
export function isDraft(): boolean {
  return Object.values(PROVIDER).some((value) => typeof value === 'string' && value.startsWith('PLACEHOLDER'));
}

const ENGLISH_ONLY =
  'This document is published in English only, and the English text is the authoritative version. ' +
  'The rest of LinguaSwap is available in seven languages; if you need any of this explained in ' +
  `another language, write to ${PROVIDER.email} and we will help.`;

const privacy: LegalDoc = {
  key: 'privacy',
  title: 'Privacy Policy — LinguaSwap',
  description:
    'What LinguaSwap stores, who processes it, how long it is kept, and how to get a copy or have it deleted.',
  heading: 'Privacy Policy',
  lede: `Last updated ${PROVIDER.lastUpdated}. LinguaSwap is a vocabulary-practice app. It needs an email address and the words you choose to study — and deliberately not much else. There is no advertising, no tracking, and nothing here is sold.`,
  sections: [
    {
      heading: 'Who is responsible',
      paragraphs: [
        `LinguaSwap is operated by ${PROVIDER.name}, ${PROVIDER.address}. For anything in this policy, including a request to see or delete your data, write to ${PROVIDER.email}.`,
        ENGLISH_ONLY,
      ],
    },
    {
      heading: 'What is stored',
      paragraphs: ['Everything below is kept in order to run the service you asked for:'],
      bullets: [
        'Your account: email address, an optional display name, and whether the address has been confirmed. Your password is never stored — only a salted hash of it.',
        'Your content: the libraries, words, translations and notes you create or import.',
        'Your learning data: which words you answered and whether you were right, the spaced-repetition box each word sits in, practice sessions, and your progress through a Journey.',
        'Billing identifiers: if you subscribe, a Stripe customer id and subscription id. Card numbers never reach our servers — payment happens on a page hosted by Stripe.',
        'Ordinary server logs kept by our hosting providers, which include IP addresses, for security and debugging.',
      ],
    },
    {
      heading: 'What is not done',
      bullets: [
        'No advertising, and no data sold or rented to anyone.',
        'No third-party analytics, no tracking pixels and no advertising cookies.',
        'No profiling and no automated decisions that have legal or similarly significant effects.',
        'Your words and notes are never used to train machine-learning models.',
      ],
    },
    {
      heading: 'Storage in your browser',
      paragraphs: [
        'LinguaSwap keeps a few things in your browser’s local storage rather than in cookies: your sign-in tokens, your chosen theme and interface language, and — so that practising still works with no connection — any answers waiting to be sent to the server. All of it is strictly necessary to provide the service you requested.',
        'Because none of it is used for tracking or advertising, there is no consent banner to click. Clearing your browser storage signs you out and discards any unsent answers.',
      ],
    },
    {
      heading: 'Why it is allowed (legal bases)',
      bullets: [
        'Performance of a contract: running your account, storing your libraries, scheduling your reviews and taking payment.',
        'Legitimate interests: keeping the service secure, preventing abuse, and fixing faults.',
        'Legal obligation: retaining invoices and transaction records for tax and accounting.',
      ],
    },
    {
      heading: 'Who else processes it',
      paragraphs: ['LinguaSwap runs on services that process data on our behalf, under contract:'],
      bullets: [
        'Supabase — the PostgreSQL database holding your account and content.',
        'Render — hosting for the application server.',
        'Vercel — hosting and content delivery for the website.',
        'Stripe — payment processing and subscription management. Stripe is the controller of your payment-card data, under its own privacy policy.',
        'Resend — delivery of transactional email such as address confirmation and password resets.',
      ],
    },
    {
      heading: 'Where it goes',
      paragraphs: [
        'Some of these providers are established in, or operate infrastructure in, the United States. Where personal data is transferred outside the European Economic Area, it is covered by the safeguards those providers offer for international transfers, such as the European Commission’s standard contractual clauses.',
      ],
    },
    {
      heading: 'How long it is kept',
      paragraphs: [
        'Your account and its content are kept until you delete them. Deleting your account from the Account page removes your libraries, words, practice history and statistics, and cancels any active subscription at the same time.',
        'Records of payments are retained by Stripe and by us for as long as tax and accounting law requires, which is longer than the account itself. Server logs are kept for a short period by our hosting providers.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'If you are in the EU or UK you have the right to access your data, to correct it, to have it erased, to restrict or object to processing, and to receive a copy in a portable format.',
        `Deleting your account is self-service on the Account page and takes effect immediately. For anything else — including a copy of your data — write to ${PROVIDER.email} and we will respond within one month.`,
        `If you think your data has been handled improperly you may complain to a data-protection authority, in your case likely ${PROVIDER.supervisoryAuthority}.`,
      ],
    },
    {
      heading: 'Security',
      bullets: [
        'Passwords are stored only as salted hashes, using the standard ASP.NET Core Identity hashing.',
        'All traffic runs over HTTPS.',
        'Sign-in uses a short-lived access token plus a refresh token that is stored hashed, is rotated on every use, and can be revoked.',
        'Repeated failed sign-in attempts lock an account temporarily, and the sign-in endpoints are rate-limited.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'LinguaSwap is not directed at children. You must be at least 16, or the minimum age for consenting to online services in your country, to create an account.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: [
        'If this policy changes materially, the date at the top changes and, where the change affects you, we will tell you by email or in the app before it takes effect.',
      ],
    },
  ],
};

const terms: LegalDoc = {
  key: 'terms',
  title: 'Terms of Service — LinguaSwap',
  description:
    'The agreement for using LinguaSwap: accounts, your content, the free and premium plans, billing, and the limits of our liability.',
  heading: 'Terms of Service',
  lede: `Last updated ${PROVIDER.lastUpdated}. These terms are the agreement between you and ${PROVIDER.name} for the use of LinguaSwap. Creating an account means accepting them.`,
  sections: [
    {
      heading: 'The service',
      paragraphs: [
        'LinguaSwap lets you build libraries of words with translations in several languages, practise them in a chosen direction, and track your progress with a spaced-repetition schedule. Some features are limited to a paid plan, described below.',
        ENGLISH_ONLY,
      ],
    },
    {
      heading: 'Your account',
      bullets: [
        'You must be at least 16, or the minimum age for consenting to online services in your country.',
        'Give a real email address: it is how a password reset or a billing notice reaches you.',
        'Keep your password to yourself. You are responsible for what happens under your account.',
        'Tell us promptly if you believe someone else has access to it.',
      ],
    },
    {
      heading: 'Your content stays yours',
      paragraphs: [
        'The libraries, words and notes you create or import remain yours. You grant us only the permission needed to run the service — to store your content, display it back to you, and process it to schedule your reviews and produce your statistics.',
        'You are responsible for having the right to upload what you upload, and for it not being unlawful.',
      ],
    },
    {
      heading: 'Our content',
      paragraphs: [
        'The curated featured libraries, the guides, the vocabulary pages and the software itself belong to us or our licensors. Adding a featured library to your account gives you a personal copy to learn from; it does not give you the right to republish or redistribute the collection.',
      ],
    },
    {
      heading: 'Acceptable use',
      bullets: [
        'Do not attempt to break, overload or probe the service, or to access another user’s data.',
        'Do not scrape the site or automate access beyond ordinary personal use.',
        'Do not resell access, or use the service to store unlawful material.',
      ],
    },
    {
      heading: 'Free plan, trial and premium',
      paragraphs: [
        'A new account starts a one-time free trial of the premium features. No card is required and the trial does not turn into a paid subscription by itself — when it ends, the account simply returns to the free plan.',
        'The free plan limits how many libraries you can keep and how many words each library can hold, and reserves some practice modes, word import and the detailed statistics for premium.',
      ],
      bullets: [
        'Important: if you exceed those limits while on premium and later return to the free plan, the content over the limit is HIDDEN, not deleted — your newest libraries beyond the free allowance, and the newest words beyond it in each library, stop being shown.',
        'Nothing is erased by this, and everything reappears immediately if you subscribe again.',
      ],
    },
    {
      heading: 'Billing',
      bullets: [
        'The price and billing period are shown before you are sent to the payment page, and again by Stripe before you confirm.',
        'A subscription renews automatically each period until you cancel it.',
        'You can cancel at any time from the billing portal, reachable from the Account page.',
        'If the price changes, we will tell you before it applies to you, and you can cancel instead.',
        'Prices are shown inclusive or exclusive of tax as indicated at checkout; any tax is handled by Stripe.',
      ],
    },
    {
      heading: 'Availability',
      paragraphs: [
        'We try to keep LinguaSwap available and correct, but it is provided as-is. We do not promise a particular level of uptime, and features may change, be added, or be withdrawn.',
        'Keep your own copy of anything you could not bear to lose.',
      ],
    },
    {
      heading: 'Liability',
      paragraphs: [
        'Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or anything else that cannot lawfully be limited — and if you are a consumer, your statutory rights are unaffected.',
        'Subject to that, our total liability to you is limited to the amount you paid us in the twelve months before the event, and we are not liable for indirect or consequential loss.',
      ],
    },
    {
      heading: 'Ending the agreement',
      paragraphs: [
        'You can stop at any time by cancelling your subscription or deleting your account from the Account page; deleting the account also cancels the subscription.',
        'We may suspend or close an account that breaches these terms, or where we are required to by law. If we close your account without cause, we will refund the unused part of anything you have paid.',
      ],
    },
    {
      heading: 'Changes and governing law',
      paragraphs: [
        'If these terms change materially, the date at the top changes and we will tell you before the change applies to you.',
        `These terms are governed by the law of ${PROVIDER.jurisdiction}, and its courts have jurisdiction, without depriving you of any protection you have under the mandatory consumer law of the country you live in.`,
        `Questions: ${PROVIDER.email}.`,
      ],
    },
  ],
};

const refunds: LegalDoc = {
  key: 'refunds',
  title: 'Cancellation & Refunds — LinguaSwap',
  description:
    'How to cancel a LinguaSwap subscription, what happens to your access and your data, and when a refund is available.',
  heading: 'Cancellation & Refunds',
  lede: `Last updated ${PROVIDER.lastUpdated}. Cancel whenever you like, from inside the app, without writing to anyone.`,
  sections: [
    {
      heading: 'How to cancel',
      paragraphs: [
        'Open the Account page and use the button that takes you to the billing portal. Cancelling stops the subscription renewing; you keep premium until the end of the period you have already paid for, and you are not charged again.',
        'Deleting your account cancels the subscription immediately, at the same time as it deletes your data.',
      ],
    },
    {
      heading: 'What happens to your data',
      paragraphs: [
        'Cancelling a subscription does not delete anything. Your account returns to the free plan, and content beyond the free limits is hidden rather than removed — it comes back if you subscribe again. Deleting your account, by contrast, does remove your libraries, words and statistics.',
      ],
    },
    {
      heading: 'The free trial',
      paragraphs: [
        'Every new account gets a one-time free trial of the premium features, with no card and no obligation. It exists so you can decide whether the paid plan is worth it before paying anything, and it never converts into a subscription by itself.',
      ],
    },
    {
      heading: 'Your right to withdraw',
      paragraphs: [
        `If you are a consumer in the EU or UK, you may withdraw from a purchase within ${PROVIDER.refundWindowDays} days without giving a reason. To do so, write to ${PROVIDER.email} from the address on the account. We will refund you using the same payment method, without undue delay.`,
        'Where you have asked for the service to start immediately during that period, we may deduct a proportionate amount for what you used before withdrawing.',
      ],
    },
    {
      heading: 'Other refunds',
      paragraphs: [
        `Outside that window a subscription is generally non-refundable, because cancelling always stops the next charge and the trial lets you evaluate the service first. If something went wrong — you were charged twice, or the service was unusable — write to ${PROVIDER.email} and we will put it right.`,
      ],
    },
  ],
};

export const LEGAL_DOCS: LegalDoc[] = [privacy, terms, refunds];

export function legalDoc(key: LegalKey): LegalDoc {
  const doc = LEGAL_DOCS.find((d) => d.key === key);
  if (!doc) throw new Error(`No legal document for "${key}"`);
  return doc;
}
