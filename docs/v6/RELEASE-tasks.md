# Exact16-task release — 2026-10-31

The twelve regular tasks and four automatic milestones are implemented on top of
the existing game. The20 expansion features remain pending and are explicitly
paused by the owner's latest instruction to publish the completed work first.
Auth configuration/email activation also remains deferred; do not request it now.

## Behavior and preservation

- Server-versioned exact16-row catalog; original chores, gym, prayers, study and
  controlled custom tasks retain their own amounts and history. New awards affect
  MAIN only; Yuyi MAD remains separate. No retrospective rewards are seeded.
- Honest confirmation for external activities. Walk/social challenges accept
  explicitly self-reported completed minutes; no phone monitoring is claimed.
- Unique daily/weekly/load claims and atomic command receipts prevent retries or
  different devices from minting duplicates. Default3 compensated laundry loads
  per day; a privileged rule change creates an immutable audit record.
- Sleep accepts7–16 elapsed hours, requires the current waking date and rejects
  overlaps/future intervals. Wake targets lock before the applicable day, with
  exactly10 minutes grace. Manual reports are not independent verification.
- Five DISTINCT whitelisted base tasks yield30 once/day; repeated laundry,
  uncontrolled custom tasks, purchases, grants and bonuses cannot inflate it.
- Verified study seconds split at server-calculated local midnight/week boundaries.
  The weekly1200-minute goal awards150 once; session bonuses add no study time.
- Weekly plans snapshot at least3 different unmet eligible goals. Existing
  accomplishments cannot retroactively fill the plan; completion awards200 once.
- Real qualifying days, not logins, earn500 at30/60/90 etc. Gaps reset the current
  streak without revoking past awards; a new distinct30-day streak can qualify.
- Task calendars default to Asia/Riyadh and Sunday weeks. Profile timezone edits
  cannot reinterpret claims. Explicit future calendar changes use a disclosed
  >=24h safety pause after week-end; old period identities remain immutable.
- RTL/LTR grouped cards, selected-currency rewards, receipt/FX provenance, reset
  times, wake targets, weekly checklist and daily/streak dashboard are functional.
  Guest simulation is explicitly local-only; authenticated authority stays in SQL.

## Actual checks

`npm run lint`, `npm run typecheck`, `npm test`:69 passed in16 files, including
12 task-engine cases and populated legacy preservation. Monetary tests include
stored historical display FX, MAIN/MAD isolation, two-device/idempotency races,
3-load limits,19/20 and59/60-minute thresholds,6/7-hour sleep, wake grace, Sunday
crossover,0/2/3 goals,29/30/60 days and a distinct new streak after a gap.

Three focused browser cases passed: mobile plan/settlement/independent-browser
restore; local guest confirmation/laundry/five-distinct persistence; and the
existing9-state game HUD desktop/mobile RTL/LTR/dark accessibility regression.
No detected WCAG violations in checked task screens. These are local browser
checks, not a hosted public-email acceptance claim. The full browser suite also
runs in GitHub CI before publication.

`npm run build:github` and `npm run verify:github` pass, including compiled base
paths, deep-link fallback and guest offline PWA with financial writes blocked.
[Evidence](../evidence/approved-tasks-release.json),
[test summary](../evidence/approved-tasks-tests.txt),
[task accessibility](../evidence/approved-tasks-accessibility.json).

## Supabase and rollout

Applied additive migration20261031000407_approved_tasks_engine after local tests
and rechecking the existing hosted schema. Catalog count16, all11 task tables
RLS-protected, no direct authenticated writes, private reconciliation inaccessible,
and the existing authenticated game_command remains the entry point. Hosted
profiles/main ledger/MAD ledger remained0; no data or arbitrary reward backfill.
Prior function definitions/counts are retained privately under ignored work/v6.

Security advisories retain the intentionally callable game_state/game_command and
capability-limited city_visit boundaries. task_rule_audit intentionally has no
client policy, like existing private FX/deletion audit tables. See the
[database-linter explanation](https://supabase.com/docs/guides/database/database-linter).

No Auth settings, public signup, email delivery or recovery were changed/tested
in this phase. Public client activation staysfalse. Publication is the owner-
authorized guest-capable increment; this is not a complete V6 release.
