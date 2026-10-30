# LifeCity 3D / لايف سيتي

This is a separate application and repository. Never modify Mdaar21 while working
here. Read docs/architecture.md and src/lib/types.ts before implementing a module.
Arabic (ar-SA) is default; English must be available. Do not mirror 3D coordinates.
Use original procedural geometry, forest/moss/ivory/gold/sky/charcoal palette and
commercially permitted fonts. No default read10pages / learn30min / personalproject tasks.

## Invariants
- Production authority is Supabase Postgres + Auth, never browser balances.
- All writes use game_command(action,payload,idempotency_key), authenticated and
  idempotent, with immutable compensating ledger, RLS and least privilege.
- Server validates rewards, elapsed study time, prices, ownership, collision,
  partner consent/limits and placement versions. XP never decreases on spending.
- Missed prayer is explicit confirmed -100; pending/excused incur no penalty.
- Study +1 per complete verified minute; one +20 bonus at60 minutes per session.
- Negative balances are allowed; insufficient balance blocks purchases.
- Offline financial writes are blocked, not silently queued or credited.
- Demo mode is clearly labeled local-only and cannot be called cloud-backed.
- Local reference server is development/testing only; no real email delivery claim.
- Never commit secrets, service-role keys, passwords, auth tokens or .data.
- No invented tests, cloud deployment, payment, notifications or backup claims.

## Commands / coordination
Root owns package installation, local services, test/build runs, Git and release.
Delegated agents write only assigned modules and tests; no package edits, process
jobs, commits, publishing, or other agents' files. Communicate contract conflicts.
Expected checks: npm run lint; npm run typecheck; npm test; npm run test:e2e;
npm run build. Keep README/.env.example/CHANGELOG/release evidence accurate.
See docs/architecture.md for exact module ownership and RPC contracts.
