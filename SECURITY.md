# Security boundaries

Do not disclose passwords, recovery links, session tokens, database credentials,
service-role keys or `.data`. Public Supabase anon/publishable keys are not admin
keys; authorization is still enforced with verified Auth JWTs and RLS.

Financial authority: `game_command` transactions only. PostgreSQL locks caller
profile/appropriate wallet rows; immutable receipts and ledger keys prevent
double-credit/spend. Actions validate server price/clock/date, ownership, partner
consent and limits, collision and expected placement version. Helpers have fixed
search_path and no authenticated execute grant. Authenticated table writes are
not granted. Partner prayer records/private notes are not exposed by inspect.

Local development service uses scrypt salts, timing-safe comparison, random
opaque HttpOnly Strict cookies stored hashed, same-origin POST checks, body
limits and rate limits. It intentionally lacks email delivery and is not a
production internet-auth service. Use hosted configured Supabase for production.

PWA caches public shell/assets, not API responses. Read-only snapshot cache is
account-keyed and removed on logout; treat the device as a private device.
Network-uncertain requests retain only idempotency keys for explicit retries,
never an automatically submitted offline financial queue.

No production penetration test, managed backup/PITR, security SLA or distributed
load test has been claimed. Review provider policies and conduct a hosted
isolation/concurrency/restore drill before commercial acceptance.
