# Local development reference

Run `npm run local:server` alongside `npm run dev` with
`VITE_BACKEND_MODE=local`. Vite proxies `/api` to `127.0.0.1:4174`.
The reference server stores PGlite data under `.data/lifecity`; it loads the
Supabase migrations and catalog seed on first startup. This is local disk
storage and development authentication, not hosted Supabase or cloud save.
Password recovery and email delivery deliberately return an unconfigured error.

Configuration:

- `LOCAL_DATABASE_PATH` defaults to `.data/lifecity`.
- `LOCAL_API_PORT` defaults to `4174`.
- `LOCAL_API_HOST` defaults to `127.0.0.1`.
- `LOCAL_ALLOWED_ORIGINS` is a comma separated list of exact origins. Defaults
  allow localhost and 127.0.0.1 on ports 5173 and 4174.
- `LOCAL_COOKIE_SECURE=true` requires an HTTPS browser connection.

Every POST requires a trusted `Origin`. Cookies are HttpOnly, SameSite Strict,
opaque random tokens; only SHA-256 session digests are persisted. Passwords use
Node's scrypt with a per-account random salt and constant-time verification.
Sessions expire after seven days and logout revokes the current session.
Authentication and command bursts are limited in process; SQL additionally
enforces its own command and domain limits. The local process limiter resets
when the reference server restarts.

Authenticated commands execute the identical `game_command` SQL boundary using
`SET LOCAL ROLE authenticated` and a transaction-local `auth.uid()` identity.
All PGlite access passes through one mutex covering the complete transaction,
including role setup, so asynchronous requests cannot share an identity or
interleave statements. No HTTP endpoint changes balances directly.

`GET /api/export` exports only the signed-in account's game snapshot. Deletion
uses `game_command('delete_account', {confirmation:'DELETE'}, key)`; the SQL
deletes that account, its authentication credentials and all local sessions.

`npm run test:integration` exercises SQL roles, RLS, rewards, ledger-backed
commerce, placements, partner consent and HTTP authentication. `npm run test:e2e`
starts its own disposable database and both local services. Do not run another
service on ports 4174/5173 during that browser suite. It uses
`CHROMIUM_PATH=/usr/bin/chromium` by default and requires no browser download.
Test-only funding is confined to `tests/e2e/start-server.ts` and SQL fixtures;
the normal server never imports those files.
