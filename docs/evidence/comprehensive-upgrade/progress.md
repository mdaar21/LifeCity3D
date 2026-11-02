# Comprehensive upgrade: twelve-stage execution

Source request: [owner specification](../../specs/LifeCity-Comprehensive-Upgrade-2026-11-02.md).
Baseline: published43771049, world-command v5,141 tests/39 browser cases.

1. Unified shop taxonomy — **complete**. Lint/types and rendered shop audit passed; six primary categories, lighting/roads and cars preserved, furniture destination coverage, no wallet/entity/inventory changes. Evidence: stage1-shop-390.png and tests/e2e/comprehensive.spec.ts.
2. Shared menu/button design — **complete**. Lint/types and rendered320/390/768/1440 keyboard/RTL control checks passed. Evidence: stage2-shop-rtl-390.png.
3. Distinct base architectural geometry and variants for the full catalog — **complete**. Actual room-bearing pavilions/courtyards, three geometric styles for13 modern families, eight tower shapes, updated five legacy families, batched construction and distance LOD.52 actual captures +26 before pictures;143 tests/32 files and four rendered paid/interior/garage journeys passed; lint/types passed. New plans use optional layout_version2; existing plans/costs remain unchanged. See architecture-comparison.html.
4. Per-category unlocks through40, trusted guards and owned-asset grandfathering — **complete**. Explicit per-SKU schedules; preview locks, next collection and earned-level toast. SQL and shared engine enforce real stored XP at quote/commit; player/task XP can advance either collection without transferring money. Existing assets/stages remain usable.145 tests verified across full and corrected19-case regression run; three browser journeys passed, including forged purchase and actual earned unlock. Additive progression migration is local, pending release.
5. Measured low/medium/high activity economy and future-price rebalance — **complete**.101 actual products audited;145/460/750 daily gross scenarios and explicit weekly/monthly assumptions. Future car/furniture/villa/tower prices and25-XP intervals; existing balances/XP/paid bases/contracts/project targets unchanged.147 tests passed, nine focused historical-compatibility checks passed after tuning; actual earned-XP/table purchase/reload and MAIN/MAD browser proof passed. Lint/types passed. See economy-review.md and economy-audit.json.
6. MM:SS focus timer, preserved timing/rewards — **complete**. New responsive centered ring/digits/controls; floor display seconds only, retaining authoritative fractional timing. Actual fractional59:59 session resumed/paused/finished at the first-hour boundary, exactly21 new SAR once, persisted60 credited minutes/one bonus, MAD unchanged;320/390/768/1440 layouts passed. Lint/types passed. Evidence: stage6-timer-390.png.
7. Camera-relative strafing, right-button look and damped zoom — **complete**. Two vector/damping tests; actual native W/S/A/D, unchanged strafe facing, no hover/left-drag rotation, right-drag/release, wheel/pinch, reload, no pointer lock and unchanged wallets passed. Independent guided garage/car purchase/touch driving/parking passed. Lint/types passed.
8. Remove fixed walking instructions, optional small help — **complete**. Fixed desktop box and walking map cue removed. Small accessible help button opens current right-drag/strafe/touch instructions only on request. Rendered mobile open/close and absence checks passed; lint/types passed. Evidence: stage8-clean-walking-390.png.
9. General UX/performance polish — pending.
10. Preservation audit — continuous; final audit pending.
11. Full automated/rendered verification and before/after evidence — pending.
12. Merge, GitHub Pages publication and real public checks — authorized; pending.

Announce completed stages in commentary and continue without ending the task.
No declaration of full completion until all stages and hosted release checks pass.
