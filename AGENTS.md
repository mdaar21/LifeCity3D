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

## Latest owner — visual batches supersede the brief publication request
Implement the uploaded visual design book in two batches. Current task is BATCH1:
stages1–3 (HUD/city, asset families/roads/nature/coast, paid construction/interiors).
No publishing. Prior Pages run finished before cancellation; do not roll it back.
Read docs/PROJECT_CONTEXT.md and only relevant sources. Preserve all features,
financial authority, existing data and applied migrations. No new dependencies or
backend changes for visual work. Keep reports short; never claim all V6 complete.

## Current checkpoint
Owner requested completion of BATCH2. All six VISUAL stages are now implemented;
checks/evidence are in docs/evidence/visual-batch2. Publication remains prohibited.
Continue on the same branch. Full V6 expansion acceptance/Auth are separate and
must not be called complete because the visual upgrade passed.

## Latest owner — missing paid content
Visual BATCH1/BATCH2 are complete. Do not redo them. Current group implements
vegetation and agriculture with server pricing, atomic quotes, receipts, real
growth/paid operations and preserved50% historical refunds. Reuse existing JSONB
world storage; no new migration needed for optional decoration metadata.
Next groups are complete paid recoloring and paid road/light/architecture variants.
Do not deploy, publish or merge without explicit owner permission.

## Latest owner — activate account login
The owner explicitly requested activating login on the live website. This
authorizes the narrow Auth release from main; visual/paid-content work stays on
codex/stylized-visual-overhaul and is not included in that publication.
Supabase public client enabled=true. Hosted password login/cloud persistence and
allowed confirmation/recovery destinations were verified; actual email delivery
has not been proved. Preserve email confirmation and separate guest saves.

## Latest owner — publish the completed batches
The owner explicitly approved publication. PR6/main a9b4799 and Pages41231861062
succeeded. Both visual batches and paid vegetation/agriculture are now live;
world-command v2 is compatible.116 tests and20 browser cases passed, followed by
real public catalog/farm verification. Evidence: docs/evidence/content-publication.
Earlier no-publication notes are historical for this released increment. Future
paid recoloring and additional variants remain unfinished. Preserve all saves.

## Latest owner — Stage A touch interaction (unpublished)
Continue codex/stylized-visual-overhaul. Beginner touch tools are now the default;
advanced numeric/studio tools remain selectable on the device. Preserve existing
visual batches/content. No merge, deployment or publication is authorized.
New road_draw and measured foundation rotation use the shared trusted engine;
keep canonical pricing, receipts, independent MAD and historical50% cost bases.
No migration/dependency change. Test-only funded accounts stay under tests/.
See docs/evidence/stage-a/README.md for verification and release dependencies.
Verification:124 tests/26 files passed.28 unique browser cases verified across
full CI41246740296 and corrected focused CI41247729824; latter CI is green.
Compiled repository paths/PWA/offline reserve/refund also passed locally.

## Latest owner — publish Stage A: complete
Owner explicitly approved publishing this increment. PR7/main e92d4a46 and
Pages41252010125 succeeded:124 tests and28 browser journeys. world-command v3
was deployed first; actual hosted finance and public mobile touch/cloud restore
passed. Diagnostic sessions/account/data were removed and verified absent.
See docs/evidence/stage-a-publication. No schema/data resets. Earlier no-publication
statements are historical for this release. Future paid recoloring/variants remain.

## Current owner — modern, advanced gameplay (unpublished)
The owner clarified that the GAME should feel modern and sophisticated. Continue
codex/stylized-visual-overhaul, preserving the released visual batches/Stage A.
Current group: richer batched paid architectural detail, in-world material fitting,
floor inspection and readable night scenes. Reuse existing material_apply pricing,
atomic receipts, quality costs and historical50% salvage; no new free objects.
No schema/dependency/backend deployment changes. This group is not published.
Full-object recoloring and the remaining expansion packs remain separate work.
Verified: CI41266983389 passed124 tests and29 browser journeys, including the
new rendered fitting/quality/salvage/RTL flow; lint/typecheck/build passed.
No publication. Keep hosted Stage A unchanged until another release request.

## Current owner — rebuild the interface (unpublished)
Owner now explicitly requests a new modern, simpler game interface and a picture
for every purchase. Rebuild UI over existing gameplay; do not restart/reset data.
Five-destination chrome, unified visual catalog and pan-first beginner controls.
Reuse procedural renders, all paid commands and optional advanced capabilities.
No new dependency, schema changes, merge or publication for this request.
See docs/PROJECT_CONTEXT.md and docs/evidence/modern-interface for this group.

Interface verification: CI41271576846 green on a98dec1,124 tests plus corrected
touch journeys; all31 unique browser cases verified across full and focused runs.
Evidence: docs/evidence/modern-interface/verification.json. No publication.


## Current owner — simpler gameplay and owned-asset art integration
The interface/architecture group above WAS published by explicit owner request:
PR8/main0779951, successful Pages41272583338;124 tests and31 browser journeys.
Earlier no-publication notes apply historically to that released increment.
New owner request integrates the original art study into the EXISTING game with
much simpler menus. Preserve all16 tasks, MAIN/MAD separation, trusted purchase
quotes/receipts, historical50% refunds, saves and manual paid placement. No free
illustrated neighborhood, new dependency, backend/schema/data reset or deployment.
Current group: simpler beginner controls, real task shortcut, floor-count preview,
quick stage confirmation, all-paid-floor inspection and richer cached owned assets.
Continue the same feature branch. This group is NOT authorized for merge/publication.
See docs/PROJECT_CONTEXT.md and docs/evidence/oasis-play for current verification.
