# Visual BATCH1 — stages1–3, unpublished

BATCH2 is subsequently complete: ../visual-batch2/README.md. Current raw captures
were rerun with its lighting and shared game surfaces; this report preserves the
original BATCH1 milestone measurements.

2026-10-31 · `codex/stylized-visual-overhaul` · base `5d567ae`.
Reference: owner-uploaded visual design book, especially pages34–43.

- Stage1: navy/cream game HUD, working build/roads/greenery shortcuts,44px dock
  targets, explicit building/floor focus; existing game windows stay functional.
- Stage2: five original architectural families, merged colored geometry and plant
  variants, connections/corners/T/cross markings from actual purchased road tiles,
  road-network curbs, coastal water and terrain-following shoreline side faces.
- Stage3: actual paid foundation/frame/slabs/roof/finish/opening visuals, temporary
  crane/scaffolds, saved-stage timeline, camera-facing cutaway walls and room floors.
  Explicit purchased materials take precedence over decorative room colors.
- No new purchasable catalog/species, free owned props, pricing or wallet changes,
  dependencies, server/Edge changes or database migrations. Original transforms,
  furniture, inventory, purchases, receipts and both wallets remain authoritative.

## Verification actually completed

- Lint, strict TypeScript and GitHub Pages production build passed.
- Compiled Pages-path/CSP/assets and PWA checks passed locally: installed service
  worker, offline saved balance, blocked offline writes, project reserve/refund.
  The built artifact was not published.
- 96 unit/integration tests in19 files passed (38.64s): authentication/CSRF,
  ownership/RLS,16 tasks, study/prayers, independent MAD/FX, purchases, atomic
  quotes/stages, paid material replacement,50% refunds, upgrades and persistence.
- 15 browser cases passed across focused runs, covering existing guest/offline,
  account isolation, two-browser restoration, approved tasks, projects/visits,
  wallets/refunds, persistent canvas/focus/menu keyboard access and measured studio.
  Two oversized mixed invocations reached their58s command limit; their remaining
  cases were run separately. There are no unresolved browser assertion failures.
- The new visual case passed43.3s (49.4s including disposable services): real paid
  8×12 two-floor construction, ten purchased legacy assets, sofa, global paid wood
  flooring, orbit/cutaway, stage states, dock actions, reduced-motion mode, English,
  Arabic RTL, light/dark accessibility scans and exact state restoration on reload.
- 390/768/1440px captures; no horizontal overflow. Zero JavaScript errors and zero
  WCAG A/AA violations in the captured studio cases and existing HUD/panel scans.
- Software Chromium fixture: construction107 calls/5,436 triangles; interior87
  calls/5,122 triangles; DPR1. These are render counters, not real-device FPS.

`verification.json` contains raw visual-case evidence. `before-*` captures were
made before these renderer changes using equivalent paid fixtures, camera/hour
and viewport. `construction-*` and `interior-*` retain those camera settings;
`*-focus-*` deliberately use the new focus control. Focused interior shots also
show the separately purchased wood floor. `preview.jpg` combines actual captures.

## Remaining

BATCH2 stages4–6: shop/task/focus/prayer/economy/settings and neutral Yuyi panel
polish, weather/day-night/streetlight and further mobile graphics/accessibility
work, then final screenshot/release acceptance. Publication remains prohibited
by the latest owner instruction. No hosted Supabase/two-device-world or full V6
completion claim; broader outstanding systems remain in ../../v6/WORLD-SYSTEMS.md.
