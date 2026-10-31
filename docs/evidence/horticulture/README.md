# Paid vegetation and agriculture — unpublished

Continues codex/stylized-visual-overhaul from676316e. Visual batches were reused.

- 14 species: date/fan/coconut/royal palms, pink blossom/jacaranda, ornamental
  orange/lemon/olive trees, hedge, flowering shrub, agave, bougainvillea and cypress.
- Two paid plots:2×2m bed (25 SAR),4×4m orchard (100 SAR); no free seeds/trees.
- Eight paid recipes: tomato, wheat, carrot, strawberry, lavender, orange/lemon/date
  orchard. Growth takes90–1440 real minutes plus required paid irrigation.
  Orchard planting buys a single four-sapling crop bundle, not movable free trees.
- Positive canonical prices for planting, irrigation (.50), harvest (.50), clearing
  (1), relocation (1/m²) and MAIN market commission (.25). MAD prices use real FX.
  The server ignores supplied price, growth, wallet and yield values.
- Harvest creates persistent crop-specific stock. MAIN sales share the EXISTING
  20% eligible24h earnings /60 SAR total allowance with all businesses. No sale
  creates new eligibility. Stock exceeding the allowance stays saved.
- MAD harvests remain collectible, without cash sales or conversion. This preserves
  the existing grant-funded Yuyi economy; neither wallet funds the other.
- All paid components, including cultivation services, retain their historical
  source costs; explicit demolition refunds exactly50% under the existing policy.
  Removing a planted/stocked plot requires an explicit discard quote/confirmation.
- No schema migration: optional species/farm data uses existing world_entities
  JSONB, owner RLS, service-only settlement, receipts and private history.

## Verified

- 111 unit/integration tests in22 files passed (42.74s); six new domain tests and
  five new SQL integration tests cover pricing, free previews, paid actions,
  idempotency, rollback, ownership, MAD half-cent refunds, trusted growth, shared
  income caps, stock identity and guest fee/gross-income accounting.
- New browser case passed: actual paid palms, cancelled quote without debit,
  paid move, mature-crop harvest/sale, zero WCAG A/AA violations and exact wallet/
  entity/component recovery in an independent browser. Maturity is staged only
  inside the disposable test DB; no public time/funding shortcut was introduced.
- Existing paid building/interior journey and three legacy purchase, MAD refund,
  account-isolation and two-browser persistence cases passed.
- 14 species PNGs and species-preview.jpg are actual renders of the same geometry
  used by purchased entities. The gallery does not seed owned assets.
- Hosted compatibility checked read-only: existing JSONB, RLS and denied direct
  client inserts; authenticated settlement denied, service-role settlement allowed.
  This does NOT claim deployed crop operations or hosted two-device acceptance.
- Lint, TypeScript and the GitHub Pages production build passed. The compiled
  Pages-path/PWA checks passed locally, including offline saved balance and blocked
  offline financial actions. No deployment was triggered by these checks.

## Release/remaining scope

No live DB, Edge deployment, website publication or merge was performed. On an
owner-approved release, bundle the new world-horticulture.ts with the updated
world-command shared engine before exposing its frontend. Existing schema suffices.
Do not roll back to an older engine that does not price these new entity types.

Complete paid recoloring/customization and paid road/lighting/architectural
variants are the next approved groups; they are not implemented in this increment.
