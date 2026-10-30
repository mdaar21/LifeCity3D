# V6 audit and working phases — 2026-10-31 (Asia/Riyadh)

Source: ../specs/LifeCity-Ultimate-V6.txt, explicitly requested by the owner.
Baseline: e32bf7e, dedicated mdaar21/LifeCity3D repository. The older game-menu
upgrade is merged with owner's publication approval; V6 work is isolated on
codex/lifecity-v6-foundation. No Mdaar source is part of this change.

## Observed baseline

Implemented/tested: React/Vite/R3F, game HUD/windows, original25-item catalog,
manual city and8x8 interior placement, collision/versions, inventory, main wallet,
immutable ledger, study+1/minute/+20 first hour, prayers/explicit-100, three
household tasks, custom schedules, linked-partner permissions, saving projects,
focus plant, exterior-only visits, Arabic/English/PWA.43 tests/8 browser journeys.
Paths: src/lib, src/pages, src/world, supabase/migrations/001..006, tests.

Missing from the actual baseline (despite being described as preserved V5):
all16 approved task definitions and their milestone engine; two adjacent cities;
separate MAD wallet; real FX; historical50% demolition; measured multistory
construction; blueprints; event-backed history; passive-income allowance;
restaurants/residents/driving and the remaining V3/V4 expansion systems.
Existing partner_adjust credits the MAIN wallet. Old history must stay intact;
NEW partner/manual Yuyi transactions must use only the separate MAD wallet.
No pre-existing V5 branch exists on this repository at audit time.

Supabase taevxcuqsanfyywkuygl:29 public tables, all RLS; required RPCs and25-item
catalog present; no migration-history rows;0 profiles/wallets/inventory/placements,
0 legacy partner ledger entries at inspection. Existing tables will NOT be
recreated. Empty current hosted records are not permission to drop schemas.
Guest progress may exist in browsers and must never be reset or auto-imported.

GitHub connection denies Actions variables API (403). Public client config can
be shipped as explicit public configuration, never a secret/service-role key.
Auth Site URL/allowed redirects require provider management access or owner setup
if the connected tools cannot manage those settings. Record actual tests only.

## Implementation order / status

1. Audit, preserve baseline and original spec: complete.
2. Foundation slice: separate exact MAD ledger, owner-reported actions/reversals,
   adjacent empty territory, authoritative purchases/placement, genuine FX adapter
   and historical paid-cost demolition. In progress.
3. Exact16-task award engine, period identity, snapshots, study segments/streaks.
4. Measured construction/cost components, blueprints, planner and history.
5. Avatar/movement/driving, terrain/parcels, infrastructure graphs and services.
6. Businesses/living city, special features and final regression.

Approval of all20 remains recorded. The table below is a work register, not
placeholder UI or a claim that unimplemented behavior exists.

| V6 | Feature | Current status |
|---|---|---|
|01|Avatar|NOT STARTED|
|02|Location-priced parcels|NOT STARTED|
|03|Terrain sculpting|NOT STARTED|
|04|Electrical graph|NOT STARTED|
|05|Water/sewage graph|NOT STARTED|
|06|Transit|NOT STARTED|
|07|Traffic/signals|NOT STARTED|
|08|Resident satisfaction|NOT STARTED|
|09|Multistory mall|NOT STARTED|
|10|Hotels|NOT STARTED|
|11|Schools/healthcare|NOT STARTED|
|12|Subsurface structures|NOT STARTED|
|13|Car/garage customization|NOT STARTED|
|14|Walkthrough|NOT STARTED|
|15|Contractors|NOT STARTED|
|16|Virtual installments|NOT STARTED|
|17|Paid materials|NOT STARTED|
|18|Private Yuyi surprises|NOT STARTED|
|19|Deterministic blueprint planner|NOT STARTED|
|20|Cosmetic celebrations|NOT STARTED|

## Data protection and rollout

- New numbered forward migrations only; inspect hosted schema before applying.
- Add owner-indexed tables/RLS and restricted helpers. Keep old RPC delegates and
  existing ledger/history. Never rewrite historical partner grants into MAD.
- Exact numeric storage and server-side quotes; client never submits balances or
  paid basis. New money must carry a valid immutable source event.
- Test on empty and populated local Postgres/PGlite including transactional
  rollback and cross-owner denial, before applying to hosted Supabase.
- Before hosted application, recheck financial counts and save schema/function
  metadata plus audit counts privately under work/v6. If records appear, export
  affected data through authorized client queries before any transformation.
- Migrations run atomically; an unsuccessful transaction rolls back. After real
  V6 events exist, prefer forward repairs; do not drop new ledgers to roll back.
- New default task/NPC rules supersede older AGENTS prohibitions where the
  owner's V6 specification explicitly approves them; excluded three tasks stay
  excluded and new worlds still have no free purchased objects.
