# Authoritative core SQL contract

`supabase/migrations/001_core.sql` owns profiles, wallets, the immutable coin
ledger, tasks/completions, study sessions, prayers/audit, preferences, worlds,
achievements, command receipts and synchronization events. Apply it before
`002_city_partner.sql`, then `supabase/seed.sql`. Supabase supplies Auth. The local
reference server alone supplies its documented `auth.users`/`auth.uid()` shim.
The migration deliberately does not create an authentication replacement.

All commands enter `game_command(p_action text,p_payload jsonb,p_key uuid)`;
`game_state()` returns the caller's current snapshot. Both require the
`authenticated` role and `auth.uid()`. Internal helpers have a fixed
`search_path=public,pg_temp` and no execute grants to public, anon or authenticated.
Every table has RLS. Authenticated table reads are owner-scoped; core table writes
have no grants. The anonymous deletion audit has neither a read policy nor API
grants. Public schema creation is revoked from API roles.

## Atomicity, retries and synchronization

Each command locks the caller's profile row to serialize idempotency keys. Core
and city commands also lock the caller's wallet. Partner commands leave target
wallet locking to module002, which locks the owner wallet before the link. This
avoids holding both participant wallets during reciprocal partner adjustments.
The server timestamp is read after the core locks are acquired.

`command_receipts` has primary key `(user_id,key)`. A successful command stores
its action, JSON payload and result in the same transaction as all effects.
Repeating the same key and request returns that result and a **fresh** snapshot;
it does not repeat side effects. Reusing a key with different action or payload
fails with `IDEMPOTENCY_CONFLICT`. A failed command leaves no receipt or partial
ledger changes. The complete snapshot is not duplicated into every receipt.
Account deletion intentionally cannot replay after the account/authentication
has been erased.

Partner inspection is a read with current consent: its private view is never
stored in a receipt, and every retry rechecks the active link and current scopes.

`apply_coins` takes the wallet row lock and appends a uniquely keyed transaction
before updating wallet coins and Player XP. A conflicting reuse of its key also
fails. Balances may be negative. XP input cannot be negative. The ledger rejects
updates/deletes even by ordinary owner SQL, except the narrowly allowed foreign
key operations required for account erasure and anonymizing a deleted actor.
Financial corrections append separate entries. Direct wallet updates are reserved
for database administration/test fixtures; the application has no such grants.

The boundary limits payloads to 8 KiB and successful commands to 120 per caller
per minute. Replays are accepted before rate limiting. The rate limiter is a
database boundary for game commands; the Auth provider/local server separately
handles authentication request limits. Offline clients must block financial
commands and retry a lost response using the original UUID.

## Tasks and local dates

Signup creates only these three built-in tasks: clean room `+40`, make bed `+10`,
workout `+50`. Their keys are `clean_room`, `make_bed`, `workout`. Each defaults to
one completion per local day. The owner can raise/lower the shared
`task_daily_limit` between 1 and 20. Custom tasks additionally have their own
`daily_limit`; the lower limit applies. An archived task cannot be completed.
At most 100 unarchived task definitions are allowed per player.

Custom rewards are integer 1–10,000 and cannot exceed the owner's
`custom_reward_limit` (default 500). Lowering that preference also caps future
awards from pre-existing custom tasks. A unique completion ordinal per task/day,
the command lock and receipt prevent concurrent or retried overclaims.

Dates use `(server_timestamp AT TIME ZONE profiles.timezone)::date`, including
midnight and daylight-saving rules from PostgreSQL. The default is Asia/Riyadh.
Timezone updates must name a real entry in `pg_timezone_names`. The first
intentional change is allowed immediately; subsequent changes require seven
days. Historical task completions and prayer day labels are never relabeled.

## Study clock

There can be one unfinished study session per owner. Only server timestamps
advance time; payload durations, rewards and credited-minute claims are ignored.
Fractional seconds are retained, and a minute pays only when the cumulative
verified total reaches a complete multiple of 60. Paused time earns nothing.
The timer pays +1 per completed minute and a single +20 at 60 credited minutes.
The bonus flag, persisted credited count, wallet lock and receipt protect retries
across pause/resume, multiple devices and reconnects. A repeated resume of a
running session does not reset its heartbeat clock or create an award.

A heartbeat/pause/finish measures elapsed time from the last server tick. Each
interval credits at most 90 seconds. If the elapsed interval exceeds 90 seconds,
the server records `idle_capped=true` and pauses the session after crediting that
cap. The player must explicitly resume. A state read never advances the clock.
This conservatively recovers a short connection gap and does not manufacture
hours of offline study. The application records self-reported focused activity;
a heartbeat is not proof of real-world attention. `last_tick_at` cannot move
backward during reconciliation.

## Prayers and corrections

The five prayers have independent `(user_id,day,prayer)` records. Fajr completion
is +30; each other completion is +20. Pending and excused have zero net coins.
A missed status requires the JSON boolean `confirmed_missed:true` and records
exactly -100, even when the wallet becomes negative. No clock or background job
converts an unrecorded prayer to missed.

Changing a status creates a `prayer_audit` row with prior/new state and total
coin difference. Corrections first reverse the previous financial statement and
then append the new one. Thus completed Fajr → missed emits -30 correction and
-100 missed, while missed → excused emits +100 correction. Repeating the same
status has no financial effect. XP is awarded only the first time that prayer
record is completed, never removed and never farmed by status corrections.

`prayer_set.day` defaults to today. Explicit dates must be ISO `YYYY-MM-DD`, not
future dates, and within the prior seven local days. This supports a bounded
self-reported correction window. Prayer audit is available to the owner as an
extra snapshot/export field, never included in partner inspection.

## Profile and account deletion

`profile_update` validates display names (1–60 trimmed characters), supported
language (`ar-SA`, `en`), theme, digit style, currency label and timezone. It also
accepts the two numeric task preferences and JSON booleans `audio`,
`prayer_reminders`, `notifications`. Storing these preferences does not configure
push delivery or a prayer-times provider.

`delete_account {confirmation:'DELETE'}` deletes the caller's Auth user inside
the command transaction. Foreign keys erase their personal core/module data and
local credentials/sessions where present. Actor references in other owners'
ledgers become null; their existing financial facts remain intact. The only
application-retained deletion record contains a random audit ID, deletion time,
number of erased own ledger entries and the erasure policy string. It contains
no original account UUID, email, name, IP, message or task content. Provider Auth
logs and provider backups are governed by the configured provider's separate
retention policy. No backup/restore service is configured or claimed here.

Deletion of external Storage objects is not needed by the current application,
which stores no uploaded avatar/media. Add an authorized server cleanup if uploads
are introduced. Database administrators should review provider retention before a
public release. A schema rollback requires a tested backup/restore or explicit
destructive teardown in a disposable development database; do not run a blanket
drop against real player data.

## Stable errors and evidence

Core machine codes are `AUTH_REQUIRED`, `INVALID_PAYLOAD`, `INVALID_TIMEZONE`,
`TIMEZONE_COOLDOWN`, `IDEMPOTENCY_CONFLICT`, `RATE_LIMIT`, `NOT_FOUND`,
`DAILY_LIMIT`, `TASK_ARCHIVED`, `TASK_LIMIT`, `SESSION_ACTIVE`,
`SESSION_FINISHED`, `CONFIRM_MISSED`, `DAY_OUT_OF_RANGE`, `DELETE_CONFIRMATION`,
`LEDGER_IMMUTABLE`. Module002 adds its documented command errors. The client must
localize codes and avoid displaying raw SQL diagnostics.

The executable integration coverage is maintained in
`tests/integration/sql-authority.test.ts` by the backend/QA module. The cases
below define the core acceptance contract; consult the release evidence for
actually executed results, rather than treating this specification as a pass.

| Case | Expected authoritative result |
| --- | --- |
| New Auth user | One profile, zero wallet, 16×16 world, exactly three built-ins |
| Eight simultaneous same-key task requests | One completion and one reward |
| Different key after the daily cap | `DAILY_LIMIT`, unchanged wallet |
| Reuse key with different payload/action | `IDEMPOTENCY_CONFLICT` |
| Invalid reward/type or limit preference | `INVALID_PAYLOAD`, no partial effects |
| 59 seconds + verified 1 second | Exactly one minute coin |
| 3,599 seconds/59 credited + verified 1 second | +1 minute and +20 bonus |
| Retry milestone, pause/resume/finish | No duplicate milestone or minute award |
| Four-hour idle gap | At most 90 seconds recovered, paused, idle flag true |
| Repeated completed prayer | One nominal reward, one initial XP award |
| Missed without true confirmation | `CONFIRM_MISSED`, no mutation |
| Pending/excused and elapsed time | No penalty |
| Complete → missed → excused | Reversal entries; net -100 then zero for that prayer; XP retained |
| Complete → pending → complete | Original XP total retained; no XP farming |
| Authenticated direct wallet/ledger writes | Permission denied |
| Read another user's wallet / helper RPC | No foreign rows / execute denied |
| Anonymous state or command RPC | Execute denied |
| Delete account | Personal rows removed, anonymous audit count only |

For the deployed Supabase project, repeat RLS/privilege and multi-device checks
against actual Auth/JWT sessions, and verify Realtime publication/filter setup.
PGlite exercises PostgreSQL SQL authority but its single-connection serialization
does not substitute for a live multi-connection Postgres load/deadlock test.
