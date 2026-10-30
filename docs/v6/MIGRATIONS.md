# V6 foundation migration and Supabase setup

Applied remotely: `20261030225914_v6_wallets_territory_fx.sql` (registry version
20261030225914, name v6_wallets_territory_fx). The file was created with Supabase
CLI2.122.0 and aligned with the version returned by the connected migration tool.
Do not rerun001..006 or recreate profiles. The pre-existing hosted schema came
from manual setup and has no earlier migration-registry rows; do not blindly run
`db push` against that schema. Inspect/repair historical baselines deliberately.

Changes are additive, except widening main balance/ledger delta from integer to
exact NUMERIC(20,4) without revaluing old numbers. Added retired-inventory metadata,
owner-indexed/RLS MAD wallet/ledger/world/inventory/placements/quotes, private FX
snapshots, verified paid components and demolition receipts. Existing RPCs are
wrapped/delegated; private helpers and predecessors are not browser callable.
A legacy cost basis is reconstructed only when an actual immutable purchase or
project receipt identifies a matching debit and inventory object. No arbitrary
old payouts, plants, starting money or retrospective MAD grants are created.

Before application, affected hosted counts were all0; schema/function metadata
and affected row exports were retained privately under ignored work/v6. A local
populated migration test preserved wallet/ledger/placements/partner history,
reconstructed purchase basis and resisted catalog repricing. A hosted transaction
tested actual operations and RLS, then ROLLBACK removed all diagnostic identities
and financial entries. This is not a full provider backup/restore-drill claim.

Rollback: a failed migration transaction rolls back atomically. After real V6
activity, retain all new ledgers and prefer a forward corrective migration. Never
drop V6 data, downcast fractional balances to integer, remove user-owned assets
or replay old partner awards to undo a release. Restore a compatible numeric-aware
client and disable the affected action while preparing a repair.

FX: ExchangeRate-API open access daily SAR-base reference, actual coverage checked
for24 supported game codes. Commercial conversion/cache permitted with source
attribution; no public bulk redistribution. Cache is private. refresh-fx is a
Supabase Edge Function; verify_jwt=false because its handler validates the actual
session through Auth.getUser before privileged work, matching current key guidance.
Secret/service-role keys stay in Supabase-provided server environment only.
Missing/invalid sessions return401; users cannot call fx_store_snapshot directly.

Remaining Auth setup in the Supabase dashboard:

- Site URL: https://mdaar21.github.io/LifeCity3D/
- Additional redirect: https://mdaar21.github.io/LifeCity3D/**
- Verify real confirmation/recovery delivery and allowed email settings.

The connected tools cannot change those Auth URL settings. GitHub Actions-variable
access also returned403. `deployment/client-service.json` therefore contains only
the public URL and publishable browser key as an alternative controlled config;
its enabled flag remainsfalse until Auth setup and hosted email acceptance.
VITE_BACKEND_MODE/VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY overrides still work.
No secret key belongs in this JSON file or any VITE_ variable.
