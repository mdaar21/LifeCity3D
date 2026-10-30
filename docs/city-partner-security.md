# City and Yuyi database contract

`supabase/migrations/002_city_partner.sql` follows `001_core.sql` and precedes
`supabase/seed.sql`. The seed mirrors all 25 entries in `src/lib/catalog.ts`.
`city_rule_prices` holds the server land-expansion price, initially 1,000 coins.
The seed creates no test accounts or artificial balances. Default real-life tasks
come from core `ensure_player`, which excludes the three removed task types.

All financial and placement writes pass through authenticated, idempotent
`game_command`. The six city helper functions have no `PUBLIC`, `anon`, or
`authenticated` execute grant. The outer function serializes receipts through
the caller profile, and city commands through the caller wallet. Partner
commands acquire the affected owner's wallet before its partner-link row;
the outer command must not acquire the caller wallet for `partner_*` commands.
This serializes consent, daily limits, revocation and adjustments without two
partner commands taking each other's wallet locks.

Every new table has RLS and no client write grant. Catalog and rule prices are
publicly readable. World land, inventory, placements, interiors and memories are
readable only by their owner. Partner histories and policy records are readable
by their participants. Invitation digests and optional recipient email have no
client select grant and must be omitted from `game_state_for` snapshots.

## Commerce and city invariants

- A purchase loads its price and unlock from the server catalog, rejects debt
  or insufficient balance, writes one ledger deduction and one unique inventory
  row. The outer receipt prevents a retried request buying a second item.
- Coordinates are integer grid positions; rotation is one of 0/90/180/270.
  Footprints rotate before bounds and rectangle-collision checks. Land must be
  owned for every covered cell. Initial owned land is lazily populated as 16×16.
- The inventory item, world and placement must all belong to the caller.
  Furniture cannot be placed outdoors; only furniture enters an interior.
  Interiors are 8×8 and belong to placed houses, villas or palaces.
- Moves and removals require the exact placement `expected_version` and increment
  world version. Moving a house preserves its furniture. Removing a house deletes
  its interior placements and returns every furniture item to owned inventory.
- Removal never refunds coins or deletes purchased inventory. First placement
  grants `max(1, floor(price/10))` city XP once per inventory row, and expansion
  grants 100 city XP. Moving, removing and replacing cannot farm city XP.
- City unlock level is `floor(sqrt(city_xp / 100)) + 1`. Player XP and city XP
  never decrease because of purchases, removals or partner deductions.
- Expansion adds four rows and columns, owns the new cells, charges the current
  server rule price, and stops at 32×32.

## Partner consent and privacy

`partner_invite` returns `{link_id, code, expires_at}`. Its code contains two
independent random UUID values (64 hexadecimal characters), with only its MD5
lookup digest stored. This is a high-entropy bearer invitation, not password
hashing. It expires after 24 hours, is consumed once, and cannot be accepted by
the owner's own account. Providing optional `{email}` binds acceptance to that
specific authenticated email. Without an email binding, the owner must share
the secret code with the intended recipient. A fresh invitation revokes older
pending invitations. At most one accepted partner is active for each owner.

All permission flags start false. Only the owner changes policy, including
whether the partner may award, deduct, view city or view tasks. Either participant
can unlink. Revocation takes effect on the server before another adjustment can
commit. Existing histories and positive garden memories remain after unlinking.

The partner chooses any nonzero integer amount within separately configured
per-action and per-local-day limits. Deductions also require literal
`confirmed: true`. The target owner's timezone determines the daily boundary;
all links and both positive/negative directions are counted separately across
that owner's actions, so replacing a link cannot reset a used daily allowance.
Server rate limits apply to invitations, adjustments, messages and challenges.

Each adjustment records actor, owner, signed amount, reason, note, command key
and server time. Ledger reasons are `partner:award` or `partner:deduction`;
freeform text stays in `partner_actions`. Positive actions append persistent
garden memories. Deductions may create debt but never remove property, earned XP
or garden memories. Deleting a partner account can remove its shared history;
the owner's accrued garden growth survives with a null action reference.

`partner_inspect` returns `{owner_id, display_name, permissions, wallet:null,
city, tasks}`. City is null without city consent; tasks is null without task
consent. Consented tasks contain only id, title, category and daily limit.
Consented city includes world, placements, furniture and garden growth/time.
Prayer logs, study sessions, balances, task completions and task notes are never
included. Challenges are stored invitations to an activity; creating a challenge
does not award coins. Its partner issues an approved award separately.

## Integration acceptance matrix

The parent-owned integration harness must apply both migrations and seed to
real Postgres/PGlite, create separate owner, partner and stranger accounts, and
issue RPC calls under the real authenticated SQL role and `auth.uid()` setting.
Only privileged fixture setup may fund wallets or advance server timestamps.
These are required checks, not claims that checks have already run:

| Area | Required assertion |
| --- | --- |
| Prices | Every seeded display field matches `CATALOG`; supplied `price`/`reward` cannot change the purchase deduction. |
| Retry | Repeating a purchase/action key yields the same response, one item and one ledger entry; changing payload for the key fails. |
| Debt | An authorized deduction can make balance negative; a paid purchase then fails without modifying inventory. |
| Ownership | Stranger inventory, house, placement, policy and partner target are rejected; raw owner tables remain isolated by RLS. |
| Footprints | Rotated non-square item fits or fails at the correct boundary; overlap fails; touching edges succeed. |
| Version | A stale move/removal fails, and refresh returns the exact coordinates, rotation and version after the valid move. |
| Recovery | Remove and replace cannot increase balance or duplicate city XP; house removal recovers all purchased furniture. |
| Expansion | Purchase owns the full new grid, increments version once and charges 1,000; size 32 rejects expansion. |
| Interior | Desk/sofa/bed rotate and collide in 8×8; non-furniture and unowned/non-house parents fail. |
| Invitations | Self-accept, expired code, consumed code, revoked code and wrong bound email fail; a second account can accept once. |
| Policy | Disabled directions and excess per-action/day amounts fail. Fractional/zero amounts fail. Negative amounts require confirmation. |
| Revocation | A revoked link cannot inspect, send, challenge or adjust; existing owner garden memories remain. |
| Privacy | Inspect defaults city/tasks to null, reveals only the separately consented projection, and never returns prayer/private-note data. |
| Grants | Direct helper RPC, direct wallet/inventory/catalog writes and direct ledger mutation are denied to authenticated users. |
| Concurrency | Two devices and simultaneous partners cannot overspend, overlap, exceed limits, duplicate receipts or bypass stale versions. |

For rollback, preserve/export user data first and restore the previous schema
from a verified backup. Dropping this migration's tables destroys purchases,
placements and partner history and is not a routine rollback procedure. Hosted
Supabase backup and live cross-device behavior require separate configured-project
verification; the migration does not provision a backup service.
