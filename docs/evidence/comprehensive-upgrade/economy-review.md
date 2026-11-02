# Future-price and progression review

Generated audit: [101 actual products, reward scenarios and construction components](economy-audit.json). Source: disposable migrated PostgreSQL task catalog and shared canonical quote engine; no production users or money were touched. Regenerate with `node --import tsx scripts/audit-economy.ts`.

| Activity scenario | Daily gross SAR | Seven days including specified milestones | 30 days including one earned streak |
|---|---:|---:|---:|
| Low | 145 | 1015 | 4850 |
| Medium | 460 | 3470 | 15371.43 |
| High | 750 | 5650 | 24714.29 |

These are explicit activity budgets, not guaranteed income. The JSON records every activity assumption. Prayer/study events count toward the existing five-distinct-task challenge. Weekly plans must be committed and completed; the medium scenario does not meet the1200-minute study milestone. Custom rewards, partner/manual grants and passive income are excluded. Missed prayers reduce the budget. Daily/load/weekly limits, eligibility, corrections and replay protection remain unchanged.

| Purchase | New complete SAR | Medium saving-only days |
|---|---:|---:|
| Agave | 18 | 0.04 |
| Small house | 800 | 1.7 |
| Chair / table / sofa | 120 / 300 / 550 | 0.3 / 0.7 / 1.2 |
| Cedar / Dune / Atlas | 3200 / 5200 / 8500 | 7.0 / 11.3 / 18.5 |
| Villa | 6800 | 14.8 |
|38-floor152m Crystal tower with lifts | 27600 | 60.0 |
|250-floor1000m Crystal tower with lifts |154800 |336.5 |

Small-house800 is the owner's retained minimum. Road tiles10 and continuous road3/m/lane remain reachable on the first day; large road networks consume multiple days. Shorter furniture saving goals reflect shared household purchases; furnished homes require several products. Other construction families remain different: school6500, mall14000, hotel18000, resort40000. Land and customization remain separate quotes. New Crystal floors cost600 SAR each, including lift access, rather than starting at1000m. Other forms have their own different tariffs.

The old100-XP quadratic curve would postpone level40 to152100 XP. New25-XP intervals preserve every stored XP point, never reduce a previous level, cap at40 and require38025 XP for40 (roughly74 medium-activity days including specified milestones). Opening a product awards no cash or object. Category schedules remain independent of price; Orbit tower opens earlier than the cheaper Crystal tower.

Only future catalog prices change. Existing JSONB construction contracts, stored additional-floor tariffs, saving-project targets, MAIN/MAD balances, historical payment components and immutable ledgers are not rewritten. Verified tests retain an old87600 tower contract and1800 floor tariff, and an old2500 villa basis/1250 refund after future-price changes. MAIN/MAD and dated FX remain separate.
