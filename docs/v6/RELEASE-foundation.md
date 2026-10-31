# Ultimate V6 foundation slice — release evidence

This is a working foundation increment, **not a complete V6 release**.
All sixteen new V5 task/dependency systems and all twenty approved V6 expansion
features remain on the [explicit status register](STATUS.md). Existing original
study/prayer/home/custom tasks, inventory, manual construction, interiors,
projects, sharing and privacy are preserved. No other Mdaar repository changed.

## Actual validation

- Libraries: existing committed npm lockfile/node_modules from successful npm ci;
  no framework replacement or new root dependency was needed. Supabase CLI used
  for migration scaffolding:2.122.0.
- `npm run lint`: passed. `npm run typecheck`: passed.
- `npm test`: **57 passed,15 files**. [Captured summary](../evidence/v6-tests.txt).
- All **11 browser cases** passed in focused runs: original guest/language/offline,
  new-account locale,2 cross-account/cross-browser cases,2 projects/visits cases,
 2 game-shell cases, and3 V6 wallet/FX/demolition/accessibility/renderer cases.
  Commands used `npm run test:e2e -- <spec>` with focused `-g` filters where needed;
  no claim of a single combined browser-suite invocation.
- Populated legacy migration retained main balances/ledger, placements, old
  partner actions and inventory IDs, created only an empty zero-MAD neighbor,
  and reconstructed a genuine purchase basis despite later catalog repricing.
- Financial tests cover retries, ownership/collision, real source-attributed
  quotes, immutable corrections, main/MAD isolation, destroyed vs recovered
  furniture, exact half-cent refunds, stale quote/confirmation rollback, RLS,
  private helper denial and denied authenticated FX imports.
- Display test:40 canonical SAR units display as10.67 USD with the deterministic
  test-only reference fixture, while server balance stays40 and MAD stays intact.
- `npm run build:github`: passed. Compiled Pages base paths, cold routes, private
  login avoiding Three downloads, guest PWA/offline reload and blocked financial
  writes passed through `npm run verify:github`.
- Automated WCAG scans:9 game-shell cases plus2 wallet-screen themes, no detected
  violations in these checked states. [Game shell](../evidence/game-shell-accessibility.json),
  [wallets](../evidence/v6-economy-accessibility.json).
- [Renderer smoke](../evidence/v6-renderer-smoke.json):390×844 software-WebGL
  Chromium,2 empty plots, baseline13 draw calls/126 triangles/DPR1, actual orbit
  renders advanced and the wallet stayed zero. This is not real-phone FPS, a
  populated city benchmark or a60FPS guarantee.

## Actual Supabase work

Applied migration **20261030225914_v6_wallets_territory_fx** to the selected project
`taevxcuqsanfyywkuygl`. Existing schema was inspected first, private schema/row
backup metadata captured, empty and populated local upgrade tests passed, and no
old tables were recreated or old values reinterpreted.

Stored an actual dated SAR-base ExchangeRate-API reference covering24 game codes.
Deployed **refresh-fx v1**. Missing sessions returned401 and an authenticated
browser call returned200. Privileged keys remain in Supabase's server environment.
No bulk public rates API is exposed; attribution is visible in the game.

Live SQL/RLS diagnostics passed and rolled back all created records. A further
**real hosted Auth password-JWT/two-browser cloud test** used a disposable
pre-confirmed diagnostic identity (no email sent), earned40 MAIN, reported100 MAD,
bought a tree using actual dated FX, placed it at2,3/90°, and restored the exact
wallet/inventory/placement on an independent mobile-sized browser and after reload.
The fixture and all of its records were deleted; final diagnostic-user/main-ledger/
MAD-ledger counts were0, and the actual FX reference remained stored.
[Hosted foundation proof](../evidence/v6-hosted-foundation.json),
[real Auth/cloud proof](../evidence/v6-hosted-auth-cloud-save.json).
This does not exercise public email registration/confirmation or recovery.

## Publication and remaining setup

The earlier game-interface update was published on GitHub Pages successfully:
run41139285295, commit e32bf7e. A real live browser verified the guest game UI.
[Live publication proof](../evidence/live-ui-publication.json).

The V6 frontend increment stays on its own review branch. Public client config
is prepared but disabled. The owner explicitly said Auth URLs are not set yet;
Site URL must be https://mdaar21.github.io/LifeCity3D/ and allowed redirects must
include https://mdaar21.github.io/LifeCity3D/**. Real email confirmation/recovery
must still be checked. Actions variables API returned403; a guarded public config
file is provided as an alternative, with no secret/service-role key.

Next implementation is the exact16-task award/calendar/milestone engine and then
all remaining approved systems, following [NEXT.md](NEXT.md) and the original
specification. No dormant expansion mockup screens have been added.
