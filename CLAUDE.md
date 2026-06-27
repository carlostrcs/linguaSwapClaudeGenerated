# LinguaSwap — project guide for Claude Code

A vocabulary-practice web app. Users create word libraries (a concept with translations in
several languages), then practise a library in a chosen direction (e.g. Spanish → English).
A Leitner spaced-repetition algorithm schedules which words to review, and the app tracks
learning statistics. Multi-user with accounts.

## Stack

- **Backend:** ASP.NET Core Web API, **.NET 10** (`backend/LinguaSwap.Api`). Controllers-based.
  EF Core + **SQLite**. ASP.NET Core Identity + **JWT** auth. Swagger UI in Development.
- **Frontend:** **React + TypeScript + Vite** (`frontend`). React Router + TanStack Query.
- **Solution file:** `backend/LinguaSwap.slnx` (new XML solution format).

## How to run (development)

Backend (from repo root):
```
dotnet run --project backend/LinguaSwap.Api
```
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
vars for anything real. Password rules are relaxed (6+ chars) for learning convenience.

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
                 PremiumService (gating rules), StripeService (subscription billing)
backend/LinguaSwap.Tests/   xUnit tests (LeitnerService, AnswerChecker, HintService, EntryImport)
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
- **Answer checking** (`AnswerChecker`): trim + case-insensitive but **accent-sensitive**
  (`camion` ≠ `camión`); normalised to Unicode FormC. Expected text may hold comma-separated
  acceptable answers. The frontend's Easy-mode live border uses the same rules (`PracticePage`).
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

### Premium & billing (Stripe)

- Two tiers via `ApplicationUser.IsPremium` (+ `StripeCustomerId`, `StripeSubscriptionId`).
  **The DB is authoritative for every gate** — we never put premium in the JWT (a claim would go
  stale on upgrade/cancel). The frontend mirrors `isPremium` into `AuthUser`/`Account` only to
  show/hide UI; the API still enforces with `403`.
- **Gates** (all enforced server-side via `Services/PremiumService`, surfaced as `403 { message }`):
  - Word import (both endpoints) — premium only.
  - Library count — free users max `FreeLibraryLimit` (**5**) libraries.
  - Words per library — free users max `FreeWordsPerLibrary` (**500**); checked on manual add.
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
