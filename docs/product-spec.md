You are an autonomous senior product, game-engineering, security, frontend, backend, UX, QA and release-engineering team working together to deliver **LifeCity 3D**, a real, commercially structured, Arabic-first web game. This is an **implementation request**, not a brainstorming or mockup request.

## MISSION AND EXECUTION RULES

Build the application in this actual writable repository. Inspect the existing project first; preserve working files. If empty, bootstrap a production-capable app. Do not stop after providing an outline, wireframe, snippets, or a decorative landing page. Create, edit and test **working code**; progress through the implementation in coherent commits or clearly tracked milestones. Use the strongest practical quality your environment permits.

Work independently where the requirement is clear. Ask only for truly essential credentials, domain ownership, authorization or external settings that cannot be inferred safely; never invent keys, URLs, payment providers, customer data, OAuth secrets, screenshots, passing tests or launch success. If you cannot connect an external service, implement all surrounding code and provide a setup checklist with exact variable names and actions. Do not claim the app is production-ready or deployed before relevant checks actually pass.

Create `AGENTS.md` at the repository root summarizing project invariants, commands, security rules, language rules, domain assumptions, completion criteria and ongoing maintenance guidance. Keep README, `.env.example`, database migrations, test coverage and CHANGELOG in sync with real changes.

## 1. PRODUCT DEFINITION

LifeCity 3D | لايف سيتي — **ابنِ مدينتك بإنجازاتك**. A premium 3D city-building PWA, mobile-first but excellent on desktop. Real-life tasks earn coins that buy and place objects in a personal persistent 3D world. The world starts nearly empty and gradually becomes a beautiful functional small town, then a city with houses, roads, landscaping, water, coastline, furniture and interiors. A user must be able to log in on two or more devices to recover the exact same balance, tasks, city layouts and progress.

Do not include as default tasks: reading 10 pages, learning a new skill for 30 minutes, or completing a personal project. These three were expressly removed. Do not reintroduce them as onboarding suggestions or seeded missions.

This is a first-class Arabic product, not a translated afterthought, and must be structured for eventual multiple customers, privacy controls and commercial operation. Make it peaceful, motivating, premium, original, intuitive, and unmistakably playable.

## 2. RECOMMENDED TECHNICAL STACK

Use React, TypeScript in strict mode, Vite, Tailwind CSS, React Three Fiber / Three.js and Drei, Zustand for local interactions, TanStack Query for server synchronization, React Router, i18next or a comparable tested localization solution, Motion for small UI transitions, Supabase Auth/Postgres/Realtime/Storage for accounts and persistent game data, Zod runtime validation, a reliable PWA/service-worker solution, Vitest and React Testing Library for unit/component tests, Playwright for integration/end-to-end tests, GitHub Actions CI, and Netlify deployment where authorized.

Use current compatible stable releases, pin a working lockfile, and do not depend on obsolete APIs. Prefer one maintainable app over unnecessary microservices. Use server functions or secure Postgres RPC transactions for privileged changes. Do not put secret service-role keys or payment keys in browser bundles. Do not substitute `localStorage` for the authenticated authoritative database.

## 3. BRAND, GAME ART AND DESIGN SYSTEM

Working product name: LifeCity 3D / لايف سيتي. Arabic slogan: ابنِ مدينتك بإنجازاتك. English tagline: Build Your City. Live Your Progress. Use original commercially usable assets, procedural geometry and art. Do not copy assets or UI from other games and do not use copyrighted materials without explicit permission. Brand name and trademark clearance remain unverified.

Color system: `#173B32` forest, `#4C866A` moss, `#F6F3E9` warm ivory, `#E8B75D` premium gold, `#A6D7E7` sky and `#182321` charcoal. Yuyi accent `#E79AB6`. Create light and dark theme variants, with subtle gradients/material surfaces only where appropriate. Use Arabic typography with commercially permitted licensing, refined English typography, consistent icons, appropriate animation curves, excellent contrast, focus-visible rings and minimum comfortable touch sizes. Create an original SVG brand icon combining city/road/leaf motifs and a reusable favicon/PWA icon family.

The whole experience should feel like a high-end polished indie game with million-riyal-level care, **without promising a monetary valuation**. Avoid default template aesthetics, noisy glassmorphism, generic stock illustrations and nonfunctional visual flourishes.

## 4. ARABIC / ENGLISH INTERNATIONALIZATION

Arabic (`ar-SA`) is the default. English (`en`) is fully selectable and saved in the account profile. All menus, notifications, item descriptions, reward logs, prayer names, screen readers, errors, email templates where possible, confirmation dialogs, offline notices and onboarding must support both languages. Use proper RTL layout, date/number formatting and pluralization. Keep identifiers, monetary balances and grid coordinates correct irrespective of direction. The world/camera itself must not be horizontally mirrored when changing language. Allow the user to choose Western or localized digit display. Default timezone `Asia/Riyadh`; let users change it intentionally. Handle midnight and daylight-saving timezone changes reliably rather than assuming UTC dates equal local dates.

## 5. AUTH, PROFILE, CLOUD SAVE AND MULTI-DEVICE

Implement real email/password registration/login, secure recovery/reset flow and email confirmation if configured. Offer Google login if OAuth credentials are available; never show a functioning-looking Google sign-in button if the OAuth provider has not been configured. User accounts must have isolated data, user profile, avatar, language preference, settings, and secure logout/session refresh. A partner account is **not** given unrestricted access to the main account.

The **server database is the source of truth** for currency, purchases, task completions, partner actions, world objects and inventory. Auto-save every valid committed game action. Provide UI states `Saving...`, `Saved`, `Offline — awaiting sync`, and `Sync conflict — needs attention`. Cache read-only or pending offline progress as appropriate; use an idempotent offline command queue only when safely implemented. Persist the exact state after browser close, PC shutdown, app restart, reinstall/re-login and cross-device login. Do not silently discard or overwrite newer data. Use optimistic concurrency/versioning for object placements and reconcile multi-device updates correctly. Support data export and account deletion; implement retention/backups or document the provider's backup assumptions transparently.

Critical acceptance test: Login on device A, complete a study session, earn money, buy a home and place it at (x,z) with rotation. Login on device B: balance, exact placement, inventory and history must match. Restart A and refresh B: everything remains accurate, with no double rewards.

## 6. CURRENCY, LEDGER AND TRUST RULES

Use one primary currency labeled `عملات` or `نقاط` according to the UI setting; these refer to the same spendable unit. Separately track Player XP and City XP/level. Spending coins, being penalized, or receiving Yuyi deductions does **not** delete earned XP. Coin balances are derived from or atomically consistent with an append-only immutable transaction ledger. All modifications must occur through a secure server-side transaction with caller authorization, validated action type, origin, server timestamp and idempotency key. No browser-side direct editing of wallet balance, prices, transactions or XP. Transactions can be reversed only with auditable compensating entries.

Support balances below zero when a user-confirmed missed prayer or authorized Yuyi deduction exceeds available coins. Display negative amounts honestly, e.g. `-100`, and block paid purchases until enough positive coins exist. Do not silently cap penalties at zero. Provide a readable ledger and explain each change.

Avoid exploit loops: a unique task/day or session/bonus cannot be claimed twice through refresh, rapid clicks, retries or concurrent devices. Rate limit sensitive actions. Allow user-configurable limits on custom-task rewards and partner deductions/awards, enforced server-side.

## 7. REAL-LIFE ACTIONS AND PRECISE REWARDS

**Study timer:** Every completed one-minute interval of valid, unpaused study time earns exactly +1 coin. A completed 60-minute session earns a one-time additional +20 coin milestone bonus. Do not double count milestone rewards across pause/resume or reconnect. Implement start, pause, resume, stop/finish, session summary, optional adjustable Pomodoro visualization and proper server-based time reconciliation. Avoid trusting the client to submit arbitrary reward totals. Persist an active study session so closing/reopening the app does not arbitrarily erase work; explain how recovered/idle time is treated and cap questionable offline accumulation. The UI should display duration, projected reward, actual credited reward and any milestone bonus.

**Prayers:** Five separate daily actions:
- Fajr (الفجر) completed: +30 coins
- Dhuhr (الظهر) completed: +20
- Asr (العصر) completed: +20
- Maghrib (المغرب) completed: +20
- Isha (العشاء) completed: +20

**Missed prayer:** If the user confirms that a specific prayer was actually missed, deduct exactly **100 coins (-100)** for that prayer, one time only. Do NOT assume a missed prayer purely because its checkbox has not been checked, the user was offline, travelling or forgot to record it. Implement explicit states `pending`, `completed`, `missed`, `excused` and a correction flow with audit history. Implement optional prayer reminders and a daily review before applying a penalty. `excused` never triggers a penalty; do not make moralizing or guilt-inducing UI. Daily reset uses the user's configured local timezone, with a coherent day-boundary policy and one claim per prayer per day. If optional prayer times are displayed, use a verified configurable provider; do not invent prayer times.

**Cleaning and exercise:** Clean room +40 coins per permitted completion; make bed +10; complete a workout +50. Define practical daily limits (configurable in settings) to avoid double claims. Provide scheduled repeating tasks and custom tasks whose reward, frequency, category and completion policy can be configured by the owner. Do not seed the three expressly removed tasks.

**Statistics:** Track time studied, actual minutes credited, prayer logging status, coins earned and deducted, custom tasks, cleanings/workouts, streaks, achievements and trend summaries. Charts are accessible and localizable. A logged prayer is self-reported; do not claim the software objectively verifies prayer.

## 8. YUYI FEATURE — SEPARATE ACCOUNT AND CONSENT

Implement a special optional partner experience named `ويوي | Yuyi`. The primary player can securely invite the specific second user via a one-time expiring invite link/code. Yuyi registers/logs into her own account, and after acceptance, both accounts are linked. The primary user controls permission scopes and can revoke access, disable the mode or unlink at any time. Permission states and actions must be checked on the server, not merely hidden in UI.

Yuyi can independently choose **any permitted integer amount** of positive coins after the player makes her happy (the amount is chosen by Yuyi, not fixed by the app); she can similarly choose the negative amount when upset. Provide optional reason and affectionate note. The owner can configure reasonable maximum-per-action and daily limits for both directions to avoid abuse; respect these limits while allowing Yuyi discretion. Present confirmation before destructive deductions, and make a detailed history of who changed what, how much, why and when. Negative changes may put the wallet in debt as described in section 6.

Yuyi can create optional personalized challenges, send sweet messages and trigger unlockable decorative interactions. Positive Yuyi rewards make a **special persistent Yuyi Garden** grow independently of XP and normal city level: flowers, rose trees, lamps, benches, heart decorations and small scenic surprises. Negative adjustments must not delete past special garden memories or take away existing purchased property. The account holder can define what city/task information Yuyi can view; prayer status and private task notes are private by default. Build the feature to be respectful, optional and suitable for mutual consent, not surveillance or humiliation.

## 9. REAL 3D CITY — NOT A STATIC IMAGE

Use actual Three.js/React Three Fiber renderable geometry and scene interaction. Start with an empty visually rich grass island or flat buildable region with a soft sky, distant ambience, shadows, terrain variation and gentle weather/day-night lighting (avoid expensive postprocessing by default).

Camera: ergonomic mobile touch pan/orbit/pinch zoom; desktop mouse drag/orbit and scroll zoom; sensible camera bounds, reset view, home scene, 3D object picking with visual feedback; orthographic/isometric as a polished default with optional perspective mode. Make city map, roads and world coordinate system consistent and deterministic.

Build mode: tile/grid selection and preview `ghost object`; valid/invalid placement shading; object footprint/collision validation; real-time item price and wallet; purchase with immediate inventory record, place objects on owned land, rotate in discrete angles, reposition without buying again, remove with clear rules and recover inventory (not free unlimited coin refunds), save x/y/z/rotation/variant in database. Support undo/redo for uncommitted edits and optional safe compensating transactions for committed moves. Protect world placement from client tampering with server-side ownership validation.

Object catalog with real original low-poly assets/procedural meshes:
- Road segment: 10 coins
- Tree: 20
- Furniture/basic item: from 40
- Car: 500
- Small house: 800
- Villa: 2,500
- Lake: 1,500
- Beach/sea expansion: 5,000
- Skyscraper: 10,000
- Palace: 20,000

Add bushes, fences, paths, lightposts, parks, bridges, benches, plazas, apartments, gardens, mountains and nature materials with balanced configurable catalog pricing. All prices and unlock requirements should be managed centrally, not scattered in client code. Every catalog item should have 3D preview, icon, Arabic and English description, footprint, cost, category, rotation behavior and unlock state.

Support buyable land expansions; owned/unowned boundaries; road connectivity visuals; optional water tiles and shoreline generation; meaningful build limitations. Water may be a performant stylized mesh, not a fake static JPG. Add houses with a basic separate interior mode, an owner-editable room grid and placeable desk, sofa, bed, rug, lamp, plant and shelving. All furniture positions must persist. Expand toward multiple room layouts without compromising early reliability.

Optional later-stage features, only after core functionality works: tiny pedestrians, cars travelling along roads, ambient wildlife, parks coming alive, day/night sync to local hour, gentle weather, seasonal decorations. Target smooth interaction on modern mobile devices: instancing, asset caching, LOD, texture compression where needed, lazy chunks, appropriate DPR limit, minimal draw calls, adaptive quality, WebGL unsupported fallback messaging. A realistic target is smooth 30–60 FPS depending on device; measure instead of claiming guaranteed FPS.

## 10. PLAYER AND CITY LEVELS

Keep separate Player XP and City Level. Player XP increases for verified/claimed activities; never falls when currency is spent. City growth uses placed value, variety, occupancy, upgraded land and landmarks. Show clear progression bars with unlocked scenery, shops, neighborhood areas and milestone events. Achievement rewards must be one-time and server-protected. No forced gambling-like loot boxes or manipulative dark patterns.

## 11. HOME DASHBOARD AND EVERY SCREEN

Create real full screens, with thoughtful loading, offline, empty, error, success and permission states:
1. Animated but fast splash/onboarding; concept explanation and language selection.
2. Register/login/verification/reset password and link-account flows.
3. Home dashboard (interactive city sneak-peek, live coin balance even when negative, player and city levels, save status, greeting, quick actions, latest achievements).
4. Dedicated city builder world, catalog inventory and editing tools.
5. Beautiful searchable shop with 3D item previews and real purchases.
6. Study timer with persistent session and server-verified rewards.
7. Prayer log, completed/missed/excused choices, weekly history and penalty explanations.
8. Cleaning, workout and custom tasks.
9. Yuyi space: partner connection, reward/penalty composer, garden, note cards, challenges and history.
10. House/interior decorator.
11. Stats and calendar, filters, streaks and coin ledger.
12. Profile/settings: privacy, permissions, audio, language, theme, notification preferences, timezone, export/delete data, log out.
13. Elegant public landing/pricing/FAQ pages that explain the app accurately; subscription/purchase hooks may be architected but must not pretend payments exist unless configured.

**Navigation:** Right-to-left mobile bottom nav in Arabic: `المدينة، المهام، المؤقت، المتجر، حسابي`; desktop collapsible sidebar. Frequent actions within two taps where feasible. Avoid hidden critical features.

## 12. DATABASE / SECURITY

Design and migrate PostgreSQL tables roughly encompassing `profiles`, `wallets`, `coin_transactions`, `task_definitions`, `task_completions`, `study_sessions`, `prayer_logs`, `user_preferences`, `city_worlds`, `city_land_tiles`, `catalog_items`, `inventory_items`, `city_placements`, `house_interiors`, `furniture_placements`, `player_levels`, `achievements`, `partner_links`, `partner_permissions`, `partner_actions`, `partner_challenges`, `partner_messages`, `notification_preferences` and `sync_events`. Normalize appropriately; adjust names if justified.

Use `auth.uid()` authorization, **Row Level Security on all exposed tables**, least-privilege grants, protected functions/RPCs, validated IDs, server-side immutable ledger recording, nonce/idempotency keys, consistent timezone policy, database constraints, optimistic locks, appropriate indexes and migration rollback guidance. Never trust user-controlled amounts, arbitrary session durations, unowned world item placement or partner role claims. Secure password/login and partner invitation flows. Avoid vulnerable broad SQL function privileges. Keep backend secrets server-side. Audit access/permission boundaries with tests.

Create `seed.sql` or equivalent for the precise catalog and default tasks. Users must not be able to alter commercial pricing by editing requests. Explain data backups and restore strategy; never claim backups exist without configuring them.

## 13. OFFLINE / MOBILE PWA / NOTIFICATIONS

Manifest, genuine installable icons, service worker caching for app shell and public assets, touch-friendly responsive layouts, iOS safe area support, good startup behavior, descriptive standalone display, support for low-motion preference. Network-dependent writes must show status and either persist to a safe retry queue or block explicitly. Offline behavior must not corrupt wallet balance or double-spend. Reconciliation uses idempotent commands. Push notifications for study/prayer/partner events require explicit permission; no notification claim without working integration. App continues to work after a PC restart or switching devices whenever cloud saves have succeeded.

## 14. BUSINESS / COMMERCIALLY PREPARED PRODUCT

Structure for future multi-user SaaS/public release with independent user worlds, secure account management, tenant isolation, admin-only catalog maintenance, meaningful monitoring/logging, error tracking respecting privacy, feature flags, configurable pricing architecture and an original landing page. Add draft privacy policy, terms, refund policy placeholders and account-data controls; flag legal and trademark review as required before accepting paying users. Do not build or imply a real money checkout without selecting an authorized provider and validating live webhook handling. All art and software dependencies must have checked or documented commercially compatible licenses. No fake endorsements, fake reviews or invented customer metrics.

## 15. QA / ACCEPTANCE TESTS / RELEASE

Create and actually run automated unit, integration and Playwright browser tests where environment permits. At minimum cover:
- RTL Arabic and English switching across all key screens without camera inversion.
- Correct 1 coin per valid complete study minute; 60-minute +20 bonus credited once.
- Each prayer can be completed once per local day; missed prayer confirmation charges exactly -100 once; an overdue pending task alone never causes penalty; excused status is not charged; correction creates audit entry.
- Yuyi independently chooses bonus or deduction amount within the owner-authorized policy, and unauthorized users cannot perform it.
- Wallet never double-changes under double-click/retry/concurrent devices; negative balance is visible; purchases blocked when balance insufficient.
- Purchase decreases wallet exactly once; bought item appears in inventory; placement, move, rotate, removal, water tiles and furniture persist across refresh and re-login.
- Two distinct browsers signed into same account sync correctly; independent accounts cannot see each other's private data.
- Clean tests for mobile breakpoints, no obvious UI overlap, accessible focus behavior, graceful 3D loading, error notices and no console exceptions.
- Build, lint, typecheck and test commands actually pass. Document untested manual steps and environment blockers.

Include realistic demo seed mode *clearly labeled* if credentials are missing, but never claim its data is cloud-backed. Ensure real functionality behind UI when configured. No `TODO` or stub for a feature called finished.

## 16. CODING WORKFLOW AND CONCRETE DELIVERABLES

(1) Inspect repo and create concise architecture/implementation checklists in `docs/`.
(2) Create `AGENTS.md`, README, documented local setup and `.env.example`.
(3) Implement app, 3D assets, database migrations/security functions and seed catalog, including all key user journeys.
(4) Test each subsystem and run full lint, TypeScript, unit, E2E and build checks; fix failures rather than ignoring them.
(5) Add GitHub Actions CI and Netlify-compatible config, including SPA routing fallback and runtime environment guidance.
(6) Commit working milestones, present summary of files and tests, list any external actions that need user authorization.
(7) Deploy only if properly authorized and credentials/access are actually available. If deployment succeeds, provide the real verified URL. Otherwise do not invent a link; give concise exact deployment steps and blockers.

**Work priority if limited by environment:** real auth + cloud save + ledger + tasks + study/prayer + usable 3D city + purchase/placement + Yuyi permissions are the non-negotiable core. Finish an honest, polished working vertical slice before optional particle effects and advanced NPCs. Do not stop at scaffolding or a long explanation. Keep iterating on code and tests during the current execution.

## 17. FINAL DEFINITION OF DONE

A new user can sign up in Arabic, complete tasks and study, claim prayer rewards or explicitly record a missed prayer with the correct -100 charge, invite Yuyi to her own restricted account, receive her chosen rewards/penalties, enter a **real interactive 3D world**, buy and place original buildings/trees/roads/furniture/water, restart the PC and open the same account on a phone to see consistent saved data. The app can be built and deployed reproducibly; it uses RLS, an auditable wallet, original assets, tested multi-device sync and clear honest release documentation.

**BEGIN IMPLEMENTING NOW.**
