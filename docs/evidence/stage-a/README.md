# Stage A — mobile world interaction (unpublished)

Branch: `codex/stylized-visual-overhaul`. No merge, frontend publication, live
Edge deployment, migration or production account/data write in this stage.

## Implementation

- One world pointer controller selects legacy objects, measured buildings,
  nested floor furniture, vegetation, roads/nodes and cars. Hold450ms enters
  placement; RAF-coalesced drag updates at most20Hz. Raycasts occur on selection,
  not continuously during drag. Pinch and pointer cancellation restore previews.
- Contextual actions, visible footprints/invalidity, rotation handle,30-step
  preview history, snapping, camera reset, help and44px RTL/safe-area controls.
  Manual coordinates and the full old studio remain in Advanced tools.
- Catalog-to-world placement, paid foundation/stage progression, floor furniture,
  and guided garage/car/walk/drive/park use existing geometry and APIs.
- Server `road_draw` prices real lengths and new junctions atomically. Crossings
  connect through graph subdivisions while retaining old paid edge/component IDs.
  Measured foundations support0/90-degree rotation with existing trusted costs.
- Preview validation is local and free. Review requests a trusted quote; explicit
  confirmation uses existing idempotency, receipts, RLS and atomic SQL settlement.
  No financial auto-retry. One revision retry is limited to confirmed nonfinancial
  navigation commands. Both wallets and original refund bases are preserved.

## Verification

- `tests/integration/touch-roads.test.ts`:6 real reference-Postgres tests for
  trusted prices, duplicate settlement, connected crossings, original cost bases,
  exact50% refunds, no-funds rollback, stale/foreign quotes, invalid strokes,
  rotated foundations and independent dated-FX MAD settlement/refunds.
- `tests/unit/touch-drafts.test.ts`:2 preview history/RTL coordinate checks.
- `tests/e2e/touch-tools.spec.ts`:8 beginner-mode mobile journeys dispatch actual
  CDP touch events against rendered WebGL: tap, hold, drag, release, collision,
  rotate, undo/redo, cancel, pinch, orbit/reset, native scroll, construction/floor
  furnishing, paid material preview/cancel/confirmation, road intersections, paid
  plants, driving/parking and reload saves.
  Legacy numeric browser journeys explicitly select Advanced tools.
- Lint/typecheck and the8 focused unit/integration checks passed locally. Full
  CI regression/build result is recorded in `verification.json` when completed.
- `npm run build:github` and `npm run verify:github` passed locally with the
  compiled Supabase-configured client. Repository-base assets/deep links, login
  excluding Three, explicit guest choice in a fresh tab, PWA control/icons,
  offline balance40, disabled offline spending and project reserve/refund passed.
  `pages-build.json`, `pages-browser.json` and `pwa.json` record this local scope.
  The Pages smoke script now respects the existing per-tab guest/Auth boundary.
  Browser PNGs are local rendered evidence; the CI HTML report includes attachments.

## Limits and future release

The tests use disposable reference databases/accounts and Chromium mobile touch
emulation. This is not a claim of hosted-Supabase acceptance or a physical-phone
performance benchmark. No purchasable objects are seeded into player cities.
Initialization retains only the existing free base parcels/terrain.

Deploy the compatible `world-command` shared engine BEFORE this frontend only
when the owner authorizes publication. No new schema fields/migrations are needed.
Full-object paid recoloring and extra road/light/architecture variants remain
separate unfinished content groups; existing paid materials/car paint are reused.
