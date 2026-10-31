# V6 world systems — active implementation, 2026-10-31

This is the continuation requested by the owner after the PWA delivery repair.
It is additive to the existing application. All20 expansions remain mandatory.
This document is a checkpoint, not a claim that the entire master prompt is done.

## Actual implementation

- Shared meter-based typed engine in `supabase/functions/_shared/world-*.ts`.
  Quotes are calculated by the trusted reference server or authenticated Edge
  handler. Service-only SQL checks ownership, revisions, receipts, wallet funding,
  actual paid components and exact50% refunds. Clients cannot settle arbitrary patches.
- Real3D integration remains in the existing R3F renderer, with neighboring plots,
  sampled terrain, paid construction stages and separate floors/rooms/stairs,
  network geometry, original characters and cars. Empty plots stay empty.
- Collapsible Arabic/English game studio in `src/world/WorldStudio.tsx`.
  Planning and quote previews do not debit money. A confirmation settles them.
- Exact16 tasks, existing tasks/prayers/study, original assets, old saving projects,
  MAIN history, independent MAD and genuine FX have not been replaced.
- World entities/components/history have owner RLS. Surprise capabilities expose
  only an expressly revealed scene. History playback never restores wallet state.
- Passive business income shares20% of qualifying24h MAIN achievements and a60
  canonical hard cap. Grants, refunds, loans, custom tasks, automatic milestones,
  missed-prayer reversals and business profits do not grow that allowance.
  Yuyi businesses animate but grant neither MAD nor MAIN; MAD remains grant-funded.

## Twenty-feature acceptance matrix

Each row is PARTIAL until its remaining browser, hosted and usability checks are
complete. Code presence and domain tests alone are not full acceptance.

|ID|Working core|Current evidence / remaining acceptance|
|---|---|---|
|01|Appearance, presets, collision, keyboard/touch, saved avatar|Unit + independent phone restore/movement passed; camera/collision polish continues|
|02|Area/location quotes, titles, split/merge, correct wallet|SQL/unit tested; broader visual market and title browser checks pending|
|03|Nine real height brushes, preview, foundation constraints, paid undo|Unit tests; mobile sculpting and cross-section browser checks pending|
|04|Capacity graph, solar, batteries, feeds, lighting, overlay|Unit tests; rooftop/battery and live browser checks in progress|
|05|Water/sewer graph and building demand|Connect/disconnect unit tests; hosted/browser checks pending|
|06|Stops, lines, route validation, moving scheduled vehicles|Graph tests; stop editing and resident transit visuals need further review|
|07|Directed roads, stop/yield/cycles, bounded agents|Routing/signal tests; queue/lane and browser driving review pending|
|08|District names/plots and transparent service scores|Domain implementation; district/coverage acceptance in progress|
|09|Paid mall floors, editable tenant rooms and global profit cap|Geometry/financial tests; tenant/interior browser acceptance pending|
|10|Room types/prices, reachable guests and capped operations|Unit tests; full guest management browser checks pending|
|11|Schools/university/clinic/hospital, staff and travel coverage|Implemented in engine/scene/studio; service-specific browser checks pending|
|12|Paid basements, depth conflicts and cutaway|Engine/scene present; entry and depth browser checks pending|
|13|Original cars, real movement, garage slots and paid customization|Unit tests; actual driving/browser acceptance pending|
|14|Aerial/follow/first person, doors/stairs/lifts|Avatar movement browser passed; interior camera safety continues|
|15|Three contractor price/effort/quality profiles, atomic stages|SQL stage/receipt/refund tests; comparison UI acceptance pending|
|16|25% down, four fixed daily installments, limits, overdue restrictions|SQL tests; concurrency/overdue browser cases pending|
|17|Ten materials, per-floor/room costs, paid replacement salvage|Unit tests; finish rendering/remodeling review in progress|
|18|Private room/props, conditions, consent, revocable narrow share|RLS/capability SQL tests passed; browser/hosted acceptance pending|
|19|Deterministic editable plans, rooms, budget, style, measured stages|8x12 two-floor browser passed; undo/redo and broader planner validation pending|
|20|Legitimate durable events, cosmetic celebration/skip, settings|Event/ack financial invariants tested; visual/event browser acceptance pending|

## Checks already actually run

- Existing regression run after initial world work:87 passed and1 new traffic test
  failed because its randomly chosen route did not approach the tested signal.
  The test now chooses the explicit route; focused domain/SQL runs passed afterward.
- Final full local regression run: **91 passed in18 files**,37.97s.
  A prior concurrent browser/full-suite attempt hit its58s local budget; the
  serial rerun above completed successfully.
- Lint, TypeScript and GitHub Pages production build all passed.
- Browser studio journey passed: real quote,8x12 two floors, second-floor sofa,
  independent390px phone login/restore and real saved movement. Evidence:
  `docs/evidence/world-studio-browser.json` and `docs/evidence/ui/world-*.png`.
  These are reference-backend results, not a hosted Supabase acceptance claim.
- The browser studio journey was rerun after scene/control improvements and
  passed again (26.3s test,41.0s including disposable servers).
- New compatibility, rooftop, battery and district cases are being added/run.

## Supabase migration and recovery plan

`20261031035728_world_systems_core.sql` was scaffolded with Supabase CLI and is
UNAPPLIED at this checkpoint. It remains editable until the first hosted apply.
It adds tables/functions/triggers and wraps the old snapshot function under
`game_state_for_before_world`; it does not reset balances, remove old records,
place free assets or replay rewards. Initialization is explicit and zero-cost.
Original paid land expansion subtracts already-owned parcel rectangles so
financed titles and their obligations remain intact.

Preflight on the linked project returned zero profiles, wallet ledger entries and
placements, and no world tables. Only the two prior V6 migrations were registered.
Security advisors reported the existing intentionally exposed command/state and
capability visit functions plus private RLS tables with no client policies.
The new migration and Edge function have NOT yet been deployed. Save a final
preflight and function-definition backup immediately before applying. After apply,
do not edit this migration: create a new CLI migration for any correction.

Rollback is a code/service rollback, not table deletion: keep all new records and
paid components, restore the previous frontend/disable new operations, and use the
preserved pre-world snapshot helper if needed. Never drop the new tables or rewrite
wallet/ledger history as a rollback. Verify old and new row counts/balance digests
before/after deployment. Auth URLs/email configuration remain explicitly deferred.

## Other master-prompt work still outstanding

Large species/crop catalog, animal/pet management, memory museum, richer photo and
time-lapse tools, rare landmark packs, jointly funded border projects and the
virtual property market/auction require further actual implementation. Weather,
districts, restaurants and architectural editing have initial working code but
are not claimed as fully accepted V3–V5 systems. Do not omit these requirements or
claim all20/full-master completion on the basis of this checkpoint.
