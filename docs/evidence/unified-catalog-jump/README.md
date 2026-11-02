# Unified product lists and articulated movement

Owner clarified that products were still split into separate ready-made/staged
catalogs, gallery layouts and building-family blocks. They requested consistent
lists across menus plus better locomotion, Left Shift running and Space jumping
in place or while moving forward/back/left/right.

Implemented:

- One actual product grid per Shop category. Legacy and modern products contribute
  cards directly to that grid; no separate showcase/sidebar or family sections.
- Shared ProductCard component for ready-made buildings, staged construction,
  furniture, road assets/services, vehicles, vegetation, farming and water/coast.
  Prices, unlock gates, purchase commands and ready-made/staged distinctions stay
  intact. Construction styles/floors remain optional settings; projects are retained.
- Large 3D inspection appears only on request. Every card uses the same image,
  access label, title, price, usage caption, dimensions and action structure.
- The advanced garden leads to the same Shop for purchases and retains owned-plant
  care, paid irrigation/harvest/sale/relocation and historical receipt operations.
  Inventory thumbnails share the catalog spacing and image proportions.
- Physical Left Shift runs; Space requests a single jump per press. Horizontal
  camera-relative WASD/diagonals remain active during flight. The render loop uses
  a ballistic arc (6m/s impulse,18m/s² gravity), exact grounded landing, ceiling
  clearance indoors and no double jump from holding/repeating Space.
- Jump offset is transient presentation above the authoritative ground/floor pose;
  it never changes paid floors or bypasses ground collision/ownership validation.
  No server movement-speed limit, backend, schema or wallet rule changed.
- Articulated walk/back/strafe/run cycles follow actual speed, with knee/elbow
  motion, torso lean, flight posture, landing compression and time-based turning.
  Other-realm avatars do not inherit the active character's jump animation.
- Touch jump is available beside movement help, clear of the left joystick/dock.
  Editing a field or opening a modal prevents gameplay keys from triggering jumps.

Validation:4 movement/physics unit tests; targeted browser proof for all6 unified
categories, native keyboard jump in place/all4 directions/running and touch jump,
and the previous camera navigation regression. Paid horticulture purchase/cancel,
harvest/sale, exact wallets/costs and independent browser restoration also passed
on disposable reference accounts. No real cloud-account writes. All four unique
browser cases were verified across focused runs, not an unrelated full-suite run.

Rendered catalog review:24 Arabic samples at320/390/844-landscape/1440,12 English
samples at390/844, one grid in every sample, matching card structure, no duplicate
family/sidebar sections, document overflow, dock overlap or clipped actions, and
no console errors. See review.json, en/review.json and financial/horticulture.json.
These are software WebGL browser viewports, not physical-device FPS measurements.
