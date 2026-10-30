# Linked starter reference — preserves the existing application

Owner selected: add the template to the current LifeCity project while preserving
its build. The reference is a Git submodule at
`references/starter-web-app-template`, pinned to
`2454e04ff92ef7d394bd69e7451dd16b67a125ab` from
https://github.com/billynoodle/starter-web-app-template.git.

The inspected reference uses Next15.1.7 App Router, React19, Tailwind3 and Supabase
Auth, including a server cookie callback. LifeCity already has React19/Vite,
Tailwind4, Supabase adapters, server-authoritative game SQL, a separate development
API and static GitHub Pages routing. Its existing build, database, source and
progress are preserved. Next server callbacks are not installed as Pages routes.

## Concrete integration

- The pinned submodule keeps the user-provided source available for review and
  traceable updates without mixing its framework or lockfile into LifeCity.
- The existing GameProvider/GameApi, Auth page, protected routes and auth tests
  provide LifeCity's corresponding authentication flow. Template source is not
  substituted for the current tested account/game architecture.
- A new original validateBuildConfig implementation and `npm run check:config`
  adapt the template's explicit environment setup into the current Vite build.
  The check runs before every production build and validates backend mode,
  repository base, account routing, cloud endpoint and public-key format. It
  rejects service-role/secret credentials in browser configuration and reports
  issue codes without logging values. Format checks do not verify a provider
  connection, key signature, account permission or email delivery.
- Unit tests cover public/demo configurations, accidental private keys, partial
  settings, credential-bearing endpoints and template-variable mapping.
- The optional reference is outside application compilation, lint and test
  inputs. GitHub Actions does not need to fetch it to build LifeCity.

| Reference variable | LifeCity variable |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | VITE_SUPABASE_URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | VITE_SUPABASE_ANON_KEY |

Values are configured through the user's environment, never through this document.
The variable names are mapped intentionally, not silently copied between apps.
Google sign-in stays disabled until implemented/configured and actually verified.

## Reference maintenance

```sh
git submodule update --init --depth 1 references/starter-web-app-template
git submodule status
npm run check:config
```

Review a later upstream commit before changing the pin. Do not run its cloning
scripts inside LifeCity or replace the root package/lockfile. No template package
installation or initialization script was executed during this integration.

No LICENSE/COPYING/NOTICE file was present at the inspected upstream commit.
The Git link preserves attribution and upstream ownership. Third-party source is
not copied into LifeCity's bundle or source ZIP; that ZIP records the reference
URL/pin and may contain an empty submodule directory. LifeCity builds without it.
Any later source redistribution needs an applicable upstream license/permission.
