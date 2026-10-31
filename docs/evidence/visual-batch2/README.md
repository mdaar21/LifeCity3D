# Visual BATCH2 — stages4–6, unpublished

2026-10-31 · codex/stylized-visual-overhaul · continues BATCH1/b4d9b5f.

- Stage4: shared navy/cream and dark game surfaces for shop, quests, focus,
  prayers, wallets and settings. Mission shortcuts retain all16 definitions.
- Shop cards use25 cached PNGs generated from the actual playable procedural
  models. Mobile opens the live3D preview on demand; cards never create25 canvases.
- Neutral Yuyi MAD panel links to its separate ledger. The original memory garden,
  partner permissions, histories and all prior functionality remain available.
- Stage5: device-only auto/low/medium/high graphics, DPR1–1.5, bounded shadows,
  merged/static assets, instanced rain/clouds, sunrise/sunset/night and readable fog.
  Rain and celebration loops stop for reduced motion/hidden or inactive views.
  Paid lights/windows respond to night; power/simulation rules remain authoritative.
- Fix inward-facing gable geometry and tall-asset preview framing. Read-only
  previews retain per-canvas counters without replacing the primary city metrics.
- Stage6: actual captures and regression/compiled-artifact checks. No publication.

## Verification

- 100 tests in20 unit/integration files passed in39.52s, including authentication,
  CSRF, RLS/ownership, purchases/receipts, task/study/prayer rewards, independent
  MAD/FX,50% paid-cost refunds, migrations and persistent old/new saves.
- All19 browser cases passed across bounded focused runs: the original15 cases
  plus390/768/1440px panel checks and the paid-city weather case. No assertions
  remain failing. Canvas/focus continuity, two-browser recovery, account isolation,
  projects, visits, offline writes, purchased construction/materials/furniture pass.
- 28 new panel WCAG A/AA scans passed: seven routes at all three widths, plus all
  seven routes in English/dark at390px. RTL/LTR, overflow, real thumbnail loading,
  mobile live preview and persisted local graphics preferences were checked.
- Actual paid eight-asset fixture: day/sunset/fog47 render calls/3,376 triangles,
  night49/3,408, rain49/4,192. Five different canvas captures; wallet/inventory/
  placement/cost snapshots stay equal. Reduced-motion idle adds zero frames.
  These are software Chromium counters, not real-phone FPS or hosted-save proof.
- Lint, strict TypeScript, production Pages build and compiled Pages/PWA checks
  passed: route/base/CSP/assets, installed service worker, saved offline balance,
  blocked offline writes and guest-project reserve/refund. No publication.

`preview.jpg` combines actual captures. `panels-*.json` and `weather.json` retain
raw results. The before-* files preserve the previous batch's game panels.

## Preservation and limits

No dependencies, server/Edge code, applied migrations, financial authority or
production data changed. Local graphics use a separate preference key. The new
funded browser identity exists exclusively in the disposable test database.
All six VISUAL stages are complete locally; the public site remains unchanged.
Broader V6 feature/hosted acceptance gaps remain in ../../v6/WORLD-SYSTEMS.md;
Auth activation and deployment remain deferred by the owner.
