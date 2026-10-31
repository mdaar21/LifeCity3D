# Cached-release delivery repair — 2026-10-31

The owner reported seeing only3 old tasks. A fresh real public browser confirmed
the published16-row catalog, but this does not prove that an existing PWA client
updated. The old build used Workbox prompt mode without a prompt UI.

An actual e32bf7e production build reproduced the problem: after serving the new
build, the existing controlled client still showed3 old cards and0 approved cards,
with a new service worker waiting. No mock worker or mocked browser storage.

Changes: a same-app /api/update.html recovery page bypasses the old navigation
fallback, installs/activates the latest worker and opens Tasks. It never clears
IndexedDB, localStorage or caches, and never updates another app's registration.
Future updates expose an in-game prompt, pause an active focus session before
reloading, and wait while saving. New approved tasks appear FIRST in Missions;
the dock and menu identify the16-task release. Original/custom tasks remain.

Checks: lint/typecheck/build pass; compiled Pages/PWA checks pass; the9-state
HUD accessibility case passes. npm run verify:pwa-upgrade passes with real older
and newer compiled builds: saved wallet, inventory, placements and ledger remain
identical;16 catalog rows/12 regular cards appear with0 retrospective claims.
A subsequent real worker update shows the prompt and pauses the same study
session before reload. Evidence: ../evidence/pwa-upgrade.json.

Reproduce from a clean project with installed locked dependencies:

```sh
mkdir -p work/pwa-old-source
git archive e32bf7e | tar -x -C work/pwa-old-source
ln -s "$PWD/node_modules" work/pwa-old-source/node_modules
(cd work/pwa-old-source && npm run build:github)
npm run build:github
npm run verify:pwa-upgrade
```

Latest owner instruction resumes the WHOLE master prompt and all20 expansions.
This repair is the first step; it does not claim any expansion implemented. Auth
remains a later stage while the requested game systems are built.
