# Marketing Forecast App — Changelog

## v37
**Focus:** Organic forecasting — Phase 3: Vertical configuration, CTR curve, agency fees

### Added
- **Vertical Configuration panel** — per-vertical table with editable CVR %, ARPU, and trajectory shape button. Appears automatically after keyword import.
- **Rank Trajectory Shape modal** — opens per-vertical. Contains 4 preset cards (Linear, S-Curve, Back-loaded, Front-loaded) with mini canvas previews, plus a drawable bar chart for custom shapes. Drawing uses DAW velocity-painting interaction: click, hold, and sweep horizontally to paint bar heights.
- **`drawBarEngine()` — reusable drawable bar component** used by both the CTR curve and trajectory modal. Supports mouse and touch. Click+hold+sweep paints bars to cursor Y position as you move across. Shows all value labels while drawing.
- **CTR Curve panel** — 100-bar drawable chart (positions 1–100) showing click-through rate by Google ranking position. Ships with industry-average defaults (28.5% at #1, declining to 0.1% at #100). Users can paint custom curves. Reset button restores defaults.
- **`orgDefaultCtrCurve()` function** — generates the default 100-position CTR curve with smooth interpolation between key positions.
- **Agency Fee panel** — 12 monthly input boxes for SEO agency retainer costs. Quick-fill helpers: "Set all to £X" and split mode ("Months 1–N at £X, rest at £Y").
- **`ORG_TRAJECTORY_PRESETS` constant** — 4 trajectory shapes, each defining 12 monotonically increasing progress weights from 0→1: Linear (even spacing), S-Curve (slow-fast-slow), Back-loaded (slow then accelerate), Front-loaded (fast then taper).
- **Organic state additions** — `orgCtrCurve[100]`, `orgAgencyFees[12]`, plus `trajectoryWeights[12]` on each vertical object. All wired into `getState()`/`setState()` and localStorage.
- **Re-import preserves vertical config** — when keywords are re-imported, existing verticals keep their CVR, ARPU, and trajectory settings if the vertical name matches.

### Changed
- **`orgRenderImportState()` patched** — now also renders vertical config, CTR bars, and fee grid. All Phase 3 panels show/hide based on whether keywords have been imported.

---

## v36
**Focus:** Organic forecasting — Phase 2: Keyword import and vertical detection

### Added
- **Keyword import panel** in the Organic tab — textarea paste (CSV) or file upload (.csv / .xlsx). Drag-and-drop also supported on the import zone.
- **Column auto-detection** (`orgDetectColumns()`) — case-insensitive, forgiving header matching. Accepts variants like "Keywords", "Volume", "MSV", "Position", "Pos", "Rank", "Ranking", "Verticals", "Niche", "Category", etc.
- **CSV parser** (`orgCsvToRows()`) — handles quoted fields containing commas.
- **XLSX parser** — reads first sheet of uploaded .xlsx files using the existing SheetJS library.
- **Row validation** — skips blank rows, rejects invalid search volumes (non-numeric / negative) and invalid ranks (< 1), caps rank at 100. Shows error count in toast.
- **Preview table** (`#orgPreviewPanel`) — shows all imported keywords grouped by vertical, with vertical badge pills. Scrollable with sticky header.
- **Organic sidebar** — mirrors the paid view layout. Shows keyword count, vertical count, total monthly search volume, and per-vertical breakdown cards.
- **Organic state variables** — `orgKeywords[]`, `orgNextId`, `orgVerticals[]` added to state. Each keyword: `{ id, keyword, vertical, searchVolume, currentRank }`. Each vertical: `{ id, name, cvr, arpu, trajectoryShape }` with defaults (2% CVR, £50 ARPU, linear).
- **State persistence** — organic state wired into `getState()`/`setState()` and auto-saved to localStorage. Survives page reload and JSON export/import.
- **Clear keywords** button — clears organic data only, with confirmation prompt.
- **Drag & drop** on the import zone — highlights on dragover, parses dropped .csv/.xlsx files.

### Changed
- **`render()` function** — now calls `orgRenderImportState()` to keep organic sidebar/preview in sync.

---

## v35
**Focus:** Organic forecasting — Phase 1: Navigation and skeleton

### Added
- **Top-level view switcher** — three pill-style toggle buttons (Paid / Organic / Combined) in the header bar, between the start-month selector and Save/Load buttons. Cyan active state matches the app's accent colour.
- **`switchView()` function** — toggles visibility of three view containers (`#viewPaid`, `#viewOrganic`, `#viewCombined`). Active view persisted to localStorage via `VIEWTAB_KEY` and restored on load.
- **Paid view container** (`#viewPaid`) — wraps the entire existing sidebar + app-main content. No changes to any paid functionality.
- **Organic placeholder panel** (`#viewOrganic`) — empty placeholder with description of upcoming functionality.
- **Combined placeholder panel** (`#viewCombined`) — empty placeholder with description of upcoming functionality.
- **`restoreViewTab()` function** — called during `initApp()` to restore the last active tab from localStorage.
- **View tab cleared on Reset** — `clearSavedState()` now also removes the `VIEWTAB_KEY`.
- **`downloadKeywordTemplate()` function** — generates a pre-filled .xlsx with 15 example iGaming keywords across 3 verticals (Slots, Sports Betting, Casino) with realistic search volumes and ranking positions. Uses the existing SheetJS library. Download button on the Organic placeholder panel.

### Changed
- **`<main>` CSS** — removed `display:flex; align-items:flex-start; gap:18px` from `main` element. The flex layout is now on `.view-container.active` so each view can control its own layout independently.

---

## v34
**Focus:** Rebalance button icon change

### Changed
- **Rebalance button icon** — replaced ⚖ (scales) with 🎯 (bullseye) across all rebalance/rescale buttons in the config panel, budget phasing panel, and LTV balance button. The scales icon was unclear to users; bullseye better communicates "hit the target budget".

---

## v33
**Focus:** Variable CPC/CPM — per-month rate modelling

### Added
- **"Var. CPC" and "Var. CPM" model options** in the platform model dropdown (alongside existing CPC/CPM). Selecting a variable model enables per-month rate modelling for that platform.
- **CPC/CPM Rate Editor modal** — opens via the "Variable ▾" button in the config panel when a platform is set to Var. CPC or Var. CPM. Features:
  - 12 draggable vertical bars with real-time value labels
  - 12 editable number inputs below the bars (two-way synced)
  - Month labels rotate with the start-month setting
  - Preset pills from the existing seasonality library (Summer Peak, NFL Season, etc.) — applies as multipliers against the current average rate
  - "Flat" preset resets all 12 rates to the current average
  - Save/load custom CPC/CPM shapes (separate `customCpcShapes[]` library)
  - Cancel/Apply workflow — changes only persist on Apply
- **`switchPlatModel()` function** — handles transitions between flat and variable models:
  - Flat → Variable: initialises 12 rates from current flat rate, backs up flat rate
  - Variable → Flat: restores backed-up flat rate, variable rates kept for re-toggling
  - Variable rates array survives round-trips (won't re-initialise if already set)
- **`customCpcShapes[]` state array** — separate from budget custom shapes. Stored in calendar-month order, rotates with start month. Travels with JSON export/import and localStorage.
- **CSS for rate editor modal** — dark theme, consistent with shape picker modal styling.

### Changed
- **`calcChannelMonth()`** — now reads `plat.cpcRates[m]` or `plat.cpmRates[m]` when model is `var-cpc` / `var-cpm`, falling back to the flat rate if the rates array is missing.
- **Config panel CPA/ROAS estimation** — for variable models, uses the average of 12 rates for the inline CPA/ROAS badges.
- **Config panel platform row** — variable models show a "Variable ▾" button instead of the flat rate input. Model dropdown now has 4 options.
- **Excel Config sheet** — shows "Variable" in the rate column for variable models, and the model name (var-cpc / var-cpm) in the model column.
- **`getState()`/`setState()`** — now persist `customCpcShapes`, `cpcRates`, `cpmRates`, `flatCpcBackup`, `flatCpmBackup` on platform objects.

### Fixed
- **CPC editor draft reset on shape save** — saving a custom CPC/CPM shape no longer closes and re-opens the modal (which was re-initialising the draft from the platform's stored rates, reverting to flat). The custom shapes list now updates in-place via `cpcRenderCustomShapes()`, preserving the current draft. Same fix applied to shape deletion.

---

## v32
**Focus:** Compact display mode replaces presentation rounding

### Changed
- **"Presentation Rounding" → "Compact Display"** — the panel now toggles a display-only formatter instead of rounding actual budget values. When enabled, all output figures use shorthand notation (e.g. 123k, 1.2M, 4.8k).
- **Scope: output sections only** — compact format applies to KPI scorecards, monthly breakdown table, KPI summary table, and chart tooltips. Config panel, budget phasing grid, and Excel export always show exact figures.
- **Auto precision** — values scale intelligently: `>=100k` shows whole units (123k), `>=10k` shows one decimal (12.3k), `>=1k` shows up to two decimals (4.8k), `<1k` shows exact integers.

### Removed
- **Rounding tier selector** (nearest £5/£10/£50/£100/£500) — no longer needed since values are formatted, not rounded.
- **`computeNiceBudgets()`** — entire rounding engine (~70 lines) removed.
- **`buildForecastNice()`** — budget-swapping wrapper removed; `buildForecast()` called directly.
- **`renderNnSummary()`** — stats panel (presentation total, platforms adjusted, max shift) removed.
- **`setNnRounding()`** — rounding setter removed.
- **`nnRounding` and `nnBudgets` state variables** — no longer needed.
- **Dead CSS** — `.nn-select`, `.nn-summary`, `.nn-stat*`, `.nn-badge-on` rules removed.

### Added
- **`fmtCompactNum(n)` function** — pure formatter converting numbers to compact strings.
- **Compact-aware `fmt()`, `fmtS()`, `fmtN()`** — existing format helpers now check `nnEnabled` and delegate to `fmtCompactNum` when active.

---

## v31
**Focus:** Move Export Excel button to header bar

### Changed
- **Export button relocated** — moved from the KPI Summary panel header to the main app header bar, grouped with Save, Load, and Reset buttons. Uses `btn-header` styling to match the existing header buttons. Label shortened to "Export" with 📊 emoji prefix.

---

## v30
**Focus:** Dark theme reskin — visual identity aligned with Looker Studio reports

### Changed
- **Full dark theme** — body background changed from light grey (`#f0f2f5`) to dark navy (`#010E21`). All panels, cards, tables, modals, inputs, and overlays updated to dark palette.
- **Primary accent: indigo → cyan** — `#6366f1` replaced with `#00E5FF` across all interactive elements (buttons, toggles, sliders, active states, links, focus rings, badges, onboarding highlights).
- **Status colors shifted for dark background** — positive values now use cyan (`#00E5FF`) instead of green; negative values use orange (`#FF8A50`) instead of red. Warning/amber adjusted to brighter orange (`#FF9100`).
- **Panel backgrounds**: white → `#0A1628`. Table headers → `#0D1B2A`. Borders → `#1A2A3F`.
- **Text colors brightened** — primary text `#E8EDF2`, secondary `#8899AA`, muted `#506070` (was dark greys on white).
- **Input/form elements** — backgrounds, borders, and text colors all updated for dark panels. Focus states use cyan ring.
- **Chart.js** — gridlines updated to `rgba(255,255,255,0.06)`, tick/legend label colors set to `#8899AA`/`#6B7D8F`, dataset fills adjusted for dark background contrast.
- **Budget card gradient** — changed from indigo/purple to dark teal (`#006064` → `#00838F`).
- **Platform colour palette** — updated `COLOURS` array for better visibility on dark backgrounds.
- **Active button contrast** — cyan-background buttons now use dark text (`#010E21`) instead of white for accessibility.
- **All badge/pill colours** — ok/warn/error/info badges updated with dark-appropriate background+text pairings.
- **Campaign structure rows** — vertical/channel/platform row backgrounds darkened to match theme.
- **Locked cell/row/column states** — amber-tinted locking colours adjusted for dark background.
- **Modals** (shape picker, season editor, LTV settings) — backgrounds, borders, close buttons all dark-themed.
- **Onboarding overlay** — prompt cards, buttons, step dots updated for dark theme.

### Not changed
- Layout, panel order, element positioning — all unchanged per user request.
- Functionality, data model, business logic — zero changes.
- HTML structure — unchanged.

---

## v29
**Focus:** Start-month selector and custom shape library

### Added

#### Start-month selector
- **"Starts: [month]" dropdown in the header bar** — lets the user declare which calendar month Month 1 represents (default: January). All seasonality shape presets rotate to match, so an "NFL Season" shape applied with a July start puts the Super Bowl peak in the correct position.
- **`rotateWeights(calWeights)` / `unrotateWeights(posWeights)` helpers** — pure functions that shift a 12-element weights array by the `startMonth` offset. Rotation is applied at every point where calendar-order weights are consumed (shape application, previews, sparklines, seasonality editor).
- **Rotation wired into:** `applyBudgetsFromHierarchy()`, `applyShapeToPlatform()`, `platShapeNorm()`, `loadSeasonPreset()`, `renderSeasonPreview()`, and all shape picker sparklines.
- Changing start month does **not** rearrange existing platform budgets — it only affects future shape applications and previews. Toast message reminds the user to re-apply shapes.

#### Custom shape library
- **Save-shape button (💾)** on each platform row in the budget phasing grid — appears when the platform's monthly distribution is non-flat. Prompts for a name and saves the distribution as a reusable shape.
- **Custom shapes stored in calendar-month order** — when saving, the platform's position-order budgets are un-rotated back to calendar months, so saved shapes rotate correctly when the start month changes.
- **Inline weights on `platform.customShape`** — every shape reference (built-in or custom) now stores `{ cat, shape, weights }`, making each platform self-contained. If a custom shape is deleted from the library, the platform keeps its distribution.
- **"Custom Shapes" section in the shape picker modal** — appears below built-in presets when custom shapes exist. Each card has a sparkline preview (rotated by start month) and a hover-revealed ✕ delete button.
- **`deleteCustomShape()`** — removes a shape from the library; platforms with inline copies are unaffected.
- **Custom shapes travel with the forecast** — included in `getState()`/`setState()`, so JSON export/import and localStorage persistence include the full shape library.

### Changed
- **`platform.customShape` now always includes `weights` array** — built-in presets also embed their weights for consistency and resilience.
- **Excel export: Overview sheet** now includes "Start Month" row.
- **Excel export: Config sheet** now includes "Shape" column showing the applied shape name per platform.

---

## v28
**Focus:** Generic month labels

### Changed
- **Month labels changed from named months to "Month 1"–"Month 12"** everywhere: budget phasing grid headers, seasonality bar labels, monthly breakdown table, cumulative ROI chart, monthly spend & revenue chart, KPI breakeven display, and Excel export. This makes the forecast period-agnostic — it no longer implies a January start.
- `MONTHS` array updated from `['Jan','Feb',…,'Dec']` to `['Month 1','Month 2',…,'Month 12']`
- `periodLabel()` now generates labels from the index directly (`Month N`) rather than looking up the `MONTHS` array, keeping tail period labels consistent (e.g. "Month 3 +1yr")

---

## v27
**Focus:** Tutorial skip-button bug fix

### Fixed
- **"Skip" button during tutorial now skips one step instead of the entire tutorial** — after the welcome screen, clicking "Skip" previously called `skipOnboarding()` (which ended the whole tutorial). Now calls `advanceOnboard()` to move to the next step. The "Skip setup" button on the welcome screen still exits the full tutorial as intended.

---

## v26
**Focus:** Excel export — client-side .xlsx generation with raw data for charting

### Added
- **SheetJS (xlsx) library** — loaded from cdnjs CDN, runs entirely client-side
- **"Export Excel" button** — in the KPI Summary panel header, triggers an .xlsx download
- **`exportToExcel()` function** — builds a 5-sheet workbook from the current forecast state:
  - **Sheet 1 — Overview:** KPI scorecards as key-value pairs (budget, spend, revenue, conversions, CPA, ROAS, net ROI, breakeven, deferred revenue if applicable)
  - **Sheet 2 — Monthly Breakdown:** full month-by-month table (spend, conversions, revenue, monthly net, cumulative spend/revenue/net/ROAS) including tail months — ready for line charts
  - **Sheet 3 — KPI Summary:** flat table with Level/Vertical/Channel/Platform columns plus spend, conversions, revenue, deferred, CPA, ROAS — vertical summary rows interleaved, grand total at bottom
  - **Sheet 4 — Platform Monthly:** one row per platform per month (vertical, channel, platform, month, spend, conversions) — ideal for pivot tables and per-platform charts
  - **Sheet 5 — Config:** snapshot of model inputs (model type, CPC/CPM rate, CTR, CVR, allocation %, annual budget, ARPU, lifespan, LTV status) per platform
- Export respects current filter state, nice numbers, and currency selection
- File named `forecast-YYYY-MM-DD.xlsx` with toast notification on completion

### Changed
- **Replaced PptxGenJS with SheetJS** — PPTX output quality was poor; Excel provides raw data tables that users can chart and format in Excel/Sheets as needed

### How it works
The export reads the same `buildForecastNice()` output used by the render pipeline — `months` for the table, `byPlatform` for the KPI summary. All numeric values are exported as numbers (not formatted strings) so Excel formulas and charts work directly on the data. The function is self-contained with no dependencies beyond SheetJS.

---

## v25
**Focus:** Dead code removal and cleanup

### Removed
- **Channel shape editor** — 12 orphaned functions (`toggleChannelShapeEditor`, `onChShapeCatChange`, `renderChPresetPreview`, `loadChPreset`, `activateChBar`, `previewChBar`, `setChBar`, `cancelChBar`, `toggleChBarLock`, `balanceChShape`, `applyChannelShape`, `resetChannelShape`) plus helper `_chValsFromBudgets`. HTML entry points were stripped in v21 rebuild but JS remained. ~240 lines removed.
- **Channel shape state variables** — `openShapeEditors`, `channelShapeDraft`, `channelShapeDraftVals`, `channelShapeBarLocked`, `channelShapeActiveBar` (6 lines)
- **`CHANNEL_PRESETS`** — default-metrics-by-channel-type object, never referenced (12 lines)
- **`spreadActiveMonth`** — declared but never read (1 line)
- **`ltvPerCustomerForVert()`** — replaced by inline maths in `buildForecast()` (4 lines)
- **`maxActiveLifespan()`** — superseded by `tailLength()` (11 lines)
- **`getPlatAnnualBudget()`** — never called (7 lines)
- **`resetBpRowFlat()`** — replaced by shape picker modal in v21 (29 lines)
- **`startOnboarding()`** — never called; `skipOnboarding`/`finishOnboarding` remain active (5 lines)
- **`toggleChannelFilter()`** — single-line wrapper for `togglePlatFilter`, never called (2 lines)

### Fixed
- **Duplicate `.onboard-highlight` CSS rule** — two separate declarations merged into one (animation property folded into the main rule)

### Summary
365 lines removed (5,612 → 5,247). No functional changes — all removed code was unreachable.

---

## v24
**Focus:** KPI Summary table and unfiltered scorecards

### Added
- **KPI Summary panel** — new panel below the monthly breakdown table showing per-vertical, per-channel, and per-platform KPI rows (Annual Spend, Conversions, Revenue, CPA, ROAS)
- **`byPlatform` map in `buildForecast()` return** — per-platform KPI totals (`spend`, `conversions`, `revenue`, `revenueDeferred`) computed alongside the aggregate forecast, so all LTV/cohort logic stays in one place
- **Deferred revenue footer** — when LTV is enabled and revenue falls beyond the forecast window, the KPI Summary shows an amber footer row with the deferred total, the combined revenue (in-window + deferred), and the inclusive ROAS — mirrors the scorecard "+ £X still beyond window" pattern
- **Filter-aware summary** — the KPI Summary table respects `activeChannelFilter`, showing only selected platforms. Subtitle updates to indicate filtered vs all-platforms view and the forecast window (12 months or full period incl. tail)

### Changed
- **KPI scorecards now always show unfiltered data** — `buildForecast()` accepts an `opts` parameter with `{ skipFilter: true }` to bypass the channel filter. `render()`, `refreshForecast()`, and `updateBudget()` now build both filtered and unfiltered forecasts, passing unfiltered data to `renderKPIs()` and filtered data to charts, monthly table, and KPI summary
- **`buildForecastNice()` passes through opts** — the nice-numbers wrapper forwards the `opts` parameter to `buildForecast()` so `skipFilter` works with presentation rounding enabled
- **`renderKpiSummary()` no longer computes its own KPIs** — it now receives the `byPlatform` map from `buildForecast()`, eliminating duplicated LTV/revenue logic and ensuring the summary exactly matches the scorecard and monthly table figures

### How it works
The render pipeline now calls `buildForecastNice()` twice: once without options (filtered, for charts/tables/summary) and once with `{ skipFilter: true }` (unfiltered, for KPI scorecards). `buildForecast()` returns a `byPlatform` Map alongside `months` and `revenueDeferred`, tracking per-platform spend, conversions, in-window revenue, and deferred revenue. `renderKpiSummary()` consumes this map directly, aggregating up to channel and vertical levels. When deferred revenue exists, an amber footer row shows the beyond-window total with inclusive ROAS (CPA is omitted since conversions all occur in months 0–11 regardless of tail).

---

## v23
**Focus:** Three-level output filter (verticals, channels, platforms)

### Changed
- **Filter bar now shows three levels** — pills are grouped with dividers and labels: Verticals → Channels → Platforms. Clicking a vertical or channel pill toggles all its child platforms at once.
- **Partial selection styling** — vertical and channel pills show a dashed border when some (but not all) children are selected, solid indigo fill when all children are active.
- **"All" button** replaces "All platforms" for brevity.
- Platform pills now show just the platform name (channel context removed since the channel group provides it).

### How the filter works
The underlying `activeChannelFilter` Set still stores **platform IDs only** — vertical/channel pills are convenience toggles that add or remove all child platform IDs. `buildForecast()` checks this set unchanged, so all downstream output sections (ROI chart, monthly chart, monthly table) respect the filter identically.

---

## v22
**Focus:** Nice Numbers — presentation rounding module

### Added
- **Presentation Rounding panel** — new panel between budget phasing and output sections with toggle and rounding selector
- **5 rounding tiers:** nearest £5, £10, £50, £100, £500
- **`computeNiceBudgets()`** — scales all platform×month cells proportionally to a rounded grand total, floors to the rounding unit, then uses largest-remainder redistribution to hit the target exactly. Every output cell is a clean multiple of the chosen unit
- **`buildForecastNice()`** — when nice numbers is enabled, temporarily swaps in rounded budgets to rebuild the forecast, then restores originals. Config panel and phasing grid always show exact figures
- **Aggregate summary stats** — shows presentation total (with shift warning if budget isn't evenly divisible), platforms adjusted count, max annual shift per platform, and rounding level
- **Persistence** — `nnEnabled` and `nnRounding` saved/restored via getState/setState and localStorage

### How it works
The module is a pure presentation layer. When toggled on, `computeNiceBudgets()` creates a parallel set of rounded budgets without mutating the real `platforms[].budgets`. The output sections (cumulative ROI chart, monthly spend & revenue chart, monthly breakdown table, and channel filter) all render from the nice figures. Toggling off instantly reverts to exact numbers. The underlying allocations, shapes, and phasing grid are never affected.

### Design decisions
- Grand total is rounded to the nearest multiple of the rounding unit (e.g. £999,999 at £500 rounding → £1,000,000). This ensures all cells can be perfect multiples. The summary shows any budget shift with an amber warning.
- Redistribution uses floor + largest-fractional-remainder (same pattern as `distributeWeighted`), guaranteeing drift-free exact sums.

---

## v21
**Focus:** Per-platform seasonality shape presets in budget phasing

### Added
- **Per-platform shape picker modal** — the "Reset Shape" button on each platform row now opens a full-screen modal offering Flat plus all seasonality presets grouped by category (Basic, USA Sports, Canadian Sports, European Sports, Philippines Sports)
- **Sparkline previews** — each shape option in the picker modal shows a small line chart visualising the monthly distribution, so users can see the shape before selecting
- **Active shape indicator** — the trigger button shows the name of the currently applied shape (e.g. "NFL Season ▾") with a purple highlight when a custom shape is set, or "Shape ▾" when flat/unset
- **`applyShapeToPlatform()` function** — applies any preset shape to a single platform row, normalising weights for free months only and using `distributeWeighted()` for drift-free rounding
- **Lock-aware shape application** — respects all 4 lock levels (column, vertical, row, cell); locked months are preserved and budget is redistributed across unlocked months only; shows warning toasts when all months are locked

### Changed
- "Reset Shape" button replaced by shape picker modal; selecting "Flat (equal)" is equivalent to the old reset behaviour
- Selecting "Flat" now also clears `customShape` on the platform, ensuring `applyBudgetsFromHierarchy()` treats it as unset

### Fixed
- **Missing weight normalisation** — raw seasonality weights are now normalised (divided by sum) before passing to `distributeWeighted()`, preventing inflated distributions when applying shapes directly to platforms

---

## v19
**Focus:** Distribution accuracy and amount-mode sliders

### Fixed
- **Flat distribution drift** — `distributeWeighted()` now detects near-flat shapes (all weights within 0.1%) and uses perfect `floor(target/12)` division instead of weighted rounding. Eliminates the ±2 drift on platforms like Meta Ads (£4,802/£4,798 instead of £4,800)
- **Largest-remainder method** — replaced `Math.round` (bidirectional drift) with `Math.floor` + award surplus to months with biggest fractional remainders. Guarantees every value is within 1 of ideal and sums are exact

### Added
- **Amount-mode sliders** — switching to "£" mode in the config panel now shows a range slider + number input (mirroring % mode UX) instead of a plain number input
  - Slider range: 0 → parent budget (channel slider goes 0 → its vertical's budget, etc.)
  - Smart step sizes: auto-scales for clean numbers — £5k steps on £500k+, £1k on £100k+, £500 on £50k+, £100 on £10k+
  - Third column flips: shows % in amt mode, £ in pct mode (always see both values)
  - Live slider↔input sync with filled-bar visual
- **"Reset Shape" button** in budget phasing — appears at the end of each platform row only when the monthly distribution is non-flat; resets to equal monthly split while respecting all lock levels; disappears once the row is flat

### Changed
- **Default allocation mode** is now "amounts" (£) instead of percentages
- Amount/pct input column widened by 50% (54px → 81px)

---

## v18
**Focus:** Budget phasing — locking, rebalancing, and hierarchy badges

### Added
- **Row locking** in budget phasing — lock individual platform rows to freeze their monthly values during rebalancing
- **Cell-level locking** — lock individual platform×month cells; lock icons appear on hover, click to toggle
- **Vertical-level locking** — freeze all platforms within a vertical at once
- **Column (month) locking** — freeze an entire month column across all platforms
- **4-tier lock hierarchy:** Column → Vertical → Row → Cell, with `isPlatLocked()` helper consolidating checks
- **Tooltips** explaining the mathematical difference between per-row and global rebalance
- **Over/under badges** on vertical and channel rows showing group health (actual spend vs allocated budget)
- **Collapsed rows still contribute to totals** — "All Platforms" row now uses full `platforms` array regardless of collapse state

### Changed
- All unlock icons now only appear on hover (consistent pattern across columns, verticals, rows, and cells)
- Vertical/channel annual column shows actual spend sum, not just allocated budget

### Fixed
- Collapsed rows no longer cause the grand total to report under-budget incorrectly
- Rounding drift between config panel £ amounts and sidebar 12-month spend (was ~£120 on a £120k budget due to ~48 independent Math.round operations)

### Attempted & Reverted
- **Budget snap / "nice numbers" rounding** — cell-level snap created conflicts between config panel and phasing panel; global-level snap via largest-remainder method was partially implemented then fully reverted at end of session per user request

---

## v17 and earlier
Pre-changelog versions. Key capabilities established:
- 3-level hierarchy: Verticals → Channels → Platforms
- Percentage-based cascading budget allocation
- Seasonality shapes with category presets
- Budget phasing grid with drag-to-adjust bars
- CPC/CPM model selection per platform with CTR/CVR inputs
- ROI/ROAS output calculations
- localStorage persistence with JSON export/import
- Chart.js visualisations
- Currency selector
- LTV modelling per vertical (basic and advanced with lag/cohort splits)
