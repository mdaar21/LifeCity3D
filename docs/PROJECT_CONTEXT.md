# LifeCity3D — focused implementation context

## Latest owner — activate login only
- Owner requested live login activation. Narrow Auth PR5 merged into main22c1098;
  Pages run41230810738 succeeded (96 tests/14 browser cases). The REAL public
  site passed password login, logout and independent-browser cloud restoration.
  Evidence: docs/evidence/auth-activation; temporary account/profile/sessions
  were removed and verified absent. Real email delivery remains unverified.
- Public Supabase client enabled=true. Hosted password login, callback after guest
  use, paid purchase/placement and independent-browser cloud restoration passed.
  Allowed confirmation/recovery destinations verified live. Email delivery to a
  real inbox remains unverified; email confirmation was not disabled.
- Auth changes carried into this content branch; its visuals/agriculture stay
  unpublished. Future content publication still needs explicit owner permission
  and deployment of the compatible world-command engine before its frontend.

## Current owner priority — paid content, not another visual batch
- Continue this branch; both visual batches are complete. Do not repeat them.
- Vegetation/agriculture group implemented:14 paid species,8 crops/orchards,2 paid
  plot sizes. Real-time growth, paid water/harvest/relocation, stored crop-specific
  produce and capped MAIN sales. MAD harvests are collection-only (grant rule).
- Next mandatory groups: paid recoloring/customization across applicable objects,
  then paid road/lighting/architectural variants. These are NOT complete yet.
- No publishing, deployment or merging without owner permission.
- world-horticulture.ts plugs into the existing trusted quote/commit engine.
  Uses optional Decoration.species/farm JSONB fields, existing RLS/receipts/cost
  components and shared20%/60 passive-income cap. No schema migration is needed.
- New UI: HorticulturePanel in Shop → Plants & farming and Greenery studio tab.
  BotanicalAssets shares cached geometry. Existing catalogs/prices stay intact.
- 111 tests/22 files and focused finance/persistence/browser checks passed.
  Evidence: docs/evidence/horticulture. Supabase schema/privileges checked read-only.
  New operations are not deployed to the live Edge function yet.


- Repo: mdaar21/LifeCity3D only. React/Vite/R3F/Three, existing stack and lockfile.
- Current branch: codex/stylized-visual-overhaul, based on main5d567ae.
- Visual BATCH1 and BATCH2 (stages1–6) implemented and locally verified.
- Latest owner: visual BATCH1 = stages1 HUD/city,2 assets/roads/nature/coast,
  3 paid construction/interiors; BATCH2 =4 game panels,5 atmosphere/graphics,6 acceptance.
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
  v1 active. Guest saves remain local and separate from the Auth account adapter.
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
- Current checks:100 tests/20 files,19 browser cases across focused runs, lint and
  typecheck, Pages build and compiled Pages/PWA checks passed. See batch evidence
  README for actual limits.
- Output: docs/evidence/visual-batch1. Use focused checks during implementation;
  full economy/security/regressions and build at the batch milestone.

## BATCH2
- src/game-panels.css scopes shared light/dark game surfaces; all forms/commands
  retained. Shop uses25 original cached PNG renders, one live preview on demand.
- src/world/graphics-profile.ts + useGraphics.ts: device-only auto/low/medium/high,
  DPR1–1.5; separate local key lifecity-render-preferences-v1, no finance or saves.
- WorldAtmosphere/WorldWeather: visual-only server-clock prediction, day/sunset/
  night, readable fog, instanced rain/clouds; stop loops when inactive/hidden or
  reduced motion. Paid windows/lamps light at night; no free assets or energy.
- Yuyi's separate MAD panel is neutral; original memory garden remains in a drawer.
- New evidence: docs/evidence/visual-batch2.100 regression tests and all19 browser
  cases passed; no schema/server/dependency changes and no publication.
- Broader V6 gaps, real email delivery and hosted world acceptance remain as
  documented earlier. Auth password/cloud acceptance has newer evidence above.
