# Scene-first mobile interface

Owner source: [full request](../../specs/LifeCity-Mobile-HUD-2026-11-02.md).

Implemented the fifteen requested interface groups in the existing game:

- Removed the pictured central walking/view bar, floating shop, inventory and
  missions buttons, permanent population panel and camera instruction text.
- One edge button switches walking/city view. Physical WASD key codes work with
  an Arabic keyboard; arrows, Shift, right-drag camera and vehicle control remain.
  Walking slides along clear obstacle edges rather than stopping both axes.
- Inventory opens from Shop; placement, interiors, furniture and owned buildings
  retain their commands. City tools, visits, guide and population remain available
  through More / City information. No free items, prices or financial changes.
- Compact account/wallet HUD, a single city selector, shared player-XP account/city
  level, temporary save status, optional help and contextual interactions.
- Responsive five-destination dock, dedicated short-landscape arrangement,
  bottom-left joystick with safe-area offsets and rotation/blur input reset.
- Shared viewport insets for scrollable windows/sheets/modals; Arabic prayer and
  task actions have their own layout space. Removed the old57px prayer-button
  margin that displaced buttons outside their cards. Success messages expire.
- Consume inventory deep links after opening, so closing and reloading does not
  reopen the inventory over the city. Stored purchases and city XP stay intact;
  the separate shop eligibility number is explicitly named Collection level.

Validation: ESLint, TypeScript and GitHub production build passed. Targeted actual
Chromium review covers320/390/844-landscape/1440 widths, Arabic physical W/A/S/D,
native touch joystick movement, a self-reported task and prayer, disappearing
reward message, level2 matching on both HUD displays and after reload, independent
MAIN50/MAD0 guest balances, inventory navigation and relocated city information.
No console errors or document overflow; prayer buttons fit their cards. See
review.json and captured PNGs. These are software-rendered browser viewports,
not a claim of physical iPhone/Safari or cloud-account acceptance testing.

Existing browser journeys were updated for inventory-in-Shop and tools-in-More.
The long full suite was not repeated; the owner previously requested avoiding
further long test repetition. This release changes no backend, schema, Auth,
ledger, purchases, paid-cost bases, FX or rewards. Production world-command v6
is retained. Automatic main/Pages publication is explicitly requested.

Published: PR13 merged at379371d96df73273a52171a1f88b04573fa36a41;
Pages41427669708 succeeded. Public delivery receipt records the real newly served
UI in an independent guest browser, without cloud-account writes.
