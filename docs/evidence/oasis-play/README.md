# Simpler gameplay and richer owned assets

Unpublished integration on `codex/stylized-visual-overhaul`. Original procedural
art ideas now run in the real game; the standalone illustrated neighborhood is
not inserted into any account. Existing purchasable ids/prices and paid footprint
contracts remain unchanged. No backend, schema, dependencies or live-data changes.

- Three-button beginner camera rail with labeled optional tools/quality/advanced menu.
- Real16-task shortcut, free1–3-floor planning and direct trusted stage confirmation.
- Compact contextual actions, exterior/individual/all-paid-floor inspection.
- Curved leaflet palms, richer legacy buildings/paid facade details, owned furniture
  and tiered fountains; merged cached meshes and device-scaled palm detail.
- Static ocean ripples, active-plot shadow coverage and refreshed catalog pictures.

`oasis-play.spec.ts` starts an empty reference account and performs a real task,
then actual paid two-floor construction, palms, fountain and furniture purchases.
It checks preview/cancel, MAIN/MAD isolation, original costs, real rendered world
selection/cutaway, English/Arabic RTL, accessibility and reload persistence.
Test accounts only exist in the local reference fixture; no free objects are seeded.

Local checks: new mobile journey passed (24.3s),57 unit tests passed previously,
production/PWA build passed. Existing shop, architectural-finance and visual
construction/furniture journeys also passed. Full regression status is recorded
in verification.json after CI. Screenshots show actual owned paid test objects;
they are development-server evidence, not a published version or final art promise.

Full-object recoloring, additional paid variants and the larger V6 acceptance
backlog remain separate work. Physical-device performance is not claimed.
