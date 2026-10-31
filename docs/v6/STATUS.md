# Ultimate V6 — factual progress, 2026-10-31 (Asia/Riyadh)

The uploaded specification is preserved in [the original text](../specs/LifeCity-Ultimate-V6.txt).
This increment implements the monetary/world foundation and all16 approved tasks. It does
**not** claim that all V5 systems or all twenty V6 expansions were already present or are now
finished. All20 remain approved mandatory scope. [Discovery evidence](AUDIT.md).

## Completed foundation slice

| Behavior | Source | Evidence |
|---|---|---|
| Preserve existing main wallet/history; create a zero MAD wallet and empty neighboring plot | migration20261030225914, server/database.ts | v6-upgrade.test.ts, v6-foundation.test.ts |
| Two flat empty territories in ONE continuous3D renderer/camera | src/world/CityScene.tsx, src/pages/City.tsx | game-shell.spec.ts, v6-foundation.spec.ts |
| Owner-entered exact MAD amount; truthful actor; immutable ledger and reversal | src/pages/Economy.tsx, money.ts, migration | SQL isolation/idempotency/negative/reversal tests |
| Linked partner consent/limits preserved, NEW grants affect MAD only | wrapped city_partner_command | city-partner.test.ts; legacy grants remain in original ledger |
| Actual dated FX reference, server cache/validation,24 supported currency codes, display selection and quoted MAD purchases | functions/_shared/fx.ts, refresh-fx, Economy/Shop/useMoney | actual provider snapshot, unit tests and quote tests |
| Owner-scoped Yuyi purchase/inventory/place/move/store; independent city XP | migration, Shop/City/useTerritory | browser buy/place/demolish/two-browser restore |
| Main/Yuyi historical50% demolition, default furniture recovery, explicit destruction, land retained, immutable receipts | asset_paid_components and demolition RPCs, City confirmation | basis/repricing/half-cent/rollback/idempotency tests |
| Shared privileged mutation boundary, per-user RLS, restricted private helpers | migration | live hosted rollback assertions and local cross-user/write-denial tests |
| Public browser config prepared, disabled until Auth setup | deployment/client-service.json | build configuration checks; key is publishable, not a secret |

FX data is indicative nonredeemable game denomination, not cash or market
investment. Attribution is visible where rates are used. It is cached privately;
this app does not expose a bulk public exchange-rate API. New MAD quotes block
after48h stale, quotes expire after2 minutes, and cross-wallet transfers are
explicitly disabled. Guest mode does not invent rates; fresh-rate purchases need
the configured backend. Main existing amounts retain their canonical SAR-unit
values; display conversion does not alter either balance.

Refunds cover verified components of currently supported purchased objects and
completed saving projects. Newly purchased charges have at most cent precision;
refund storage retains4 decimals, including half-cent values. Unknown legacy
costs block refund rather than guessing. Future multistory, shared-project and
paid-material components still need their own implemented payment systems/tests;
this slice does not pretend those systems exist.

## V5 prerequisites still outstanding

| Requirement | Status |
|---|---|
| Original study/prayer/home/custom task behavior | IMPLEMENTED and regression-tested |
|16 new exact task definitions and claim engine | IMPLEMENTED and tested; applied migration20261031000407 |
|Five-distinct/day,1200-minute/week, immutable weekly plan,30-day streak | IMPLEMENTED and tested |
|Measured multistory construction, paid stages and Blueprint Studio | NOT STARTED |
|Event-backed city replay, landmark gates, split-funded shared projects | NOT STARTED |
|Business income allowance, restaurant/resident/driving/museum/animal/auction packs | NOT STARTED |
|FX display/history throughout every legacy screen | PARTIAL: HUD, wallets and shop integrated; older task/ledger wording and historical FX receipts need completion |
|Cloud registration/confirmation/recovery URLs and real email acceptance | DEFERRED by owner; do not resume until requested |

## All twenty approved V6 expansions

The shared foundation/task engine above is complete. Expansion work is PAUSED
by the owner pending publication of the current increment. None of the rows below is claimed
complete, and no nonfunctional expansion buttons have been added.

| ID | Feature | Status | Remaining implementation / evidence boundary |
|---|---|---|---|
|01|Custom playable avatar|NOT STARTED|Appearance/presets, movement/collision, account saves and camera tests|
|02|Location-priced land parcels|NOT STARTED|Polygon titles/area/factors, purchase/split/merge; current empty territories are not this market|
|03|Terrain sculpting|NOT STARTED|Heightmap brushes, quotes, persistence and foundation conflicts|
|04|Electricity|NOT STARTED|Capacity/reachability graph, overlays and lighting|
|05|Water/sewage|NOT STARTED|Network supply graph, pipes and service state|
|06|Transit|NOT STARTED|Stops/lines/routes/vehicles and resident routing|
|07|Traffic/signals|NOT STARTED|Directed road graph, queues, signal settings and routing|
|08|Resident well-being|NOT STARTED|Transparent district scoring with bounded effects|
|09|Multistory malls|NOT STARTED|Paid floors, navigable units/corridors, capped tenants|
|10|Hotels/resorts|NOT STARTED|Rooms, guest routes and globally capped finance|
|11|Schools/healthcare|NOT STARTED|Service buildings, capacity/travel coverage and interiors|
|12|Underground structures|NOT STARTED|Depth/cross-sections, paid floors and overlap checks|
|13|Car/garage customization|NOT STARTED|Real driving, customization receipts and parking|
|14|Walk-through|NOT STARTED|Avatar/collision/interior transitions and touch controls|
|15|Contractors|NOT STARTED|Firm tradeoffs, stage quotes and atomic payments|
|16|Virtual installments|NOT STARTED|Debt/repayment schedule, concurrency and sale constraints|
|17|Materials/finishes|NOT STARTED|Paid assignments, visual material variants and replacement salvage|
|18|Private Yuyi surprises|NOT STARTED|Private scenes, reveal permissions, gifts and opt-in cosmetics; MAD entry is not this feature|
|19|Smart architect|NOT STARTED|Validated deterministic editable floor plans and construction integration|
|20|Celebrations|NOT STARTED|Durable legitimate triggers, skip/mute/motion settings and no minting|

## Verification and publication boundary

Current commands and evidence are recorded in [the task release](RELEASE-tasks.md);
[foundation evidence](RELEASE-foundation.md) records the prior slice.
The earlier game-interface upgrade is published at
https://mdaar21.github.io/LifeCity3D/ (run41139285295, commit e32bf7e), verified in
an actual mobile-sized browser. [Live UI proof](../evidence/live-ui-publication.json).
This does not claim V6 frontend publication.

Supabase migration v6_wallets_territory_fx is **applied**, actual FX reference is
stored, and refresh-fx v1 is deployed with in-handler session validation.
[Hosted foundation proof](../evidence/v6-hosted-foundation.json).
Actual hosted password-JWT login and exact cloud restoration in two independent
browser contexts passed using a disposable pre-confirmed Auth fixture; it was
removed afterward. [Hosted Auth/cloud proof](../evidence/v6-hosted-auth-cloud-save.json).
Auth URL configuration and real email confirmation/recovery remain unverified.
