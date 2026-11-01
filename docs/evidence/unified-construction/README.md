# One menu system, honest full construction prices and distinct architecture

Unpublished on codex/stylized-visual-overhaul. No live Supabase/account writes,
schema changes or new dependencies. The future release must deploy the compatible
world-command engine before the frontend. Existing hosted v3 is untouched.

Shared headers, close controls, tabs and safe panel bounds replace inconsistent
catalog/tool chrome. More/route navigation closes prior tools and free previews;
only one active panel is visible. Construction, nature, furniture, roads, vehicles
and owned inventory stay in their own sections. Global save status replaces the
duplicate saved toast. Confirmations no longer stack over Details.

The13-type catalog displays full basic construction costs and first deposits.
Canonical one-floor Moss prices: house800, garage1200, villa2200, restaurant2800,
clinic4200, school6500, office8000, museum10000, mall14000, hotel18000,
hospital24000, university32000, resort40000. Floors/area/contractor/lifts adjust
cost. Land/furniture/custom finishes are separate purchases. Frozen server-created
v2 contracts use cent allocation; all paid stages sum exactly to the advertised
price. MAD displays sum per-component FX rounding. Client-supplied prices ignored.
Buildings already in saves omit pricing and continue on original rates. Paid
components are never repriced and demolition refunds exactly50% of paid history.

Original gables, double roofs, clock tower, colonnades, dome, storefront awnings,
garage shutters, medical marks, balcony rails, resort pergola and office crown
run in the actual paid-stage renderer. No extra free/functional assets are added.
All13 cached thumbnails were regenerated from those models. Two merged identity
batches per building; unit-tested finite geometry and triangle/envelope budgets.

Local proof: new mobile journey built an actual6500 school and2800 restaurant,
refunded3250 for the school while retaining land/cost bases, checked separate MAD
and unchanged tasks, and restored saved entities/components. English and Arabic
RTL320px/Axe checks, first-card price visibility and tutorial navigation passed
in28.4s on the final source. Existing advanced construction/cloud-shaped reference
restoration passed30.1s; focused financial/geometry checks passed. Full
regression/production build results are added to verification.json after CI.
