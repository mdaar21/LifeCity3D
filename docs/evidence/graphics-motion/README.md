# Graphics and locomotion upgrade — 2026-11-02

Owner requested a substantial visual upgrade, four Arabic quality levels, improved
walking/running/jumping and automatic GitHub Pages publication. This is a frontend
rendering increment over PR15, not a replacement game or a backend release.

## Implemented

- Low / Medium / High / Ultra, plus backwards-compatible device-aware Auto, saved
  in the existing device-only preference. Both Settings and the scene tools use
  the same levels. Explicit choices remain available on mobile.
- Original world-space procedural surface grain and relief for ground, asphalt,
  plaster, stone, wood, fabric and skin. One cached 128×128 mipmapped
  texture supplies noise instead of recomputing many hashes per screen pixel. Paid finish colors/roughness/metalness
  remain sourced from the existing assignments. No downloaded art dependencies.
- Generated HDR sky environment, gradient horizon and sky/sun reflections on glass
  and metal. Day, sunset, night and existing weather stay connected to world time.
- Animated multi-scale ocean normals, Fresnel reflection, sun glints and restrained
  crest foam. Distant wave detail fades to avoid horizon shimmer. Motion pauses
  with menus/hidden pages and respects reduced-motion/photosensitive settings.
- Real shadow-map tier changes, architectural distance detail, foliage and character
  geometry tiers. High adds bounded SSAO; Ultra adds restrained HDR bloom. AO uses
  the actual camera type and updated projection matrices, including orthographic
  map zoom, third/first-person walking and viewport changes.
- Color buffers are capped at 2.6 million pixels; AO runs at reduced resolution.
  Read-only previews cap DPR and omit the costly full-scene effects chain. Existing
  merged architecture and cached procedural geometry remain in use.
- Articulated ankles, continuous walk/run blend, backwards and sideways weight
  shifts, smoother joints and distinct takeoff/descent/landing poses. Soft foot
  contact stays on the authoritative ground while the visual avatar jumps.
- Original bevelled purchased vehicle bodywork, reflective glazing, mirrors and
  handles. These are mesh details on the same owned car, not new items.

## Preservation and limits

No backend, SQL, Auth, dependency or economic changes. Existing purchases, stored
paid cost bases, MAIN/MAD wallets, 16 tasks, home residents, collisions and camera
return rules are preserved. Physical WASD, Left Shift and Space remain unchanged;
jump physics remain transient above the trusted floor pose, with ceiling limits.
No free world assets, balances or floor access are created.

“10× graphics” is an aesthetic goal, not a measured numerical quality multiplier.
Software Chromium review is not a physical-phone FPS benchmark. Ultra intentionally
costs more; players can select a lower level at any time. Reflections are generated
sky/lighting reflections, not full dynamic reflections of every city object.

`art/` contains an explicitly isolated development-only scene fixture using the
real procedural building, car, plant and character components. It never creates
an account or writes to a game save. `/__graphics-art` exists only in Vite serve;
its entry is not imported into the production app.

## Verification

Lint, typecheck,21 focused unit tests across6 files and the GitHub/PWA production
build passed (224 precache entries). Four unique real-browser journeys passed
across focused runs: all catalogs, native run/jump/touch, four quality levels in
both camera modes with local persistence/data preservation, and the complete
camera/navigation regression. See `verification.json`, `browser-runs.txt` and
`quality-browser.json`. The long unrelated full suite was not repeated.

An intermediate grouped camera run exceeded its old total deadline during build
load; it then passed alone with a180-second allowance and every assertion retained.
The native-input case uses960×640 to bound software rendering cost and still tests
390×844 touch. Final art review has8 renders and no runtime/shader console errors.
These are software Chromium checks, not physical-device frame-rate measurements.

## Published

PR16 merged at runtime `dc48d6655ba35ceeb020191fcf7ec2d0d8ccb491`.
GitHub Pages41546029125 succeeded. The actual public guest flow through the
save-preserving update route verified all four rendering profiles, their AO/bloom
flags and pixel budgets, native Space jump/grounded return, Ultra surviving mobile
reload, perspective zoom1 and unchanged MAIN/MAD wallets. Runtime/shader errors0;
no hosted-account writes. See `publication.json` and `public-receipt.json`.

A later documentation-only commit records these receipts; the deployed runtime
is the merge SHA above.
