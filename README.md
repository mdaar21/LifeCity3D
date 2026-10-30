# LifeCity 3D | لايف سيتي

**ابنِ مدينتك بإنجازاتك.** An Arabic-first, bilingual playable 3D productivity
game, built independently from Mdaar. React19/strict TypeScript/Vite, original
R3F/Three procedural world, Zustand editor, TanStack Query, Supabase Auth/Postgres,
transactional RPCs, RLS and a real installable PWA.

The frontend is published at https://mdaar21.github.io/LifeCity3D/ through GitHub
Pages. Guest entry has been verified in the real public app. Hosted Supabase
accounts are not active: the selected project's existing profiles table needs
inspection before a data-preserving setup. This is not a fully launched
commercial cloud service. Read [the current handoff](docs/HANDOFF.md) before
continuing; older local release records describe earlier deployment blockers.

The owner-provided [starter template](docs/starter-template-integration.md) is
pinned as an optional Git submodule under `references/`. LifeCity keeps its
existing React/Vite build. No Next.js migration or root package replacement was
performed. `npm run check:config` now validates public build configuration before
bundling and keeps credential values out of its output.

## Run

Node22.12+ (verified here with Node24), npm and the committed lockfile:

```sh
npm ci
npm run dev
```

Default is an explicitly labeled guest demo in IndexedDB, with no account,
cloud-security or multi-device claim. It starts with zero coins and an empty
buildable island. Tasks/study/prayers earn coins; buy items and place them in a
real WebGL city. Demo state never migrates silently into an authenticated account.

For the persistent local reference backend, copy `.env.example` to `.env.local`,
set `VITE_BACKEND_MODE=local`, then use two terminals:

```sh
npm run local:server
npm run dev
```

Local accounts use scrypt passwords, opaque HttpOnly sessions and an on-disk
PGlite/PostgreSQL database at `.data/lifecity`. All game writes use the same SQL
RPC/RLS rules as the Supabase integration. This development service is **not
hosted cloud storage**, and it does not send recovery or confirmation emails.

See [deployment](docs/deployment.md) for GitHub Pages and real Supabase setup. Never
put a service-role/secret key in a `VITE_` variable or commit `.env`/`.data`.

## Implemented journeys

- Guided first task, first20-coin tree purchase and manual placement, with saved
  milestones and an optional account-scoped hide/reopen preference.
- Building saving projects: server-quoted price, partial coin contributions,
  staged illustration, exact cancellation refund and one inventory item on
  completion. Buildings are never placed automatically.
- Focus-session plant grows from credited minutes only; the estimated clock
  cannot award growth, coins or the60-minute bonus.
- Optional7-day revocable city visit links. Anonymous viewers see only exterior
  geometry; signed-in visitors may send one like and preset greeting. No owner
  identity, wallet, tasks, prayers, partner notes or interiors are shared.
- Real configured email/password auth + recovery in Supabase adapter; local
  reference auth; secure logout; profile language/theme/digits/timezone/avatar.
- Account-isolated server-authoritative wallet with negative balances, immutable
  ledger, compensating corrections and idempotent transaction receipts.
- Exactly1 coin per verified complete study minute, one20-coin60min bonus,
  persisted pause/resume/finish,90s uncertain-idle cap with automatic pause.
- Five separate prayer logs: Fajr30, others20, explicit missed−100, excused0,
  pending never automatically penalized, auditable corrections within7days.
- Clean room40, make bed10, workout50, owner-limited daily/weekly/once custom
  tasks and editing. The three expressly removed default tasks are absent.
- Original25-item catalog with real purchase/inventory, valid/invalid grid ghost,
  rotation, collisions, optimistic move versions, inventory recovery, land
  expansion, water and8×8 home interiors with persisted furniture.
- Separate optional Yuyi account, expiring one-use invitation (optionally email
  bound), scoped owner permissions, chosen signed amounts with per-action/day
  limits, revocation, messages, challenges and persistent positive garden memories.
- Arabic/English screens, responsive navigation, accessible forms/dialogs,
  progress/ledger/statistics, JSON export and confirmed account deletion.
- Offline app shell and read-only cache; financial writes blocked offline.
  An uncertain request retains its idempotency key for explicit retry; there is
  no silent offline spending queue. Realtime +10s polling for configured accounts.

## Checks

```sh
npm run lint
npm run check:config
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run build:github
npm run verify:github
```

Browser checks use `/usr/bin/chromium` here; elsewhere run
`npx playwright install --with-deps chromium` or set `CHROMIUM_PATH`. They launch
a disposable isolated backend and two distinct browser contexts, with fixture
funding available only through test-side privileged SQL. No funding HTTP API.
The SQL timer tests advance privileged fixture timestamps; they do not pretend
a human actually studied for60minutes. See [release evidence](docs/release.md).

`build:github` defaults to `/LifeCity3D/`, creates the Pages SPA fallback and
configures the manifest, icons, fonts and authentication callbacks for that base.
`verify:github` serves that artifact on an isolated localhost port and checks
cold navigation, production CSP and offline PWA persistence. These are local
checks, not evidence of a remote deployment. GitHub Actions repeats verification
before a Pages release once repository access and Pages are available.

## Boundaries before commercial release

Real hosted Supabase multi-device operation, email deliverability/confirmation,
production load/restore and provider backup policies remain to be configured and
tested. Google login, push notifications, real-money billing and payment webhooks
are not enabled or advertised as working. Notification switches stay disabled.
Privacy/terms/refund pages are labeled drafts; legal identity/contact, jurisdiction,
name/trademark clearance, support and retention review are still required.
No guaranteed30–60FPS, monetary valuation or objective prayer verification claim.

Architecture: [docs/architecture.md](docs/architecture.md). Core SQL:
[docs/core-sql.md](docs/core-sql.md). Commerce/partner security:
[docs/city-partner-security.md](docs/city-partner-security.md).
Master prompt status: [docs/acceptance-checklist.md](docs/acceptance-checklist.md).
Source ownership/maintenance: [AGENTS.md](AGENTS.md). Original art and font/dependency
licenses are documented in [docs/licenses.md](docs/licenses.md).
