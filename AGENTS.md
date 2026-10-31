# LifeCity 3D / لايف سيتي

This is a separate application and repository. Never modify Mdaar21 while working
here. Read docs/HANDOFF.md for current deployment/account status, then
docs/architecture.md and src/lib/types.ts before implementing a module.
Owner's latest publication policy: **GitHub only**. Do not deploy to Netlify or
another host. Keep the existing compatibility files as history, not active
publication instructions. Never make a private repository public without consent.
The linked starter under references/ is review-only, pinned and optional. Preserve
the React/Vite application; do not execute that starter's cloning scripts or adopt
its package/lockfile. See docs/starter-template-integration.md before changing it.
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
- Owner cancelled automatic city population (addition3): do not add autonomous
  residents, moving cars or auto-placed buildings. All owned objects are placed
  manually. First-city guide and project art are illustrations outside the world.
- Projects reserve coins through the ledger; cancel refunds exactly once and
  completion grants one inventory item, never automatic placement or early XP.
- Public visits use city_visit's exterior-only allowlist. Never serialize a full
  GameSnapshot, private profile/interiors or visitor identities into a shared view.

## Commands / coordination
Root owns package installation, local services, test/build runs, Git and release.
Delegated agents write only assigned modules and tests; no package edits, process
jobs, commits, publishing, or other agents' files. Communicate contract conflicts.
Expected checks: npm run lint; npm run typecheck; npm test; npm run test:e2e;
npm run build. Keep README/.env.example/CHANGELOG/release evidence accurate.
See docs/architecture.md for exact module ownership and RPC contracts.

## Owner-approved Ultimate V6 continuation
Read docs/specs/LifeCity-Ultimate-V6.txt and docs/v6/AUDIT.md. All20 expansions
are approved, executed in tested slices. Do not claim preserved V5 systems exist
unless their code and tests are present. New V6 resident/driving features are
approved despite the older cancellation above; no free assets in either plot.
New Yuyi grants/debits belong ONLY to a separate exact MAD wallet. Never rewrite
legacy main-wallet history. Genuine dated FX and50% verified paid-cost demolition
are mandatory. Use additive migrations, exact DB money and truthful status.

## Latest owner sequence
Implement the exact16 tasks FIRST, then all20 expansions, before returning to
Auth configuration. Auth URL/email work is explicitly deferred until the owner
asks after feature implementation; do not ask about Auth during these stages.
Continue existing branches and test each stage; no completion claim for pending work.

## Latest publication steering
The owner has now PAUSED expansion work and explicitly requested publication of
the completed foundation +16 tasks. Publish this tested increment on GitHub Pages,
keep Auth deferred/client enabled=false, and wait for a later continuation request
before implementing expansions. Do not continue new feature work during publication.

Publication is now COMPLETE: PR2 merged at e6adb873, Pages41148905443 succeeded,
and the real public16-task guest flow passed. All20 expansions and Auth remain
paused; wait for a new user instruction. See docs/evidence/live-tasks-publication.json.

## Latest owner continuation — supersedes the publication pause
The owner reports seeing only three old tasks, then explicitly resumed the ENTIRE
master prompt and all20 expansions. Fix stale PWA update delivery/discoverability
first without deleting guest saves, then continue all remaining approved systems.
The paused-scope paragraphs above are historical. Do not claim20-feature completion
until real operations and tests exist. Keep Auth as the later feature stage.

## Latest owner — activate account login
The owner explicitly requested activating login on the live website. This
authorizes the narrow Auth release from main; visual/paid-content work stays on
codex/stylized-visual-overhaul and is not included in that publication.
Supabase public client enabled=true. Hosted password login/cloud persistence and
allowed confirmation/recovery destinations were verified; actual email delivery
has not been proved. Preserve email confirmation and separate guest saves.
