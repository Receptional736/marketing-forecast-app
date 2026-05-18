# Marketing Forecast App — Developer Handoff Prompt

Copy everything below the line into the start of a new Cowork task.

---

## Prompt to paste:

I'm continuing development on a single-file HTML marketing forecasting app for iGaming client pitches.

### Folder structure
- **`forecast app/`** — all HTML app files (v1–v37). The working file is `marketing-forecast-v37.html`.
- **`Forecast App Developement/`** — context and instructions files (this file and the changelog).

Before you do anything, read these files from the `Forecast App Developement` folder:
1. `CHANGELOG.md` — full version history
2. `DEVELOPER-PROMPT.md` — this file, which contains architecture notes, conventions, and known issues

Then ask me what I'd like to work on in this session.

---

## How I want you to work

### Communication style
- Be concise. Don't recap what you're about to do — just do it.
- Don't explain code back to me unless I ask.
- After completing a change, give a short summary of what changed and why, not a walkthrough of every line.
- When sharing the file, use a link and stop. Don't write paragraphs describing what's in the document I can open myself.

### Clarification
- Ask me questions BEFORE starting work on a new feature. Use the AskUserQuestion tool with concrete options when the approach isn't obvious.
- If a request is ambiguous about which panel or section of the app it refers to, ask. The app has multiple panels that share similar concepts (config panel vs budget phasing panel vs results panel).

### Versioning and changelog
- **Never edit the current version file directly.** Always copy to vN+1 first, update the STORAGE_KEY and ONBOARD_KEY, then make changes in the new file.
- Update `CHANGELOG.md` at the end of each session with everything that was added, changed, fixed, or reverted.
- If I ask you to revert something, revert it cleanly and note it in the changelog under "Reverted".

### Code quality
- After every edit, run a JS syntax check: extract `<script>` blocks and run `node -c` on each.
- The app is a single HTML file (~5250 lines). Use the Edit tool for surgical changes. Don't rewrite large blocks unnecessarily.
- When a string replacement fails (not unique), add more surrounding context rather than guessing.

### Testing
- The browser preview from the VM doesn't work (Chrome can't connect to localhost inside the sandbox). Don't waste time trying to screenshot the app.
- Instead, verify logic programmatically with Node.js test scripts when the change involves maths or data flow.

---

## Architecture

### What the app does
A marketing budget planning tool. The user sets a total annual budget, then allocates it across a hierarchy: **Verticals → Channels → Platforms** using percentage splits. Each platform's annual budget is then distributed across 12 months (the "phasing"), with optional seasonality shapes. The app calculates CPA, ROAS, and LTV-based forecasts.

### File structure
Single HTML file with inline CSS and JS. No build step, no external JS files. Uses Chart.js and SheetJS (xlsx) from CDN.

### Key panels (top to bottom)
1. **KPI bar** — total budget input, currency selector, allocation mode toggle (% / £)
2. **Campaign structure (config panel)** — hierarchy tree with sliders/inputs for percentage or £ allocation, CPC/CPM rates, CTR/CVR, lock toggles, ARPU/lifespan/LTV settings
3. **Seasonality** — shape presets (Flat, Summer Peak, etc.) with category selector and visual preview
4. **Budget phasing** — 12-month grid with draggable bar charts per platform, column/row/cell/vertical locking, rebalance buttons, "Reset Shape" button, over/under badges
5. **Results** — Chart.js visualisations, monthly breakdown table, and KPI Summary table (per-vertical/channel/platform)

### Data model (state variables, ~line 1238)
```
totalBudget          — annual total (number)
allocMode            — 'amt' (default) or 'pct'
verticals[]          — { id, name, pct, arpu, lifespan, ltv:{...}, locked, collapsed }
channels[]           — { id, vertId, name, pct, locked, collapsed }
platforms[]          — { id, channelId, name, pct, model, cpc/cpmRate, ctr, cvr, budgets[12], locked, customShape, cpcRates[12]?, cpmRates[12]?, flatCpcBackup?, flatCpmBackup? }
spreadLocked[12]     — column (month) locks
bpRowLocked          — Set of platform IDs with locked rows
bpCellLocked         — Set of "platId-monthIdx" keys
bpVertLocked         — Set of vertical IDs with locked verticals
phasingMode          — 'abs' or 'pct' (display mode in phasing panel)
seasonSnap5          — round to nearest 5 toggle
nnEnabled            — compact display mode on/off (123k, 1.2M formatting)
startMonth           — 0-based calendar month offset (0=Jan, 6=Jul); rotates shape weights
customShapes[]       — { name, weights[12] } — user-saved shapes in calendar-month order
customCpcShapes[]    — { name, rates[12] } — user-saved CPC/CPM rate shapes in calendar-month order

# Organic forecasting state (v36+)
orgKeywords[]        — { id, keyword, vertical, searchVolume, currentRank }
orgNextId            — auto-incrementing ID for keywords
orgVerticals[]       — { id, name, cvr, arpu, trajectoryShape, trajectoryWeights[12]? }
orgCtrCurve[100]     — CTR% by Google position (1-100), lazy-initialised from defaults
orgAgencyFees[12]    — monthly agency/SEO retainer amounts
```

### Key functions (with line numbers for v21)
| Function | Line | Purpose |
|----------|------|---------|
| `render()` | 3164 | Master render — calls all sub-renders |
| `renderCampaignStructure()` | 1593 | Draws the config panel table |
| `allocCells()` | 1564 | Renders slider+input cells (% mode or £ mode) |
| `amtSliderStep()` | 1553 | Chooses slider step size based on budget scale |
| `setAllocMode()` | 1845 | Switches between % and £ mode |
| `updateVertAmt/ChAmt/PlatAmt()` | 1897-1914 | £→% conversion for amount-mode inputs |
| `applyBudgetsFromHierarchy()` | 1917 | Distributes total budget through hierarchy to platform monthly budgets |
| `distributeWeighted()` | 3274 | Core rounding: distributes annual across 12 months using largest-remainder. Has flat-shape detection. |
| `renderBudgetPhasing()` | 2261 | Draws the phasing grid |
| `buildPlatformHierarchy()` | 2265 | Builds row data for phasing panel |
| `rebalanceBpRow()` | 4759 | Rebalances one platform row to its allocated budget |
| `rebalanceAllSpread()` | 4807 | Rebalances all platforms proportionally to hit total budget |
| `applyShapeToPlatform()` | ~4960 | Applies a seasonality preset (or flat) to a single platform, respecting locks |
| `isPlatLocked()` | 4725 | Consolidates row + vertical lock checks |
| `fmtCompactNum()` | ~1690 | Pure formatter: converts numbers to compact strings (123k, 1.2M) |
| `switchPlatModel()` | ~2443 | Handles flat↔variable model transitions, initialises rate arrays, backs up flat rates |
| `openCpcEditor()` | ~5575 | Opens the CPC/CPM rate editor modal for a platform |
| `closeCpcEditor()` | ~5640 | Closes the modal, optionally applying the draft rates |
| `renderKpiSummary(byPlatform)` | ~3277 | Renders the KPI Summary table from `buildForecast().byPlatform` map; groups by vertical/channel/platform; shows deferred footer when LTV tail is active |
| `rotateWeights()` / `unrotateWeights()` | ~1510 | Shift 12-element calendar-month weights by startMonth offset / inverse |
| `promptSaveCustomShape()` | ~5548 | Save a platform's current distribution as a named custom shape |
| `deleteCustomShape()` | ~5579 | Remove a custom shape from the library |
| `onStartMonthChange()` | ~4225 | Handle start-month dropdown change |
| `getState() / setState()` | 3918/3936 | Serialise/deserialise for localStorage and JSON export |
| `saveToLocalStorage()` | 3696 | Persists state |
| `exportToExcel()` | ~4214 | Builds a 5-sheet .xlsx (overview, monthly breakdown, KPI summary, platform monthly detail, config) and triggers browser download via SheetJS |

### Lock hierarchy (4 levels, checked in this order)
1. **Column lock** — `spreadLocked[monthIdx]` — freezes a month across all platforms
2. **Vertical lock** — `bpVertLocked.has(vertId)` — freezes all platforms in a vertical
3. **Row lock** — `bpRowLocked.has(platId)` — freezes one platform's entire row
4. **Cell lock** — `bpCellLocked.has("platId-monthIdx")` — freezes one cell

`isPlatLocked(platId)` returns true if the platform's row OR its parent vertical is locked.

### Budget flow
```
totalBudget
  → verticals[].pct  (% of total)
    → channels[].pct  (% of vertical)
      → platforms[].pct  (% of channel)
        → platforms[].budgets[12]  (monthly amounts via distributeWeighted)
```

`applyBudgetsFromHierarchy()` drives this flow. It uses `distributeWeighted()` which:
- Detects near-flat shapes (weights within 0.1%) → uses perfect equal division
- Otherwise uses floor + largest-remainder for drift-free distribution
- Accepts a `snap` parameter (currently only used for seasonSnap5)

### Amount-mode sliders
In £ mode, `allocCells()` renders a range slider (0→parentBudget) with smart step sizes via `amtSliderStep()`. The step auto-scales: £5k for £500k+ budgets, £1k for £100k+, etc. The onchange calls `updateVertAmt/ChAmt/PlatAmt` which convert £ to % and delegate to the normal percentage update path.

### Persistence
- `localStorage` with key `mktForecast_v37` — auto-saves on every change
- `localStorage` with key `mktForecast_v37_viewTab` — remembers active view tab (paid/organic/combined)
- JSON export/import buttons in the sidebar
- When creating a new version, always update STORAGE_KEY and ONBOARD_KEY

---

## Known issues and future work

### Known issues
- **Budget snap / "nice numbers"**: Was attempted in v18, reverted due to conflicts between config panel and phasing panel. The amount-mode sliders in v19 partially address this by constraining slider stops to clean increments, but the typed number input still allows arbitrary values. A global snap feature could be revisited — the approach should snap at the `applyBudgetsFromHierarchy` level and use `getSnappedAllocations()` so both panels read from the same source. See v18 changelog for details on what went wrong.
- **Rounding drift on percentage changes**: When the user adjusts a percentage slider repeatedly, the shape-preservation logic in `applyBudgetsFromHierarchy` can accumulate micro-drift. The flat-shape detection in `distributeWeighted` mitigates this for flat distributions, but shaped distributions can still drift slightly over many edits.

### Future work (discussed but not started)
- **Phase 3**: Polish results graphs and charts — the Chart.js visualisations need refinement
- **Phase 4**: Budget phasing further refinement
- The "Reset Shape" button currently only resets to flat. Could be extended to reset to the selected seasonality preset shape.
- Config panel rescale buttons could potentially move to a dedicated column for cleaner layout (was attempted on wrong panel, then reverted — would need to be done on the config panel's alloc column, not the phasing panel)

---

## File inventory

### `forecast app/` (HTML app files)
| File | Purpose |
|------|---------|
| `marketing-forecast-v37.html` | **Current working version** — Vertical config, CTR curve, agency fees (Phase 3) |
| `marketing-forecast-v36.html` | Previous version — Keyword import + vertical detection (Phase 2) |
| `marketing-forecast-v35.html` | Previous version — Paid/Organic/Combined view switcher (Phase 1) |
| `marketing-forecast-v34.html` | Previous version — bullseye rebalance icons |
| `marketing-forecast-v33.html` | Previous version (variable CPC/CPM) |
| `marketing-forecast-v32.html` | Previous version (compact display mode) |
| `marketing-forecast-v31.html` | Previous version (export button moved to header) |
| `marketing-forecast-v30.html` | Previous version (dark theme reskin) |
| `marketing-forecast-v29.html` | Previous version (start-month selector + custom shapes) |
| `marketing-forecast-v28.html` | Previous version (generic month labels) |
| `marketing-forecast-v27.html` | Previous version (tutorial skip-button fix) |
| `marketing-forecast-v26 - frozen for user testing.html` | Frozen for user testing (Excel export) |
| `marketing-forecast-v25.html` | Previous version (dead code cleanup) |
| `marketing-forecast-v24 - user testing.html` | User testing (KPI summary + unfiltered scorecards) |
| `marketing-forecast-v23.html` | Previous version (three-level filter) |
| `marketing-forecast-v22.html` | Previous version (nice numbers module) |
| `marketing-forecast-v21.html` | Previous version (shape picker modal) |
| `marketing-forecast-v20.html` | Previous stable version |
| `marketing-forecast-v19.html` | Version before per-platform shape presets |
| `marketing-forecast-v18.html` | Version before amount sliders |
| `marketing-forecast-v1.html` through `v17.html` | Earlier versions (pre-changelog) |

### `Forecast App Developement/` (context and instructions)
| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Version history with detailed notes |
| `DEVELOPER-PROMPT.md` | This file — architecture, conventions, known issues |
