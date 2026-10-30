# Projects and city visits — migration006

Construction projects reserve real spendable coins through the same authenticated
`game_command` transaction as other financial actions. Only one saving project is
allowed per owner. The building must be an eligible unlocked server catalog item;
the price is quoted from that catalog and frozen at creation. A submitted price,
owner ID or inventory ID never determines the result. Contributions are positive
integers within both remaining quote and available wallet balance. On completion,
exactly one owned inventory row is granted. City XP is earned only by the normal
first placement rule. There is no project reward or early XP.

Cancellation creates one auditable compensating `project:refund` ledger entry,
sets the remaining reservation to zero and makes the project terminal. Completed
projects cannot be cancelled for a refund. Wallet/profile locks, a partial unique
index and the existing idempotency receipt protect concurrent starts, contributions,
completion, cancellation and network retry. Replaying a successful command returns
fresh state; it cannot double-credit a refund or double-grant a building.

The forward migration preserves the old private module/state implementations
under new names, revokes their execute grants and adds protected wrappers. It
does not reset accounts, currency, tasks, inventory or placements. All new tables
have RLS and no browser mutation grants. Owners can read their own projects and
safe share metadata; neither code verifiers nor visitor identities have grants.

City links are deliberate bearer access to an allowlisted exterior view. Each
enable/rotate generates two random UUIDs (64 lowercase hex characters), stores a
SHA256 verifier in `city_shares`, increments revision and expires after seven days.
Disable clears the verifier immediately. Rotation, expiry, account deletion and
disabled status are checked by every `city_visit` call and new reaction. An already
received screenshot/view cannot be recalled; reload or the next request applies
current revocation. A link holder may share the link, so this is explicit city-only
sharing rather than a guarantee about the identity of every viewer.

The ordinary game state contains only enabled/expiry/revision and never a raw
token. **Storage exception:** the owner's private `command_receipts` row retains
the raw successful `share_enable` result for exact idempotent retries. The code is
not stored solely as a hash throughout the entire database. Receipts are already
owner-scoped by the existing command boundary/RLS, and a retained old result does
not restore a revoked or rotated token. Keep receipts/database backups protected.

`city_visit(text)` explicitly revokes PUBLIC execute and grants only anon and
authenticated roles a read-only safe projection: a fixed LifeCity title, world
size, public catalog, exterior catalog/coordinates/rotation/variant fields,
expiry, aggregate likes and aggregate preset greetings. It excludes the owner
name/email/ID, placement/inventory IDs, wallet, XP, tasks, prayers, private notes,
partner details and interior furniture. Anonymous roles cannot read the private
tables or write reactions. Local HTTP additionally applies no-store/no-referrer
and bounded public request limits; deployment/frontend integration is root-owned.

Only authenticated accounts can use `visit_react`. The server supplies the caller,
denies self-reactions, checks current share consent under a share row lock and
permits one like and one preset greeting per viewer/revision. Greeting choices are
`beautiful`, `keep_going`, `welcome`; there is no publicly posted free text or
visitor identity. Reactions give no money/XP and cannot change the visited city.
Owners can rotate or disable a link. A returned earlier idempotency receipt is not
a new reaction and does not bypass consent or insert a new row after revocation.

Tests in `tests/integration/projects-visits.test.ts` cover funding/refunds,
malformed/hostile amounts, server price quotes, ownership, direct table/helper
denial, concurrent exact completion, privacy projection, hash verification,
rotation/expiry/disable/delete, authenticated reaction uniqueness and no rewards.
Root executes them against real local PostgreSQL; no hosted Supabase result is
claimed by this document.
