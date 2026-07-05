# LinguaSwap — project guide for Claude Code

A vocabulary-practice web app. Users create word libraries (a concept with translations in
several languages), then practise a library in a chosen direction (e.g. Spanish → English).
A Leitner spaced-repetition algorithm schedules which words to review, and the app tracks
learning statistics. Multi-user with accounts.

## Stack

- **Backend:** ASP.NET Core Web API, **.NET 10** (`backend/LinguaSwap.Api`). Controllers-based.
  EF Core + **PostgreSQL** (Npgsql) — **Supabase** in production, **local Docker Postgres** in dev.
  ASP.NET Core Identity + **JWT** auth. Swagger UI in Development.
- **Frontend:** **React + TypeScript + Vite** (`frontend`). React Router + TanStack Query.
- **Solution file:** `backend/LinguaSwap.slnx` (new XML solution format).

## How to run (development)

Start the local database first (from repo root), then the API:
```
docker compose up -d               # local Postgres (postgres:17) on host port 5433
dotnet run --project backend/LinguaSwap.Api
```
- The DB is a Docker container (`docker-compose.yml`). `docker compose down` stops it (data
  persists in a named volume); `docker compose down -v` also wipes it. Host port is **5433**
  (not the default 5432) to stay clear of any other local Postgres — the connection string in
  `appsettings.json` (`ConnectionStrings:Default`) already points there. In **production** that
  connection string is overridden by the env var `ConnectionStrings__Default` (the Supabase
  session-pooler string; **never commit it** — same pattern as the Stripe/Email secrets).
- Schema is created automatically: `Program.cs` runs `db.Database.Migrate()` on startup, then
  `DbSeeder` seeds the demo user + featured libraries. To manage migrations by hand:
  `dotnet ef migrations add <Name> --project backend/LinguaSwap.Api` /
  `dotnet ef database update --project backend/LinguaSwap.Api`.
- API base: `http://localhost:5299`
- Swagger UI: `http://localhost:5299/swagger`
- Health check: `http://localhost:5299/api/health`

Frontend:
```
npm --prefix frontend run dev
```
- App: `http://localhost:5173` (Vite). Calls the API at `http://localhost:5299`.

> Dev runs over **HTTP** (no HTTPS redirect) to avoid dev-cert friction. CORS allows
> `http://localhost:5173` (see `Program.cs`).

### Demo login (seeded on first run)

An empty database is seeded with a demo user and a sample "Spanish Basics" library:

- **Email:** `demo@linguaswap.app` · **Password:** `Demo123!`

### Auth

JWT bearer auth. Get a token from `POST /api/auth/register` or `POST /api/auth/login`, then
send `Authorization: Bearer <token>`. In Swagger UI use the **Authorize** button. The JWT signing
key lives under `Jwt` in `appsettings.json` — it's a **dev-only** value; use user-secrets or env
vars for anything real.

**Account-creation validation.** `register` rejects weak credentials. Email format is checked by
`[EmailAddress]` on `RegisterRequest`; password complexity is enforced by ASP.NET Core Identity in
`Program.cs` — **8+ chars with an uppercase, a lowercase, and a digit** (symbols optional). Both are
authoritative server-side; the frontend mirrors them in `frontend/src/lib/validation.ts` for inline
feedback only — keep that mirror in sync with the Identity options. Validation failures now come back
as `{ message, errors }` (a global `InvalidModelStateResponseFactory` reshapes DataAnnotation errors,
and `register` joins Identity errors into `message`) so the client surfaces the actual reason.

#### Sessions (short access token + rotating refresh token)

To keep regular users logged in across days **without** a dangerously long-lived JWT, auth pairs a
short access token with a long-lived, DB-backed refresh token:

- **Access token (JWT):** short-lived — `Jwt:ExpiryHours` (now **1**). Stateless, can't be revoked,
  so we keep its blast radius small.
- **Refresh token:** opaque random token, **30-day sliding** window (`Jwt:RefreshTokenDays`). Stored
  **hashed** (SHA-256) in the `RefreshTokens` table (`Models/RefreshToken.cs`,
  `AddRefreshTokens` migration); owned by `Services/RefreshTokenService` (issue / validate-and-rotate
  / revoke). **Rotated on every use** — each refresh revokes the presented token and issues a new
  one, so a daily user stays logged in indefinitely while leaked/old tokens stop working.
- **Endpoints:** `POST /api/auth/refresh` (`{ refreshToken }` → new access token + rotated refresh
  token, or `401` if invalid/expired) and `POST /api/auth/logout` (`{ refreshToken }` → revoke, `204`).
  `register`/`login` now also return a `refreshToken` field in `AuthResponse`.
- **Frontend:** both tokens live in `localStorage` (`linguaswap.token`, `linguaswap.refreshToken`).
  The central `api/client.ts` wrapper transparently handles this: on a `401` it does a **single-flight**
  silent refresh and replays the request once; if the refresh fails it signs out. No screen ever sees
  the expiry — `signIn`/`signOut` in `auth/AuthContext.tsx` persist and revoke the refresh token.

#### Email confirmation (soft — never blocks)

New accounts are emailed a confirmation link, but confirmation is a **gentle nudge, not a gate**:
register still auto-logs the user in and login is **never** blocked. Verification just proves the
address is real.

- **Send:** `register` (and an email change in `AccountController.Update`, which un-confirms via
  `SetEmailAsync`) calls `Services/EmailConfirmationService.SendConfirmationEmailAsync` —
  `UserManager.GenerateEmailConfirmationTokenAsync` (works because `Program.cs` already calls
  `AddDefaultTokenProviders()`) → a link `{FrontendBaseUrl}/confirm-email?userId=…&token=…` (token is
  `Uri.EscapeDataString`-encoded; default Identity tokens contain `+`/`/`/`=`). Sending is
  **best-effort** (try/catch, logged, never rethrown) so a mail failure can't fail registration.
- **Transport:** `Services/IEmailSender` → `SmtpEmailSender` (MailKit) driven by the `Email` config
  section. **With no SMTP configured it logs the message (link included) instead of sending**, so the
  flow is testable before secrets are set. `EmailConfirmed` is the inherited `IdentityUser` column —
  **no migration.**
- **Endpoints:** `POST /api/auth/confirm-email` (`{ userId, token }` → `ConfirmEmailAsync`, anonymous —
  the link is often opened logged-out) and `POST /api/auth/resend-confirmation` (`[Authorize]`, no
  body → resend to the current user, idempotent no-op if already confirmed, `204`).
- **`emailConfirmed`** rides on `AuthResponse`/`AccountResponse` (mirrored into `AuthUser` and synced
  from the `['account']` query in `Layout`). The frontend shows a **dismissible** `ConfirmEmailBanner`
  (session-scoped dismiss) with a **Resend** button until confirmed; the emailed link lands on the
  public `pages/ConfirmEmailPage.tsx` (modeled on `BillingSuccessPage`). The seeded demo user is
  `EmailConfirmed = true`, so it never sees the banner.
- **Config:** `Email:FromAddress`, `Email:FromName`, `Email:Smtp:{Host,Port,User,Password,UseStartTls}`
  in `appsettings.json` — Gmail defaults (`smtp.gmail.com:587`, STARTTLS) with **empty** secret
  placeholders. Supply real values via **user-secrets** (`Email:Smtp:User` = the Gmail address,
  `Email:Smtp:Password` = a 16-char **App Password**, which requires 2FA on the account;
  `Email:FromAddress`). Env-var form for prod: `Email__Smtp__User`, `Email__Smtp__Password`,
  `Email__FromAddress`. **Never commit real values.**

## Common commands

- Build backend: `dotnet build backend/LinguaSwap.slnx`
- Run backend tests: `dotnet test backend/LinguaSwap.slnx`
- Add a migration: `dotnet ef migrations add <Name> --project backend/LinguaSwap.Api`
- Apply migrations: `dotnet ef database update --project backend/LinguaSwap.Api`
- Frontend build: `npm --prefix frontend run build`
- Frontend lint: `npm --prefix frontend run lint`

## Project structure

```
backend/LinguaSwap.Api/
  Controllers/   API endpoints (Auth, Account, Libraries, Entries, Practice, Stats, Billing, Health)
  Models/        EF Core entities
  Data/          AppDbContext + Migrations + DbSeeder
  Dtos/          request/response shapes
  Services/      LeitnerService, AnswerChecker, HintService, TokenService, EntryImport,
                 PracticeSelectors (per-mode word selection), PremiumService (gating rules),
                 StripeService (subscription billing), IEmailSender/SmtpEmailSender (MailKit)
                 + EmailConfirmationService (account email confirmation)
backend/LinguaSwap.Tests/   xUnit tests (LeitnerService, AnswerChecker, HintService, EntryImport,
                            PracticeSelectors)
frontend/src/
  api/           typed fetch wrappers
  lib/           small helpers (e.g. importFile.ts — parse an import file)
  pages/         Login, Register, Account, Libraries, LibraryEditor, Practice, Stats
  components/    Layout, ProtectedRoute, EntryForm, HintGuide, ImportPanel
  theme/         ThemeProvider + themes registry (CSS-variable theming)
  i18n/          I18nProvider + translation dictionaries
sample-imports/  example .json files for testing import (not used by the app at runtime)
```

## Conventions

- Backend: nullable reference types on; controllers thin, logic in `Services/`.
- All non-auth endpoints require JWT and operate only on the current user's data.
- Learning is tracked **per direction**: each (Entry, SourceLang, TargetLang) has its own
  `LearningState`. Practice difficulty (Easy/Medium/Hard) controls how much of the answer is
  revealed as a hint; Easy also returns the full answer for live green/red typing feedback.
  A word's `Notes` (if any) are shown on the practice card at every difficulty.
- **Practice systems (`PracticeMode`)**: a session picks a *mode* (separate from difficulty). Each
  mode is a selection strategy in `Services/PracticeSelectors.cs` (`IPracticeSelector`, resolved by
  `PracticeSelectorResolver`); `PracticeController.Start` calls the resolved selector instead of
  hard-coding the query, and the chosen mode is stored on `PracticeSession.Mode`.
  - `SmartReview` — the original Leitner due→new→not-due selection (unchanged). **Free, default.**
  - `LearnNew` — only never-seen words (a fresh batch, capped at ~20); endless and client-driven
    (see below). `Cram` — the whole library, shuffled, no cap. `Weak` — seen words, lowest box /
    most-missed first. `Journey` — the whole library in order (see below). **All four are premium**
    (`Start` returns `403` for free users via `PremiumService`); the picker locks them for free users.
  - **Rescheduling is per-mode** (`IPracticeSelector.Reschedules`): SmartReview/LearnNew/Weak move
    Leitner boxes; **Cram and Journey are practice-only** — `Answer` still records the `Attempt` (so
    stats count) but skips `LeitnerService.ApplyAnswer`, so they never disturb the schedule. LearnNew
    reschedules so learned words graduate out of "never-seen" and the next batch pulls new words.
  - **In-session reinforcement**: in `Cram`, `PracticeRunner` re-queues a missed word a few cards
    ahead (capped) so it recurs before the finite session ends.
  - **`LearnNew` is endless and client-driven**: the selector returns the fresh batch (~20 never-seen
    words); the flow lives in `frontend/src/components/LearnNewRunner.tsx` (reusing `lib/journeyEngine`).
    First a **preview pass** flips through each word + its translation (study, no typing — the backend
    sends the answer via `expectedForClient` for LearnNew at every difficulty so the card can show it),
    then **endless drilling** of the batch in reshuffled iterations (most-missed first, only the
    not-yet-learned words) until every word is _learned_ (same criterion as Journey: ≥3 attempts, ≥90%,
    `streak >= 3`). No end screen and **no growing** (the active set is the whole fixed batch); the user
    leaves via the back links. Unlike Journey, **progress is not persisted** — each session previews +
    drills a new batch. `PracticeCard` is the shared one-word view used by all runners.
  - **`Journey` is endless and client-driven**: the `JourneySelector` just returns the library in
    order (by entry id); the whole loop lives in `frontend/src/components/JourneyRunner.tsx` +
    `lib/journeyEngine.ts`. An active set of ~20 is drilled in reshuffled iterations (most-missed
    first) that contain **only the not-yet-learned words**; a word that becomes _learned_ (≥3
    attempts, ≥90% success, `streak >= 3` — i.e. last 3 correct) hibernates and is shown just **once
    per set-grow** (a review pass), reappearing only when the set grows again or a failure un-learns
    it. When the whole set is learned the set grows with the next library words (`nextRound` in
    `journeyEngine`). No end screen. `PracticeCard` is the shared one-word view used by both runners.
  - **Journey progress persists** per `(user, library, direction)` so re-entering resumes where you
    left off. The server is a **dumb JSON store** — `Models/JourneyState.cs` (`StateJson`) +
    `PUT /api/practice/journey`; `Start` hands the saved blob back in `StartSessionResponse.Journey`.
    All learned/grow/order logic stays in `journeyEngine`. `JourneyRunner` seeds from it and re-saves
    (fire-and-forget) after every answer. The demo mirrors this in `localStorage` (`demoStore`
    `journeys` map).
  - **Mirror discipline**: `frontend/src/lib/practiceModes.ts` (premium/reinforcing/reschedules/
    journey flags) and `lib/demo/demoEngine.ts` (`buildDemoWords` per-mode) mirror the backend
    selectors — keep them in sync, same as `AnswerChecker` ⇄ `demoEngine`. The no-account demo shows
    all modes unlocked as a showcase (Journey runs fully client-side there too).
- **Answer checking** (`AnswerChecker`): trim + **accent-sensitive** (`camion` ≠ `camión`);
  normalised to Unicode FormC. Case-insensitive **except for capitalization-required languages**
  (German): `Services/LanguageRules.IsCaseSensitive(targetLang)` is the authoritative gate, threaded
  into `AnswerChecker.IsCorrect(expected, actual, caseSensitive)` from `PracticeController`, so
  `haus` ≠ `Haus` for German but case stays ignored elsewhere. Expected text may hold comma-separated
  acceptable answers. The frontend's Easy-mode live border + the no-account demo mirror these rules
  (`PracticeRunner`, `lib/demo/demoEngine`).
- **Special-character keypad** (`PracticeRunner`): the practice card shows a diacritic keypad for the
  target language (clickable; each button bound to a number key **1–9** that inserts the char while
  typing). The per-language character sets **and** the case-sensitivity mirror live in
  `frontend/src/lib/languages.ts` — its `de` case-sensitivity flag must stay in sync with the backend
  `LanguageRules` (same mirror discipline as `AnswerChecker` ⇄ `demoEngine`).
- **Audio pronunciation** (`PracticeCard`): a speaker button (`components/SpeakButton.tsx`) sits next
  to the prompt word (source language) and the revealed answer (target language), pronouncing it via
  the browser-native **Web Speech API** (`lib/speech.ts` → `window.speechSynthesis`). **100%
  client-side — no audio stored, no backend, no external request**, so it also works in the no-account
  demo for free. `lib/languages.ts` `speechLangFor` maps the bare code to a BCP-47 locale
  (`es`→`es-ES`), joining the `FLAGS`/`PROFILES` maps. This is a **cosmetic client-only** feature —
  unlike case-sensitivity/keypad it has **no backend mirror** to keep in sync. The button hides itself
  when the browser lacks speech support. New i18n key: `practice.playAudio` (en/es).
- The full build plan / change history lives at
  `C:\Users\carlo\.claude\plans\i-am-a-first-sorted-origami.md`.

### Import words (JSON)

- Endpoints: `POST /api/libraries/{id}/import` (into an existing library) and
  `POST /api/libraries/import` (`{ name, description?, entries }` → create a new library
  atomically). Both return `{ imported, skipped }`.
- File format: a bare array **or** `{ "entries": [...] }`; each entry is
  `{ "translations": { "<lang>": "<text>", ... }, "notes"?: "..." }`.
- `Services/EntryImport` is the single source of truth: `NormalizeTranslations` (used by manual
  create/update too), `BuildEntries`, `Signature` + `Deduplicate`. Import **skips duplicates**
  (same full set of translations, case/space-insensitive) — existing words and within-file repeats.
  No word-count cap. Validation is **atomic** (any bad entry → 400, nothing imported).
- UI: the collapsible **Import** panel on the Libraries page (`ImportPanel`, target = existing or
  new library) plus a per-card **Import** button. Both share `lib/importFile.ts`.
- **Import is a premium feature** — both endpoints return `403` for free users and the UI is
  replaced with an upgrade prompt. See _Premium & billing_ below.

### Default (featured) libraries

Curated ready-made libraries (Travel, Food, Dating, Work, Small Talk, Shopping, Health, Slang) shown
on a **dedicated "Featured libraries" page** (`/featured`, in the nav), as a premium enticement: free
users **see the cards** (name, word count, and a few **blurred teaser words**) but can't access
anything; premium users **Add** one and practise it.

- **Copy-on-add model (no shared-library refactor).** The curated masters are ordinary `Library`
  rows marked `IsDefault = true`, owned by a hidden **system account** (`system@linguaswap.app`,
  `IsPremium = false`, random unusable password — never logs in). Because every read path is
  owner-scoped via `PremiumService.VisibleLibraries`, masters are unreachable by normal users. A
  premium **Add** deep-clones the master's entries+translations into a **user-owned copy**
  (`Library.SourceDefaultId` = master id, **no** learning states), so from then on it's a normal
  library — practice / stats / journey / editing all work **unchanged**. This deliberately avoids
  touching `LearningState` (which has no `UserId`); progress stays attributed via `Library.UserId`.
- **Schema:** `Library.IsDefault` (bool) + `Library.SourceDefaultId` (int?, soft ref, no FK) —
  `AddDefaultLibraries` migration (two additive columns).
- **Endpoints** (`LibrariesController`): `GET /api/libraries/featured` → `FeaturedLibrarySummary`
  (`WordCount` + `SampleWords` teaser) for every master **minus** ones the user already added (dedup
  by `SourceDefaultId`, so a deleted copy re-appears on the shelf) — available to free **and**
  premium. `POST /api/libraries/featured/{id}/add` → **premium-only (`403`)**, **idempotent**
  (returns the existing copy if already added), else clones and returns the new `LibrarySummary`.
- **Content is file-based (`Data/DefaultLibraries/*.json`)** — one JSON per topic in the import
  format plus a header (`{ name, description, entries: [{ translations, notes? }] }`), shipped via a
  csproj `<Content ... CopyToOutputDirectory>` and read from `AppContext.BaseDirectory`. **These
  files are the single source of curated content** — add/grow them here (target ≤~1000 words each).
- **Seeding:** `Data/DbSeeder.cs` `SeedDefaultLibrariesAsync` runs **unconditionally on every
  startup** (separate from the empty-DB demo seed). It loads each file, validates/dedups via
  `EntryImport.BuildEntries`/`Deduplicate`, and per library (matched by name) **creates it if
  missing or appends only the new entries** (deduped by `EntryImport.Signature`). So growing a file
  tops up its master; **existing user copies are snapshots and never change**. Malformed files are
  logged and skipped, never fatal.
- **Frontend:** the shelf is its own page `pages/FeaturedPage.tsx` (`['featured']` query; premium →
  **Add** button that navigates to the new copy; free → blurred `.teaser-words` + 🔒 + Upgrade),
  routed at `/featured` with a `nav.featured` link in `Layout.tsx`. Types/wrappers in `api/types.ts`
  + `api/libraries.ts`; styles `.featured-*` / `.teaser-words` in `index.css`; `featured.*` i18n
  keys (en/es). **Deleting a library** in `LibrariesPage.tsx` invalidates `['featured']` so a
  removed copy reappears on the shelf.
- **Mirror discipline:** the no-account demo mirrors the shelf **inline** on `DemoLibrariesPage.tsx`
  (its `DemoLayout` has no nav) as an **unlocked showcase** — `lib/demo/demoData.ts` (`DEMO_FEATURED`,
  a **lightweight taster**, not the full content) + `demoStore.ts`
  (`listDemoFeatured`/`addDemoFeatured`, whose `teaser()` mirrors `LibrariesController.Teaser`). The
  demo is intentionally a small taster — it does **not** bundle the full JSON content.

### Premium & billing (Stripe)

- Two tiers via `ApplicationUser.IsPremium` (+ `StripeCustomerId`, `StripeSubscriptionId`).
  **The DB is authoritative for every gate** — we never put premium in the JWT (a claim would go
  stale on upgrade/cancel). The frontend mirrors `isPremium` into `AuthUser`/`Account` only to
  show/hide UI; the API still enforces with `403`.
- **Effective premium = paid _or_ active trial.** `ApplicationUser.HasPremiumAccess(now)` (=
  `IsPremium || TrialEndsAt > now`) is the single definition; `PremiumService.IsPremiumAsync` uses it,
  so **all** gates below inherit the trial automatically. The API sends the **effective** flag as
  `isPremium` in `AuthResponse`/`AccountResponse`, plus `subscriptionActive` (the raw paid flag, to
  tell trial from paid) and `trialEndsAt`. See _Free trial & hide-when-free_ below.
- **Gates** (all enforced server-side via `Services/PremiumService`, surfaced as `403 { message }`):
  - Word import (both endpoints) — premium only.
  - Practice modes — `LearnNew`/`Journey`/`Cram`/`Weak` are premium (`POST /api/practice/sessions`
    returns `403` for a non-`SmartReview` mode); `SmartReview` stays free. See _Practice systems_.
  - Library count — free users max `FreeLibraryLimit` (**5**) libraries. Over-limit libraries are
    **hidden, not blocked** for users who exceeded the cap while premium (see hide-when-free below).
  - Words per library — free users max `FreeWordsPerLibrary` (**500**); checked on manual add.
    Over-limit words are likewise **hidden** when the user reverts to free.
  - Advanced stats — `GET /api/stats/libraries/{id}` is premium; `GET /api/stats/overview`
    returns an empty `perLibrary` for free users (top-line summary stays free).
  - Extra themes — `ocean`/`forest` are `premium: true` in `theme/themes.ts`; gate is cosmetic
    and client-side (the Account theme picker locks them; downgrades reset to the default theme).
- **Subscription flow** (Stripe Checkout `mode=subscription`): `BillingController` →
  `POST /api/billing/checkout` returns a hosted URL; the browser redirects there. On return,
  `/billing/success` calls `POST /api/billing/confirm` (dev-friendly: re-reads the session and
  grants premium without webhook infra). The production-correct path is the signature-verified
  `POST /api/billing/webhook` (`checkout.session.completed` → grant;
  `customer.subscription.deleted`/lapsed `updated` → revoke). `POST /api/billing/portal` opens the
  Stripe Customer Portal to manage/cancel.
- **Config:** `Stripe:SecretKey`, `Stripe:WebhookSecret`, `Stripe:PriceId`, and `FrontendBaseUrl`
  in `appsettings.json` (empty placeholders — supply real **test** values via `dotnet user-secrets`
  or a gitignored `appsettings.Development.json`; **never commit real keys**). `StripeConfiguration.ApiKey`
  is set once in `Program.cs`.
- **Local webhook testing:** `stripe listen --forward-to localhost:5299/api/billing/webhook`
  prints the `whsec_…` to use as `Stripe:WebhookSecret`. Test card: `4242 4242 4242 4242`.
- The seeded **demo user is premium** (and `DbSeeder` upgrades an existing demo account on
  startup) so every feature is testable without paying.

##### Free trial & hide-when-free

- **One-time free trial** (`PremiumService.TrialDays` = **14**, mirrored client-side as
  `lib/premium.ts` `TRIAL_DAYS`). New accounts start it automatically in `AuthController.Register`;
  existing free accounts start it once via `POST /api/billing/trial` (the Account page "Start free
  trial" button). `ApplicationUser.TrialStartedAt` (non-null ⇒ already used, can never restart) +
  `TrialEndsAt` back it; `PremiumService.StartTrialAsync` is the one-time guard. No card, no Stripe.
  A trial user has raw `IsPremium == false`, so `POST /api/billing/checkout` still lets them
  subscribe (that's the conversion). `AddPremiumTrial` migration.
- **Hide-when-free, reappear-when-premium (dynamic capping — nothing is ever deleted).** When a user
  is effectively free (trial expired and unpaid, or a paid subscription lapsed), content beyond the
  free limits is **hidden**: their **newest** libraries past 5 and the **newest** words past 500 in
  each library (i.e. only the _oldest_ 5 / _oldest_ 500 stay visible). Regaining premium un-hides
  everything instantly with zero restore logic. Chosen over an `IsHidden` flag because trial expiry
  is time-based (no event to trigger a sweep) — visibility is derived at query time.
  - Implemented by `PremiumService.VisibleLibraries(userId, isPremium)` /
    `VisibleEntries(libraryId, isPremium)` (return all for premium, oldest-N `Take` for free),
    threaded through **every read path**: `LibrariesController` List/Get, `EntriesController`
    ListForLibrary (+ Get/Update/Delete visibility guards), `PracticeController.Start`, and
    `StatsController.Overview` (hidden libraries excluded from counts/aggregates; visible word counts
    capped). **Create gates are unchanged** — they count _all_ owned rows, so an over-limit reverted
    user stays blocked from adding more.
  - `LibrarySummary.EntryCount` is the **visible** (capped) count; `HiddenEntryCount` +
    `AccountResponse.HiddenLibraries` drive the gentle "N hidden — upgrade to restore" notes on the
    Libraries page / library editor / Account page. An active trial shows a top banner + countdown.
  - **No backfill needed:** existing free users were already capped at creation, so none can be
    over-limit; only premium/trial users can exceed limits.

#### Database (dev Docker Postgres → Supabase)

> The app runs on **PostgreSQL** everywhere (Npgsql). Dev uses a local Docker Postgres
> (`docker-compose.yml`, host port 5433); production uses **Supabase**. Switching is
> **config-only, no code change** — the provider and migrations are already Postgres.

1. **Create the Supabase project** (Dashboard → New project). Note the region and DB password.
2. **Get the connection string** → Project → **Connect** → use the **Session pooler** (port
   `5432`, host `aws-0-<region>.pooler.supabase.com`, user `postgres.<project-ref>`). Prefer the
   pooler over the direct `db.<ref>.supabase.co` host: it's **IPv4-reachable** and supports
   prepared statements (needed for `dotnet ef` and most hosts). Add `SSL Mode=Require;Trust
   Server Certificate=true`.
3. **Set it as an env var** (never commit): `ConnectionStrings__Default` = that Npgsql string.
   In dev it's read from `appsettings.json`; in prod the env var overrides it.
4. **Migrations apply automatically** on first startup (`db.Database.Migrate()` in `Program.cs`),
   and `DbSeeder` seeds the demo user + featured libraries. (To pre-apply from your machine:
   `ConnectionStrings__Default=<supabase-string> dotnet ef database update --project
   backend/LinguaSwap.Api`.) Requires the DB user to have DDL rights — Supabase's `postgres`
   user does. *If you ever scale past one instance, move `Migrate()` out of startup into a
   deploy step to avoid concurrent-migration races.*
5. **Data note** → no test data migrates; the local Docker DB is disposable dev/seed data.

#### Going live (Stripe test → production)

> **Current state (as of 2026-06-27):** billing is fully implemented and running in **Stripe
> test mode**. Going live is **config + infra + dashboard**, *not a code change* — every Stripe
> value is read from config. The only code edit is the hardcoded CORS origin. Do these when the
> user asks to "go to production":

1. **Activate the Stripe account** for live payments (business details + bank account); create
   everything below with **Test mode OFF**.
2. **Live secret key** → set `Stripe:SecretKey` to `sk_live_…` (replaces `sk_test_…`).
3. **Live Price** → recreate the Product + recurring Price in live mode; set `Stripe:PriceId`
   to the new live `price_…` (test price IDs are invalid under live keys).
4. **Live webhook** → Dashboard (live) → add endpoint `https://<domain>/api/billing/webhook`
   for events `checkout.session.completed`, `customer.subscription.deleted`,
   `customer.subscription.updated`; copy its `whsec_…` into `Stripe:WebhookSecret` (the Stripe
   CLI `whsec_` is dev-only).
5. **FrontendBaseUrl** → set to the real public site (e.g. `https://app.example.com`); it drives
   the Checkout `SuccessUrl`/`CancelUrl` (currently `http://localhost:5173`).
6. **HTTPS everywhere** → live Stripe + real cards require it and the webhook must be public
   HTTPS. Serve API + frontend over HTTPS at the host/reverse-proxy (dev is HTTP, no redirect).
7. **CORS** → add the production origin in `Program.cs` (currently hardcoded to
   `http://localhost:5173`). *This is the one code edit; optionally refactor it to read from config.*
8. **Prod secret storage** → NOT `dotnet user-secrets` (dev only). Use the host's env vars /
   secrets manager; ASP.NET maps `Stripe__SecretKey`, `Stripe__WebhookSecret`, `Stripe__PriceId`,
   `FrontendBaseUrl`, and the email secrets `Email__Smtp__User`, `Email__Smtp__Password`,
   `Email__FromAddress`. **Never commit live keys.**
9. **Customer Portal** → configure it in **live** mode (Settings → Billing → Customer portal) or
   `POST /api/billing/portal` errors.
10. **Data note** → test customers/subscriptions don't migrate; existing
    `StripeCustomerId`/`StripeSubscriptionId` rows are test-mode and meaningless under live keys.

Both grant paths work unchanged under live keys: the `/billing/success` → `/billing/confirm`
return path and the signature-verified `/billing/webhook`.

## Dev gotchas (Windows / this environment)

- **Stop the running API before `dotnet build`/`dotnet test`** — a running `LinguaSwap.Api`
  locks `bin/...exe` and the build fails with MSB3027/MSB3021. Free port 5299 first
  (e.g. `npx kill-port 5299`) or stop the process.
- **git commit messages:** PowerShell mangles inner double-quotes when passing to native git;
  for multi-line or quoted messages write the message to a file and use `git commit -F <file>`.
- The frontend dev server falls back to **5174** if 5173 is busy, but CORS only allows **5173** —
  run a single frontend instance.

### Theming & i18n (frontend)

- **Theme:** UI colours come from CSS variables on `:root`. A theme = a `[data-theme="id"]`
  block in `index.css` that overrides those variables + an entry in `theme/themes.ts`.
  `ThemeProvider` sets `<html data-theme>` and persists to `localStorage`. To add a palette:
  add one CSS block + one list entry.
- **Language:** UI strings live in `i18n/translations.ts` (one dictionary per language).
  Components call `const { t } = useI18n()` and `t('some.key', { vars })`; missing keys fall
  back to English. To add a language: add it to `LANGUAGES` + a dictionary. Keep new UI strings
  out of JSX literals — add a key instead.
- Both preferences are per-browser (localStorage); the controls are on the Account page. If
  cross-device sync is ever needed, persist them on the user account instead.
