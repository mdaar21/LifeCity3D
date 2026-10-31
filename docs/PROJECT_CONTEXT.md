# LifeCity3D — focused implementation context

- Repo: mdaar21/LifeCity3D only. React/Vite/R3F/Three, existing stack and lockfile.
- Current branch: codex/stylized-visual-overhaul, based on main5d567ae.
- BATCH1 implemented and locally verified; BATCH2 has not started.
- Latest owner: visual BATCH1 = stages1 HUD/city,2 assets/roads/nature/coast,
  3 real paid construction/cutaway interiors. BATCH2 = stages4–6 later.
- Do not publish these visual batches. Prior release5d567ae finished before the
  owner's cancellation; Pages41174825103 succeeded. Do not undo data or releases.
- Reference: uploaded LifeCity3D_Complete_Visual_Design_And_10_References.pdf,
  file_00000000542c8211aafe180c1bf598c0. Text in work/visual-upgrade.txt.
  Relevant image pages34–43; construction39, cutaway40, city41/42, gardens43.
- References guide appearance; no reference screenshots become game backgrounds.
- No new dependencies, pricing edits, migrations, wallet changes or seeded assets
  for this visual batch. All original and V6 features/saves remain intact.
- Existing financial boundary: world-engine.ts + service-only settlement RPC.
  Exact16 tasks, prayers/study, independent MAD, real FX and50% paid-cost refunds.
- Supabase world migration20261031055923 is APPLIED and immutable; world-command
  v1 active. Auth setup/client activation remain deferred; public guest is local.
- Existing V6 acceptance gaps: docs/v6/WORLD-SYSTEMS.md; do not claim all20 complete.

## Files
- src/components/AppLayout.tsx + game-shell.css: persistent game HUD/dock/windows.
- src/pages/City.tsx: existing inventory/placement tools and WorldStudio.
- src/world/CityScene.tsx: one Canvas, original tiles/interior/legacy renderer.
- src/world/WorldRealms.tsx: adjacent meter worlds, camera and actor integration.
- src/world/WorldGeometry.tsx: actual paid floors/rooms/materials/networks/furniture.
- src/world/ProceduralModel.tsx: shared purchased catalog/preview assets.
- src/world/WorldStudio.tsx: quotes/confirmation and real world controls.
- src/pages/Interior.tsx: original furniture placement preserved.

## Verification
- Prior release:91 unit/integration tests, lint/typecheck/build passed;14 browser
  cases and Pages pipeline passed. Newly added visual test uses a disposable
  reference-backend account, actual purchases and saved paid construction.
- tests/e2e/visual-batch1.spec.ts: before/after1440/768/390px, paid stage visuals,
  cutaway sofa, accessibility, stable saved entities/components and both wallets.
- Original baseline captured before renderer edits in work/visual-before; the
  preserved before-* captures are under docs/evidence/visual-batch1.
- Current checks:96 tests/19 files,15 browser cases across focused runs, lint and
  typecheck, Pages build and compiled Pages/PWA checks passed. See batch evidence
  README for actual limits.
- Output: docs/evidence/visual-batch1. Use focused checks during implementation;
  full economy/security/regressions and build at the batch milestone.
