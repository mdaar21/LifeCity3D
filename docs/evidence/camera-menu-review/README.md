# Camera return regression and full interface review

The owner reported an extreme zoom-in after returning from Missions or another
menu, followed by ineffective zoom-out. They also requested a repeated review of
the entire interface and all menus.

Reproduced the original bug in an actual browser: follow-camera zoom1 became
16.810344827586206 after Missions; projection[0] jumped from4.4370678 to74.5886398.
`WorldRealms` derived camera mode from both the avatar and route activity. Opening
a menu mounted an orthographic map camera while the walking perspective camera
was still mounted. Map setup then wrote its zoom into the walking camera.

Camera selection now follows avatar mode independently of menu visibility. Route
activity only pauses input/simulation. Inactive map controls are disabled; walking
keeps its perspective zoom1 and user-selected follow distance. Remounting after
Home interior restores the current heading and distance. The same reproduction
now reports zoom1 and an identical projection before, during and after Missions.

Interface changes:

- More has three labeled groups: Your city, Your progress, Your account. Each
  secondary destination appears once as an icon/title/description row; Shop
  categories stay inside Shop. Every existing route/tool remains reachable.
- Shop combines purchase-city selection and inventory access, removes its generic
  banner, keeps one category row and puts future collection previews behind a
  disclosure. Short landscape places navigation and purchase-city controls on one
  row so products are reached sooner.
- Save/guest status has reserved space above panels. All scrollable panels end
  above the dock. More stays selected for secondary pages. Notices share the game
  palette with separate semantic error/warning/success colors.
- Fixed inherited grid-column rules that created an implicit narrow column for
  daily-progress numbers. Daily prayers/challenge stay visible; weekly/streak
  details are optional. Reward rules remain available in their disclosure.
- Dashboard heading and English focus-sidebar wrapping corrected; tools and all
  route pages reviewed in phone portrait, short landscape and desktop layouts.

Validation: the new real-browser regression passes repeated returns through all10
route pages, three More open/close cycles, City tools, custom orbit and distance,
wheel zoom-out, native two-finger zoom-out and orientation change. Both wallets
stay unchanged. Lint, TypeScript and GitHub production/PWA build pass. Repeated
rendered audits cover route tops/ends and11 studio tabs at320/390/844/1440 widths,
plus English narrow/landscape views. See audit.json, en/audit.json and screenshots.
These are software-rendered Chromium viewport checks, not physical iOS testing.
The unrelated full suite was not repeated; existing journeys were updated for
the new navigation. No backend, Auth, database, reward or paid-asset changes.
