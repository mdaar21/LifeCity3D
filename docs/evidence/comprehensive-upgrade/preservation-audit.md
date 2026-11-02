# Preservation and release dependency audit

The populated-v5 upgrade test actually closes a persisted reference database, applies only the two new additive migrations on reopening, then compares the saved account before and after. It passes with the following unchanged: profile, both balances/XP, inventory, placements, interior furniture, immutable ledgers, saving projects and their frozen targets, prayers, fractional study session, tasks/completions, all16 approved tasks, world JSONB geometry/layouts/contracts/components and independent MAD history. A pre-upgrade low-level villa remains moveable after its future unlock becomes10; new purchases are denied. Existing2500 SAR and6562.50 MAD bases still quote1250/3281.25 refunds. An old-layout construction continues its locked paid stage and preserves every earlier component.

Verified sources:

- `tests/integration/comprehensive-upgrade.test.ts`: populated compatible migration and continuing old assets.
- `tests/integration/product-progress.test.ts`: SQL/service-only eligibility, forged level rejection, rechecked commit, owned furniture, frozen project/legacy price bases.
- `tests/unit/living-city.test.ts`: old87600 tower contract and1800 additional-floor price survive new pricing; actual residents, gradual38–250 four-meter floors and50% components.
- `tests/integration/prayer-daily.test.ts` and `v5-tasks.test.ts`: MAIN-only rewards, unique claims, corrections, daily/load/weekly limits and historical exclusion.
- `tests/integration/http-auth.test.ts`: actual local Auth isolation, HttpOnly session boundary, logout/ownership. Actual hosted Auth/restoration remains a final release check.
- `tests/e2e/comprehensive.spec.ts`: actual display fractional-clock/hour-boundary settlement, true native controls, free previews/cancel and saved MAIN/MAD isolation.

Stage10 focused verification:22 tests across5 files passed. Prior financial/full tests also passed; the complete release suite is stage11. No production data was seeded, deleted, reset or edited in these tests.

New migrations only update future catalog fields, add a private read-only eligibility helper and extend the service-only context. No user wallet, profile, inventory, project, owned geometry, ledger or paid component is rewritten. Remote read-only inspection confirmed all three original level expressions expected by the guarded migration; unknown implementations fail closed. Existing RLS/Auth and service-only execution grants remain in place.

Release order is mandatory: full checks, preservation baseline, two SQL migrations, compatible `world-command` edge function, hosted service/finance checks, main/Pages deployment, save-preserving public PWA upgrade and independent cloud restoration, diagnostic-only cleanup. Backend changes are not yet deployed at this checkpoint. Publication is already authorized by the owner and needs no additional approval.
