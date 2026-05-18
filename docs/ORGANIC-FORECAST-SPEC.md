# Organic Forecasting Module — Implementation Spec

Paste this entire document into a new Cowork task to begin implementation.

---

## Context

I'm continuing development on a single-file HTML marketing forecasting app for iGaming client pitches. The current working version is `marketing-forecast-v34.html` in the `forecast app/` folder.

Before you do anything, read these files from the `Forecast App Developement` folder:
1. `CHANGELOG.md` — full version history
2. `DEVELOPER-PROMPT.md` — architecture notes, conventions, known issues, and the existing data model

The task is to add an **organic forecasting module** alongside the existing paid forecasting functionality. This is a large feature — work through it incrementally, one phase at a time. Ask me before starting each phase to confirm the approach.

---

## How I want you to work

### Communication style
- Be concise. Don't recap what you're about to do — just do it.
- Don't explain code back to me unless I ask.
- After completing a change, give a short summary of what changed and why, not a walkthrough of every line.
- When sharing the file, use a link and stop. Don't write paragraphs describing what's in the document I can open myself.

### Clarification
- Ask me questions BEFORE starting work on a new feature. Use the AskUserQuestion tool with concrete options when the approach isn't obvious.
- If a request is ambiguous about which panel or section of the app it refers to, ask. The app now has paid panels AND organic panels that share similar concepts.

### Versioning and changelog
- **Never edit the current version file directly.** Always copy to vN+1 first, update the STORAGE_KEY and ONBOARD_KEY, then make changes in the new file.
- Update `CHANGELOG.md` at the end of each session with everything that was added, changed, fixed, or reverted.
- If I ask you to revert something, revert it cleanly and note it in the changelog under "Reverted".

### Code quality
- After every edit, run a JS syntax check: extract `<script>` blocks and run `node -c` on each.
- The app is a single HTML file (currently ~5250 lines, will grow significantly). Use the Edit tool for surgical changes. Don't rewrite large blocks unnecessarily.
- When a string replacement fails (not unique), add more surrounding context rather than guessing.

### Testing
- The browser preview from the VM doesn't work (Chrome can't connect to localhost inside the sandbox). Don't waste time trying to screenshot the app.
- Instead, verify logic programmatically with Node.js test scripts when the change involves maths or data flow. This is especially important for the organic model calculations — test the rank trajectory, CTR curve lookups, and incremental revenue maths with concrete examples before wiring up the UI.

### Intelligent disobedience
- Tell me when I'm wrong. Don't allow my requests to break existing functionality.
- The paid forecasting module must remain fully functional throughout. Don't refactor shared code in a way that risks regressions on the paid side.

---

## Feature spec: Organic forecasting

### Overview

The app gains a new top-level section for organic (SEO) forecasting. The organic model works fundamentally differently from paid: instead of budget → clicks → conversions, it models keyword rank improvements → incremental traffic → incremental revenue. The "spend" is an agency fee rather than media spend.

The organic module is a self-contained UI panel, separate from the existing paid panels. A new combined results section merges both paid and organic outputs with filtering.

### Navigation

Add a top-level tab or toggle to switch between three views:
- **Paid** — the existing app (all current panels unchanged)
- **Organic** — the new organic UI (described below)
- **Combined** — a merged results view pulling from both models

The paid view must remain exactly as it is today. The tab/toggle should be prominent and clear — this is the primary navigation for the app now.

---

### Organic UI — panels and inputs

#### 1. Keyword import

The user uploads or pastes a CSV containing their keyword data. Required columns:

| Column | Description |
|--------|-------------|
| keyword | The search term |
| vertical | The niche/vertical this keyword belongs to (e.g. "Slots", "Sports Betting") |
| search_volume | Average monthly search volume (flat number, no seasonality) |
| current_rank | Current Google ranking position (integer, 1–100+) |

The import flow should:
- Accept CSV paste (textarea) or file upload
- Auto-detect columns by header name (be forgiving — accept "Keyword", "keyword", "Keywords", etc.)
- Show a preview table after import so the user can verify the data looks right
- Display a summary: X keywords across Y verticals, total monthly search volume
- Allow re-import to replace the dataset

Keywords are grouped by vertical automatically based on the vertical column value.

#### 2. Vertical configuration

After import, display the detected verticals with per-vertical inputs:

| Input | Description | Default |
|-------|-------------|---------|
| CVR | Conversion rate from organic click to conversion | 2% |
| ARPU | Average revenue per user | £50 |
| Rank trajectory shape | Visual shape preset for how rankings improve over 12 months | Linear |

The rank trajectory shape picker should reuse the same interaction pattern as the existing seasonality shape selector on the paid side: visual presets with a mini chart preview. Available presets:

- **Linear** — steady improvement each month
- **S-Curve** — slow start, fast middle, slow finish (most realistic for SEO)
- **Back-loaded** — slow for first few months, accelerates later
- **Front-loaded** — fast initial gains, tapering off

Each preset defines a set of 12 weights (like seasonality shapes) that determine what fraction of the total rank improvement has been achieved by each month. For example, Linear would be [1/12, 2/12, 3/12, ... 12/12] and S-Curve would concentrate progress in months 4–9.

The trajectory is applied to all keywords within that vertical. Each keyword improves from its current_rank toward position 1, with the trajectory shape controlling the pace. Rankings are capped at position 1 — no keyword can go below 1.

#### 3. CTR curve

A default CTR curve mapping Google ranking position to expected click-through rate. Ship a sensible default based on industry averages (roughly):

| Position | CTR |
|----------|-----|
| 1 | 28.5% |
| 2 | 15.7% |
| 3 | 11.0% |
| 4 | 8.0% |
| 5 | 7.2% |
| 6 | 5.1% |
| 7 | 4.0% |
| 8 | 3.2% |
| 9 | 2.8% |
| 10 | 2.5% |
| 11–20 | ~1.0% (declining) |
| 21–50 | ~0.2–0.5% |
| 50+ | ~0.1% or negligible |

Display the CTR curve as an editable chart or table. The user should be able to adjust individual position CTRs. The curve is global (applies to all keywords), not per-vertical.

#### 4. Agency fee inputs

12 monthly input boxes for the agency/SEO fee. This is the organic equivalent of "budget" but it's a cost input, not an allocation.

Include quick-fill helpers to avoid tedious data entry:
- "Set all to £X"
- "Set months 1–N to £X, rest to £Y" (covers the common front-loaded retainer pattern)

#### 5. Organic results (within the organic tab)

This section shows results for organic only:

- **Monthly chart** — incremental organic revenue by month (stacked by vertical), with agency fee line overlaid
- **Monthly breakdown table** — per-vertical monthly incremental traffic, incremental revenue, and agency fee
- **KPI summary** — total incremental revenue, total agency fee, organic ROI (incremental revenue / agency fee), break-even month

---

### The organic calculation model

For each keyword, for each month (0–11):

```
1. projected_rank = current_rank - (current_rank - 1) × trajectory_progress[month]
   (capped at 1, rounded to nearest integer)

2. projected_ctr = ctr_curve[projected_rank]
   baseline_ctr = ctr_curve[current_rank]

3. incremental_clicks = search_volume × (projected_ctr - baseline_ctr)
   (if negative or zero, clamp to 0)

4. incremental_revenue = incremental_clicks × cvr × arpu
```

Where `trajectory_progress[month]` is a value from 0.0 to 1.0 defined by the vertical's selected trajectory shape — representing what fraction of the total possible rank improvement has been achieved by that month.

Aggregate up: sum all keywords in a vertical to get vertical-level monthly incremental traffic and revenue. Sum all verticals for totals.

**Important:** the output is purely incremental. A keyword already at rank 1 contributes zero. A keyword that doesn't improve in a given month contributes zero for that month. The baseline is "what we'd get with no SEO work" and we only show the gains above that.

---

### Combined results view

A new tab/section that merges paid and organic outputs:

- **Monthly chart** — stacked bars showing paid revenue + incremental organic revenue by month, with combined spend (media + agency fee) line
- **Monthly breakdown table** — columns for paid revenue, organic incremental revenue, combined revenue, paid spend, agency fee, combined spend
- **Vertical-level view** — if a vertical name exists in both paid and organic, merge them into a single row showing both revenue streams. If a vertical exists only in paid or only in organic, show it standalone.
- **Filtering** — reuse the filter pattern from the existing paid results. The user should be able to filter by:
  - Channel type: Paid only / Organic only / Combined
  - Individual verticals (showing both paid and organic within that vertical if both exist)
  - Any other breakdowns that make sense

---

### State and persistence

New state variables for organic (add to the existing state model):

```
orgKeywords[]        — { id, keyword, vertical, searchVolume, currentRank }
orgVerticals[]       — { id, name, cvr, arpu, trajectoryShape }
orgCtrCurve[]        — array of { position, ctr } from 1 to 100
orgAgencyFees[12]    — monthly agency fee amounts
orgTrajectoryShapes  — built-in presets (like seasonality shapes)
```

These must be included in:
- `getState()` / `setState()` — for JSON export/import
- `saveToLocalStorage()` — for auto-persistence
- The Excel export — add new sheets for organic data (keyword list, organic monthly forecast, organic KPI summary)

The organic state is independent of paid state. Clearing one should not affect the other. A "Reset organic" button should clear only organic data.

---

### Suggested implementation phases

This is a large feature. Break it into phases, confirming with me before starting each one:

**Phase 1 — Navigation and skeleton**
Add the top-level Paid/Organic/Combined tab switcher. Create empty placeholder panels for Organic and Combined. Ensure the paid view is completely unaffected.

**Phase 2 — Keyword import and vertical detection**
Build the CSV import flow (paste + file upload), column auto-detection, preview table, and vertical grouping. Store the imported data in state. No calculations yet.

**Phase 3 — Vertical configuration and CTR curve**
Add per-vertical CVR, ARPU, and trajectory shape inputs. Build the trajectory shape picker (reuse the seasonality shape UI pattern). Add the editable CTR curve. Add the 12-month agency fee inputs.

**Phase 4 — Organic calculation engine**
Implement the per-keyword, per-month forecast model. Test it thoroughly with Node.js scripts before wiring to UI. Verify edge cases: keyword already at rank 1, keyword at rank 100, trajectory producing fractional ranks, etc.

**Phase 5 — Organic results panel**
Build the organic-only results section within the organic tab: charts, monthly breakdown table, KPI summary.

**Phase 6 — Combined results view**
Build the combined tab merging paid and organic outputs. Implement the filtering system. Handle vertical name matching for merged rows.

**Phase 7 — Persistence and export**
Wire organic state into getState/setState, localStorage, and Excel export. Add organic-specific sheets to the Excel output. Add "Reset organic" functionality.

---

### Things NOT to do (scope boundaries)

- No seasonal variation on search volume — use flat monthly averages only
- No per-keyword target rank overrides — the trajectory applies uniformly to a vertical
- No automated keyword research or API integrations — all data comes from user import
- No changes to the existing paid forecasting panels or calculations
- Keep it as a single HTML file — no splitting into separate files
