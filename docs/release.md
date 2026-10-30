# Local release evidence — 0.1.0 preview, 2026-10-30

**Gate: locally verified, external release blocked.** This is working code,
not a production launch claim. Mdaar's repository and published app were not
changed. LifeCity sources and milestones are in a separate local Git repository.

## Executed checks

| Check | Actual outcome | Evidence |
|---|---|---|
| npm install / lockfile | Installed compatible dependencies, committed lockfile | package-lock.json |
| npm run lint | Pass, zero warnings under configured TypeScript and hooks rules | evidence/lint.txt |
| npm run typecheck | Strict app/server/test TypeScript pass | evidence/typecheck.txt |
| npm test | **29 passed**,8 files: domain/localization/hosting paths + real PostgreSQL/auth/RLS/integration/upgrade | evidence/tests.txt |
| npm run test:e2e | **4 passed**, actual Chromium browser journeys | evidence/e2e.txt |
| npm run build | Pass, production app + generated service worker/manifest | evidence/build.txt |
| npm audit --omit=dev | Zero reported production advisories at check time | evidence/npm-audit.json |
| WCAG2 A/AA automated scan | **20 states, zero detected violations**, ten key screens in both themes | evidence/accessibility.json |
| Responsive/native UI | **20 viewport/route combinations, zero horizontal overflow or page exceptions**; ten English LTR screens; offline notice | evidence/ui-review.json |
| Compiled PWA | Active SW; genuine192/512/maskable PNG icons; offline reload preserved40 coins; writes blocked; reconnect did not add rewards | evidence/pwa.json |
| npm run build:github | Pass; `/LifeCity3D/` assets, manifest, security policy and404 fallback prepared | evidence/github-pages-build.json |
| npm run verify:github | Pass; local simulation verifies cold links, icons/fonts, pricing, CSP and compiled offline state | evidence/github-pages-browser.json; evidence/github-pages-verify.txt |

The build emits an advisory about the approximately915KB minified Three chunk
(approximately251KB gzip); route and vendor bundles are separated. Shared React
entry points no longer force this engine download on a cold login page; that
network assertion is checked in the compiled browser verification. It is not a
build failure and has not been represented as zero build warnings. ESLint uses
rules-of-hooks/exhaustive-deps; React Compiler is not enabled.

## Tested behavior and boundaries

SQL tests exercise1/minute study credits and one20 bonus at60min, pause/recovery
idle cap, explicit prayer−100 and corrections, negative debt, idempotency and
concurrent requests, protected prices, collision/version checks, furniture
recovery, scopes/daily caps/revocation for Yuyi, immutable ledger, account
isolation/RLS, hashed HttpOnly sessions/CSRF, export/deletion and persisted DB
reopening. Scheduling tests cover daily/weekly/once, edited-history limits and
valid avatar presets. Forward-upgrade test preserves wallet, ledger, inventory
and exact placement while upgrading an early schema, without resetting data.

Browser1 buys a house, places it at(4,6),rotation90, and Browser2 signs into the
same **local reference server** and recovers identical data. Refreshes preserve
balance1200 after test-only fixture funding2000 and an800 purchase. A separate
account cannot place the other account's item or see its private city. The signup browser test preserves the language selected before registration. Guest
preview tests complete tasks, buy/place a tree, retain English and state after
refresh and prevent offline balance changes.

This is not a test of a hosted Supabase project, real phone hardware or a literal
PC shutdown. SQL timer fixtures adjust privileged timestamps instead of claiming
a human really studied for60minutes. Test funding is not an application API.

## Real3D / performance evidence

Original Three geometry, not a static picture. Renderer metrics were sampled
only on completed R3F render frames during bounded pointer interaction. The
JSON report includes calls, triangles, buffer size, DPR and frame counters from
software WebGL2 Chromium in this cloud environment. Frame gaps can include idle
demand-render time, and scripted input/CDP overhead is present. **No guarantee
of30–60FPS on a phone** and no claim of a real-device performance certification.
Inspect `evidence/ui/` for actual app screenshots. Advanced NPCs/seasons/weather
and multiple room layouts remain optional later features.

## External blockers — do not invent a URL

1. GitHub `createRepository` was denied by this connection:
   `Resource not accessible by integration`. The selected new repository has
   not been created or pushed. Local Git history and portable source artifacts
   are preserved. The actual create error is in evidence/github-create.txt.
   No other repository was modified as a substitute.
2. GitHub-only publication is the current owner policy. Pages workflow and the
   compiled artifact are verified locally, not remotely deployed. Earlier Netlify
   provisioning/upload failure is retained only as historical evidence in
   evidence/deployment-netlify-history.json; that address has no published app.
3. No Supabase project URL/public key or management credentials are configured.
   All surrounding auth/RPC/save code, migration/seed and setup steps exist;
   hosted multi-device persistence/email delivery remain unverified and inactive.

Google OAuth, push and real-money payments are not enabled. Provider backups,
load/restore drills, commercial legal/contact/trademark review and production
monitoring must be configured before accepting paying users. See deployment.md,
SECURITY.md and the clearly labeled public policy drafts.

## Source review and next step

Continue from this repository; do not re-scaffold or wipe data. Run the checked
commands after substantive changes. New schema upgrades must be forward
migrations. After GitHub access is granted, push this preserved main branch;
after GitHub Pages and Supabase setup exist, deploy and run the
hosted acceptance test before changing this gate to deployed/production-ready.
