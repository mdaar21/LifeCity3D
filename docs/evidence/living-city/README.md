# Living city implementation — 2026-11-02

Owner-authorized upgrade; publication follows successful release verification.

- PC walking/running, mouse heading, follow-camera touch/wheel zoom, articulated
  original avatar and modal input lock. Adjacent legacy roads snap edge-to-edge;
  moving objects render once. Saved geometry remains unchanged until confirmation.
- One deterministic resident per completed purchased home, including legacy homes,
  with an outbound/return walk. Simulation objects never become free inventory.
  Traffic follows paid roads/signals when enabled; worker/crane construction cues.
- Shop contains all purchase categories; inventory contains owned purchases.
  Advanced tools retain their operations but replace X/Y/Z entry with world picking
  and terrain brushes. Mission tabs use normal flow to avoid covering scrolled cards.
- All16 approved tasks retained. Missions includes prayers and an independent5/5
  progress card. An additive private trigger awards MAIN50/day and reverses/restores
  corrections without replay/XP farming, historical backfill or MAD changes.
- Eight paid tower types,38–250 floors,4m/floor (152–1000m). The base catalog price
  buys38 floors; each extra floor costs2% of that base plus applicable lift cost,
  area/contractor scaling. New contracts freeze the amount. Glass:1800 extra/floor
  at the standard footprint/contractor. Existing contracts/cost bases unchanged.
- Batched tower facades, actual floor heights/navigation and camera fit preserve
 250-floor plans. Additive entity envelope raises only building/blueprint JSON
  to1MiB, retaining2MiB transitions,256 bill rows and other entity limits.

Verification before release:141 unit/integration checks in31 files passed. The
real250-floor persistence test completes every paid stage, checks exact469200 SAR
and reloads all receipts. Rendered software-WebGL capture:18 calls,9538 triangles;
this is a geometry budget measurement, not a physical phone frame-rate claim.
Six added browser journeys cover desktop controls/home population, prayers,
the eight tower catalog entries, adjacent road movement, terrain and the actual
paid1000m tower. Existing navigation tests follow the new shop/world tools while
retaining finance/privacy/persistence checks. See release evidence for full CI.

Screenshots and catalog images come from the real procedural renderer. Local
test fixtures are disposable. No production user data was reset or backfilled.
Remaining Ultimate V6 master-plan work is separate from this requested increment.
