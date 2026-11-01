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

Full regression passed on application source `d621b48` in
[CI41290225129](https://github.com/mdaar21/LifeCity3D/actions/runs/41290225129):
126 unit/integration tests in27 files, all32 browser journeys (5.5min), clean lint,
TypeScript and production/PWA build. Covers trusted finance/idempotency/refunds,
MAIN/MAD isolation, roads, touch gestures, vehicle/garage, paid material fitting,
all16 life tasks, persistence and106 working catalog photos. No tests skipped.

Local new mobile journey passed24.3s, including English/Arabic RTL/Axe checks;
57 unit tests and production/PWA build also passed. Screenshots show actual owned
paid test objects; development-server evidence, not a published version or final
art promise. No physical-device or newly hosted Supabase verification claimed.

Full-object recoloring, additional paid variants and the larger V6 acceptance
backlog remain separate work. Physical-device performance is not claimed.
