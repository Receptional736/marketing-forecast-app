---
theme: dark
title: Marketing Forecast
toc: false
sidebar: false
---

<style>
  /* Framework reserves a 272px gutter for the sidebar and 192px for the
     table of contents even when both are disabled in observablehq.config.js
     (sidebar: false, toc: false). Zero them so the forecast app uses the
     full viewport width, the way the original single-file HTML did. */
  #observablehq-center { margin: 0 !important; padding: 0 !important; }
  #observablehq-main { padding-right: 0 !important; margin: 0 auto !important; max-width: none !important; }
  /* The forecast app sets its own body styles below; let them through. */
  body { background: #010E21 !important; }
</style>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

<style>

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #010E21;
      color: #E8EDF2;
      min-height: 100vh;
    }

    header {
      background: linear-gradient(135deg, #010E21 0%, #0A1628 100%);
      color: white;
      padding: 18px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }
    header h1 { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.3px; }
    header p  { font-size: 0.78rem; opacity: 0.55; margin-top: 2px; }
    .header-controls select {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white; padding: 6px 12px; border-radius: 6px;
      font-size: 0.85rem; cursor: pointer;
    }
    .header-controls select option { background: #0A1628; }
    .header-controls { display: flex; align-items: center; gap: 10px; }

    /* ── Header save/load buttons ── */
    .btn-header {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 13px; border-radius: 7px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.22);
      background: rgba(255,255,255,0.1); color: white;
      font-family: inherit; transition: all .12s; white-space: nowrap;
    }
    .btn-header:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); }
    .btn-header.reset { border-color: rgba(255,138,80,0.35); color: rgba(255,255,255,0.65); }
    .btn-header.reset:hover { background: rgba(255,138,80,0.18); border-color: rgba(255,138,80,0.6); color: white; }
    .header-divider { width: 1px; height: 22px; background: rgba(255,255,255,0.15); margin: 0 2px; }

    /* ── View tab pills (Paid / Organic / Combined) ── */
    .view-tabs { display: flex; gap: 0; background: rgba(255,255,255,0.08); border-radius: 8px; padding: 2px; }
    .view-tab {
      padding: 5px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.55);
      font-family: inherit; transition: all .15s; white-space: nowrap;
    }
    .view-tab:hover { color: rgba(255,255,255,0.85); }
    .view-tab.active { background: #00E5FF; color: #010E21; }

    /* ── View containers ── */
    .view-container { display: none; }
    .view-container.active { display: flex; align-items: flex-start; gap: 18px; }
    .view-container--full.active { display: block; }
    .combined-placeholder {
      width: 100%; padding: 60px 40px; text-align: center;
      background: #0A1628; border-radius: 14px; margin: 24px;
      border: 1px dashed #1A2A3F;
    }
    .combined-placeholder h2 { font-size: 1.3rem; margin-bottom: 8px; color: #E8EDF2; }
    .combined-placeholder p { color: #8899AA; font-size: 0.9rem; }

    /* ── Organic import panel ── */
    .org-import-zone {
      border: 2px dashed #1A2A3F; border-radius: 10px; padding: 20px;
      text-align: center; transition: border-color .15s, background .15s;
      margin-bottom: 14px;
    }
    .org-import-zone.drag-over { border-color: #00E5FF; background: rgba(0,229,255,0.04); }
    .org-import-zone textarea {
      width: 100%; min-height: 100px; background: #010E21; color: #E8EDF2;
      border: 1px solid #1A2A3F; border-radius: 8px; padding: 10px;
      font-family: 'Courier New', monospace; font-size: 0.78rem; resize: vertical;
      margin-bottom: 10px;
    }
    .org-import-zone textarea::placeholder { color: #506070; }
    .org-import-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .org-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 16px; border-radius: 7px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; border: 1px solid #1A2A3F; background: #0D1B2A; color: #E8EDF2;
      font-family: inherit; transition: all .12s; white-space: nowrap;
    }
    .org-btn:hover { background: #142236; border-color: #2A3A4F; }
    .org-btn.primary { background: #00E5FF; color: #010E21; border-color: #00E5FF; }
    .org-btn.primary:hover { background: #33EBFF; }
    .org-btn.danger { border-color: rgba(255,138,80,0.35); color: rgba(255,255,255,0.65); }
    .org-btn.danger:hover { background: rgba(255,138,80,0.18); border-color: rgba(255,138,80,0.6); color: white; }

    /* ── Organic preview table ── */
    .org-preview-wrap { max-height: 420px; overflow-y: auto; border-radius: 8px; border: 1px solid #1A2A3F; }
    .org-preview-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
    .org-preview-table th {
      position: sticky; top: 0; background: #0D1B2A; padding: 8px 10px;
      text-align: left; font-weight: 700; color: #8899AA; border-bottom: 1px solid #1A2A3F;
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .org-preview-table td { padding: 6px 10px; border-bottom: 1px solid #0D1B2A; color: #E8EDF2; }
    .org-preview-table tr:hover td { background: rgba(0,229,255,0.03); }
    .org-vert-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;
      font-weight: 600; background: rgba(0,229,255,0.1); color: #00E5FF;
    }
    .org-stat-card {
      background: #0A1628; border: 1px solid #1A2A3F; border-radius: 10px; padding: 12px 14px;
    }
    .org-stat-card label { font-size: 0.7rem; color: #8899AA; display: block; margin-bottom: 4px; }
    .org-stat-card .value { font-size: 1.15rem; font-weight: 700; color: #E8EDF2; }

    /* ── Organic vertical config table ── */
    .org-vert-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .org-vert-table th {
      padding: 8px 10px; text-align: left; font-weight: 700; color: #8899AA;
      border-bottom: 1px solid #1A2A3F; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .org-vert-table td { padding: 7px 10px; border-bottom: 1px solid #0D1B2A; }
    .org-vert-table input[type="number"] {
      width: 75px; background: #010E21; color: #E8EDF2; border: 1px solid #1A2A3F;
      border-radius: 6px; padding: 5px 8px; font-size: 0.8rem; text-align: right;
    }
    .org-vert-table input[type="number"]:focus { outline: none; border-color: #00E5FF; }
    .org-shape-btn {
      padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; border: 1px solid #1A2A3F; background: #0D1B2A; color: #E8EDF2;
      font-family: inherit; transition: all .12s; white-space: nowrap;
    }
    .org-shape-btn:hover { border-color: #00E5FF; color: #00E5FF; }
    .org-shape-btn.active { background: rgba(0,229,255,0.12); border-color: #00E5FF; color: #00E5FF; }

    /* ── Drawable bar chart (shared by CTR + trajectory) ── */
    .draw-bar-wrap {
      position: relative; background: #0A1628; border: 1px solid #1A2A3F;
      border-radius: 8px; padding: 8px 4px 4px; user-select: none; -webkit-user-select: none;
      cursor: crosshair;
    }
    .draw-bar-container {
      display: flex; align-items: flex-end; gap: 1px; height: 180px;
      padding: 0 2px 18px;
    }
    .draw-bar-col {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: flex-end; min-width: 0; height: 100%; position: relative;
    }
    .draw-bar {
      width: 100%; min-height: 2px; border-radius: 2px 2px 0 0;
      background: #00E5FF; opacity: 0.7; transition: height 0.04s;
    }
    .draw-bar-label {
      position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%);
      font-size: 0.55rem; color: #506070; text-align: center;
      white-space: nowrap; pointer-events: none;
    }
    .draw-bar-value {
      position: absolute; top: -2px; left: 50%; transform: translate(-50%, -100%);
      font-size: 0.58rem; color: #8899AA; white-space: nowrap; pointer-events: none;
      opacity: 0; transition: opacity 0.1s;
    }
    .draw-bar-col:hover .draw-bar-value, .draw-bar-col.active .draw-bar-value { opacity: 1; }
    .draw-bar-container.drawing .draw-bar-value { opacity: 1; }

    /* ── Trajectory modal ── */
    .traj-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9000;
      display: flex; align-items: center; justify-content: center;
    }
    .traj-modal {
      background: #0A1628; border: 1px solid #1A2A3F; border-radius: 14px;
      width: 620px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }
    .traj-modal-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 18px 22px 14px; border-bottom: 1px solid #1A2A3F;
    }
    .traj-modal-head strong { font-size: 1rem; color: #E8EDF2; }
    .traj-modal-head p { font-size: 0.75rem; color: #8899AA; margin-top: 2px; }
    .traj-modal-body { padding: 18px 22px 22px; }
    .traj-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
    .traj-preset-card {
      background: #0D1B2A; border: 1px solid #1A2A3F; border-radius: 10px;
      padding: 12px; cursor: pointer; transition: all .12s;
    }
    .traj-preset-card:hover { border-color: #2A3A4F; }
    .traj-preset-card.active { border-color: #00E5FF; background: rgba(0,229,255,0.06); }
    .traj-preset-card .traj-preset-name { font-size: 0.82rem; font-weight: 700; color: #E8EDF2; margin-bottom: 4px; }
    .traj-preset-card .traj-preset-desc { font-size: 0.7rem; color: #8899AA; margin-bottom: 8px; }
    .traj-preset-card canvas { width: 100%; height: 40px; }
    .traj-section-label {
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.4px; color: #7A8A9A; margin: 16px 0 10px;
    }
    .traj-modal-actions {
      display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;
      padding-top: 14px; border-top: 1px solid #1A2A3F;
    }

    /* ── Agency fee panel ── */
    .org-fee-grid {
      display: grid; grid-template-columns: repeat(12, 1fr); gap: 6px;
    }
    .org-fee-cell { text-align: center; }
    .org-fee-cell label { display: block; font-size: 0.68rem; color: #8899AA; margin-bottom: 4px; }
    .org-fee-cell input {
      width: 100%; background: #010E21; color: #E8EDF2; border: 1px solid #1A2A3F;
      border-radius: 6px; padding: 6px 4px; font-size: 0.8rem; text-align: center;
    }
    .org-fee-cell input:focus { outline: none; border-color: #00E5FF; }
    .org-fee-helpers { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
    .org-fee-helpers label { font-size: 0.75rem; color: #8899AA; }
    .org-fee-helpers input[type="number"] {
      width: 85px; background: #010E21; color: #E8EDF2; border: 1px solid #1A2A3F;
      border-radius: 6px; padding: 4px 8px; font-size: 0.78rem; text-align: right;
    }

    /* ── Save toast notification ── */
    .save-toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: #0D1B2A; border: 1px solid #1A2A3F; color: white; padding: 10px 18px;
      border-radius: 9px; font-size: 0.82rem; font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      opacity: 0; transform: translateY(8px);
      transition: opacity .2s ease, transform .2s ease; pointer-events: none;
    }
    .save-toast.show { opacity: 1; transform: translateY(0); }

    /* ── Page layout: main content + sticky sidebar ── */
    main {
      max-width: none;
      margin: 0;
      padding: 22px 20px 56px;
    }
    .app-main { flex: 1; min-width: 0; }

    /* ── KPI Sidebar ── */
    .kpi-sidebar {
      width: 230px;
      flex-shrink: 0;
      position: sticky;
      top: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: calc(100vh - 56px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #1A2A3F transparent;
      padding-bottom: 4px;
    }
    .kpi-sidebar::-webkit-scrollbar { width: 4px; }
    .kpi-sidebar::-webkit-scrollbar-thumb { background: #1A2A3F; border-radius: 4px; }
    .kpi-sidebar-label {
      font-size: 0.67rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #7A8A9A; padding: 0 2px;
    }
    .kpi {
      background: #0D1B2A; border-radius: 10px; padding: 13px 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07); border-left: 4px solid #1A2A3F;
    }
    .kpi.green  { border-left-color: #00E5FF; background: #001820; }
    .kpi.red    { border-left-color: #FF8A50; background: #1A0E05; }
    .kpi.indigo { border-left-color: #00E5FF; }
    .kpi.amber  { border-left-color: #FF9100; background: #1A1505; }
    .kpi label  { font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #90A0B0; display: block; }
    .kpi .value { font-size: 1.3rem; font-weight: 700; margin-top: 5px; color: #E8EDF2; line-height: 1.1; }
    .kpi .value.pos { color: #00E5FF; }
    .kpi .value.neg { color: #FF8A50; }
    .kpi .sub   { font-size: 0.7rem; color: #7A8A9A; margin-top: 2px; }
    .kpi-target-row { display: flex; align-items: center; gap: 4px; margin-top: 8px; padding-top: 7px; border-top: 1px dashed #1A2A3F; }
    .kpi-target-row .kpi-target-label { font-size: 0.67rem; color: #7A8A9A; white-space: nowrap; }
    .kpi-target-input { width: 100%; padding: 3px 6px; border: 1px solid #1A2A3F; border-radius: 4px; font-size: 0.72rem; font-family: inherit; color: #A8B8C8; background: #0D1B2A; }
    .kpi-target-input:focus { outline: none; border-color: #00E5FF; background: #0D1B2A; }
    .kpi-target-input::placeholder { color: #4A5A6F; }
    .kpi-target-badge { display: inline-block; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-top: 4px; white-space: nowrap; }
    .kpi-target-badge.green { background: #002B36; color: #00E5FF; }
    .kpi-target-badge.amber { background: #1A1505; color: #FF8F00; }
    .kpi-target-badge.red   { background: #1A0E05; color: #FF6D00; }

    /* ── Channel filter bar ── */
    .ch-filter-bar { display: flex; align-items: center; gap: 10px; padding: 11px 18px; background: #0A1628; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 18px; flex-wrap: wrap; }
    .ch-filter-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7A8A9A; white-space: nowrap; }
    .ch-filter-pills { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .ch-filter-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 20px; font-size: 0.73rem; font-weight: 600; cursor: pointer; border: 1.5px solid #1A2A3F; background: #0D1B2A; color: #90A0B0; transition: all .12s; user-select: none; }
    .ch-filter-pill:hover { border-color: #00E5FF; color: #00E5FF; }
    .ch-filter-pill.all-active { background: #00E5FF; border-color: #00E5FF; color: #010E21; }
    .ch-filter-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .ch-filter-divider { width: 1px; height: 18px; background: #1A2A3F; margin: 0 2px; flex-shrink: 0; }
    .ch-filter-active-note { font-size: 0.7rem; color: #00E5FF; font-weight: 600; white-space: nowrap; }
    .ch-filter-group-label { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #4A5A6F; white-space: nowrap; }
    .ch-filter-pill.partial { border-style: dashed; }

    /* ── Panels ── */
    .panel { background: #0A1628; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 18px; overflow: hidden; }
    .panel-header {
      padding: 15px 22px; border-bottom: 1px solid #0F1D2E;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .panel-header h2 { font-size: 0.9rem; font-weight: 700; color: #E8EDF2; }
    .panel-header p  { font-size: 0.75rem; color: #7A8A9A; margin-top: 1px; }
    .panel-body { padding: 18px 22px; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

    /* ── Toggle switch ── */
    .toggle-wrap { display: flex; align-items: center; gap: 9px; cursor: pointer; flex-shrink: 0; }
    .toggle-wrap span { font-size: 0.82rem; font-weight: 600; color: #A8B8C8; }
    .toggle-switch { position: relative; display: inline-block; width: 42px; height: 23px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; cursor: pointer; inset: 0;
      background: #1A2A3F; transition: .2s; border-radius: 23px;
    }
    .toggle-slider::before {
      position: absolute; content: ""; height: 17px; width: 17px;
      left: 3px; bottom: 3px; background: #0D1B2A; transition: .2s;
      border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    input:checked + .toggle-slider { background: #00E5FF; }
    input:checked + .toggle-slider::before { transform: translateX(19px); }

    /* ── LTV Settings ── */
    .ltv-body { display: none; }
    .ltv-body.open { display: block; }

    .ltv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

    .ltv-section label.section-label {
      display: block; font-size: 0.72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.4px; color: #90A0B0; margin-bottom: 10px;
    }

    /* Lag pill buttons — segmented style */
    .lag-pills { display: inline-flex; border: 1px solid #1A2A3F; border-radius: 6px; overflow: hidden; }
    .lag-pill {
      padding: 7px 18px; border-radius: 0; font-size: 0.82rem; font-weight: 600;
      border: none; background: #0D1B2A; color: #7A8A9A;
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .lag-pill + .lag-pill { border-left: 1px solid #1A2A3F; }
    .lag-pill.active { background: #00E5FF; color: #010E21; }
    .lag-pill:hover:not(.active) { color: #00E5FF; background: #0E1A2C; }

    /* Cohort table */
    table.cohort { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    table.cohort thead th {
      background: #0D1B2A; padding: 8px 12px;
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.4px; color: #90A0B0; border-bottom: 2px solid #1A2A3F;
      text-align: left;
    }
    table.cohort thead th.right { text-align: right; }
    table.cohort tbody tr { border-bottom: 1px solid #0F1D2E; }
    table.cohort tbody td { padding: 9px 12px; }
    table.cohort tbody td.right { text-align: right; }
    table.cohort tfoot tr { border-top: 2px solid #1A2A3F; background: #0D1B2A; }
    table.cohort tfoot td { padding: 8px 12px; font-weight: 700; font-size: 0.82rem; }

    .pct-input {
      width: 68px; padding: 5px 8px; border: 1px solid #1A2A3F; border-radius: 5px;
      font-size: 0.82rem; text-align: right; font-family: inherit;
      transition: border-color .15s; font-variant-numeric: tabular-nums;
    }
    .pct-input:focus { outline: none; border-color: #00E5FF; }

    .sum-pill {
      display: inline-block; padding: 3px 10px; border-radius: 10px;
      font-size: 0.78rem; font-weight: 700;
    }
    .sum-pill.ok  { background: #002B36; color: #00838F; }
    .sum-pill.bad { background: #1A0E05; color: #D84315; }

    .ltv-note {
      margin-top: 14px; padding: 10px 14px; background: #001820;
      border: 1px solid #006064; border-radius: 7px;
      font-size: 0.77rem; color: #00ACC1; line-height: 1.5;
    }

    /* ── ROI mode toggle (inside KPI card) — segmented style ── */
    .roi-mode-toggle { display: inline-flex; border: 1px solid #1A2A3F; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
    .roi-pill {
      padding: 2px 7px; border-radius: 0; font-size: 0.68rem; font-weight: 700;
      border: none; background: #0D1B2A; color: #7A8A9A;
      cursor: pointer; line-height: 1.5; transition: all .12s; font-family: inherit;
    }
    .roi-pill + .roi-pill { border-left: 1px solid #1A2A3F; }
    .roi-pill.active { background: #00E5FF; color: #010E21; }
    .roi-pill:hover:not(.active) { color: #00E5FF; background: #0E1A2C; }

    /* ── Tail toggle row ── */
    .tail-toggle-row {
      margin-top: 18px; padding-top: 18px;
      border-top: 1px solid #0F1D2E;
      display: flex; align-items: flex-start; gap: 14px;
    }
    .tail-toggle-row .tail-desc { flex: 1; }
    .tail-toggle-row .tail-desc strong { font-size: 0.85rem; color: #E8EDF2; }
    .tail-toggle-row .tail-desc p { font-size: 0.76rem; color: #90A0B0; margin-top: 3px; line-height: 1.5; }
    .tail-length-pill {
      display: inline-block; margin-top: 6px; padding: 2px 9px;
      background: #0F1D2E; border-radius: 10px;
      font-size: 0.72rem; font-weight: 600; color: #A8B8C8;
    }

    /* ── Channel table ── */
    table.channels { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    table.channels thead th {
      background: #0D1B2A; padding: 9px 11px;
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.4px; color: #90A0B0; border-bottom: 2px solid #1A2A3F; white-space: nowrap;
    }
    table.channels thead th.right { text-align: right; }
    table.channels tbody tr { border-bottom: 1px solid #0F1D2E; transition: background .12s; }
    table.channels tbody tr:hover { background: #0F1E30; }
    table.channels tbody td { padding: 9px 11px; vertical-align: middle; }

    .ch-name-cell { display: flex; align-items: center; gap: 8px; }
    .ch-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    .cell-input {
      border: 1px solid #1A2A3F; border-radius: 5px; padding: 5px 7px;
      font-size: 0.83rem; background: #0D1B2A; transition: border-color .12s, background .12s;
      font-family: inherit; color: #E8EDF2; width: 100%;
    }
    .cell-input:focus { outline: none; border-color: #00E5FF; background: #0E1A2C; }
    input.cell-input[type="text"]   { min-width: 130px; }
    input.cell-input[type="number"] { min-width: 75px; text-align: right; }

    .ro-cell { text-align: right; color: #A8B8C8; font-variant-numeric: tabular-nums; font-size: 0.82rem; }
    .ro-cell.pos { color: #00E5FF; font-weight: 600; }
    .ro-cell.neg { color: #FF8A50; font-weight: 600; }

    .badge-roas {
      display: inline-block; padding: 2px 9px; border-radius: 10px;
      font-size: 0.75rem; font-weight: 700;
    }
    .badge-roas.good  { background: #002B36; color: #00838F; }
    .badge-roas.ok    { background: #fff7ed; color: #7c2d12; }
    .badge-roas.bad   { background: #1A0E05; color: #BF360C; }

    /* Constant / inherited value — plain text style */
    .badge-const {
      display: inline;
      font-size: 0.82rem; font-weight: 400; color: #A8B8C8;
      font-variant-numeric: tabular-nums;
    }

    .btn-del {
      background: none; border: none; cursor: pointer;
      color: #4A5A6F; font-size: 1rem; padding: 4px 6px; border-radius: 4px;
      line-height: 1; transition: color .12s, background .12s;
    }
    .btn-del:hover { color: #FF8A50; background: #1A0E05; }

    /* ── Shape controls bar (lives in panel header, below title row) ── */
    .shape-controls-bar {
      display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
      padding-top: 11px; margin-top: 11px; border-top: 1px solid #0F1D2E;
    }
    .shape-controls-label {
      font-size: 0.72rem; font-weight: 600; color: #90A0B0; white-space: nowrap;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .shape-controls-select {
      padding: 4px 8px; border: 1px solid #1A2A3F; border-radius: 5px;
      font-size: 0.75rem; cursor: pointer; background: #0D1B2A; font-family: inherit;
    }
    .shape-controls-select:focus { outline: none; border-color: #00E5FF; }


    /* ── Per-channel shape badge ── */
    .ch-shape-badge {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 1px 7px; border-radius: 8px; font-size: 0.61rem; font-weight: 700;
      cursor: pointer; border: 1px solid; flex-shrink: 0; white-space: nowrap;
      transition: all .12s; margin-left: 6px; vertical-align: middle;
    }
    .ch-shape-badge.global {
      background: #0F1D2E; color: #7A8A9A; border-color: #1A2A3F;
    }
    .ch-shape-badge.global:hover { border-color: #00E5FF; color: #00E5FF; background: #0E1A2C; }
    .ch-shape-badge.custom { background: #002B36; color: #00ACC1; border-color: #00838F; }
    .ch-shape-badge.custom:hover { background: #003340; }
    .ch-shape-badge.open   { background: #00E5FF; color: white; border-color: #00E5FF; }

    /* ── Per-channel inline shape editor ── */
    /* ── Per-channel shape editor — two-row column-aligned layout ── */
    .ch-shape-head-tr { animation: spIn .15s ease; }
    .ch-shape-bars-tr:hover { background: transparent !important; }
    .ch-shape-head-td {
      padding: 8px 11px 7px !important; background: #0F1E30;
      border-left: 3px solid #00E5FF; border-bottom: 1px solid #1A2A3F;
    }
    .ch-shape-bar-label-td {
      font-size: 0.68rem; font-weight: 700; color: #7A8A9A; text-transform: uppercase;
      letter-spacing: 0.3px; padding-left: 11px !important; white-space: nowrap;
      vertical-align: middle; background: #0F1E30; border-left: 3px solid #00E5FF;
    }
    .ch-shape-bar-td { text-align: center; vertical-align: bottom; padding: 8px 2px 4px !important; }
    .ch-shape-bar-annual-td { background: #0F1D2E; border-left: 1px solid #1A2A3F; }
    .ch-shape-editor-head {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    }
    .ch-shape-editor-head strong { font-size: 0.82rem; color: #E8EDF2; white-space: nowrap; }
    .ch-shape-selects { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .ch-shape-select {
      padding: 4px 8px; border: 1px solid #1A2A3F; border-radius: 5px;
      font-size: 0.75rem; cursor: pointer; background: #0D1B2A; font-family: inherit;
    }
    .ch-shape-select:focus { outline: none; border-color: #00E5FF; }
    .ch-shape-canvas { border: 1px solid #1A2A3F; border-radius: 4px; background: #0D1B2A; vertical-align: middle; flex-shrink: 0; }
    /* Amber bar for spread-locked months in the channel shape editor */
    .sbar-col.spread-locked .sbar-fill { background: #FF9100; opacity: 0.85; }
    .sbar-col.spread-locked .sbar-pct  { color: #FF8F00; }
    .sbar-col.spread-locked .sbar-amt  { color: #FF6D00; }

    /* ── Season shape editor ── */
    .sbar-grid { display:flex; gap:4px; align-items:flex-end; padding-bottom:4px; border-bottom:2px solid #1A2A3F; }
    .sbar-col { display:flex; flex-direction:column; align-items:center; gap:2px; flex:1; min-width:0; cursor:pointer; }
    .sbar-col.locked .sbar-fill { background:#7A8A9A; }
    .sbar-wrap { width:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; height:80px; position:relative; }
    .sbar-fill { width:80%; border-radius:3px 3px 0 0; background:#00E5FF; transition:height 0.12s; min-height:3px; cursor:pointer; }
    .sbar-fill:hover { filter:brightness(1.1); }
    .sbar-pct { font-size:0.63rem; color: #90A0B0; line-height:1.2; text-align:center; }
    .sbar-amt { font-size:0.6rem; color: #7A8A9A; line-height:1.2; text-align:center; }
    .sbar-label { font-size:0.63rem; color: #7A8A9A; margin-top:3px; }
    .sbar-lock { background:none; border:none; cursor:pointer; padding:1px; font-size:0.72rem; line-height:1; opacity:0.5; transition:opacity 0.1s; }
    .sbar-lock:hover, .sbar-col.locked .sbar-lock { opacity:1; }
    .sbar-active-input { width:90%; text-align:center; font-size:0.75rem; padding:3px 2px; border:1px solid #00E5FF; border-radius:4px; outline:none; background:#0E1A2C; }
    .season-editor-footer { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:14px; padding-top:14px; border-top:1px solid #0F1D2E; }

    /* ── Season Shape Editor Lightbox ── */
    .season-editor-overlay {
      position: fixed; inset: 0; z-index: 1800;
      background: rgba(15,20,40,0.45); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: obFadeIn .18s ease;
    }
    .season-editor-modal {
      background: #0D1B2A; border-radius: 14px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.25);
      width: 860px; max-width: calc(100vw - 48px); max-height: 90vh;
      overflow-y: auto; animation: obSlideIn .2s ease;
      display: flex; flex-direction: column;
    }
    .season-editor-modal-head {
      padding: 16px 22px; border-bottom: 1px solid #0F1D2E;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .season-editor-modal-head strong { font-size: 0.92rem; font-weight: 700; color: #E8EDF2; }
    .season-editor-modal-head p { font-size: 0.74rem; color: #7A8A9A; margin-top: 2px; }
    .season-editor-modal-body { padding: 22px; }
    .season-editor-modal-close {
      background: #0F1D2E; border: 1px solid #1A2A3F; border-radius: 7px;
      cursor: pointer; color: #90A0B0; width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.95rem; transition: all .12s; font-family: inherit; flex-shrink: 0;
    }
    .season-editor-modal-close:hover { background: #1A0E05; border-color: #FF8A50; color: #FF6D00; }

    /* ── Nice Numbers Panel ── */
    .nn-panel .panel-header { flex-wrap: wrap; gap: 10px; }
    .nn-controls { display: flex; align-items: center; gap: 12px; }
    .nn-toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .nn-toggle-track {
      width: 40px; height: 22px; border-radius: 11px; background: #1A2A3F;
      position: relative; transition: background 0.2s; cursor: pointer;
    }
    .nn-toggle-track.active { background: #00E5FF; }
    .nn-toggle-thumb {
      width: 18px; height: 18px; border-radius: 50%; background: #0D1B2A;
      position: absolute; top: 2px; left: 2px; transition: left 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .nn-toggle-track.active .nn-toggle-thumb { left: 20px; }
    .nn-toggle-text { font-size: 0.78rem; font-weight: 600; color: #7A8A9A; min-width: 20px; }
    .nn-toggle-track.active + .nn-toggle-text { color: #00E5FF; }

    /* ── Budget Phasing Panel Styles ── */
    .bp-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .bp-mode-toggle { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #1A2A3F; border-radius: 6px; overflow: hidden; cursor: pointer; }
    .bp-mode-toggle input { display: none; }
    .bp-mode-toggle span { padding: 4px 10px; font-size: 0.75rem; font-weight: 600; color: #7A8A9A; background: #0D1B2A; }
    .bp-mode-toggle input:checked + span { color: #010E21; background: #00E5FF; }
    .bp-total-badge { font-size: 0.82rem; color: #90A0B0; white-space: nowrap; }
    .bp-total-badge strong { color: #E8EDF2; font-size: 0.95rem; }

    .bp-summary-wrap { }
    .bp-chart-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: #7A8A9A; vertical-align: bottom !important; padding-left: 11px !important; }
    .bp-chart-cell { vertical-align: bottom !important; text-align: center; padding: 6px 2px 4px !important; cursor: grab; }
    .bp-chart-cell:active { cursor: grabbing; }
    .bp-chart-stack { display: flex; flex-direction: column-reverse; align-items: center; min-height: 4px; margin: 0 auto; width: 70%; border-radius: 3px 3px 0 0; overflow: hidden; }
    .bp-summary-seg { width: 100%; flex-shrink: 0; }
    .bp-chart-total { font-size: 0.68rem; color: #A8B8C8; font-weight: 700; line-height: 1.4; text-align: center; margin-top: 2px; font-variant-numeric: tabular-nums; }

    .bp-grid-wrap { overflow-x: auto; }
    .bp-grid { border-collapse: collapse; font-size: 0.8rem; width: 100%; }
    .bp-grid thead th { background: #0D1B2A; padding: 8px 6px; font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #90A0B0; border-bottom: 2px solid #1A2A3F; text-align: center; white-space: nowrap; cursor: pointer; user-select: none; transition: background 0.12s, color 0.12s; }
    .bp-grid thead th:first-child { text-align: left; min-width: 140px; padding-left: 11px; cursor: default; }
    .bp-grid thead th.bp-month-locked { background: #1A1505; color: #FF8F00; box-shadow: inset 0 3px 0 #FF9100, inset 1px 0 0 #664E0A, inset -1px 0 0 #664E0A; }
    .bp-grid thead th:not(:first-child):hover { background: #002B36; color: #00ACC1; }
    .bp-grid thead th.bp-month-locked:hover { background: #332A05; color: #A45500; }
    .bp-grid thead th.bp-annual-col { background: #0F1D2E; cursor: default; }
    .bp-th-inner { display: flex; align-items: center; justify-content: center; gap: 3px; }
    .bp-th-lock { font-size: 0.6rem; line-height: 1; cursor: pointer; opacity: 0; transition: opacity 0.12s; }
    .bp-grid thead th:hover .bp-th-lock { opacity: 0.45; }
    .bp-th-lock:hover { opacity: 0.9 !important; }
    .bp-grid thead th.bp-month-locked .bp-th-lock { opacity: 0.8; }
    .bp-grid tbody tr { border-bottom: 1px solid #0F1D2E; }
    .bp-grid tbody tr:hover { background: #0F1E30; }
    .bp-grid tbody tr.bp-totals-row { background: #0D1B2A; border-top: 2px solid #1A2A3F !important; }
    .bp-grid tbody tr.bp-totals-row:hover { background: #0D1B2A !important; }
    .bp-grid tbody td { padding: 6px 4px; text-align: center; vertical-align: middle; }
    .bp-grid tbody td:first-child { text-align: left; padding-left: 11px; }
    .bp-grid tbody td.bp-annual-col { background: #0D1B2A; color: #00E5FF; font-weight: 600; padding-right: 11px; font-variant-numeric: tabular-nums; }

    .bp-name-cell { display: flex; align-items: center; gap: 6px; }
    .bp-indent-0 { width: 0px; }
    .bp-indent-1 { width: 18px; }
    .bp-indent-2 { width: 36px; }
    .bp-chevron { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none; font-size: 0.65rem; color: #7A8A9A; flex-shrink: 0; }
    .bp-chevron:hover { color: #90A0B0; }
    .bp-name-label { font-size: 0.82rem; font-weight: 500; color: #E8EDF2; flex: 1; }
    .bp-context-label { font-size: 0.72rem; color: #7A8A9A; }

    .bp-cell { position: relative; }
    .bp-cell.bp-month-locked { background: #0F1505; box-shadow: inset 1px 0 0 #1A1505, inset -1px 0 0 #1A1505; }
    .bp-cell-bar { display: flex; flex-direction: column; align-items: center; gap: 2px; height: 70px; justify-content: flex-end; cursor: grab; }
    .bp-cell-bar:active { cursor: grabbing; }
    .bp-cell-bar.bp-locked-month { cursor: not-allowed; opacity: 0.7; }
    .bp-bar { width: 70%; border-radius: 3px 3px 0 0; min-height: 3px; transition: background 0.12s; }
    .bp-bar:hover { filter: brightness(1.08); }
    .bp-bar.bp-locked-month { opacity: 1; cursor: not-allowed; }
    .bp-value { font-size: 0.72rem; color: #90A0B0; font-variant-numeric: tabular-nums; }
    .bp-cell-input { width: 70%; padding: 2px 4px; font-size: 0.72rem; border: 1px solid #00E5FF; border-radius: 4px; outline: none; background: #0E1A2C; text-align: center; font-family: inherit; font-variant-numeric: tabular-nums; }

    .bp-row-actions { display: flex; align-items: center; gap: 4px; }
    .bp-rebalance-btn { background: none; border: none; cursor: pointer; font-size: 0.85rem; padding: 2px 4px; color: #7A8A9A; transition: color 0.12s; }
    .bp-rebalance-btn:hover { color: #00E5FF; }
    .bp-rebalance-btn:disabled { cursor: not-allowed; opacity: 0.5; }
    .bp-flat-btn { background: none; border: 1px solid #1A2A3F; border-radius: 4px; cursor: pointer; font-size: 0.62rem; padding: 2px 6px; color: #7A8A9A; transition: all 0.12s; font-family: inherit; white-space: nowrap; }
    .bp-flat-btn:hover { color: #00E5FF; border-color: #0097A7; background: #0E1A2C; }
    .bp-shape-preset { font-size: 0.72rem; padding: 2px 6px; border: 1px solid #1A2A3F; border-radius: 4px; background: #0D1B2A; color: #90A0B0; cursor: pointer; transition: all 0.12s; }
    .bp-shape-preset:hover { border-color: #00E5FF; color: #00E5FF; }

    /* ── Shape picker button on platform rows ── */
    .bp-shape-trigger { background: none; border: 1px solid #1A2A3F; border-radius: 4px; cursor: pointer; font-size: 0.62rem; padding: 2px 6px; color: #7A8A9A; transition: all 0.12s; font-family: inherit; white-space: nowrap; }
    .bp-shape-trigger:hover { color: #00E5FF; border-color: #0097A7; background: #0E1A2C; }
    .bp-shape-trigger.has-shape { color: #00ACC1; border-color: #00838F; background: #002B36; }
    .bp-shape-trigger.has-shape:hover { background: #003340; }
    .bp-save-shape-btn { background: none; border: 1px solid #1A2A3F; border-radius: 4px; cursor: pointer; font-size: 0.7rem; padding: 2px 5px; transition: all 0.12s; line-height: 1; }
    .bp-save-shape-btn:hover { border-color: #0097A7; background: #0E1A2C; }

    /* ── Shape picker modal ── */
    .shape-picker-overlay {
      position: fixed; inset: 0; z-index: 1800;
      background: rgba(15,20,40,0.45); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: obFadeIn .18s ease;
    }
    .shape-picker-modal {
      background: #0D1B2A; border-radius: 14px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.25);
      width: 640px; max-width: calc(100vw - 48px); max-height: 85vh;
      overflow-y: auto; animation: obSlideIn .2s ease;
      display: flex; flex-direction: column;
    }
    .shape-picker-head {
      padding: 16px 22px; border-bottom: 1px solid #0F1D2E;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .shape-picker-head strong { font-size: 0.92rem; font-weight: 700; color: #E8EDF2; }
    .shape-picker-head p { font-size: 0.74rem; color: #7A8A9A; margin-top: 2px; }
    .shape-picker-body { padding: 16px 22px; overflow-y: auto; }
    .shape-picker-cat { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7A8A9A; margin: 14px 0 8px; }
    .shape-picker-cat:first-child { margin-top: 0; }
    .shape-picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; margin-bottom: 6px; }
    .shape-picker-card {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 10px 8px; border: 1px solid #1A2A3F; border-radius: 8px;
      cursor: pointer; transition: all 0.12s; background: #0D1B2A;
    }
    .shape-picker-card:hover { border-color: #0097A7; background: #0E1A2C; }
    .shape-picker-card.active { border-color: #00E5FF; background: #002B36; box-shadow: 0 0 0 2px rgba(0,229,255,0.2); }
    .shape-picker-card-name { font-size: 0.75rem; font-weight: 600; color: #C8D4E0; text-align: center; line-height: 1.2; }
    .shape-picker-card.active .shape-picker-card-name { color: #00ACC1; }
    .sp-delete-btn { position: absolute; top: 2px; right: 2px; background: none; border: none; cursor: pointer; font-size: 0.65rem; color: #7A8A9A; padding: 2px 4px; border-radius: 3px; line-height: 1; opacity: 0; transition: opacity 0.12s, color 0.12s; }
    .shape-picker-card:hover .sp-delete-btn { opacity: 1; }
    .sp-delete-btn:hover { color: #FF8A50; background: #1A0E05; }

    /* ── CPC/CPM Rate Editor Modal ── */
    .cpc-editor-overlay {
      position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center;
    }
    .cpc-editor-modal {
      background: #0A1628; border-radius: 14px; width: 780px; max-width: 95vw;
      max-height: 90vh; display: flex; flex-direction: column;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5); border: 1px solid #1A2A3F;
    }
    .cpc-editor-head {
      padding: 16px 22px; border-bottom: 1px solid #1A2A3F;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .cpc-editor-head strong { font-size: 0.92rem; font-weight: 700; color: #E8EDF2; }
    .cpc-editor-head p { font-size: 0.74rem; color: #7A8A9A; margin-top: 2px; }
    .cpc-editor-body { padding: 16px 22px; overflow-y: auto; }
    .cpc-editor-chart-wrap {
      position: relative; height: 160px; margin-bottom: 12px; background: #0D1B2A;
      border: 1px solid #1A2A3F; border-radius: 8px; padding: 8px 4px 4px;
    }
    .cpc-bar-container { display: flex; gap: 2px; height: 100%; align-items: flex-end; }
    .cpc-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; cursor: ns-resize; }
    .cpc-bar {
      width: 70%; min-height: 4px; background: linear-gradient(180deg, #00E5FF 0%, #00838F 100%);
      border-radius: 3px 3px 0 0; transition: height 0.08s;
    }
    .cpc-bar-col:hover .cpc-bar { background: linear-gradient(180deg, #4DE8FF 0%, #00ACC1 100%); }
    .cpc-bar-label { font-size: 0.6rem; color: #7A8A9A; margin-top: 2px; line-height: 1; }
    .cpc-bar-value { font-size: 0.62rem; color: #00E5FF; font-weight: 600; position: absolute; top: -2px; transform: translateY(-100%); white-space: nowrap; }
    .cpc-inputs-row { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; margin-bottom: 16px; }
    .cpc-input-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .cpc-input-cell label { font-size: 0.6rem; color: #7A8A9A; font-weight: 600; }
    .cpc-input-cell input {
      width: 100%; text-align: center; font-size: 0.75rem; padding: 4px 2px;
      border: 1px solid #1A2A3F; border-radius: 4px; background: #0D1B2A; color: #E8EDF2;
      font-family: inherit;
    }
    .cpc-input-cell input:focus { outline: none; border-color: #00E5FF; }
    .cpc-editor-presets { margin-bottom: 16px; }
    .cpc-editor-presets-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7A8A9A; margin-bottom: 6px; }
    .cpc-preset-pills { display: flex; flex-wrap: wrap; gap: 5px; }
    .cpc-preset-pill {
      font-size: 0.7rem; padding: 4px 10px; border-radius: 12px; border: 1px solid #1A2A3F;
      background: #0D1B2A; color: #A8B8C8; cursor: pointer; font-family: inherit; transition: all 0.12s;
    }
    .cpc-preset-pill:hover { border-color: #00838F; color: #00E5FF; background: #0E1A2C; }
    .cpc-editor-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 12px; border-top: 1px solid #1A2A3F; }
    .cpc-editor-actions button {
      font-size: 0.78rem; padding: 6px 16px; border-radius: 6px; cursor: pointer;
      font-family: inherit; font-weight: 600; transition: all 0.12s;
    }
    .cpc-btn-save { background: #00E5FF; color: #010E21; border: none; }
    .cpc-btn-save:hover { background: #00B8D4; }
    .cpc-btn-cancel { background: none; border: 1px solid #1A2A3F; color: #A8B8C8; }
    .cpc-btn-cancel:hover { border-color: #506070; color: #E8EDF2; }
    .cpc-btn-save-shape { background: none; border: 1px solid #00838F; color: #00E5FF; }
    .cpc-btn-save-shape:hover { background: #002B36; }
    .cpc-custom-shapes { margin-bottom: 12px; }
    .cpc-custom-shape-card {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
      border: 1px solid #1A2A3F; border-radius: 8px; background: #0D1B2A; cursor: pointer;
      transition: all 0.12s; margin-right: 5px; margin-bottom: 5px;
    }
    .cpc-custom-shape-card:hover { border-color: #00838F; background: #0E1A2C; }
    .cpc-custom-shape-card .cpc-cs-name { font-size: 0.72rem; color: #C8D4E0; font-weight: 600; }
    .cpc-custom-shape-card .cpc-cs-del {
      font-size: 0.6rem; color: #7A8A9A; cursor: pointer; padding: 1px 3px; border-radius: 3px;
      opacity: 0; transition: opacity 0.12s;
    }
    .cpc-custom-shape-card:hover .cpc-cs-del { opacity: 1; }
    .cpc-custom-shape-card .cpc-cs-del:hover { color: #FF8A50; }

    .bp-badge { display: inline-block; font-size: 0.66rem; font-weight: 700; padding: 2px 6px; border-radius: 8px; white-space: nowrap; }
    .bp-badge-ok { background: #002B36; color: #006064; }
    .bp-badge-warn { background: #332A05; color: #BF6800; }
    .bp-badge-over { background: #1A0E05; color: #D84315; }

    /* Row locking */
    .bp-vert-row.bp-vert-locked td { background: #0F1505; }
    .bp-vert-lock { background: none; border: none; cursor: pointer; font-size: 0.75rem; padding: 0 2px; opacity: 0; transition: opacity 0.12s; }
    .bp-vert-row:hover .bp-vert-lock { opacity: 0.45; }
    .bp-vert-lock:hover { opacity: 0.9 !important; }
    .bp-vert-row.bp-vert-locked .bp-vert-lock { opacity: 0.8; }
    .bp-plat-row.bp-row-locked td { background: #0F1505; }
    .bp-plat-row.bp-row-locked .bp-cell-bar { cursor: not-allowed; opacity: 0.7; }
    .bp-row-lock { background: none; border: none; cursor: pointer; font-size: 0.75rem; padding: 0 2px; opacity: 0; transition: opacity 0.12s; }
    .bp-plat-row:hover .bp-row-lock { opacity: 0.45; }
    .bp-row-lock:hover { opacity: 0.9 !important; }
    .bp-plat-row.bp-row-locked .bp-row-lock { opacity: 0.8; }

    /* Cell locking */
    .bp-cell-lock { position: absolute; top: 2px; right: 2px; background: none; border: none; cursor: pointer; font-size: 0.6rem; padding: 0; line-height: 1; opacity: 0; transition: opacity 0.12s; z-index: 2; }
    .bp-cell:hover .bp-cell-lock { opacity: 0.45; }
    .bp-cell-lock:hover { opacity: 0.9 !important; }
    .bp-cell.bp-cell-locked .bp-cell-lock { opacity: 0.8; }
    .bp-cell.bp-cell-locked { background: #0F1505; }
    .bp-cell.bp-cell-locked .bp-cell-bar { cursor: not-allowed; opacity: 0.7; }

    /* ── Budget phasing panel header — right side (kept for compatibility) ── */

    /* ─── Vertical Configuration ─────────────────────────────────── */
    .vert-table { width:100%; border-collapse:collapse; }
    .vert-table th { font-size:0.69rem; color: #7A8A9A; text-transform:uppercase; letter-spacing:0.4px; font-weight:600; padding:6px 6px 4px; text-align:left; }
    .vert-table td { padding:5px 6px; vertical-align:middle; }
    .vert-row:hover td { background:#0F1E30; }
    .vert-badge { display:inline-block; font-size:0.62rem; font-weight:700; padding:1px 5px; border-radius:10px; background:#002B36; color:#00BCD4; text-transform:uppercase; letter-spacing:0.4px; margin-left:5px; vertical-align:middle; }
    .vert-rescale-btn { font-size:0.71rem; padding:2px 7px; border:1px solid #003340; border-radius:5px; background:#0E1A2C; color:#00BCD4; cursor:pointer; white-space:nowrap; }
    .vert-rescale-btn:hover { background:#002B36; }
    .vert-sum-ok  { color:#00E5FF; font-size:0.78rem; font-weight:600; }
    .vert-sum-bad { color:#FF8A50; font-size:0.78rem; font-weight:600; }
    .vert-empty-state { color: #7A8A9A; font-size:0.8rem; font-style:italic; padding:12px 4px; }
    .ch-vert-inherited { color:#4DD0E1 !important; }
    .vert-mode-toggle { display:flex;border:1px solid #1A2A3F;border-radius:6px;overflow:hidden;font-size:0.72rem;font-weight:600; }
    .vert-mode-toggle button { padding:4px 10px;background: #0D1B2A;border:none;cursor:pointer;color: #7A8A9A; }
    .vert-mode-toggle button.active { background:#00E5FF;color:#010E21; }


    /* ── Buttons ── */
    .btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 14px; border-radius: 7px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; border: none; transition: all .12s; font-family: inherit;
    }
    .btn-secondary { background: #0F1D2E; color: #A8B8C8; border: 1px solid #1A2A3F; }
    .btn-secondary:hover { background: #1A2A3F; }
    .btn-sm { padding: 5px 10px; font-size: 0.75rem; }
    .btn-primary { background: #00E5FF; color: #010E21; }
    .btn-primary:hover { background: #00B8D4; }
    .btn-primary:disabled { background: #0097A7; cursor: not-allowed; }
    .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-split.active { background: #002B36; border-color: #4DD0E1; color: #00B8D4; }
    .table-actions { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #0F1D2E; }

    /* ── Chart ── */
    .chart-wrap { position: relative; height: 330px; }

    .breakeven-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    .breakeven-badge.yes { background: #002B36; border: 1px solid #4DD0E1; color: #00838F; }
    .breakeven-badge.no  { background: #1A0E05; border: 1px solid #FF8A50; color: #BF360C; }

    /* ── Monthly table ── */
    table.monthly { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    table.monthly tbody tr.tail-row { background: #0D1520; }
    table.monthly tbody tr.tail-row:hover { background: #0D1520; }
    table.monthly tbody tr.tail-row td { color: #90A0B0; }
    table.monthly tbody tr.tail-row td:first-child { color: #7A8A9A; }
    table.monthly thead th {
      background: #0D1B2A; padding: 8px 13px; text-align: right;
      font-size: 0.67rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.4px; color: #90A0B0; border-bottom: 2px solid #1A2A3F; white-space: nowrap;
    }
    table.monthly thead th:first-child { text-align: left; }
    table.monthly tbody tr { border-bottom: 1px solid #0F1D2E; }
    table.monthly tbody tr:hover { background: #0F1E30; }
    table.monthly tbody tr.be-row { background: #002B36; }
    table.monthly tbody tr.be-row td { font-weight: 600; }
    table.monthly tbody td { padding: 8px 13px; text-align: right; font-variant-numeric: tabular-nums; }
    table.monthly tbody td:first-child { text-align: left; color: #A8B8C8; }
    .pv { color: #00E5FF; } .nv { color: #FF8A50; }

    /* ── KPI Summary Table ── */
    .kpi-summary-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .kpi-summary-table thead th {
      background: #0D1B2A; padding: 8px 13px; text-align: right;
      font-size: 0.67rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.4px; color: #90A0B0; border-bottom: 2px solid #1A2A3F; white-space: nowrap;
    }
    .kpi-summary-table thead th:first-child { text-align: left; }
    .kpi-summary-table tbody tr { border-bottom: 1px solid #0F1D2E; }
    .kpi-summary-table tbody tr:hover { background: #0F1E30; }
    .kpi-summary-table tbody td { padding: 8px 13px; text-align: right; font-variant-numeric: tabular-nums; }
    .kpi-summary-table tbody td:first-child { text-align: left; }
    .kpi-summary-table .ks-vert-row td { font-weight: 700; background: #0D1B2A; }
    .kpi-summary-table .ks-ch-row td { font-weight: 600; color: #A8B8C8; }
    .kpi-summary-table .ks-plat-row td { color: #90A0B0; }
    .kpi-summary-table .ks-plat-row td:first-child { padding-left: 28px; }
    .kpi-summary-table .ks-ch-row td:first-child { padding-left: 16px; }
    .kpi-summary-table .ks-total-row td { font-weight: 700; border-top: 2px solid #1A2A3F; background: #0D1B2A; }
    .kpi-summary-table .ks-deferred-row td { font-size: 0.78rem; color: #FF8F00; background: #1A1505; border-top: 1px dashed #1A2A3F; font-style: italic; }

    .export-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border: 1.5px solid #00E5FF; border-radius: 8px; background: #0E1A2C; color: #00E5FF; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all .15s; }
    .export-btn:hover { background: #00E5FF; color: #fff; }
    .export-btn svg { width: 15px; height: 15px; }

    .legend-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .legend-item { display: inline-flex; align-items: center; gap: 5px; font-size: 0.77rem; color: #A8B8C8; }
    .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

    .tip { cursor: help; border-bottom: 1px dashed #7A8A9A; }

    /* ── KPI Popover ── */
    .kpi-popover {
      position: fixed; z-index: 2200;
      background: #0D1B2A; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #1A2A3F;
      width: 310px; overflow: hidden;
    }
    .pop-header { padding: 13px 16px 10px; border-bottom: 1px solid #0F1D2E; }
    .pop-title { font-size: 0.88rem; font-weight: 700; color: #E8EDF2; }
    .pop-subtitle { font-size: 0.72rem; color: #7A8A9A; margin-top: 3px; }
    .pop-levers { padding: 10px 14px; display: flex; flex-direction: column; gap: 7px; }
    .pop-lever {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 10px; border-radius: 8px;
      background: #0D1B2A; border: 1px solid #1A2A3F;
    }
    .pop-lever.client-lever { background: #1A1505; border-color: #332A05; border-style: dashed; }
    .pop-lever-icon { font-size: 0.95rem; flex-shrink: 0; line-height: 1.5; }
    .pop-lever strong { font-size: 0.82rem; color: #E8EDF2; display: block; }
    .pop-lever-note { font-size: 0.70rem; color: #90A0B0; margin-top: 1px; line-height: 1.4; }
    .pop-lever.client-lever strong { color: #FF8F00; }
    .pop-lever.client-lever .pop-lever-note { color: #FF6D00; }
    .pop-footer {
      padding: 9px 16px 11px; display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid #0F1D2E;
    }
    .pop-lab-link { font-size: 0.78rem; font-weight: 700; color: #00E5FF; text-decoration: none; }
    .pop-lab-link:hover { text-decoration: underline; }
    .pop-close-btn {
      background: none; border: 1px solid #1A2A3F; cursor: pointer; color: #7A8A9A;
      font-size: 0.75rem; padding: 2px 7px; border-radius: 5px; font-family: inherit;
    }
    .pop-close-btn:hover { background: #0F1D2E; color: #A8B8C8; }


    /* ── Campaign Structure Panel ── */

    /* Table wrapper */
    table.cs-table {
      width: 100%; border-collapse: collapse; table-layout: fixed;
    }

    /* Column widths — one definition, every row aligned */
    col.c-name   { width: 186px; }
    col.c-slider { width: 144px; }
    col.c-pct    { width:  81px; }
    col.c-amt    { width:  82px; }
    col.c-alloc  { width:  98px; }   /* allocation badge + rescale — budget zone */
    col.c-lock   { width:  36px; }   /* lock icon column */
    .cs-lock-cell { text-align: center; vertical-align: middle; }

    /* Vertical preset shortcut buttons */
    .cs-preset-bar { display: flex; gap: 8px; padding: 8px 0 12px; flex-wrap: wrap; }
    .cs-preset-btn {
      padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: 1.5px dashed #0097A7; background: #0E1A2C; color: #00E5FF;
      font-family: inherit; transition: all .12s;
    }
    .cs-preset-btn:hover { background: #002B36; border-color: #00E5FF; }

    /* LTV toggle + gear in vertical row */
    .cs-ltv-controls { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; }
    .cs-ltv-toggle { position: relative; display: inline-block; width: 32px; height: 18px; cursor: pointer; }
    .cs-ltv-toggle input { opacity: 0; width: 0; height: 0; }
    .cs-ltv-slider {
      position: absolute; inset: 0; background: #1A2A3F; border-radius: 18px; transition: .2s;
    }
    .cs-ltv-slider::before {
      position: absolute; content: ""; width: 14px; height: 14px; left: 2px; bottom: 2px;
      background: #0D1B2A; border-radius: 50%; transition: .2s;
    }
    .cs-ltv-toggle input:checked + .cs-ltv-slider { background: #00E5FF; }
    .cs-ltv-toggle input:checked + .cs-ltv-slider::before { transform: translateX(14px); }
    .cs-ltv-gear {
      width: 24px; height: 24px; border: 1px solid #1A2A3F; border-radius: 6px;
      background: #0D1B2A; cursor: pointer; font-size: 0.82rem; display: inline-flex;
      align-items: center; justify-content: center; transition: all .12s; padding: 0;
    }
    .cs-ltv-gear:hover { background: #0E1A2C; border-color: #00E5FF; }
    .cs-arpu-disabled {
      background: #0F1D2E !important; color: #7A8A9A !important;
      border-color: #1A2A3F !important; cursor: not-allowed;
    }

    /* LTV Modal */
    .ltv-modal-overlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
    }
    .ltv-modal {
      background: #0D1B2A; border-radius: 14px; width: 520px; max-width: 95vw;
      max-height: 90vh; overflow-y: auto; box-shadow: 0 12px 40px rgba(0,0,0,0.2);
    }
    .ltv-modal-header {
      padding: 18px 24px; border-bottom: 1px solid #0F1D2E;
      display: flex; align-items: center; justify-content: space-between;
    }
    .ltv-modal-header h3 { font-size: 1rem; font-weight: 700; color: #E8EDF2; }
    .ltv-modal-header .ltv-modal-close {
      width: 28px; height: 28px; border: none; background: #0F1D2E; border-radius: 7px;
      cursor: pointer; font-size: 0.9rem; color: #90A0B0; display: flex;
      align-items: center; justify-content: center; transition: all .12s;
    }
    .ltv-modal-header .ltv-modal-close:hover { background: #1A0E05; color: #FF8A50; }
    .ltv-modal-body { padding: 20px 24px; }
    .ltv-modal-section { margin-bottom: 20px; }
    .ltv-modal-section:last-child { margin-bottom: 0; }
    .ltv-modal-label {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.4px; color: #90A0B0; margin-bottom: 8px; display: block;
    }
    .ltv-modal-sublabel { font-size: 0.78rem; color: #90A0B0; margin-bottom: 10px; }
    .ltv-modal-pills { display: flex; gap: 6px; flex-wrap: wrap; }
    .ltv-modal-pill {
      padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: 1.5px solid #1A2A3F; background: #0D1B2A; color: #A8B8C8;
      font-family: inherit; transition: all .12s;
    }
    .ltv-modal-pill:hover { border-color: #00E5FF; color: #00E5FF; }
    .ltv-modal-pill.active { background: #00E5FF; border-color: #00E5FF; color: #010E21; }
    .ltv-cohort-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .ltv-cohort-table th { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: #7A8A9A; padding: 6px 8px; text-align: left; }
    .ltv-cohort-table th.right, .ltv-cohort-table td.right { text-align: right; }
    .ltv-cohort-table td { padding: 6px 8px; border-top: 1px solid #0F1D2E; }
    .ltv-cohort-table tfoot td { border-top: 2px solid #1A2A3F; font-weight: 600; }
    .ltv-cohort-input { width: 56px; padding: 4px 6px; border: 1px solid #1A2A3F; border-radius: 5px; font-size: 0.82rem; text-align: right; font-family: inherit; }
    .ltv-cohort-input:focus { outline: none; border-color: #00E5FF; }
    .ltv-sum-ok { color: #00838F; background: #002B36; padding: 2px 8px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .ltv-sum-bad { color: #BF360C; background: #1A0E05; padding: 2px 8px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .ltv-modal-note { font-size: 0.78rem; color: #00ACC1; background: #001820; padding: 8px 12px; border-radius: 8px; margin-top: 8px; line-height: 1.5; }
    .ltv-modal-footer { padding: 16px 24px; border-top: 1px solid #0F1D2E; text-align: right; }
    .ltv-modal-save {
      padding: 8px 24px; border-radius: 8px; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; border: none; background: #00E5FF; color: #010E21; font-family: inherit;
      transition: all .12s;
    }
    .ltv-modal-save:hover { background: #00B8D4; }
    col.c-model  { width:  78px; }   /* ← inputs zone */
    col.c-rate   { width:  68px; }
    col.c-ctr    { width:  62px; }
    col.c-cvr    { width:  62px; }
    col.c-out    { width: 194px; }   /* ← outcomes: CPA + ROAS */
    col.c-act    { width:  54px; }   /* ← always just lock + remove */

    /* Row backgrounds & level indicators */
    tr.cs-vert-row td, tr.cs-vert-row th { background: #0A1628; }
    tr.cs-vert-row td:first-child         { box-shadow: inset 4px 0 0 #00E5FF; }
    tr.cs-ch-row td, tr.cs-ch-row th     { background: #0D1B2A; border-top: 1px solid #152035; }
    tr.cs-ch-row td:first-child           { box-shadow: inset 4px 0 0 #4DD0E1; }
    tr.cs-plat-row td                     { background: #0D1B2A; border-top: 1px solid #0F1D2E; }
    tr.cs-add-row td                      { background: #0D1B2A; border-top: 1px solid #0F1D2E; padding: 0; }
    tr.cs-spacer-row td                   { height: 6px; background: transparent; border: none; padding: 0; }
    tr.cs-footer-row td                   { background: #0D1B2A; border-top: 2px solid #1A2A3F; }

    /* Zone dividers */
    td.cs-z-inp, th.cs-z-inp { border-left: 2px solid #1A2A3F; }
    td.cs-z-out               { border-left: 2px solid #1A2A3F; }
    td.cs-z-act               { border-left: 1px solid #152035; }

    /* Cell base */
    .cs-table td, .cs-table th { padding: 6px 8px; vertical-align: middle; font-size: 0.8rem; color: #B8C8D8; }

    /* Name cell */
    .cs-name-cell  { display: flex; align-items: center; gap: 5px; }
    .cs-collapse-btn { background: none; border: none; cursor: pointer; color: #7A8A9A; font-size: 0.65rem; padding: 2px 3px; line-height: 1; flex-shrink: 0; transition: transform .15s; }
    .cs-collapse-btn.open   { transform: rotate(0deg); }
    .cs-collapse-btn.closed { transform: rotate(-90deg); }
    .cs-name-input { font-size: 0.82rem; font-weight: 600; color: #E8EDF2; border: 1px solid transparent; background: transparent; padding: 3px 6px; border-radius: 5px; width: 100%; font-family: inherit; box-sizing: border-box; min-width: 0; }
    .cs-name-input:hover { border-color: #1A2A3F; background: rgba(255,255,255,0.65); }
    .cs-name-input:focus  { outline: none; border-color: #00E5FF; background: #0D1B2A; color: #00B8D4; }
    .cs-name-input.plat   { font-weight: 500; }
    .cs-ch-indent   { width: 12px; flex-shrink: 0; display: inline-block; }
    .cs-plat-indent { width: 28px; flex-shrink: 0; display: inline-block; }

    /* Slider */
    input.cs-slider {
      -webkit-appearance: none; appearance: none;
      width: 100%; height: 5px; border-radius: 3px;
      cursor: pointer; outline: none; border: none; padding: 0; margin: 0; display: block;
    }
    input.cs-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%;
      background: #00E5FF; cursor: pointer; border: 2px solid white;
      box-shadow: 0 1px 5px rgba(0,229,255,0.5);
    }
    input.cs-slider::-moz-range-thumb {
      width: 15px; height: 15px; border-radius: 50%; background: #00E5FF;
      cursor: pointer; border: 2px solid white; box-shadow: 0 1px 5px rgba(0,229,255,0.5); box-sizing: border-box;
    }
    input.cs-slider.ch-sl::-webkit-slider-thumb { background: #26C6DA; box-shadow: 0 1px 5px rgba(59,130,246,0.5); }
    input.cs-slider.ch-sl::-moz-range-thumb     { background: #26C6DA; }
    input.cs-slider.pl-sl::-webkit-slider-thumb { background: #00BCD4; box-shadow: 0 1px 5px rgba(14,165,233,0.5); }
    input.cs-slider.pl-sl::-moz-range-thumb     { background: #00BCD4; }

    /* Pct + amount cells */
    .cs-pct-num { width: 100%; font-size: 0.82rem; text-align: right; border: 1px solid #1A2A3F; border-radius: 5px; padding: 3px 5px; font-family: inherit; color: #B8C8D8; background: #0D1B2A; box-sizing: border-box; }
    .cs-pct-num:focus { outline: none; border-color: #00E5FF; }
    .cs-amt-cell { font-size: 0.75rem; color: #A8B8C8; font-weight: 500; white-space: nowrap; }

    /* Allocation badge + rescale (c-alloc column) */
    .cs-alloc-cell { display: flex; align-items: center; gap: 4px; }

    /* Column header labels inside channel rows */
    th.cs-col-hdr {
      font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
      color: #7A8A9A; padding: 5px 8px; white-space: nowrap; vertical-align: middle;
    }

    /* Input cells */
    .cs-cell-inp {
      width: 100%; font-size: 0.8rem; border: 1px solid #1A2A3F; border-radius: 5px;
      padding: 4px 6px; color: #B8C8D8; background: #0D1B2A; font-family: inherit; box-sizing: border-box;
    }
    .cs-cell-inp:focus { outline: none; border-color: #00E5FF; }
    .cs-model-sel {
      width: 100%; font-size: 0.8rem; font-weight: 600; padding: 4px 5px; border-radius: 5px;
      border: 1px solid #1A2A3F; cursor: pointer; font-family: inherit; background: #0D1B2A; color: #B8C8D8; box-sizing: border-box;
    }
    .cs-model-sel:focus { outline: none; border-color: #00E5FF; }
    .cs-var-rate-btn {
      background: #0E1A2C; border: 1px solid #00838F; border-radius: 5px; color: #00E5FF;
      font-size: 0.75rem; font-weight: 600; padding: 3px 8px; cursor: pointer;
      font-family: inherit; transition: all 0.12s; white-space: nowrap;
    }
    .cs-var-rate-btn:hover { background: #002B36; border-color: #00E5FF; }

    /* ARPU / Mos in vertical rows */
    .cs-arpu-mos { display: flex; align-items: center; gap: 6px; }
    .cs-arpu-mos .cs-lbl { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: #7A8A9A; white-space: nowrap; }
    .cs-arpu-mos input { font-size: 0.8rem; text-align: right; border: 1px solid #1A2A3F; border-radius: 5px; padding: 3px 6px; color: #B8C8D8; background: #0D1B2A; font-family: inherit; width: 56px; box-sizing: border-box; }
    .cs-arpu-mos input:focus { outline: none; border-color: #00E5FF; }

    /* Outcomes cell */
    .cs-out-cell { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }

    /* Actions cell — always lock + remove */
    .cs-act-cell { display: flex; align-items: center; gap: 3px; justify-content: center; }

    /* Badges */
    .cs-badge-ok    { font-size: 0.69rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #002B36; color: #00838F; white-space: nowrap; }
    .cs-badge-over  { font-size: 0.69rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #1A0E05; color: #BF360C; white-space: nowrap; }
    .cs-badge-under { font-size: 0.69rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #1A1505; color: #BF6800; white-space: nowrap; }
    .cs-badge-empty { font-size: 0.69rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #0F1D2E; color: #7A8A9A; white-space: nowrap; }
    .cs-metric-badge { font-size: 0.69rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #001820; color: #00ACC1; white-space: nowrap; }
    .cs-metric-good  { font-size: 0.69rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #002B36; color: #00838F; white-space: nowrap; }
    .cs-metric-warn  { font-size: 0.69rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #1A1505; color: #BF6800; white-space: nowrap; }
    .cs-metric-na    { font-size: 0.67rem; color: #4A5A6F; font-style: italic; white-space: nowrap; padding: 2px 4px; }

    /* Buttons */
    /* Alloc-mode toggle (% vs £) */
    .cs-mode-toggle { display:inline-flex; border:1px solid #1A2A3F; border-radius:6px; overflow:hidden; }
    .cs-mode-toggle button { background:none; border:none; padding:4px 10px; font-size:0.75rem; font-weight:700; cursor:pointer; color: #7A8A9A; font-family:inherit; transition:all .12s; white-space:nowrap; }
    .cs-mode-toggle button.active { background:#00E5FF; color:#010E21; }
    .cs-mode-toggle button:hover:not(.active) { background:#0E1A2C; color:#00E5FF; }
    /* £ amount input — replaces slider in amt mode */
    .cs-amt-num { width:100%; font-size:0.8rem; text-align:right; border:1px solid #1A2A3F; border-radius:5px; padding:3px 6px; color: #B8C8D8; background: #0D1B2A; font-family:inherit; box-sizing:border-box; }
    .cs-amt-num:focus { outline:none; border-color:#00E5FF; }
    .cs-amt-num::-webkit-inner-spin-button { opacity: 0.3; }
    .cs-amt-num:hover::-webkit-inner-spin-button { opacity: 1; }
    .cs-pct-ro { font-size:0.72rem; color: #7A8A9A; white-space:nowrap; padding:6px 4px; }

    .cs-lock-btn { background: none; border: 1px solid #1A2A3F; border-radius: 4px; cursor: pointer; font-size: 0.72rem; padding: 2px 5px; color: #7A8A9A; line-height: 1; transition: all .12s; }
    .cs-lock-btn.locked { background: #002B36; border-color: #4DD0E1; color: #00ACC1; }
    .cs-lock-btn:hover   { background: #0F1D2E; }
    .cs-remove-btn { background: none; border: none; cursor: pointer; color: #4A5A6F; font-size: 0.8rem; padding: 2px 4px; border-radius: 4px; transition: all .12s; line-height: 1; }
    .cs-remove-btn:hover { color: #FF8A50; background: #1A0E05; }
    .cs-rescale-btn { font-size: 0.68rem; padding: 2px 6px; border-radius: 8px; border: 1px solid #00838F; color: #00ACC1; background: #0E1A2C; cursor: pointer; font-family: inherit; font-weight: 600; white-space: nowrap; transition: background .1s; }
    .cs-rescale-btn:hover { background: #002B36; }

    /* Add-row buttons */
    .cs-add-btn { display: block; width: 100%; text-align: left; padding: 7px 14px; font-size: 0.74rem; font-weight: 600; color: #00E5FF; background: none; border: none; cursor: pointer; transition: background .1s; }
    .cs-add-btn:hover { background: #0E1A2C; }
    .cs-ch-add-btn   { padding-left: 30px; }
    .cs-plat-add-btn { padding-left: 50px; color: #90A0B0; }
    .cs-plat-add-btn:hover { color: #00E5FF; background: #0E1A2C; }

    /* Footer totals row */
    .cs-total-inner { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 0.74rem; }
    .cs-budget-bar  { height: 3px; border-radius: 3px; background: #1A2A3F; overflow: hidden; flex: 1; min-width: 40px; }
    .cs-budget-fill { height: 100%; border-radius: 3px; transition: width .2s, background .2s; }
    .budget-card { background:linear-gradient(135deg,#006064,#00838F); border-radius:10px; padding:14px 16px; color:white; }
    .budget-card label { font-size:0.67rem; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; opacity:0.8; display:block; margin-bottom:6px; }
    .budget-card-row { display:flex; align-items:center; gap:4px; }
    .budget-currency { font-size:1.1rem; font-weight:700; }
    .budget-card .budget-input { background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); border-radius:6px; color:white; font-size:1.2rem; font-weight:700; padding:5px 8px; font-family:inherit; flex:1; min-width:0; }
    .budget-card .budget-input::placeholder { color:rgba(255,255,255,0.5); }
    .budget-card .budget-input:focus { outline:none; background:rgba(255,255,255,0.3); }

    /* ── Onboarding overlay ── */
    .onboard-backdrop {
      position: fixed; inset: 0; z-index: 8000;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(2px);
      transition: opacity .3s ease;
    }
    .onboard-backdrop.hidden { opacity: 0; pointer-events: none; }

    /* Elevate parent stacking contexts so children can sit above the backdrop */
    .onboard-elevate { position: relative; z-index: 8001; }

    .onboard-highlight {
      position: relative; z-index: 8001;
      box-shadow: 0 0 0 4px rgba(0,229,255,0.5), 0 0 24px rgba(0,229,255,0.25);
      border-radius: 12px;
      animation: onboard-pulse 2s ease-in-out infinite;
    }
    @keyframes onboard-pulse {
      0%, 100% { box-shadow: 0 0 0 4px rgba(0,229,255,0.5), 0 0 24px rgba(0,229,255,0.25); }
      50%      { box-shadow: 0 0 0 6px rgba(0,229,255,0.7), 0 0 32px rgba(0,229,255,0.4); }
    }

    .onboard-prompt {
      position: fixed; z-index: 8002;
      background: #0D1B2A; border-radius: 12px;
      padding: 18px 22px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,229,255,0.15);
      max-width: 320px; width: max-content;
      font-size: 0.88rem; color: #E8EDF2; line-height: 1.5;
      transition: opacity .25s ease, transform .25s ease;
    }
    .onboard-prompt.hidden { opacity: 0; transform: translateY(8px); pointer-events: none; }
    .onboard-prompt h3 {
      font-size: 0.82rem; font-weight: 700; color: #00E5FF;
      text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;
    }
    .onboard-prompt p { margin-bottom: 14px; color: #A8B8C8; font-size: 0.84rem; }
    .onboard-prompt .onboard-actions { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
    .onboard-btn {
      padding: 7px 18px; border-radius: 8px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; border: none; font-family: inherit; transition: all .12s;
    }
    .onboard-btn.primary { background: #00E5FF; color: #010E21; }
    .onboard-btn.primary:hover { background: #00B8D4; }
    .onboard-btn.primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .onboard-btn.skip { background: none; color: #7A8A9A; padding: 7px 10px; }
    .onboard-btn.skip:hover { color: #90A0B0; }

    .onboard-step-dots { display: flex; gap: 5px; align-items: center; }
    .onboard-dot { width: 7px; height: 7px; border-radius: 50%; background: #1A2A3F; transition: background .2s; }
    .onboard-dot.active { background: #00E5FF; }
    .onboard-dot.done { background: #00E5FF; }
  
</style>



<header>
  <div>
    <h1>📈 Marketing ROI Forecaster</h1>
    <p>Set per-channel budgets month by month — chart updates instantly</p>
  </div>
  <div class="header-controls">
    <select id="currencySelect" onchange="render()">
      <option value="£">£ GBP</option>
      <option value="$">$ USD</option>
      <option value="€">€ EUR</option>
    </select>
    <select id="startMonthSelect" onchange="onStartMonthChange(+this.value)" title="Which calendar month does Month 1 represent? Seasonality shapes will rotate to match.">
      <option value="0">Starts: January</option>
      <option value="1">Starts: February</option>
      <option value="2">Starts: March</option>
      <option value="3">Starts: April</option>
      <option value="4">Starts: May</option>
      <option value="5">Starts: June</option>
      <option value="6">Starts: July</option>
      <option value="7">Starts: August</option>
      <option value="8">Starts: September</option>
      <option value="9">Starts: October</option>
      <option value="10">Starts: November</option>
      <option value="11">Starts: December</option>
    </select>
    <div class="header-divider"></div>
    <div class="view-tabs" id="viewTabs">
      <button class="view-tab active" data-view="paid" onclick="switchView('paid')">Paid</button>
      <button class="view-tab" data-view="organic" onclick="switchView('organic')">Organic</button>
      <button class="view-tab" data-view="combined" onclick="switchView('combined')">Combined</button>
    </div>
    <div class="header-divider"></div>
    <button class="btn-header" onclick="exportJSON()" title="Download forecast as a .json file — share it or keep it as a backup">
      💾 Save
    </button>
    <label class="btn-header" title="Load a previously saved forecast .json file" style="cursor:pointer;">
      📂 Load
      <input type="file" accept=".json" onchange="importJSON(event)" style="display:none;" />
    </label>
    <button class="btn-header" onclick="exportToExcel()" title="Export forecast to Excel">
      📊 Export
    </button>
    <button class="btn-header reset" onclick="clearSavedState()" title="Clear auto-saved data and reset to defaults">
      ↺ Reset
    </button>
  </div>
</header>

<div class="save-toast" id="saveToast"></div>

<main>

  <!-- ═══ PAID VIEW ═══ -->
  <div id="viewPaid" class="view-container active">

  <!-- ── KPI Sidebar ── -->
  <aside class="kpi-sidebar">

    <div class="budget-card">
      <label>Annual Budget</label>
      <div class="budget-card-row">
        <span class="budget-currency" id="kpi-budget-sym">£</span>
        <input class="budget-input" type="number" min="0" step="1000"
          id="kpi-budget-input" placeholder="e.g. 120000"
          oninput="onBudgetInput(+this.value)" />
      </div>
    </div>

    <span class="kpi-sidebar-label">Performance</span>

    <div class="kpi indigo" id="kpi-spend-card">
      <label>Total 12-Month Spend</label>
      <div class="value" id="kpi-spend">—</div>
      <div id="kpi-spend-delta" style="display:none;margin-top:6px;padding-top:6px;border-top:1px dashed #1A2A3F;align-items:center;gap:6px;flex-wrap:wrap;">
        <span id="kpi-spend-badge" style="font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;"></span>
        
      </div>
    </div>

    <div class="kpi indigo">
      <label>Total Revenue Recognised</label>
      <div class="value" id="kpi-revenue">—</div>
      <div class="sub" id="kpi-rev-sub"></div>
      <div class="kpi-target-row">
        <span class="kpi-target-label">Target:</span>
        <input class="kpi-target-input" type="number" min="0" id="kpi-revenue-target"
          placeholder="e.g. 500000" oninput="setKpiTarget('revenue',+this.value)" />
      </div>
      <span class="kpi-target-badge" id="kpi-revenue-badge" style="display:none;cursor:pointer;"
        onclick="openBadgePopover('revenue',this)"></span>
    </div>

    <div class="kpi indigo">
      <label>Total Conversions</label>
      <div class="value" id="kpi-conversions">—</div>
      <div class="sub" id="kpi-conv-sub"></div>
      <div class="kpi-target-row">
        <span class="kpi-target-label">Target:</span>
        <input class="kpi-target-input" type="number" min="0" id="kpi-conversions-target"
          placeholder="e.g. 5000" oninput="setKpiTarget('conversions',+this.value)" />
      </div>
      <span class="kpi-target-badge" id="kpi-conversions-badge" style="display:none;cursor:pointer;"
        onclick="openBadgePopover('conversions',this)"></span>
    </div>

    <div class="kpi" id="kpi-cpa-wrap">
      <label>Avg CPA</label>
      <div class="value" id="kpi-cpa">—</div>
      <div class="sub" id="kpi-cpa-sub"></div>
      <div class="kpi-target-row">
        <span class="kpi-target-label">Max:</span>
        <input class="kpi-target-input" type="number" min="0" id="kpi-cpa-target"
          placeholder="e.g. 50" oninput="setKpiTarget('cpa',+this.value)" />
      </div>
      <span class="kpi-target-badge" id="kpi-cpa-badge" style="display:none;cursor:pointer;"
        onclick="openBadgePopover('cpa',this)"></span>
    </div>

    <div class="kpi" id="kpi-roi-wrap">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px;">
        <label id="kpi-roi-label">Net ROI (12 months)</label>
        <span class="roi-mode-toggle">
          <button class="roi-pill active" id="roi-pill-currency" onclick="setRoiMode('currency')" title="Net value (revenue − spend)">£</button>
          <button class="roi-pill" id="roi-pill-multiplier" onclick="setRoiMode('multiplier')" title="Revenue ÷ spend ratio (1× = breakeven)">×</button>
        </span>
      </div>
      <div class="value" id="kpi-roi">—</div>
    </div>

    <div class="kpi" id="kpi-be-wrap">
      <label>Breakeven Month</label>
      <div class="value" id="kpi-breakeven">—</div>
    </div>

    <div class="kpi" id="kpi-tail-wrap">
      <label class="toggle-wrap" style="align-items:flex-start;padding-top:2px;">
        <label class="toggle-switch" style="flex-shrink:0;margin-top:1px;">
          <input type="checkbox" id="tailToggle" onchange="onTailToggle()" />
          <span class="toggle-slider"></span>
        </label>
        <div class="tail-desc" style="margin:0;">
          <strong>Show revenue tail</strong>
          <p style="margin:0;">Extends forecast beyond month 12 to see remaining LTV revenue</p>
          <span class="tail-length-pill" id="tailLengthPill">—</span>
        </div>
      </label>
    </div>

  </aside>

  <!-- ── Main content panels ── -->
  <div class="app-main">

  <!-- ① Campaign Structure -->
  <div class="panel">
    <div class="panel-header">
      <div>
        <h2>Campaign Structure</h2>
        <p>Define verticals, channels and platforms — budget allocations cascade through the hierarchy</p>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="cs-mode-toggle">
          <button id="cs-mode-pct" class="active" onclick="setAllocMode('pct')" title="Input as % allocation">%</button>
          <button id="cs-mode-amt" onclick="setAllocMode('amt')" title="Input as £ amounts">£</button>
        </div>
        <button class="btn btn-secondary btn-sm" id="addVerticalBtn" onclick="addVertical()">+ Add Vertical</button>
      </div>
    </div>
    <div class="panel-body" id="campaignStructureBody" style="padding-top:10px;">
      <!-- rendered by renderCampaignStructure() -->
    </div>
  </div>

  <!-- ② Monthly Budget Phasing -->
  <div class="panel">
    <div class="panel-header">
      <div>
        <h2>Monthly Budget Phasing <span id="bp-global-badge" style="font-weight:400;color:#00E5FF;font-size:0.82rem;"></span></h2>
        <p id="bp-header-sub">Adjust how each platform's annual budget is spread across 12 months — drag bars to adjust, click to type a value, or apply seasonality presets</p>
      </div>
      <div class="bp-header-right">
        <label class="bp-mode-toggle">
          <input type="radio" name="bp-mode" value="abs" checked onchange="setPhasingMode('abs')">
          <span>£</span>
        </label>
        <label class="bp-mode-toggle">
          <input type="radio" name="bp-mode" value="pct" onchange="setPhasingMode('pct')">
          <span>%</span>
        </label>
        <span class="bp-total-badge" id="bp-total-badge">
          Total: <strong id="bp-total-value">—</strong>
        </span>
      </div>
    </div>
    <div class="panel-body">
      <!-- Main grid -->
      <div id="bpGridWrap" class="bp-grid-wrap"></div>
      <!-- Summary stacked bar chart below table -->
      <div id="bpSummaryWrap" class="bp-summary-wrap"></div>
    </div>
  </div>

  <!-- Compact Display module -->
  <div class="panel nn-panel" id="niceNumbersPanel">
    <div class="panel-header">
      <div>
        <h2>Compact Display</h2>
        <p>Show output figures in shorthand (e.g. 123k, 1.2M) for cleaner client-facing reports — your exact allocations are preserved</p>
      </div>
      <div class="nn-controls">
        <label class="nn-toggle-label">
          <div class="nn-toggle-track" id="nnToggleTrack" onclick="toggleNiceNumbers()">
            <div class="nn-toggle-thumb"></div>
          </div>
          <span class="nn-toggle-text" id="nnToggleText">Off</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Channel filter bar — controls panels ④ ⑤ ⑥ -->
  <div class="ch-filter-bar" id="channelFilterBar">
    <span class="ch-filter-label">View</span>
    <div class="ch-filter-pills" id="channelFilterPills"></div>
  </div>

  <!-- ③ Cumulative ROI Chart -->
  <div class="panel">
    <div class="panel-header">
      <div>
        <h2 id="chartTitle">Cumulative ROI — 12-Month View</h2>
        <p id="chartSubtitle">Running total of spend vs. revenue recognised — use the filter bar to show or hide individual channels</p>
      </div>
      <div id="breakevenBadge"></div>
    </div>
    <div class="panel-body">
      <div class="chart-wrap"><canvas id="roiChart"></canvas></div>
      <div class="legend-row" id="channelLegend"></div>
    </div>
  </div>

  <!-- ④ Monthly (Non-Cumulative) Chart -->
  <div class="panel">
    <div class="panel-header">
      <div>
        <h2>Monthly Spend &amp; Revenue</h2>
        <p id="monthlyChartSubtitle">Per-month spend and revenue — use the filter bar to show or hide individual channels</p>
      </div>
    </div>
    <div class="panel-body">
      <div class="chart-wrap"><canvas id="monthlyChart"></canvas></div>
    </div>
  </div>

  <!-- ⑤ Monthly Breakdown -->
  <div class="panel">
    <div class="panel-header">
      <div>
        <h2>Monthly Breakdown</h2>
        <p id="tableSubtitle">Month-by-month totals across all channels — filtered channels are excluded</p>
      </div>
    </div>
    <div class="panel-body table-wrap">
      <table class="monthly">
        <thead>
          <tr>
            <th>Month</th>
            <th>Spend</th>
            <th id="col-acquired">Conversions Acquired</th>
            <th id="col-revenue">Revenue Recognised</th>
            <th>Monthly Net</th>
            <th>Cumul. Spend</th>
            <th>Cumul. Revenue</th>
            <th id="col-cumnet">Cumul. Net ROI</th>
          </tr>
        </thead>
        <tbody id="monthlyBody"></tbody>
      </table>
    </div>
  </div>

  <!-- ⑥ KPI Summary by Vertical & Platform -->
  <div class="panel" id="kpiSummaryPanel">
    <div class="panel-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h2>KPI Summary</h2>
        <p id="kpiSummarySubtitle">Spend, conversions, revenue, CPA and ROAS by vertical and platform — respects the filter above</p>
      </div>
    </div>
    <div class="panel-body table-wrap">
      <table class="kpi-summary-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Annual Spend</th>
            <th>Conversions</th>
            <th>Revenue</th>
            <th>CPA</th>
            <th>ROAS</th>
          </tr>
        </thead>
        <tbody id="kpiSummaryBody"></tbody>
      </table>
    </div>
  </div>

  </div><!-- /.app-main -->

  </div><!-- /#viewPaid -->

  <!-- ═══ ORGANIC VIEW ═══ -->
  <div id="viewOrganic" class="view-container">

    <!-- Organic sidebar — summary stats -->
    <aside class="kpi-sidebar" id="orgSidebar">
      <span class="kpi-sidebar-label">Organic Summary</span>
      <div class="org-stat-card">
        <label>Keywords Imported</label>
        <div class="value" id="orgStatKeywords">0</div>
      </div>
      <div class="org-stat-card">
        <label>Verticals Detected</label>
        <div class="value" id="orgStatVerticals">0</div>
      </div>
      <div class="org-stat-card">
        <label>Total Monthly Search Vol.</label>
        <div class="value" id="orgStatSearchVol">0</div>
      </div>
      <div id="orgVerticalBreakdown"></div>
    </aside>

    <!-- Organic main content -->
    <div class="app-main">

      <!-- ① Keyword Import -->
      <div class="panel">
        <div class="panel-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h2>Keyword Import</h2>
            <p>Paste CSV data or upload a .csv / .xlsx file with columns: keyword, vertical, search_volume, current_rank</p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="org-btn" onclick="downloadKeywordTemplate()">📥 Template</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="org-import-zone" id="orgDropZone">
            <textarea id="orgCsvPaste" placeholder="keyword,vertical,search_volume,current_rank&#10;best online slots,Slots,12100,18&#10;sports betting sites,Sports Betting,22200,15&#10;..."></textarea>
            <div class="org-import-actions">
              <button class="org-btn primary" onclick="orgParseFromPaste()">Parse CSV</button>
              <label class="org-btn" style="cursor:pointer;">
                📂 Upload File
                <input type="file" accept=".csv,.xlsx,.xls" onchange="orgParseFromFile(event)" style="display:none;" />
              </label>
              <button class="org-btn danger" id="orgClearBtn" onclick="orgClearKeywords()" style="display:none;">✕ Clear</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ② Keyword Preview Table -->
      <div class="panel" id="orgPreviewPanel" style="display:none;">
        <div class="panel-header">
          <div>
            <h2>Keyword Preview</h2>
            <p id="orgPreviewSubtitle">Verify your imported data below</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="org-preview-wrap">
            <table class="org-preview-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Vertical</th>
                  <th>Search Volume</th>
                  <th>Current Rank</th>
                </tr>
              </thead>
              <tbody id="orgPreviewBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ③ Vertical Configuration -->
      <div class="panel" id="orgVertConfigPanel" style="display:none;">
        <div class="panel-header">
          <div>
            <h2>Vertical Configuration</h2>
            <p>Set conversion rate, ARPU, and rank trajectory shape per vertical</p>
          </div>
        </div>
        <div class="panel-body">
          <table class="org-vert-table">
            <thead>
              <tr>
                <th>Vertical</th>
                <th>Keywords</th>
                <th>CVR %</th>
                <th>ARPU</th>
                <th>Trajectory Shape</th>
              </tr>
            </thead>
            <tbody id="orgVertConfigBody"></tbody>
          </table>
        </div>
      </div>

      <!-- ④ CTR Curve -->
      <div class="panel" id="orgCtrPanel" style="display:none;">
        <div class="panel-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h2>CTR Curve</h2>
            <p>Click and drag across the chart to draw the click-through rate curve by Google ranking position</p>
          </div>
          <button class="org-btn" onclick="orgResetCtrCurve()">↺ Reset to Defaults</button>
        </div>
        <div class="panel-body">
          <div class="draw-bar-wrap" id="orgCtrBarWrap">
            <div class="draw-bar-container" id="orgCtrBarContainer"></div>
          </div>
        </div>
      </div>

      <!-- ⑤ Agency Fees -->
      <div class="panel" id="orgFeePanel" style="display:none;">
        <div class="panel-header">
          <div>
            <h2>Agency / SEO Fees</h2>
            <p>Monthly agency retainer — the cost side of the organic forecast</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="org-fee-grid" id="orgFeeGrid"></div>
          <div class="org-fee-helpers">
            <label>Set all to</label>
            <input type="number" id="orgFeeAllVal" min="0" step="100" placeholder="e.g. 5000" />
            <button class="org-btn" onclick="orgFeeSetAll()">Apply</button>
            <div class="header-divider" style="height:18px;margin:0 6px;"></div>
            <label>Months 1–</label>
            <input type="number" id="orgFeeSplitMonth" min="1" max="11" value="3" style="width:50px;" />
            <label>at</label>
            <input type="number" id="orgFeeSplitA" min="0" step="100" placeholder="e.g. 8000" />
            <label>rest at</label>
            <input type="number" id="orgFeeSplitB" min="0" step="100" placeholder="e.g. 5000" />
            <button class="org-btn" onclick="orgFeeSplit()">Apply Split</button>
          </div>
        </div>
      </div>

    </div><!-- /.app-main -->
  </div><!-- /#viewOrganic -->

  <!-- ═══ COMBINED VIEW ═══ -->
  <div id="viewCombined" class="view-container view-container--full">
    <div class="combined-placeholder">
      <h2>📊 Combined Results</h2>
      <p>Merged paid + organic revenue forecasts with filtering — coming in a later phase.</p>
    </div>
  </div>

</main>


<!-- ── KPI Popover ───────────────────────────────────────── -->
<div class="kpi-popover" id="kpiPopover" style="display:none;"></div>

<!-- ── Onboarding Overlay ────────────────────────────────── -->
<div class="onboard-backdrop hidden" id="onboardBackdrop"></div>
<div class="onboard-prompt hidden" id="onboardPrompt"></div>

<!-- ── LTV Modal ─────────────────────────────────────────── -->
<div id="ltvModalWrap"></div>

<script>
// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const MONTHS  = ['Month 1','Month 2','Month 3','Month 4','Month 5','Month 6','Month 7','Month 8','Month 9','Month 10','Month 11','Month 12'];
const COLOURS = ['#00E5FF','#26C6DA','#FF9100','#FF8A50','#4DD0E1','#00BCD4','#E040FB','#1DE9B6','#FF6D00','#76FF03'];

// Seasonality shape library — relative monthly weights (will be normalised to annual budget).
// Weights represent engagement / betting volume index, not just fixture count.
// Month 1=index 0 … Month 12=index 11
const SEASONALITY_SHAPES = {
  'Basic': {
    'Flat':         [1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0],
    'Ramp up':      [0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6],
    'Ramp down':    [1.6,1.5,1.4,1.3,1.2,1.1,1.0,0.9,0.8,0.7,0.6,0.5],
    'Front-loaded': [2.0,1.8,1.5,1.2,1.0,0.9,0.8,0.8,0.8,0.7,0.7,0.7],
    'Back-loaded':  [0.7,0.7,0.7,0.7,0.8,0.8,0.9,1.0,1.2,1.5,1.8,2.0],
    'Summer peak':  [0.7,0.7,0.8,0.9,1.1,1.5,1.6,1.5,1.1,0.9,0.7,0.6],
  },
  'USA Sports': {
    // Mean of NFL + NBA + MLB + March Madness
    'All sports (blended)': [0.90,1.05,1.05,1.13,0.95,1.00,0.60,0.65,0.95,1.30,0.95,1.00],
    // NFL: Jan/Feb playoffs & Super Bowl spike; Sep-Dec season build
    'NFL Season':    [1.5,2.0,0.5,0.5,0.5,0.5,0.6,0.7,1.4,1.3,1.4,1.5],
    // NBA: Oct-Jun season; Apr-Jun playoffs; Jun Finals peak
    'NBA Season':    [1.0,1.0,1.1,1.5,1.7,2.0,0.4,0.4,0.5,1.0,1.0,1.1],
    // MLB: Apr Opening Day → Oct World Series; winter quiet
    'MLB Season':    [0.4,0.4,0.6,1.0,0.9,0.9,0.9,1.0,1.2,2.0,0.5,0.4],
    // NCAA Basketball: huge March-April spike
    'March Madness': [0.7,0.8,2.0,1.5,0.7,0.6,0.5,0.5,0.7,0.9,0.9,1.0],
  },
  'Canadian Sports': {
    // Mean of NHL + CFL
    'All sports (blended)': [0.80,0.80,0.85,1.00,1.15,1.50,0.75,0.80,0.90,1.25,1.60,0.90],
    // NHL dominant in Canada; Apr-Jun Stanley Cup run is peak
    'NHL Season': [1.1,1.1,1.2,1.5,1.8,2.0,0.4,0.4,0.5,1.1,1.2,1.2],
    // CFL: Jun kick-off → Nov Grey Cup peak
    'CFL Season': [0.5,0.5,0.5,0.5,0.5,1.0,1.1,1.2,1.3,1.4,2.0,0.6],
  },
  'European Sports': {
    // Mean of Football + Champions League + F1 + Rugby
    'All sports (blended)': [0.75,1.25,1.53,1.38,1.45,0.73,0.63,1.00,1.08,1.15,1.28,0.80],
    // Football/Soccer: Aug-May season; Dec Boxing Day & Apr-May title run peaks
    'Football / Soccer':   [1.2,1.3,1.4,1.6,1.8,0.6,0.6,1.3,1.2,1.2,1.0,1.4],
    // UCL: Feb-May knockout stages dominate; group stage Sep-Nov moderate
    'Champions League':    [0.6,1.4,1.5,1.8,2.0,0.4,0.4,0.9,1.0,1.1,1.1,0.5],
    // F1: Mar-Nov; Sep-Oct title fight peak; summer break dip in Jul-Aug
    'Formula 1':           [0.4,0.5,1.2,1.2,1.2,1.2,0.8,1.1,1.3,1.4,1.2,0.4],
    // Rugby: Feb-Mar Six Nations + Nov Autumn Internationals
    'Rugby (6N + Autumn)': [0.8,1.8,2.0,0.9,0.8,0.7,0.7,0.7,0.8,0.9,1.8,0.9],
  },
  'Philippines Sports': {
    // Mean of PBA + UAAP + Boxing + Volleyball
    'All sports (blended)': [0.88,0.98,1.05,1.05,1.05,0.88,0.85,1.20,1.35,1.55,1.55,1.10],
    // PBA: 3 overlapping conferences year-round; Oct-Nov finals crunch
    'Basketball (PBA)': [1.3,1.2,1.2,1.0,1.1,1.1,1.2,1.3,1.3,1.6,1.8,1.5],
    // UAAP: Aug season-start → Nov/Dec finals
    'UAAP Season':      [0.6,0.6,0.6,0.6,0.6,0.6,0.6,1.3,1.5,1.8,2.0,1.2],
    // Boxing: Filipino card peaks in spring and fall
    'Boxing':           [0.8,0.9,1.0,1.1,1.2,1.1,0.9,1.0,1.2,1.3,1.1,0.9],
    // Volleyball PSL/V-League: Mar-May and Sep-Nov conference peaks
    'Volleyball (PSL)': [0.8,1.2,1.4,1.5,1.3,0.7,0.7,1.2,1.4,1.5,1.3,0.8],
  },
};

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// V14 DATA MODEL — 3-level hierarchy: vertical → channel → platform
// ─────────────────────────────────────────────────────────────

let totalBudget = 0;      // annual total, set in KPI bar
let allocMode   = 'amt';  // 'amt' = £ amount sliders, 'pct' = % sliders

// Verticals — top level. Holds ARPU + lifespan for all platforms beneath.
let verticals = [];
let vertNextId = 1;

// Channels — middle level, belong to a vertical
let channels = [];
let chNextId = 1;

// Platforms — leaf level. Holds spend metrics + monthly budgets.
let platforms = [];
let platNextId = 1;

// LTV / revenue recognition settings — now per-vertical
// Global tail toggle only
let tail = { enabled: false };
let roiMode    = 'multiplier';
let seasonSnap5       = false;
let seasonEditorOpen  = false;
let seasonDraftVals   = null;
let seasonLocked      = Array(12).fill(false);
let seasonActiveBar   = null;
let seasonEditorCat   = 'Basic';
let seasonEditorShape = null;

// Start month — 0-based calendar month offset (0=January, 6=July, etc.)
// Rotates seasonality shape weights so preset patterns align with the forecast start
let startMonth = 0;

// Custom shapes library — user-saved shapes, travels with the forecast config
// Each entry: { name: string, weights: number[12] } — weights in calendar-month order
let customShapes = [];

// Custom CPC/CPM shapes library — separate from budget shapes
// Each entry: { name: string, rates: number[12] } — rates in calendar-month order
let customCpcShapes = [];

// Nice Numbers — presentation rounding (output only, does not mutate real budgets)
let nnEnabled  = false;     // compact display mode (123k, 1.2M)

// KPI targets
let targets        = { conversions: 0, cpa: 0, revenue: 0 };
let lastKpiActuals = { conversions: 0, cpa: 0, revenue: 0 };

let roiChart = null;

// Budget spread chart state
let spreadLocked      = Array(12).fill(false);

// Budget phasing mode: 'abs' = absolute values (£), 'pct' = percentage of annual
let phasingMode = 'abs';
let bpRowLocked = new Set(); // platform IDs with locked rows
let bpCellLocked = new Set(); // "platId-monthIdx" keys for individually locked cells
let bpVertLocked = new Set(); // vertical IDs with locked verticals

// Phasing drag state
let phasingDragState = null;

// ─── Organic forecasting state ───
// Keywords imported from CSV/XLSX — each: { id, keyword, vertical, searchVolume, currentRank }
let orgKeywords  = [];
let orgNextId    = 1;
// Detected verticals — each: { id, name, cvr, arpu, trajectoryShape, trajectoryWeights[12]? }
// Auto-populated on keyword import, user can adjust CVR/ARPU/shape later
let orgVerticals = [];

// CTR curve — position (1-50) to CTR%. Global, applies to all keywords.
let orgCtrCurve = null; // Initialised by orgDefaultCtrCurve() on first use

// Agency fees — 12 monthly amounts
let orgAgencyFees = Array(12).fill(0);

// Platform filter for charts + monthly table. Empty = all shown.
let activeChannelFilter = new Set();
let monthlyChart = null;



// ─────────────────────────────────────────────────────────────
// CALCULATIONS
// ─────────────────────────────────────────────────────────────

function calcChannelMonth(ch, m) {
  const budget = ch.budgets[m] || 0;
  let impressions, clicks;
  const model = ch.model || 'cpc';
  const isCpcType = model === 'cpc' || model === 'var-cpc';
  const isVariable = model === 'var-cpc' || model === 'var-cpm';

  if (isCpcType) {
    // CPC / Var. CPC: budget buys clicks directly
    const rate = isVariable ? (ch.cpcRates?.[m] ?? ch.cpc ?? 0) : (ch.cpc || 0);
    clicks      = rate > 0 ? budget / rate : 0;
    impressions = (ch.ctr > 0) ? clicks / (ch.ctr / 100) : null;
  } else {
    // CPM / Var. CPM: impressions = budget × 1000 / cpmRate; CTR converts to clicks
    const rate = isVariable ? (ch.cpmRates?.[m] ?? ch.cpmRate ?? 0) : (ch.cpmRate || 0);
    impressions = rate > 0 ? budget * 1000 / rate : 0;
    clicks      = impressions * ((ch.ctr || 0) / 100);
  }
  const conversions = clicks * ((ch.cvr || 0) / 100);
  return { budget, impressions, clicks, conversions };
}

// Weighted average lifespan in months
// Average lifespan for a vertical's LTV config
function avgLifespanForVert(vert) {
  if (!vert || !vert.ltv) return 6;
  return (vert.ltv.pct3m/100)*3 + (vert.ltv.pct6m/100)*6 + (vert.ltv.pct12m/100)*12;
}

// ARPU is always entered as a monthly figure, so this helper just returns it directly.
function monthlyArpuForVert(arpu, vert) {
  return arpu;
}

// Returns the lifespan to use for a vertical:
//   - LTV on  → weighted average from cohort splits
//   - LTV off → per-vertical lifespan set by the user
function effectiveLifespanForVert(vert) {
  if (!vert) return 6;
  return vert.ltv?.enabled ? avgLifespanForVert(vert) : (vert.lifespan || 6);
}

// How many extra months of tail revenue exist after spend stops at month 12.
// Find the max lag + max lifespan across all LTV-enabled verticals
function tailLength() {
  let maxTail = 0;
  verticals.forEach(v => {
    if (v.ltv?.enabled) {
      const maxLs = (v.ltv.pct12m > 0 ? 12 : v.ltv.pct6m > 0 ? 6 : 3);
      const tl = v.ltv.lag + maxLs - 1;
      maxTail = Math.max(maxTail, tl);
    }
  });
  return maxTail;
}

// Check if any vertical has LTV enabled
function anyLtvEnabled() {
  return verticals.some(v => v.ltv?.enabled);
}

// Total forecast periods (spend months + optional tail)
function totalPeriods() {
  return (tail.enabled && anyLtvEnabled()) ? 12 + tailLength() : 12;
}

// Label for a given 0-based period index
function periodLabel(idx) {
  const monthNum = (idx % 12) + 1;
  const yr = Math.floor(idx / 12);
  return yr > 0 ? `Month ${monthNum} +${yr}yr` : `Month ${monthNum}`;
}

// Rotate 12-element calendar-month weights by startMonth offset.
// Calendar index `startMonth` becomes position 0.
// e.g. startMonth=6 (July): [Jan,Feb,...,Dec] → [Jul,Aug,...,Jun]
function rotateWeights(calWeights) {
  if (!startMonth) return calWeights; // no rotation needed for January start
  const n = calWeights.length;
  return calWeights.map((_, i) => calWeights[(i + startMonth) % n]);
}

// Inverse: convert position-order weights back to calendar-month order.
// Used when saving a custom shape from a platform's current distribution.
function unrotateWeights(posWeights) {
  if (!startMonth) return posWeights;
  const n = posWeights.length;
  return posWeights.map((_, i) => posWeights[(i - startMonth + n) % n]);
}

// Render the tail toggle pill in the KPI sidebar
function renderTailToggle() {
  const pill = document.getElementById('tailLengthPill');
  if (!pill) return;
  if (anyLtvEnabled()) {
    const tl = tailLength();
    pill.textContent = `Extends forecast by ${tl} month${tl !== 1 ? 's' : ''}`;
  } else {
    pill.textContent = 'LTV must be enabled on a vertical';
  }
}

// ─────────────────────────────────────────────────────────────
// FORECAST BUILDER
//
// When LTV mode is OFF:
//   Revenue is recognised in the same month as acquisition.
//   Each conversion is worth arpu × avg_lifespan (total LTV, lump-sum).
//
// When LTV mode is ON:
//   Revenue is spread across future months.
//   Customers acquired in month M start paying in month M + lag.
//   Each cohort pays ARPU per month for their lifespan:
//     3-month cohort  → months M+lag … M+lag+2
//     6-month cohort  → months M+lag … M+lag+5
//     12-month cohort → months M+lag … M+lag+11
//   Revenue falling beyond month 12 is tracked separately.
// ─────────────────────────────────────────────────────────────

function buildForecast(opts) {
  const skipFilter = opts?.skipFilter || false;
  const N = totalPeriods();

  // Enrich platforms with inherited arpu/lifespan/ltv from their vertical
  const enriched = platforms.map(plat => {
    const ch   = channels.find(c => c.id === plat.channelId);
    const vert = ch ? verticals.find(v => v.id === ch.vertId) : null;
    return {
      ...plat,
      arpu: vert?.arpu ?? 30,
      lifespan: vert?.lifespan ?? 6,
      vert: vert
    };
  });

  const spend = Array(N).fill(0);
  const convs = Array(N).fill(0);
  const convsByPlat = enriched.map(() => Array(N).fill(0));
  const spendByPlat = enriched.map(() => 0);

  const isFiltered = !skipFilter && activeChannelFilter.size > 0;
  enriched.forEach((plat, pi) => {
    if (isFiltered && !activeChannelFilter.has(plat.id)) return;
    for (let m = 0; m < 12; m++) {
      const c = calcChannelMonth(plat, m);
      spend[m] += c.budget;
      convs[m] += c.conversions;
      convsByPlat[pi][m] = c.conversions;
      spendByPlat[pi] += c.budget;
    }
  });

  const revenue = Array(N).fill(0);
  let revenueDeferred = 0;

  // Per-platform KPI tracking for KPI Summary table
  const byPlatform = new Map();
  const revByPlat = enriched.map(() => 0);
  const deferredByPlat = enriched.map(() => 0);

  enriched.forEach((plat, pi) => {
    if (isFiltered && !activeChannelFilter.has(plat.id)) return;
    const vert = plat.vert;
    if (!vert?.ltv?.enabled) {
      // LTV off: simple revenue = conversions × ARPU × lifespan (all same-month)
      for (let m = 0; m < 12; m++) {
        const rev = convsByPlat[pi][m] * monthlyArpuForVert(plat.arpu, vert) * effectiveLifespanForVert(vert);
        revenue[m] += rev;
        revByPlat[pi] += rev;
      }
    } else {
      // LTV on: spread revenue across months using cohort model
      const p3  = vert.ltv.pct3m  / 100;
      const p6  = vert.ltv.pct6m  / 100;
      const p12 = vert.ltv.pct12m / 100;
      const lag = vert.ltv.lag;
      const mArpu = monthlyArpuForVert(plat.arpu, vert);

      for (let m = 0; m < 12; m++) {
        const c = convsByPlat[pi][m];
        if (c === 0) continue;
        for (let k = lag; k < lag + 12; k++) {
          const active =
            p3  * (k < lag + 3  ? 1 : 0) +
            p6  * (k < lag + 6  ? 1 : 0) +
            p12 * (k < lag + 12 ? 1 : 0);
          if (active === 0) continue;
          const rev = c * mArpu * active;
          const f   = m + k;
          if (f < N) { revenue[f] += rev; revByPlat[pi] += rev; }
          else       { revenueDeferred += rev; deferredByPlat[pi] += rev; }
        }
      }
    }
  });

  // Build byPlatform map for KPI Summary consumption
  enriched.forEach((plat, pi) => {
    if (isFiltered && !activeChannelFilter.has(plat.id)) return;
    const totalConvs = convsByPlat[pi].reduce((a, b) => a + b, 0);
    byPlatform.set(plat.id, {
      spend: spendByPlat[pi],
      conversions: totalConvs,
      revenue: revByPlat[pi],
      revenueDeferred: deferredByPlat[pi]
    });
  });

  let cs = 0, cr = 0, cc = 0;
  const months = [];
  for (let i = 0; i < N; i++) {
    cs += spend[i]; cr += revenue[i]; cc += convs[i];
    months.push({
      month: i + 1,
      isTail: i >= 12,
      spend:          spend[i],
      revenue:        revenue[i],
      conversions:    convs[i],
      monthlyNet:     revenue[i] - spend[i],
      cumSpend:       cs,
      cumRevenue:     cr,
      cumConversions: cc,
      cumNet:         cr - cs,
    });
  }
  return { months, revenueDeferred, byPlatform };
}


// ─────────────────────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────────────────────

const sym   = ()    => document.getElementById('currencySelect').value;

// Compact display helper: 1234567 → "1.23M", 123456 → "123k", 4800 → "4.8k", 450 → "450"
function fmtCompactNum(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return String(v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, '') + 'M';
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return String(v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, '') + 'k';
  }
  return Math.round(abs).toLocaleString('en-GB');
}

const fmt   = (n, dp=0) => {
  if (nnEnabled && dp === 0) return sym() + fmtCompactNum(n);
  return sym() + Math.abs(n).toLocaleString('en-GB', {minimumFractionDigits:dp,maximumFractionDigits:dp});
};
const fmtS  = n => {
  if (nnEnabled) return (n >= 0 ? '+' : '−') + sym() + fmtCompactNum(n);
  return (n >= 0 ? '+' : '−') + sym() + Math.abs(Math.round(n)).toLocaleString('en-GB');
};
const fmtN  = n => {
  if (nnEnabled) return fmtCompactNum(n);
  return Math.round(n).toLocaleString('en-GB');
};

// ─────────────────────────────────────────────────────────────
// RENDER — CAMPAIGN STRUCTURE (3-level: vertical → channel → platform)
// ─────────────────────────────────────────────────────────────

// Live helpers — update slider fill + peer input without triggering a re-render
function csSliderLive(sl, color, peerId) {
  const val = +sl.value;
  const p   = Math.min(100, Math.max(0, val));
  sl.style.background = `linear-gradient(to right,${color} ${p}%,#1A2A3F ${p}%)`;
  const peer = document.getElementById(peerId);
  if (peer) peer.value = val;
}
function csNumLive(ni, color, sliderId) {
  const val = +ni.value || 0;
  const p   = Math.min(100, Math.max(0, val));
  const sl  = document.getElementById(sliderId);
  if (sl) {
    sl.value = Math.min(100, val);
    sl.style.background = `linear-gradient(to right,${color} ${p}%,#1A2A3F ${p}%)`;
  }
}
// Amount-mode slider live update — syncs the £ input and updates slider fill
function csAmtSliderLive(sl, color, peerId, maxAmt) {
  const val = +sl.value;
  const p   = maxAmt > 0 ? Math.min(100, val / maxAmt * 100) : 0;
  sl.style.background = `linear-gradient(to right,${color} ${p}%,#1A2A3F ${p}%)`;
  const peer = document.getElementById(peerId);
  if (peer) peer.value = val;
}
// Amount-mode number input live update — syncs the slider and updates its fill
function csAmtNumLive(ni, color, sliderId, maxAmt) {
  const val = Math.max(0, +ni.value || 0);
  const p   = maxAmt > 0 ? Math.min(100, val / maxAmt * 100) : 0;
  const sl  = document.getElementById(sliderId);
  if (sl) {
    sl.value = Math.min(maxAmt, val);
    sl.style.background = `linear-gradient(to right,${color} ${p}%,#1A2A3F ${p}%)`;
  }
}

// Choose a slider step that produces "nice" numbers for the given budget scale
function amtSliderStep(parentBudget) {
  if (parentBudget >= 500000) return 5000;
  if (parentBudget >= 100000) return 1000;
  if (parentBudget >= 50000)  return 500;
  if (parentBudget >= 10000)  return 100;
  if (parentBudget >= 1000)   return 50;
  return 10;
}

// Helper: renders slider+pct OR £amount+pct cells depending on allocMode
// amtFn: dedicated onchange for £-amount mode (no string surgery on updateFn)
function allocCells(slId, niId, val, color, slCls, updateFn, budget, parentBudget, amtFn) {
  const slBg = (v, c) => { const p=Math.min(100,Math.max(0,v)); return `linear-gradient(to right,${c} ${p}%,#1A2A3F ${p}%)`; };
  if (allocMode === 'amt') {
    const amtVal = budget > 0 ? Math.round(budget) : 0;
    const maxAmt = Math.max(1, Math.round(parentBudget));
    const step   = amtSliderStep(parentBudget);
    const pct    = maxAmt > 0 ? Math.min(100, amtVal / maxAmt * 100) : 0;
    const amtSlId = slId + '-amt';
    const amtNiId = niId + '-amt';
    return `<td><input type="range" class="cs-slider cs-amt-slider ${slCls}" id="${amtSlId}"
        min="0" max="${maxAmt}" step="${step}"
        value="${amtVal}" style="background:${slBg(pct,color)}"
        oninput="csAmtSliderLive(this,'${color}','${amtNiId}',${maxAmt})"
        onchange="${amtFn||''}"></td>
      <td><input type="number" class="cs-amt-num" id="${amtNiId}" min="0" max="${maxAmt}" step="${step}"
        value="${amtVal}" placeholder="0"
        oninput="csAmtNumLive(this,'${color}','${amtSlId}',${maxAmt})"
        onchange="${amtFn||''}"></td>`;
  } else {
    return `<td><input type="range" class="cs-slider ${slCls}" id="${slId}" min="0" max="100"
        value="${Math.min(100,val)}" style="background:${slBg(val,color)}"
        oninput="csSliderLive(this,'${color}','${niId}')"
        onchange="${updateFn}"></td>
      <td><input type="number" class="cs-pct-num" id="${niId}" min="0" step="1" value="${val}"
        oninput="csNumLive(this,'${color}','${slId}')"
        onchange="${updateFn}"></td>`;
  }
}

function renderCampaignStructure() {
  const container = document.getElementById('campaignStructureBody');
  if (!container) return;
  const currency = document.getElementById('currencySelect')?.value || '£';
  const fmt      = n => Math.round(n).toLocaleString();
  const fmtRate  = n => n >= 100 ? Math.round(n).toLocaleString() : n < 10 ? n.toFixed(2) : n.toFixed(1);

  const vertSum    = verticals.reduce((s, v) => s + (v.pct || 0), 0);
  const vertStatus = Math.abs(vertSum - 100) < 0.1 ? 'ok' : vertSum > 100 ? 'over' : 'under';

  const slBg = (val, color) => {
    const p = Math.min(100, Math.max(0, val));
    return `linear-gradient(to right,${color} ${p}%,#1A2A3F ${p}%)`;
  };

  // Colgroup — defined once, governs every row
  const colgroup = `<colgroup>
    <col class="c-name"><col class="c-slider"><col class="c-pct"><col class="c-amt"><col class="c-alloc"><col class="c-lock">
    <col class="c-model"><col class="c-rate"><col class="c-ctr"><col class="c-cvr">
    <col class="c-out"><col class="c-act">
  </colgroup>`;

  let rows = '';
  let firstVert = true;

  verticals.forEach(vert => {
    const vertBudget = totalBudget > 0 ? totalBudget * vert.pct / 100 : 0;
    const vertChs    = channels.filter(c => c.vertId === vert.id);
    const chSum      = vertChs.reduce((s, c) => s + (c.pct || 0), 0);
    const chStatus   = vertChs.length === 0 || Math.abs(chSum - 100) < 0.1 ? 'ok'
                       : chSum > 100 ? 'over' : 'under';

    // Spacer between vertical groups
    if (!firstVert) rows += `<tr class="cs-spacer-row"><td colspan="12"></td></tr>`;
    firstVert = false;

    // ── Vertical row ──
    rows += `<tr class="cs-vert-row">
      <td><div class="cs-name-cell">
        <button class="cs-collapse-btn ${vert.collapsed ? 'closed' : 'open'}"
          onclick="toggleCollapseVert(${vert.id})"
          title="${vert.collapsed ? 'Expand' : 'Collapse'}">${vert.collapsed ? '▶' : '▼'}</button>
        <input class="cs-name-input" value="${esc(vert.name)}"
          onchange="updateVertical(${vert.id},'name',this.value)" placeholder="Vertical name">
      </div></td>
      ${allocCells(`cs-sl-v-${vert.id}`,`cs-ni-v-${vert.id}`,vert.pct,'#00E5FF','',`updateVertical(${vert.id},'pct',+this.value)`,vertBudget,totalBudget,`updateVertAmt(${vert.id},+this.value)`)}
      <td class="cs-amt-cell">${allocMode === 'amt' ? vert.pct.toFixed(1) + '%' : (vertBudget > 0 ? currency + fmt(vertBudget) : '')}</td>
      <td><div class="cs-alloc-cell">
        ${vertChs.length > 0
          ? `<span class="cs-badge-${chStatus}" title="Channels sum: ${chSum.toFixed(1)}%">
               ${chStatus==='ok' ? '✓ chs' : chStatus==='over' ? '▲ '+chSum.toFixed(0)+'%' : '▼ '+chSum.toFixed(0)+'%'}
             </span>
             <button class="cs-rescale-btn" onclick="rescaleChannels(${vert.id})" title="Rescale channels to 100%">🎯</button>`
          : ''}
      </div></td>
      <td class="cs-lock-cell">
        <button class="cs-lock-btn${vert.locked ? ' locked' : ''}" onclick="toggleLockVert(${vert.id})"
          title="${vert.locked ? 'Unlock %' : 'Lock %'}">${vert.locked ? '🔒' : '🔓'}</button>
      </td>
      <td class="cs-z-inp" colspan="4"><div class="cs-arpu-mos">
        <span class="cs-lbl">ARPU</span>
        <input type="number" min="0" step="1"
          value="${vert.arpu || ''}"
          placeholder="30"
          title="Average monthly revenue per user (${currency})"
          onchange="updateVertical(${vert.id},'arpu',+this.value)">
        <span class="cs-lbl">Lifespan&nbsp;(mo)</span>
        <input type="number" min="1" step="1"
          value="${vert.ltv?.enabled ? avgLifespanForVert(vert).toFixed(1) : (vert.lifespan || '')}"
          placeholder="6"
          title="${vert.ltv?.enabled ? 'Weighted avg lifespan (set via LTV settings)' : 'Customer lifespan in months'}"
          ${vert.ltv?.enabled ? 'disabled class="cs-arpu-disabled"' : ''}
          onchange="updateVertical(${vert.id},'lifespan',+this.value)">
        <span class="cs-ltv-controls">
          <label class="cs-ltv-toggle" title="${vert.ltv?.enabled ? 'Disable advanced LTV modelling' : 'Enable advanced LTV modelling'}">
            <input type="checkbox" ${vert.ltv?.enabled ? 'checked' : ''} onchange="toggleVertLtv(${vert.id})">
            <span class="cs-ltv-slider"></span>
          </label>
          <button class="cs-ltv-gear" onclick="openLtvModal(${vert.id})" title="LTV settings">⚙</button>
        </span>
      </div></td>
      <td class="cs-z-out"></td>
      <td class="cs-z-act"><div class="cs-act-cell">
        <button class="cs-remove-btn" onclick="removeVertical(${vert.id})" title="Remove vertical">✕</button>
      </div></td>
    </tr>`;

    if (!vert.collapsed) {
      vertChs.forEach(ch => {
        const chBudget = totalBudget > 0 ? totalBudget * vert.pct / 100 * ch.pct / 100 : 0;
        const chPlats    = platforms.filter(p => p.channelId === ch.id);
        const platSum    = chPlats.reduce((s, p) => s + (p.pct || 0), 0);
        const platStatus = chPlats.length === 0 || Math.abs(platSum - 100) < 0.1 ? 'ok'
                           : platSum > 100 ? 'over' : 'under';

        // ── Channel row — input cells double as column headers ──
        rows += `<tr class="cs-ch-row">
          <td><div class="cs-name-cell">
            <span class="cs-ch-indent"></span>
            <button class="cs-collapse-btn ${ch.collapsed ? 'closed' : 'open'}"
              onclick="toggleCollapseCh(${ch.id})"
              title="${ch.collapsed ? 'Expand' : 'Collapse'}">${ch.collapsed ? '▶' : '▼'}</button>
            <input class="cs-name-input" value="${esc(ch.name)}"
              onchange="updateChannel(${ch.id},'name',this.value)" placeholder="Channel name">
          </div></td>
          ${allocCells(`cs-sl-c-${ch.id}`,`cs-ni-c-${ch.id}`,ch.pct,'#26C6DA','ch-sl',`updateChannel(${ch.id},'pct',+this.value)`,chBudget,vertBudget,`updateChAmt(${ch.id},+this.value)`)}
          <td class="cs-amt-cell">${allocMode === 'amt' ? ch.pct.toFixed(1) + '%' : (chBudget > 0 ? currency + fmt(chBudget) : '')}</td>
          <td><div class="cs-alloc-cell">
            ${chPlats.length > 0
              ? `<span class="cs-badge-${platStatus}" title="Platforms sum: ${platSum.toFixed(1)}%">
                   ${platStatus==='ok' ? '✓ plats' : platStatus==='over' ? '▲ '+platSum.toFixed(0)+'%' : '▼ '+platSum.toFixed(0)+'%'}
                 </span>
                 <button class="cs-rescale-btn" onclick="rescalePlatforms(${ch.id})" title="Rescale platforms to 100%">🎯</button>`
              : ''}
          </div></td>
          <td class="cs-lock-cell">
            <button class="cs-lock-btn${ch.locked ? ' locked' : ''}" onclick="toggleLockCh(${ch.id})"
              title="${ch.locked ? 'Unlock %' : 'Lock %'}">${ch.locked ? '🔒' : '🔓'}</button>
          </td>
          <th class="cs-col-hdr cs-z-inp">Model</th>
          <th class="cs-col-hdr">Rate</th>
          <th class="cs-col-hdr">CTR %</th>
          <th class="cs-col-hdr">CVR %</th>
          <td class="cs-z-out"></td>
          <td class="cs-z-act"><div class="cs-act-cell">
            <button class="cs-remove-btn" onclick="removeChannel(${ch.id})" title="Remove channel">✕</button>
          </div></td>
        </tr>`;

        if (!ch.collapsed) {
          chPlats.forEach(plat => {
            const platBudget = totalBudget > 0
              ? totalBudget * vert.pct / 100 * ch.pct / 100 * plat.pct / 100 : 0;
            const model = plat.model || 'cpc';
            const isCpcType = model === 'cpc' || model === 'var-cpc';
            const isVariable = model === 'var-cpc' || model === 'var-cpm';

            // Compute CPA / ROAS — for variable models use average of 12 rates
            let convs = 0;
            if (platBudget > 0) {
              if (isCpcType) {
                const rate = isVariable
                  ? (plat.cpcRates ? plat.cpcRates.reduce((a,b)=>a+b,0)/12 : plat.cpc)
                  : (plat.cpc || 0);
                if (rate > 0 && plat.cvr > 0) convs = (platBudget / rate) * (plat.cvr / 100);
              } else {
                const rate = isVariable
                  ? (plat.cpmRates ? plat.cpmRates.reduce((a,b)=>a+b,0)/12 : plat.cpmRate)
                  : (plat.cpmRate || 0);
                if (rate > 0 && plat.ctr > 0 && plat.cvr > 0) convs = (platBudget / rate * 1000) * (plat.ctr / 100) * (plat.cvr / 100);
              }
            }
            let cpaHtml  = `<span class="cs-metric-na">CPA —</span>`;
            let roasHtml = `<span class="cs-metric-na">ROAS —</span>`;
            if (convs > 0) {
              const cpaVal = platBudget / convs;
              const cpaTarget = targets.cpa || 0;
              const cpaCls = (cpaTarget > 0 && cpaVal > cpaTarget) ? 'cs-metric-warn' : 'cs-metric-badge';
              cpaHtml = `<span class="${cpaCls}" title="${fmt(Math.round(convs))} conversions">${currency}${fmtRate(cpaVal)} CPA</span>`;
              const ltv = (vert.arpu || 0) * (vert.lifespan || 1);
              if (ltv > 0) {
                const roasVal = (convs * ltv) / platBudget;
                const rCls   = roasVal >= 2 ? 'cs-metric-good' : roasVal >= 1 ? 'cs-metric-badge' : 'cs-metric-warn';
                roasHtml = `<span class="${rCls}" title="LTV-based ROAS">${roasVal.toFixed(2)}× ROAS</span>`;
              }
            }

            // ── Platform row ──
            rows += `<tr class="cs-plat-row">
              <td><div class="cs-name-cell">
                <span class="cs-plat-indent"></span>
                <input class="cs-name-input plat" value="${esc(plat.name)}"
                  onchange="updatePlatform(${plat.id},'name',this.value)" placeholder="Platform name">
              </div></td>
              ${allocCells(`cs-sl-p-${plat.id}`,`cs-ni-p-${plat.id}`,plat.pct,'#00BCD4','pl-sl',`updatePlatform(${plat.id},'pct',+this.value)`,platBudget,chBudget,`updatePlatAmt(${plat.id},+this.value)`)}
              <td class="cs-amt-cell">${allocMode === 'amt' ? plat.pct.toFixed(1) + '%' : (platBudget > 0 ? currency + fmt(platBudget) : '')}</td>
              <td></td>
              <td class="cs-lock-cell">
                <button class="cs-lock-btn${plat.locked ? ' locked' : ''}" onclick="toggleLockPlat(${plat.id})"
                  title="${plat.locked ? 'Unlock %' : 'Lock %'}">${plat.locked ? '🔒' : '🔓'}</button>
              </td>
              <td class="cs-z-inp"><select class="cs-model-sel"
                onchange="switchPlatModel(${plat.id},this.value)">
                <option value="cpc"${model === 'cpc' ? ' selected' : ''}>CPC</option>
                <option value="cpm"${model === 'cpm' ? ' selected' : ''}>CPM</option>
                <option value="var-cpc"${model === 'var-cpc' ? ' selected' : ''}>Var. CPC</option>
                <option value="var-cpm"${model === 'var-cpm' ? ' selected' : ''}>Var. CPM</option>
              </select></td>
              <td>${isVariable
                ? `<button class="cs-var-rate-btn" onclick="openCpcEditor(${plat.id})" title="Edit monthly ${isCpcType ? 'CPC' : 'CPM'} rates">Variable ▾</button>`
                : `<div style="display:flex;align-items:center;gap:2px;"><span style="font-size:0.75rem;color:#7A8A9A;font-weight:600;flex-shrink:0;">${currency}</span><input class="cs-cell-inp" type="number" min="0" step="0.01"
                value="${isCpcType ? (plat.cpc||'') : (plat.cpmRate||'')}"
                placeholder="${isCpcType ? '1.50' : '10.00'}"
                title="${isCpcType ? 'Cost per click' : 'Cost per thousand impressions'}"
                onchange="updatePlatform(${plat.id},'${isCpcType ? 'cpc' : 'cpmRate'}',+this.value)"></div>`
              }</td>
              <td><input class="cs-cell-inp" type="number" min="0" step="0.1"
                value="${plat.ctr||''}" placeholder="—"
                title="Click-through rate %"
                onchange="updatePlatform(${plat.id},'ctr',+this.value)"></td>
              <td><input class="cs-cell-inp" type="number" min="0" step="0.1"
                value="${plat.cvr||''}" placeholder="—"
                title="Conversion rate %"
                onchange="updatePlatform(${plat.id},'cvr',+this.value)"></td>
              <td class="cs-z-out"><div class="cs-out-cell">${cpaHtml}${roasHtml}</div></td>
              <td class="cs-z-act"><div class="cs-act-cell">
                <button class="cs-remove-btn" onclick="removePlatform(${plat.id})" title="Remove platform">✕</button>
              </div></td>
            </tr>`;
          });

          rows += `<tr class="cs-add-row"><td colspan="12">
            <button class="cs-add-btn cs-plat-add-btn" onclick="addPlatform(${ch.id})">+ Add Platform</button>
          </td></tr>`;
        }
      });

      rows += `<tr class="cs-add-row"><td colspan="12">
        <button class="cs-add-btn cs-ch-add-btn" onclick="addChannel(${vert.id})">+ Add Channel</button>
      </td></tr>`;
    }
  });

  // Footer totals row
  const footerContent = `
    <div class="cs-total-inner">
      <span style="font-weight:600;">Verticals total:</span>
      <span class="cs-badge-${vertStatus}">${vertSum.toFixed(1)}%${vertStatus==='ok' ? ' ✓' : vertStatus==='over' ? ' ▲' : ' ▼'}</span>
      <button class="cs-rescale-btn" onclick="rescaleVerticals()">🎯 to 100%</button>
      ${totalBudget > 0
        ? `<span style="margin-left:auto;font-size:0.75rem;color:#475569;font-weight:500;">${currency}${Math.round(totalBudget).toLocaleString()} total budget</span>`
        : ''}
    </div>`;

  // Shortcut buttons — quick-add typical vertical templates
  const presetNames = ['Casino', 'Sports', 'Lottery'];
  const existingNames = verticals.map(v => v.name.toLowerCase());
  const presetBtns = presetNames
    .filter(name => !existingNames.includes(name.toLowerCase()))
    .map(name => `<button class="cs-preset-btn" onclick="addVerticalPreset('${name}')">+ Add ${name}</button>`)
    .join('');
  const presetBar = presetBtns
    ? `<div class="cs-preset-bar">${presetBtns}</div>`
    : '';

  const html = `${presetBar}<table class="cs-table">${colgroup}<tbody>${rows}</tbody>
    <tfoot><tr class="cs-footer-row"><td colspan="12" style="padding:8px 14px;">${footerContent}</td></tr></tfoot>
  </table>`;

  container.innerHTML = html;
}


// BUDGET CASCADE
// ─────────────────────────────────────────────────────────────

function onBudgetInput(val) {
  totalBudget = (isNaN(val) || val < 0) ? 0 : val;
  // Sync currency symbol in KPI budget card
  const sym   = document.getElementById('currencySelect')?.value || '£';
  const symEl = document.getElementById('kpi-budget-sym');
  if (symEl) symEl.textContent = sym;
  applyBudgetsFromHierarchy();
  refreshForecast();
  saveToLocalStorage();   // ← fix: persist budget change immediately
}

function setAllocMode(mode) {
  allocMode = mode;
  document.getElementById('cs-mode-pct')?.classList.toggle('active', mode === 'pct');
  document.getElementById('cs-mode-amt')?.classList.toggle('active', mode === 'amt');
  renderCampaignStructure();
  saveToLocalStorage();
}

// Returns the normalised seasonal weights for a platform (custom or global).
// Weights are rotated by startMonth so calendar shapes align with the forecast period.
function platShapeNorm(plat, defaultNorm) {
  if (!plat.customShape) return defaultNorm;
  // Custom shapes store weights inline; built-in presets look up SEASONALITY_SHAPES
  let cw;
  if (plat.customShape.weights) {
    cw = plat.customShape.weights;
  } else {
    cw = SEASONALITY_SHAPES[plat.customShape.cat]?.[plat.customShape.shape];
  }
  if (!cw) return defaultNorm;
  const rotated = rotateWeights(cw);
  const cs = rotated.reduce((a, b) => a + b, 0);
  return rotated.map(w => w / cs);
}

// ─────────────────────────────────────────────────────────────
// BUDGET HELPERS
// ─────────────────────────────────────────────────────────────

// Generic rescale: normalises pct values for unlocked items so
// they fill the space left by locked ones (summing to 100%).
function rescaleGroup(items, lockedKey, pctKey) {
  const unlocked    = items.filter(x => !x[lockedKey]);
  const lockedSum   = items.filter(x => x[lockedKey]).reduce((s, x) => s + (x[pctKey]||0), 0);
  const remaining   = Math.max(0, 100 - lockedSum);
  const unlockedSum = unlocked.reduce((s, x) => s + (x[pctKey]||0), 0);
  if (!unlocked.length) return;
  if (unlockedSum === 0) {
    const eq = remaining / unlocked.length;
    unlocked.forEach(x => { x[pctKey] = +eq.toFixed(2); });
  } else {
    unlocked.forEach(x => { x[pctKey] = +(x[pctKey] * remaining / unlockedSum).toFixed(2); });
  }
  // Correct residual rounding error on the last unlocked item
  const total = items.reduce((s, x) => s + (x[pctKey]||0), 0);
  if (Math.abs(total - 100) > 0.01 && unlocked.length)
    unlocked[unlocked.length - 1][pctKey] =
      +((unlocked[unlocked.length - 1][pctKey] + (100 - total)).toFixed(2));
}

// £-amount input handlers — convert entered amount to pct and
// delegate to the normal pct update path so everything stays in sync.
function updateVertAmt(vertId, amtVal) {
  const pct = totalBudget > 0 ? Math.min(100, Math.max(0, amtVal / totalBudget * 100)) : 0;
  updateVertical(vertId, 'pct', pct);
}
function updateChAmt(chId, amtVal) {
  const ch   = channels.find(c => c.id === chId);
  const vert = ch && verticals.find(v => v.id === ch.vertId);
  const parent = vert ? totalBudget * vert.pct / 100 : 0;
  const pct  = parent > 0 ? Math.min(100, Math.max(0, amtVal / parent * 100)) : 0;
  updateChannel(chId, 'pct', pct);
}
function updatePlatAmt(platId, amtVal) {
  const plat = platforms.find(p => p.id === platId);
  const ch   = plat && channels.find(c => c.id === plat.channelId);
  const vert = ch   && verticals.find(v => v.id === ch.vertId);
  const parent = (vert && ch) ? totalBudget * vert.pct / 100 * ch.pct / 100 : 0;
  const pct  = parent > 0 ? Math.min(100, Math.max(0, amtVal / parent * 100)) : 0;
  updatePlatform(platId, 'pct', pct);
}

function applyBudgetsFromHierarchy() {
  if (totalBudget <= 0) return;
  const catEl     = document.getElementById('seasonCatSelect');
  const shapeEl   = document.getElementById('seasonShapeSelect');
  const catName   = catEl?.value   || 'Basic';
  const shapeName = shapeEl?.value || 'Flat';
  const calW      = SEASONALITY_SHAPES[catName]?.[shapeName] || Array(12).fill(1);
  const rawW      = rotateWeights(calW);
  const wSum      = rawW.reduce((a, b) => a + b, 0);
  const norm      = rawW.map(w => w / wSum);
  const snap      = seasonSnap5 ? 5 : 1;

  verticals.forEach(vert => {
    const vertBudget = totalBudget * vert.pct / 100;
    channels.filter(c => c.vertId === vert.id).forEach(ch => {
      const chBudget = vertBudget * ch.pct / 100;
      platforms.filter(p => p.channelId === ch.id).forEach(plat => {
        const platBudget = Math.round(chBudget * plat.pct / 100);
        const currentAnnual = plat.budgets.reduce((a, b) => a + (b||0), 0);

        if (currentAnnual > 0) {
          // Preserve existing monthly shape — scale proportionally
          const norm12 = plat.budgets.map(b => (b||0) / currentAnnual);
          plat.budgets = distributeWeighted(platBudget, norm12, snap);
        } else {
          // No existing shape — apply seasonality preset
          plat.budgets = distributeWeighted(platBudget, platShapeNorm(plat, norm), snap);
        }
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────
// CAMPAIGN STRUCTURE — MUTATIONS
// ─────────────────────────────────────────────────────────────

function addVertical() {
  const id    = vertNextId++;
  const chId  = chNextId++;
  const platId = platNextId++;
  verticals.push({
    id, name: 'New Vertical', pct: 0, arpu: 30, lifespan: 6, locked: false, collapsed: false,
    ltv: {
      enabled: false, lag: 1, pct3m: 30, pct6m: 50, pct12m: 20
    }
  });
  channels.push({ id: chId, vertId: id, name: 'New Channel', pct: 100, locked: false, collapsed: false });
  platforms.push({ id: platId, channelId: chId, name: 'Default Platform', pct: 100,
    model: 'cpc', cpc: 1.50, ctr: 3.0, cvr: 3.0, locked: false, customShape: null,
    budgets: Array(12).fill(0) });
  render();
}

const VERTICAL_PRESETS = {
  Casino: {
    arpu: 150, lifespan: 12,
    ltv: {
      enabled: false, lag: 1, pct3m: 30, pct6m: 50, pct12m: 20
    },
    channels: [
      { name: 'Paid Search', pct: 60, platforms: [
        { name: 'Google Ads',    pct: 70, model: 'cpc', cpc: 2.50, ctr: 3.0, cvr: 4.5 },
        { name: 'Microsoft Ads', pct: 30, model: 'cpc', cpc: 1.80, ctr: 2.5, cvr: 3.8 },
      ]},
      { name: 'Paid Social', pct: 40, platforms: [
        { name: 'Meta Ads',   pct: 60, model: 'cpm', cpmRate: 12.0, ctr: 1.5, cvr: 3.2 },
        { name: 'TikTok Ads', pct: 40, model: 'cpm', cpmRate: 8.0,  ctr: 1.2, cvr: 2.5 },
      ]},
    ],
  },
  Sports: {
    arpu: 80, lifespan: 8,
    ltv: {
      enabled: false, lag: 1, pct3m: 30, pct6m: 50, pct12m: 20
    },
    channels: [
      { name: 'Paid Search', pct: 60, platforms: [
        { name: 'Google Ads',    pct: 80, model: 'cpc', cpc: 2.20, ctr: 3.5, cvr: 5.0 },
        { name: 'Microsoft Ads', pct: 20, model: 'cpc', cpc: 1.50, ctr: 2.8, cvr: 4.2 },
      ]},
      { name: 'Paid Social', pct: 40, platforms: [
        { name: 'Meta Ads',   pct: 60, model: 'cpm', cpmRate: 10.0, ctr: 1.8, cvr: 4.0 },
        { name: 'TikTok Ads', pct: 40, model: 'cpm', cpmRate: 7.0,  ctr: 1.0, cvr: 2.8 },
      ]},
    ],
  },
  Lottery: {
    arpu: 25, lifespan: 6,
    ltv: {
      enabled: false, lag: 1, pct3m: 30, pct6m: 50, pct12m: 20
    },
    channels: [
      { name: 'Paid Search', pct: 60, platforms: [
        { name: 'Google Ads',    pct: 70, model: 'cpc', cpc: 0.90, ctr: 2.0, cvr: 3.0 },
        { name: 'Microsoft Ads', pct: 30, model: 'cpc', cpc: 0.65, ctr: 1.8, cvr: 2.5 },
      ]},
      { name: 'Display', pct: 40, platforms: [
        { name: 'GDN',   pct: 60, model: 'cpm', cpmRate: 2.50, ctr: 0.3, cvr: 1.5 },
        { name: 'DV360', pct: 40, model: 'cpm', cpmRate: 5.00, ctr: 0.5, cvr: 2.0 },
      ]},
    ],
  },
};

function addVerticalPreset(name) {
  const preset = VERTICAL_PRESETS[name];
  if (!preset) return;
  const vertId = vertNextId++;
  verticals.push({
    id: vertId, name, pct: 0, arpu: preset.arpu, lifespan: preset.lifespan, locked: false, collapsed: false,
    ltv: { ...preset.ltv }
  });
  preset.channels.forEach(ch => {
    const chId = chNextId++;
    channels.push({ id: chId, vertId, name: ch.name, pct: ch.pct, locked: false, collapsed: false });
    ch.platforms.forEach(plat => {
      const platId = platNextId++;
      platforms.push({
        id: platId, channelId: chId, name: plat.name, pct: plat.pct,
        model: plat.model,
        cpc: plat.cpc || 0, cpmRate: plat.cpmRate || 0,
        ctr: plat.ctr, cvr: plat.cvr,
        locked: false, customShape: null, budgets: Array(12).fill(0),
      });
    });
  });
  render();
}

function removeVertical(vertId) {
  if (!confirm('Remove this vertical and all its channels and platforms?')) return;
  verticals = verticals.filter(v => v.id !== vertId);
  const chIds = channels.filter(c => c.vertId === vertId).map(c => c.id);
  channels  = channels.filter(c => c.vertId !== vertId);
  platforms = platforms.filter(p => !chIds.includes(p.channelId));
  render();
}

function updateVertical(vertId, field, value) {
  const vert = verticals.find(v => v.id === vertId);
  if (!vert) return;
  vert[field] = value;
  if ((field === 'pct') && totalBudget > 0) applyBudgetsFromHierarchy();
  refreshForecast();
}

function toggleLockVert(vertId) {
  const vert = verticals.find(v => v.id === vertId);
  if (vert) { vert.locked = !vert.locked; renderCampaignStructure(); }
}

function toggleCollapseVert(vertId) {
  const vert = verticals.find(v => v.id === vertId);
  if (vert) { vert.collapsed = !vert.collapsed; renderCampaignStructure(); }
}

// ── Per-Vertical LTV Toggle & Modal ──

let ltvModalVertId = null;

function toggleVertLtv(vertId) {
  const vert = verticals.find(v => v.id === vertId);
  if (!vert) return;
  if (!vert.ltv) vert.ltv = { enabled: false, lag: 1, pct3m: 30, pct6m: 50, pct12m: 20 };
  vert.ltv.enabled = !vert.ltv.enabled;
  render();
}

function openLtvModal(vertId) {
  ltvModalVertId = vertId;
  renderLtvModal();
}

function closeLtvModal() {
  ltvModalVertId = null;
  document.getElementById('ltvModalWrap').innerHTML = '';
  render();
}

function renderLtvModal() {
  const wrap = document.getElementById('ltvModalWrap');
  if (!wrap || ltvModalVertId === null) { if (wrap) wrap.innerHTML = ''; return; }
  const vert = verticals.find(v => v.id === ltvModalVertId);
  if (!vert) { wrap.innerHTML = ''; return; }
  if (!vert.ltv) vert.ltv = { enabled: false, lag: 1, pct3m: 30, pct6m: 50, pct12m: 20 };
  const l = vert.ltv;
  const currency = document.getElementById('currencySelect')?.value || '£';

  const sum = l.pct3m + l.pct6m + l.pct12m;
  const sumOk = Math.abs(sum - 100) < 0.5;
  const avgLs = (l.pct3m/100)*3 + (l.pct6m/100)*6 + (l.pct12m/100)*12;
  const mArpu = vert.arpu || 0;

  const lagPills = [0,1,2].map(n =>
    `<button class="ltv-modal-pill${l.lag === n ? ' active' : ''}" onclick="setVertLtvLag(${vert.id},${n})">${n === 0 ? 'Same month (0)' : n + ' month' + (n>1?'s':'') + ' later'}</button>`
  ).join('');


  wrap.innerHTML = `<div class="ltv-modal-overlay" onclick="if(event.target===this)closeLtvModal()">
    <div class="ltv-modal">
      <div class="ltv-modal-header">
        <h3>LTV Settings — ${esc(vert.name)}</h3>
        <button class="ltv-modal-close" onclick="closeLtvModal()">✕</button>
      </div>
      <div class="ltv-modal-body">
        <div class="ltv-modal-section">
          <span class="ltv-modal-label">Revenue recognition lag</span>
          <p class="ltv-modal-sublabel">How many months after acquisition does revenue first appear?</p>
          <div class="ltv-modal-pills">${lagPills}</div>
        </div>
        <div class="ltv-modal-section">
          <span class="ltv-modal-label">Customer lifetime mix</span>
          <table class="ltv-cohort-table">
            <thead><tr><th>Lifespan</th><th>% of customers</th><th class="right">Months</th><th class="right">LTV / customer</th></tr></thead>
            <tbody>
              <tr>
                <td>3 months</td>
                <td><input class="ltv-cohort-input" type="number" min="0" max="100" value="${l.pct3m}" oninput="setVertCohort(${vert.id},'pct3m',+this.value)"> %</td>
                <td class="right" style="color:#64748b;">× 3</td>
                <td class="right">${mArpu > 0 ? currency + (mArpu * 3).toFixed(0) : '—'}</td>
              </tr>
              <tr>
                <td>6 months</td>
                <td><input class="ltv-cohort-input" type="number" min="0" max="100" value="${l.pct6m}" oninput="setVertCohort(${vert.id},'pct6m',+this.value)"> %</td>
                <td class="right" style="color:#64748b;">× 6</td>
                <td class="right">${mArpu > 0 ? currency + (mArpu * 6).toFixed(0) : '—'}</td>
              </tr>
              <tr>
                <td>12 months</td>
                <td><input class="ltv-cohort-input" type="number" min="0" max="100" value="${l.pct12m}" oninput="setVertCohort(${vert.id},'pct12m',+this.value)"> %</td>
                <td class="right" style="color:#64748b;">× 12</td>
                <td class="right">${mArpu > 0 ? currency + (mArpu * 12).toFixed(0) : '—'}</td>
              </tr>
            </tbody>
            <tfoot><tr>
              <td>Total</td>
              <td><span class="${sumOk ? 'ltv-sum-ok' : 'ltv-sum-bad'}">${sum}%</span></td>
              <td class="right" style="color:#64748b;font-size:0.78rem;">Avg: ${avgLs.toFixed(1)} mo</td>
              <td class="right" style="font-weight:700;${mArpu > 0 ? 'color:#00838F' : ''}">${mArpu > 0 ? currency + (mArpu * avgLs).toFixed(0) : '—'}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>
      <div class="ltv-modal-footer">
        <button class="ltv-modal-save" onclick="closeLtvModal()">Done</button>
      </div>
    </div>
  </div>`;
}

function setVertLtvLag(vertId, lag) {
  const vert = verticals.find(v => v.id === vertId);
  if (vert?.ltv) { vert.ltv.lag = lag; renderLtvModal(); }
}

function setVertCohort(vertId, field, value) {
  const vert = verticals.find(v => v.id === vertId);
  if (vert?.ltv) { vert.ltv[field] = value; renderLtvModal(); }
}


function rescaleVerticals() {
  rescaleGroup(verticals, 'locked', 'pct');
  if (totalBudget > 0) applyBudgetsFromHierarchy();
  refreshForecast();
}

function addChannel(vertId) {
  const id     = chNextId++;
  const platId = platNextId++;
  channels.push({ id, vertId, name: 'New Channel', pct: 0, locked: false, collapsed: false });
  platforms.push({ id: platId, channelId: id, name: 'Default Platform', pct: 100,
    model: 'cpc', cpc: 1.50, ctr: 3.0, cvr: 3.0, locked: false, customShape: null,
    budgets: Array(12).fill(0) });
  render();
}

function removeChannel(chId) {
  channels  = channels.filter(c => c.id !== chId);
  platforms = platforms.filter(p => p.channelId !== chId);
  render();
}

function updateChannel(chId, field, value) {
  const ch = channels.find(c => c.id === chId);
  if (!ch) return;
  ch[field] = value;
  if ((field === 'pct') && totalBudget > 0) applyBudgetsFromHierarchy();
  refreshForecast();
}

function toggleLockCh(chId) {
  const ch = channels.find(c => c.id === chId);
  if (ch) { ch.locked = !ch.locked; renderCampaignStructure(); }
}

function toggleCollapseCh(chId) {
  const ch = channels.find(c => c.id === chId);
  if (ch) { ch.collapsed = !ch.collapsed; renderCampaignStructure(); }
}

function rescaleChannels(vertId) {
  rescaleGroup(channels.filter(c => c.vertId === vertId), 'locked', 'pct');
  if (totalBudget > 0) applyBudgetsFromHierarchy();
  refreshForecast();
}

function addPlatform(channelId) {
  const id = platNextId++;
  platforms.push({ id, channelId, name: 'New Platform', pct: 0,
    model: 'cpc', cpc: 1.50, ctr: 3.0, cvr: 3.0, locked: false, customShape: null,
    budgets: Array(12).fill(0) });
  render();
}

function removePlatform(platId) {
  platforms = platforms.filter(p => p.id !== platId);
  render();
}

function updatePlatform(platId, field, value) {
  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;
  plat[field] = value;
  if ((field === 'pct') && totalBudget > 0) applyBudgetsFromHierarchy();
  refreshForecast();
}

// Handle model dropdown changes — manages variable CPC/CPM init and revert
function switchPlatModel(platId, newModel) {
  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;
  const oldModel = plat.model || 'cpc';
  const wasVariable = oldModel === 'var-cpc' || oldModel === 'var-cpm';
  const isVariable  = newModel === 'var-cpc' || newModel === 'var-cpm';
  const oldIsCpc = oldModel === 'cpc' || oldModel === 'var-cpc';
  const newIsCpc = newModel === 'cpc' || newModel === 'var-cpc';

  plat.model = newModel;

  if (!wasVariable && isVariable) {
    // Switching TO variable — initialise 12 rates from current flat rate, backup flat
    if (newIsCpc) {
      plat.flatCpcBackup = plat.cpc || 1.50;
      if (!plat.cpcRates || plat.cpcRates.length !== 12) {
        plat.cpcRates = Array(12).fill(plat.cpc || 1.50);
      }
    } else {
      plat.flatCpmBackup = plat.cpmRate || 10.0;
      if (!plat.cpmRates || plat.cpmRates.length !== 12) {
        plat.cpmRates = Array(12).fill(plat.cpmRate || 10.0);
      }
    }
  } else if (wasVariable && !isVariable) {
    // Switching FROM variable — restore flat backup
    if (newIsCpc) {
      plat.cpc = plat.flatCpcBackup ?? plat.cpc ?? 1.50;
    } else {
      plat.cpmRate = plat.flatCpmBackup ?? plat.cpmRate ?? 10.0;
    }
  } else if (wasVariable && isVariable && oldIsCpc !== newIsCpc) {
    // Switching between var-cpc and var-cpm — init the other rate array
    if (newIsCpc) {
      plat.flatCpcBackup = plat.cpc || 1.50;
      if (!plat.cpcRates || plat.cpcRates.length !== 12) {
        plat.cpcRates = Array(12).fill(plat.cpc || 1.50);
      }
    } else {
      plat.flatCpmBackup = plat.cpmRate || 10.0;
      if (!plat.cpmRates || plat.cpmRates.length !== 12) {
        plat.cpmRates = Array(12).fill(plat.cpmRate || 10.0);
      }
    }
  }

  refreshForecast();
}

function toggleLockPlat(platId) {
  const plat = platforms.find(p => p.id === platId);
  if (plat) { plat.locked = !plat.locked; renderCampaignStructure(); }
}

function rescalePlatforms(channelId) {
  rescaleGroup(platforms.filter(p => p.channelId === channelId), 'locked', 'pct');
  if (totalBudget > 0) applyBudgetsFromHierarchy();
  refreshForecast();
}


// ─────────────────────────────────────────────────────────────
// RENDER — BUDGET GRID
// ─────────────────────────────────────────────────────────────

function renderBudgetPhasing() {
  const currency = document.getElementById('currencySelect')?.value || '£';
  const fmtCur = (v) => Math.round(v).toLocaleString();
  // Helper to build platform list with hierarchy structure
  function buildPlatformHierarchy() {
    const rows = [];
    verticals.forEach(vert => {
      const vertBudget = totalBudget > 0 ? totalBudget * vert.pct / 100 : 0;
      rows.push({
        type: 'vert',
        id: vert.id,
        name: vert.name,
        depth: 0,
        collapsed: vert.collapsed,
        budget: vertBudget,
        isCollapsed: vert.collapsed,
      });

      if (!vert.collapsed) {
        const chs = channels.filter(c => c.vertId === vert.id);
        chs.forEach(ch => {
          const chBudget = totalBudget > 0 ? totalBudget * vert.pct / 100 * ch.pct / 100 : 0;
          rows.push({
            type: 'ch',
            id: ch.id,
            name: ch.name,
            depth: 1,
            collapsed: ch.collapsed,
            budget: chBudget,
            isCollapsed: ch.collapsed,
          });

          if (!ch.collapsed) {
            const plats = platforms.filter(p => p.channelId === ch.id);
            plats.forEach(plat => {
              const platBudget = totalBudget > 0 ? totalBudget * vert.pct / 100 * ch.pct / 100 * plat.pct / 100 : 0;
              const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
              rows.push({
                type: 'plat',
                id: plat.id,
                platId: plat.id,
                name: plat.name,
                depth: 2,
                budget: platBudget,
                budgets: plat.budgets,
                annual: annual,
                colour: COLOURS[platforms.indexOf(plat) % COLOURS.length],
                vert: vert,
                ch: ch,
              });
            });
          }
        });
      }
    });
    return rows;
  }

  const hierarchy = buildPlatformHierarchy();

  // ─── Render main grid ───
  const gridWrap = document.getElementById('bpGridWrap');
  if (!gridWrap) return;

  // Build header
  let headerHtml = '<thead><tr><th>Platform</th>';
  MONTHS.forEach((mo, m) => {
    const locked = spreadLocked[m];
    const cls = locked ? 'bp-month-locked' : '';
    headerHtml += `<th class="${cls}" onclick="toggleBpMonthLock(${m})" title="${locked ? 'Unlock' : 'Lock'} ${mo}">
      <div class="bp-th-inner">${mo} <span class="bp-th-lock">${locked ? '🔒' : '🔓'}</span></div></th>`;
  });
  headerHtml += '<th class="bp-annual-col">Annual</th><th style="width:40px;"></th><th style="width:64px;"></th></tr></thead>';

  // Build body
  let bodyHtml = '';
  hierarchy.forEach(row => {
    if (row.type === 'vert') {
      const chs = channels.filter(c => c.vertId === row.id);
      const indentClass = 'bp-indent-0';
      const chevron = chs.length > 0 ? `<span class="bp-chevron" onclick="toggleBpVertical(${row.id})">${row.collapsed ? '▶' : '▼'}</span>` : '';

      const vertLocked = bpVertLocked.has(row.id);
      bodyHtml += `<tr class="bp-vert-row${vertLocked ? ' bp-vert-locked' : ''}">
        <td><div class="bp-name-cell">
          ${chevron}
          <span class="bp-name-label">${esc(row.name)}</span>
          <button class="bp-vert-lock" onclick="toggleBpVertLock(${row.id})" title="${vertLocked ? 'Unlock' : 'Lock'} entire vertical">${vertLocked ? '🔒' : '🔓'}</button>
        </div></td>`;

      MONTHS.forEach((mo, m) => {
        const locked = spreadLocked[m];
        const cls = locked ? 'bp-month-locked' : '';
        bodyHtml += `<td class="bp-cell ${cls}" style="opacity:0.5;"></td>`;
      });

      // Badge: sum actual spend of all child platforms vs allocated budget
      const vertPlats = platforms.filter(p => {
        const c = channels.find(ch => ch.id === p.channelId);
        return c && c.vertId === row.id;
      });
      const vertActual = vertPlats.reduce((s, p) => s + p.budgets.reduce((a, b) => a + (b||0), 0), 0);
      const vertDelta = vertActual - row.budget;
      let vertBadge = '';
      if (row.budget > 0) {
        if (Math.abs(vertDelta) <= row.budget * 0.01) {
          vertBadge = `<span class="bp-badge bp-badge-ok">✓</span>`;
        } else {
          const vbCls = Math.abs(vertDelta) > row.budget * 0.05
            ? (vertDelta > 0 ? 'bp-badge-over' : 'bp-badge-warn')
            : 'bp-badge-warn';
          vertBadge = `<span class="bp-badge ${vbCls}">${vertDelta > 0 ? '+' : ''}${currency}${fmtCur(Math.abs(vertDelta))}</span>`;
        }
      }

      bodyHtml += `<td class="bp-annual-col">${currency}${fmtCur(vertActual)}</td><td><div class="bp-row-actions">${vertBadge}</div></td><td></td></tr>`;
    } else if (row.type === 'ch') {
      const plats = platforms.filter(p => p.channelId === row.id);
      const indentClass = 'bp-indent-1';
      const chevron = plats.length > 0 ? `<span class="bp-chevron" onclick="toggleBpChannel(${row.id})">${row.collapsed ? '▶' : '▼'}</span>` : '';

      bodyHtml += `<tr class="bp-ch-row">
        <td><div class="bp-name-cell">
          <span class="${indentClass}"></span>
          ${chevron}
          <span class="bp-name-label">${esc(row.name)}</span>
        </div></td>`;

      MONTHS.forEach((mo, m) => {
        const locked = spreadLocked[m];
        const cls = locked ? 'bp-month-locked' : '';
        bodyHtml += `<td class="bp-cell ${cls}" style="opacity:0.5;"></td>`;
      });

      // Badge: sum actual spend of child platforms vs allocated budget
      const chActual = plats.reduce((s, p) => s + p.budgets.reduce((a, b) => a + (b||0), 0), 0);
      const chDelta = chActual - row.budget;
      let chBadge = '';
      if (row.budget > 0) {
        if (Math.abs(chDelta) <= row.budget * 0.01) {
          chBadge = `<span class="bp-badge bp-badge-ok">✓</span>`;
        } else {
          const cbCls = Math.abs(chDelta) > row.budget * 0.05
            ? (chDelta > 0 ? 'bp-badge-over' : 'bp-badge-warn')
            : 'bp-badge-warn';
          chBadge = `<span class="bp-badge ${cbCls}">${chDelta > 0 ? '+' : ''}${currency}${fmtCur(Math.abs(chDelta))}</span>`;
        }
      }

      bodyHtml += `<td class="bp-annual-col">${currency}${fmtCur(chActual)}</td><td><div class="bp-row-actions">${chBadge}</div></td><td></td></tr>`;
    } else if (row.type === 'plat') {
      // Platform row
      const indentClass = 'bp-indent-2';
      const annual = row.annual;
      const rowLocked = isPlatLocked(row.platId);

      bodyHtml += `<tr class="bp-plat-row${rowLocked ? ' bp-row-locked' : ''}" data-plat-id="${row.platId}">
        <td><div class="bp-name-cell">
          <span class="${indentClass}"></span>
          <span class="bp-dot" style="display:inline-block;width:8px;height:8px;background:${row.colour};border-radius:50%;flex-shrink:0;"></span>
          <span class="bp-name-label">${esc(row.name)}</span>
          <span class="bp-context-label">${row.vert.name} › ${row.ch.name}</span>
          <button class="bp-row-lock" onclick="toggleBpRowLock(${row.platId})" title="${rowLocked ? 'Unlock row' : 'Lock row'}">${rowLocked ? '🔒' : '🔓'}</button>
        </div></td>`;

      // Monthly cells with bars
      const maxVal = Math.max(...row.budgets, 0.1) * 1.5;
      MONTHS.forEach((mo, m) => {
        const val = row.budgets[m] || 0;
        const colLocked = spreadLocked[m];
        const cellKey = `${row.platId}-${m}`;
        const cellLocked = bpCellLocked.has(cellKey);
        let cellCls = 'bp-cell';
        if (colLocked) cellCls += ' bp-month-locked';
        if (cellLocked) cellCls += ' bp-cell-locked';
        const barH = maxVal > 0 ? Math.max(3, Math.round((val / maxVal) * 45)) : 3;

        let displayVal = '';
        if (phasingMode === 'pct' && annual > 0) {
          displayVal = ((val / annual) * 100).toFixed(1) + '%';
        } else {
          displayVal = currency + (val > 0 ? fmtCur(val) : '—');
        }

        const lockIcon = cellLocked ? '🔒' : '🔓';
        bodyHtml += `<td class="${cellCls}">
          <button class="bp-cell-lock" onclick="toggleBpCellLock(${row.platId},${m})" title="${cellLocked ? 'Unlock' : 'Lock'} this cell">${lockIcon}</button>
          <div class="bp-cell-bar" onmousedown="startBpDrag(${row.platId},${m},event)">
            <div class="bp-bar" id="bp-bar-${row.platId}-${m}" style="background:${row.colour};height:${barH}px;"></div>
            <div class="bp-value" id="bp-val-${row.platId}-${m}" onclick="activateBpCell(${row.platId},${m},event)">${displayVal}</div>
          </div>
        </td>`;
      });

      // Annual total
      const allocBudget = row.budget;
      const delta = annual - allocBudget;
      let badgeCls = 'bp-badge-ok';
      if (Math.abs(delta) > allocBudget * 0.05) {
        badgeCls = delta > 0 ? 'bp-badge-over' : 'bp-badge-warn';
      } else if (Math.abs(delta) > allocBudget * 0.01) {
        badgeCls = 'bp-badge-warn';
      }
      const badge = allocBudget > 0
        ? (badgeCls === 'bp-badge-ok'
          ? `<span class="bp-badge bp-badge-ok">✓</span>`
          : `<span class="bp-badge ${badgeCls}">${delta > 0 ? '+' : ''}${currency}${fmtCur(Math.abs(delta))}</span>`)
        : '';

      // Shape dropdown — shows current shape name if set, otherwise "Shape"
      const plat = platforms.find(p => p.id === row.platId);
      const hasCustom = plat && plat.customShape;
      const shapeLbl = hasCustom ? plat.customShape.shape : 'Shape';
      const shapeCls = hasCustom ? 'bp-shape-trigger has-shape' : 'bp-shape-trigger';
      const shapeDropdown = `<button class="${shapeCls}" onclick="openShapePicker(${row.platId})" title="Apply a seasonality shape to this platform">${esc(shapeLbl)} ▾</button>`;

      // Save shape button — visible when distribution is not flat
      const budgets = plat ? plat.budgets : [];
      const annualPlat = budgets.reduce((a, b) => a + (b||0), 0);
      const isFlat = annualPlat > 0 && budgets.every(b => Math.abs((b||0) - annualPlat/12) < 2);
      const saveShapeBtn = (!isFlat && annualPlat > 0)
        ? `<button class="bp-save-shape-btn" onclick="promptSaveCustomShape(${row.platId})" title="Save this distribution as a reusable shape">💾</button>`
        : '';

      bodyHtml += `<td class="bp-annual-col">${currency}${fmtCur(annual)}</td>
        <td><div class="bp-row-actions">${badge}<button class="bp-rebalance-btn" onclick="rebalanceBpRow(${row.platId})" title="Rebalance to configured allocation">🎯</button></div></td>
        <td><div style="display:flex;align-items:center;gap:4px;">${shapeDropdown}${saveShapeBtn}</div></td>
      </tr>`;
    }
  });

  // ─── Combined totals + stacked bar row ───
  // Use ALL platforms (not just visible hierarchy rows) so collapsed verticals/channels are included
  const allPlatRows = platforms.map((plat, idx) => ({
    platId: plat.id,
    budgets: plat.budgets,
    colour: COLOURS[idx % COLOURS.length],
  }));
  const totalsByMonth = MONTHS.map((_, m) => allPlatRows.reduce((s, row) => s + (row.budgets[m] || 0), 0));
  const grandTotal = totalsByMonth.reduce((a, b) => a + b, 0);
  const maxMonthly = Math.max(...totalsByMonth, 1);

  bodyHtml += `<tr class="bp-totals-row"><td class="bp-chart-label">All Platforms</td>`;
  totalsByMonth.forEach((total, m) => {
    let segsHtml = '';
    allPlatRows.forEach(plat => {
      const val = plat.budgets[m] || 0;
      if (val > 0 && total > 0) {
        const h = Math.max(1, Math.round((val / maxMonthly) * 56));
        segsHtml += `<div class="bp-summary-seg" style="height:${h}px;background:${plat.colour};"></div>`;
      }
    });
    const locked = spreadLocked[m];
    bodyHtml += `<td class="bp-chart-cell${locked ? ' bp-month-locked' : ''}"
      title="${MONTHS[m]}: ${currency}${fmtCur(total)}${locked ? '' : ' · drag to adjust'}"
      onmousedown="startSpreadDrag(${m},event)">
      <div class="bp-chart-stack" id="bp-spread-stack-${m}">${segsHtml}</div>
      <div class="bp-chart-total" id="bp-spread-total-${m}">${currency}${fmtCur(total)}</div>
    </td>`;
  });

  let spreadBadge = '';
  if (totalBudget > 0) {
    const spreadDelta = grandTotal - totalBudget;
    let sBadgeCls = 'bp-badge-ok';
    if (Math.abs(spreadDelta) > totalBudget * 0.05) {
      sBadgeCls = spreadDelta > 0 ? 'bp-badge-over' : 'bp-badge-warn';
    } else if (Math.abs(spreadDelta) > totalBudget * 0.01) {
      sBadgeCls = 'bp-badge-warn';
    }
    spreadBadge = sBadgeCls === 'bp-badge-ok'
      ? `<span class="bp-badge bp-badge-ok">✓</span>`
      : `<span class="bp-badge ${sBadgeCls}">${spreadDelta > 0 ? '+' : ''}${currency}${fmtCur(Math.abs(spreadDelta))}</span>`;
  }
  bodyHtml += `<td class="bp-annual-col">${currency}${fmtCur(grandTotal)}</td>
    <td><div class="bp-row-actions">${spreadBadge}<button class="bp-rebalance-btn" onclick="rebalanceAllSpread()" title="Rebalance total — hits the annual budget while preserving relative platform splits">🎯</button></div></td><td></td></tr>`;

  gridWrap.innerHTML = `<table class="bp-grid"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table>`;
  // Hide the separate summary wrap (now integrated into table)
  const summaryWrap = document.getElementById('bpSummaryWrap');
  if (summaryWrap) summaryWrap.innerHTML = '';

  // Update global badge
  const globalBadge = document.getElementById('bp-global-badge');
  const totalBudge = document.getElementById('bp-total-value');
  if (globalBadge) {
    const globalDelta = grandTotal - totalBudget;
    if (totalBudget > 0 && Math.abs(globalDelta) > totalBudget * 0.01) {
      const cls = Math.abs(globalDelta) > totalBudget * 0.05 ? 'bp-badge-over' : 'bp-badge-warn';
      globalBadge.innerHTML = `<span class="bp-badge ${cls}">${globalDelta > 0 ? '+' : '-'}${currency}${fmtCur(Math.abs(globalDelta))}</span>`;
    } else {
      globalBadge.textContent = '';
    }
  }
  if (totalBudge) totalBudge.textContent = grandTotal > 0 ? currency + fmtCur(grandTotal) : '—';

  // Re-attach drag handlers
}



// ─────────────────────────────────────────────────────────────
// RENDER — KPI BAR
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// KPI TARGETS
// ─────────────────────────────────────────────────────────────

function setKpiTarget(type, val) {
  targets[type] = val > 0 ? val : 0;
  renderKPIBadges();
}

function renderKPIBadges() {
  _renderBadge('conversions', lastKpiActuals.conversions, targets.conversions, false);
  _renderBadge('revenue',     lastKpiActuals.revenue,     targets.revenue,     false);
  _renderBadge('cpa',         lastKpiActuals.cpa,         targets.cpa,         true);
}

// lowerIsBetter = true for CPA (target is a cost cap)
function _renderBadge(type, actual, target, lowerIsBetter) {
  const badge = document.getElementById(`kpi-${type}-badge`);
  if (!badge) return;
  if (!target || !actual) { badge.style.display = 'none'; return; }

  const pct = (actual / target) * 100;

  if (lowerIsBetter) {
    // CPA: actual / target — ≤100% means at or under cap (good)
    if (pct <= 100) {
      badge.textContent = `✓ Under target (${pct.toFixed(0)}% of cap)`;
      badge.className   = 'kpi-target-badge green';
    } else if (pct <= 125) {
      badge.textContent = `${pct.toFixed(0)}% of cap — slightly over`;
      badge.className   = 'kpi-target-badge amber';
    } else {
      badge.textContent = `${pct.toFixed(0)}% of cap — over target`;
      badge.className   = 'kpi-target-badge red';
    }
  } else {
    // Conversions / Revenue: actual / target — ≥100% means at or above goal (good)
    if (pct >= 100) {
      badge.textContent = `✓ ${pct.toFixed(0)}% of target`;
      badge.className   = 'kpi-target-badge green';
    } else if (pct >= 75) {
      badge.textContent = `${pct.toFixed(0)}% of target`;
      badge.className   = 'kpi-target-badge amber';
    } else {
      badge.textContent = `${pct.toFixed(0)}% of target`;
      badge.className   = 'kpi-target-badge red';
    }
  }
  badge.style.display = '';
}

function updateSpendBadge() {
  const grand   = platforms.reduce((s, p) => s + p.budgets.reduce((a, b) => a + (b||0), 0), 0);
  const spendEl = document.getElementById('kpi-spend');
  if (spendEl) spendEl.textContent = grand > 0 ? fmt(grand) : '—';

  const deltaEl = document.getElementById('kpi-spend-delta');
  const badgeEl = document.getElementById('kpi-spend-badge');
  if (!deltaEl || !badgeEl) return;

  if (totalBudget <= 0 || grand <= 0) { deltaEl.style.display = 'none'; return; }

  const diff    = grand - totalBudget;
  const absDiff = Math.abs(diff);
  deltaEl.style.display = 'flex';

  if (absDiff < 1) {
    badgeEl.textContent      = '✓ Balanced';
    badgeEl.style.background = '#002B36';
    badgeEl.style.color      = '#00E5FF';
  } else if (diff > 0) {
    badgeEl.textContent      = '+' + fmt(absDiff) + ' over';
    badgeEl.style.background = '#1A0E05';
    badgeEl.style.color      = '#FF6D00';
  } else {
    badgeEl.textContent      = '−' + fmt(absDiff) + ' under';
    badgeEl.style.background = '#1A1505';
    badgeEl.style.color      = '#FF8F00';
  }
}

function renderKPIs(months, revenueDeferred) {
  const last      = months[months.length - 1]; // last period, which may be in the tail
  const spendLast = months[11];                // spend only ever runs to month 12
  const totalNet  = last.cumNet;
  const breakeven = months.find(m => m.cumNet >= 0);
  const hasAnyLtv = anyLtvEnabled();
  const hasTail   = tail.enabled && hasAnyLtv;

  // Update KPI label to reflect window length
  const roiLabel = document.getElementById('kpi-roi-label');
  if (roiLabel) roiLabel.textContent = hasTail ? `Net ROI (full period)` : 'Net ROI (12 months)';
  const revLabel = document.querySelector('.kpi:nth-child(2) label');
  if (revLabel) revLabel.textContent = hasTail ? 'Revenue (incl. tail)' : 'Total Revenue Recognised';

  updateSpendBadge();
  document.getElementById('kpi-revenue').textContent = fmt(last.cumRevenue);

  // Show any remaining deferred revenue (beyond even the tail window)
  const revSub = document.getElementById('kpi-rev-sub');
  if (hasAnyLtv && revenueDeferred > 0) {
    revSub.textContent = `+ ${fmt(revenueDeferred)} still beyond window`;
    revSub.style.display = 'block';
  } else {
    revSub.style.display = 'none';
  }

  const roiEl = document.getElementById('kpi-roi');
  if (roiMode === 'multiplier') {
    const mult = last.cumSpend > 0 ? last.cumRevenue / last.cumSpend : null;
    if (mult !== null) {
      roiEl.textContent = mult.toFixed(2) + '×';
      roiEl.className   = 'value ' + (mult >= 1 ? 'pos' : 'neg');
      document.getElementById('kpi-roi-wrap').className = 'kpi ' + (mult >= 1 ? 'green' : 'red');
    } else {
      roiEl.textContent = '—'; roiEl.className = 'value';
      document.getElementById('kpi-roi-wrap').className = 'kpi';
    }
  } else {
    roiEl.textContent = fmtS(totalNet);
    roiEl.className   = 'value ' + (totalNet >= 0 ? 'pos' : 'neg');
    document.getElementById('kpi-roi-wrap').className = 'kpi ' + (totalNet >= 0 ? 'green' : 'red');
  }

  // Keep pills in sync and update currency pill label to match selected currency
  const pillC = document.getElementById('roi-pill-currency');
  const pillM = document.getElementById('roi-pill-multiplier');
  if (pillC) { pillC.className = 'roi-pill' + (roiMode === 'currency'    ? ' active' : ''); pillC.textContent = sym(); }
  if (pillM)   pillM.className = 'roi-pill' + (roiMode === 'multiplier'  ? ' active' : '');

  const beEl = document.getElementById('kpi-breakeven');
  if (breakeven) {
    const inTail = breakeven.isTail ? ' 🔁' : '';
    beEl.textContent  = `Month ${breakeven.month} (${periodLabel(breakeven.month - 1)})${inTail}`;
    beEl.className    = 'value pos';
    document.getElementById('kpi-be-wrap').className = 'kpi green';
  } else {
    beEl.textContent = hasTail ? '> full period' : '> 12 months';
    beEl.className   = 'value neg';
    document.getElementById('kpi-be-wrap').className = 'kpi red';
  }

  // Conversions are always from the 12 spend months
  document.getElementById('kpi-conversions').textContent = fmtN(spendLast.cumConversions);
  const convSub = document.getElementById('kpi-conv-sub');
  if (hasAnyLtv) {
    const ltvVerts = verticals.filter(v => v.ltv?.enabled);
    if (ltvVerts.length > 0) {
      const lagStr = ltvVerts.map(v => v.ltv.lag).join('/');
      const avgLs = ltvVerts.reduce((s, v) => s + avgLifespanForVert(v), 0) / ltvVerts.length;
      convSub.textContent = `${lagStr}-mo lag · ${avgLs.toFixed(1)}-mo avg lifetime`;
    } else {
      convSub.textContent = '';
    }
  } else {
    convSub.textContent = '';
  }

  // CPA = total 12-month spend / total 12-month conversions
  const cpaEl    = document.getElementById('kpi-cpa');
  const cpaWrap  = document.getElementById('kpi-cpa-wrap');
  const cpaSubEl = document.getElementById('kpi-cpa-sub');
  const totalConv = spendLast.cumConversions;
  if (totalConv > 0) {
    const cpa = spendLast.cumSpend / totalConv;
    cpaEl.textContent   = fmt(cpa, 2);
    cpaEl.className     = 'value';
    cpaWrap.className   = 'kpi amber';
    cpaSubEl.textContent = 'spend ÷ conversions';
  } else {
    cpaEl.textContent   = '—';
    cpaEl.className     = 'value';
    cpaWrap.className   = 'kpi';
    cpaSubEl.textContent = '';
  }

  // Breakeven badge
  document.getElementById('breakevenBadge').innerHTML = breakeven
    ? `<span class="breakeven-badge yes">✓ Breakeven: Month ${breakeven.month} (${periodLabel(breakeven.month - 1)})</span>`
    : `<span class="breakeven-badge no">✕ Not profitable within ${hasTail ? 'full period' : '12 months'}</span>`;

  // Cache actuals for badge rendering and re-sync badges
  const actualCpa = totalConv > 0 ? spendLast.cumSpend / totalConv : 0;
  lastKpiActuals = {
    conversions: spendLast.cumConversions,
    revenue:     last.cumRevenue,
    cpa:         actualCpa,
  };
  renderKPIBadges();

  // Keep target input values in sync with state (in case of re-render)
  const convTgt = document.getElementById('kpi-conversions-target');
  const revTgt  = document.getElementById('kpi-revenue-target');
  const cpaTgt  = document.getElementById('kpi-cpa-target');
  if (convTgt && targets.conversions > 0 && !convTgt.value) convTgt.value = targets.conversions;
  if (revTgt  && targets.revenue     > 0 && !revTgt.value)  revTgt.value  = targets.revenue;
  if (cpaTgt  && targets.cpa         > 0 && !cpaTgt.value)  cpaTgt.value  = targets.cpa;
}

// ─────────────────────────────────────────────────────────────
// RENDER — CHART
// ─────────────────────────────────────────────────────────────

function renderChart(months) {
  const hasAnyLtv = anyLtvEnabled();
  const hasTail   = tail.enabled && hasAnyLtv;
  const labels    = months.map((_, i) => periodLabel(i));
  const spendData = months.map(m => m.cumSpend);
  const revData   = months.map(m => m.cumRevenue);
  const netData   = months.map(m => m.cumNet);
  const N         = months.length;
  const breakeven = months.find(m => m.cumNet >= 0);

  const datasets = [
    {
      label: 'Cumulative Spend',
      data: spendData, borderColor: '#FF8A50', backgroundColor: 'rgba(255,138,80,0.08)',
      borderWidth: 2.5, pointRadius: hasTail ? 3 : 4, pointHoverRadius: 6,
      fill: false, tension: 0.35,
    },
    {
      label: hasAnyLtv ? 'Cumulative Revenue Recognised' : 'Cumulative Revenue (LTV)',
      data: revData, borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.08)',
      borderWidth: 2.5, pointRadius: hasTail ? 3 : 4, pointHoverRadius: 6,
      fill: false, tension: 0.35,
    },
  ];

  if (roiChart) roiChart.destroy();
  roiChart = new Chart(document.getElementById('roiChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          grid: {
            color: ctx => ctx.tick.value === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
            lineWidth: ctx => ctx.tick.value === 0 ? 1.5 : 1,
          },
          ticks: {
            callback: v => sym() + (Math.abs(v) >= 1000 ? (v/1000).toFixed(0)+'k' : v),
            font: { size: 11 }, color: '#90A0B0'
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: hasTail ? 10 : 11 },
            maxRotation: hasTail ? 45 : 0,
          }
        }
      },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true, padding: 14, color: '#A8B8C8' } },
        tooltip: {
          callbacks: {
            title: items => {
              const idx = items[0]?.dataIndex;
              return idx >= 12 ? `${labels[idx]} (tail)` : labels[idx];
            },
            label: ctx => ` ${ctx.dataset.label}: ${ctx.raw < 0 ? '−' : ''}${sym()}${nnEnabled ? fmtCompactNum(ctx.raw) : Math.abs(Math.round(ctx.raw)).toLocaleString('en-GB')}`
          }
        }
      }
    }
  });

  // Consolidated overlay draw hook — handles tail shading, spend-ends line, and breakeven line
  const origDraw = roiChart.draw.bind(roiChart);
  roiChart.draw = function () {
    origDraw();
    const ctx  = roiChart.ctx;
    const meta = roiChart.getDatasetMeta(0);
    if (!meta?.data?.length) return;
    const { top, bottom, left, right } = roiChart.chartArea;
    ctx.save();

    // ① Shade and annotate the tail region
    if (hasTail && meta.data[11] && meta.data[12]) {
      const x11 = meta.data[11].x;
      const x12 = meta.data[12].x;
      const spendEndsX = (x11 + x12) / 2; // midpoint between last spend and first tail month

      // Shaded tail background
      ctx.fillStyle = 'rgba(100,116,139,0.055)';
      ctx.fillRect(spendEndsX, top, right - spendEndsX, bottom - top);

      // Dashed vertical divider
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(100,116,139,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath(); ctx.moveTo(spendEndsX, top); ctx.lineTo(spendEndsX, bottom); ctx.stroke();
      ctx.setLineDash([]);

      // "Spend ends" label — sits on the left of the divider
      ctx.font = 'bold 10px system-ui, sans-serif';
      const lbl1 = 'Spend ends →';
      const lw1  = ctx.measureText(lbl1).width + 14;
      const ly   = top + 5;
      ctx.fillStyle = 'rgba(100,116,139,0.12)';
      ctx.beginPath(); ctx.roundRect(spendEndsX - lw1 - 4, ly, lw1, 19, 4); ctx.fill();
      ctx.fillStyle = '#90A0B0'; ctx.textAlign = 'right';
      ctx.fillText(lbl1, spendEndsX - 8, ly + 13.5);

      // "Revenue tail" label — sits on the right
      const lbl2 = '← Revenue tail';
      const lw2  = ctx.measureText(lbl2).width + 14;
      ctx.fillStyle = 'rgba(100,116,139,0.12)';
      ctx.beginPath(); ctx.roundRect(spendEndsX + 4, ly, lw2, 19, 4); ctx.fill();
      ctx.fillStyle = '#90A0B0'; ctx.textAlign = 'left';
      ctx.fillText(lbl2, spendEndsX + 11, ly + 13.5);
    }

    // ② Breakeven vertical line
    if (breakeven) {
      const mi = breakeven.month - 1;
      if (meta.data[mi]) {
        const x = meta.data[mi].x;
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth   = 2;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
        ctx.setLineDash([]);
        const label = '✓ Breakeven';
        ctx.font = 'bold 10.5px system-ui, sans-serif';
        const tw = ctx.measureText(label).width + 14;
        const bx = x - tw / 2;
        // Push label down a bit if it would overlap the spend-ends label
        const by = (hasTail && breakeven.isTail) ? top + 30 : top + 5;
        ctx.fillStyle = 'rgba(16,185,129,0.15)';
        ctx.beginPath(); ctx.roundRect(bx, by, tw, 19, 4); ctx.fill();
        ctx.fillStyle = '#00838F'; ctx.textAlign = 'center';
        ctx.fillText(label, x, by + 13.5);
      }
    }

    ctx.restore();
  };
  roiChart.draw();
}

// ─────────────────────────────────────────────────────────────
// RENDER — MONTHLY (NON-CUMULATIVE) CHART
// ─────────────────────────────────────────────────────────────

function renderMonthlyChart(months) {
  const hasAnyLtv = anyLtvEnabled();
  const hasTail  = tail.enabled && hasAnyLtv;
  const labels   = months.map((_, i) => periodLabel(i));
  const spendData  = months.map(m => m.spend);
  const revData    = months.map(m => m.revenue);
  const netData    = months.map(m => m.monthlyNet);
  const N          = months.length;
  const breakeven  = months.find(m => m.cumNet >= 0);

  // Update subtitle
  const sub = document.getElementById('monthlyChartSubtitle');
  if (sub) sub.textContent = hasAnyLtv
    ? `Month-by-month spend and recognised revenue — not cumulative${hasTail ? ', including revenue tail' : ''}`
    : 'Month-by-month spend and revenue — not cumulative';

  const datasets = [
    {
      label: 'Monthly Spend',
      data: spendData,
      borderColor: '#FF8A50',
      backgroundColor: 'rgba(255,138,80,0.1)',
      borderWidth: 2, pointRadius: hasTail ? 2 : 3, pointHoverRadius: 5,
      fill: false, tension: 0.35,
    },
    {
      label: hasAnyLtv ? 'Monthly Revenue Recognised' : 'Monthly Revenue',
      data: revData,
      borderColor: '#00E5FF',
      backgroundColor: 'rgba(0,229,255,0.1)',
      borderWidth: 2, pointRadius: hasTail ? 2 : 3, pointHoverRadius: 5,
      fill: false, tension: 0.35,
    },
    {
      label: 'Monthly ROI',
      data: netData,
      borderColor: 'rgba(0,229,255,0.7)',
      backgroundColor: netData.map(v => v >= 0 ? 'rgba(0,229,255,0.0)' : 'rgba(255,138,80,0.0)'),
      borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.35,
      borderDash: [4, 3],
    },
  ];

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthlyChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          grid: {
            color: ctx => ctx.tick.value === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
            lineWidth: ctx => ctx.tick.value === 0 ? 1.5 : 1,
          },
          ticks: {
            callback: v => sym() + (Math.abs(v) >= 1000 ? (v/1000).toFixed(0)+'k' : v),
            font: { size: 11 }, color: '#90A0B0'
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: hasTail ? 10 : 11 }, maxRotation: hasTail ? 45 : 0 }
        }
      },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true, padding: 14, color: '#A8B8C8' } },
        tooltip: {
          callbacks: {
            title: items => {
              const idx = items[0]?.dataIndex;
              return (hasTail && idx >= 12) ? `${labels[idx]} (tail)` : labels[idx];
            },
            label: ctx => ` ${ctx.dataset.label}: ${ctx.raw < 0 ? '−' : ''}${sym()}${nnEnabled ? fmtCompactNum(ctx.raw) : Math.abs(Math.round(ctx.raw)).toLocaleString('en-GB')}`
          }
        }
      }
    }
  });

  // Overlay: tail shading + spend-ends divider (mirrors cumulative chart)
  const origDraw = monthlyChart.draw.bind(monthlyChart);
  monthlyChart.draw = function () {
    origDraw();
    const ctx  = monthlyChart.ctx;
    const meta = monthlyChart.getDatasetMeta(0);
    if (!meta?.data?.length) return;
    const { top, bottom, right } = monthlyChart.chartArea;
    ctx.save();

    // ① Tail shading
    if (hasTail && meta.data[11] && meta.data[12]) {
      const spendEndsX = (meta.data[11].x + meta.data[12].x) / 2;
      ctx.fillStyle = 'rgba(100,116,139,0.055)';
      ctx.fillRect(spendEndsX, top, right - spendEndsX, bottom - top);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(100,116,139,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath(); ctx.moveTo(spendEndsX, top); ctx.lineTo(spendEndsX, bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 10px system-ui, sans-serif';
      const lbl = '← Revenue tail';
      const lw  = ctx.measureText(lbl).width + 14;
      ctx.fillStyle = 'rgba(100,116,139,0.12)';
      ctx.beginPath(); ctx.roundRect(spendEndsX + 4, top + 5, lw, 19, 4); ctx.fill();
      ctx.fillStyle = '#90A0B0'; ctx.textAlign = 'left';
      ctx.fillText(lbl, spendEndsX + 11, top + 18.5);
    }

    // ② Crossover annotation removed — monthly chart is not cumulative so crossover is not true breakeven

    ctx.restore();
  };
  monthlyChart.draw();
}

// ─────────────────────────────────────────────────────────────
// RENDER — MONTHLY TABLE
// ─────────────────────────────────────────────────────────────

function renderMonthlyTable(months) {
  const breakeven = months.find(m => m.cumNet >= 0);

  // Update cumulative ROI column header to reflect display mode
  const cumNetHdr = document.getElementById('col-cumnet');
  if (cumNetHdr) cumNetHdr.textContent = roiMode === 'multiplier' ? 'Cumul. ROI ×' : 'Cumul. Net ROI';

  document.getElementById('monthlyBody').innerHTML = months.map((m, i) => {
    const isBE   = breakeven && m.month === breakeven.month;
    const isFirst = m.isTail && (i === 0 || !months[i-1].isTail); // first tail row
    const beTag  = isBE ? ` &nbsp;<span style="background:#00E5FF;color:#fff;font-size:0.62rem;padding:2px 6px;border-radius:10px;font-weight:700;">BREAKEVEN</span>` : '';
    const tailTag = isFirst
      ? ` &nbsp;<span style="background:#7A8A9A;color:#fff;font-size:0.62rem;padding:2px 6px;border-radius:10px;font-weight:700;">TAIL</span>`
      : (m.isTail ? ` <span style="font-size:0.68rem;color:#7A8A9A;">↳</span>` : '');

    const classes = [isBE ? 'be-row' : '', m.isTail ? 'tail-row' : ''].filter(Boolean).join(' ');

    // Tail rows: no new spend or conversions
    const spendCell = m.isTail ? `<td style="color:#cbd5e1;">—</td>` : `<td>${fmt(m.spend)}</td>`;
    const convCell  = m.isTail ? `<td style="color:#cbd5e1;">—</td>` : `<td>${fmtN(m.conversions)}</td>`;

    return `<tr class="${classes}">
      <td>${periodLabel(i)}${tailTag}${beTag}</td>
      ${spendCell}
      ${convCell}
      <td>${fmt(m.revenue)}</td>
      <td class="${m.monthlyNet >= 0 ? 'pv' : 'nv'}">${fmtS(m.monthlyNet)}</td>
      <td>${fmt(m.cumSpend)}</td>
      <td>${fmt(m.cumRevenue)}</td>
      ${roiMode === 'multiplier'
        ? (() => {
            const r = m.cumSpend > 0 ? m.cumRevenue / m.cumSpend : null;
            return `<td class="${r !== null ? (r >= 1 ? 'pv' : 'nv') : ''}">${r !== null ? r.toFixed(2) + '×' : '—'}</td>`;
          })()
        : `<td class="${m.cumNet >= 0 ? 'pv' : 'nv'}">${fmtS(m.cumNet)}</td>`}
    </tr>`;
  }).join('');
}


// ─────────────────────────────────────────────────────────────
// RENDER — KPI SUMMARY TABLE (per vertical / channel / platform)
// ─────────────────────────────────────────────────────────────

function renderKpiSummary(byPlatform) {
  const body = document.getElementById('kpiSummaryBody');
  if (!body) return;

  const currency = document.getElementById('currencySelect')?.value || '£';
  const isFiltered = activeChannelFilter.size > 0;
  const hasAnyLtv = anyLtvEnabled();
  const hasTail   = tail.enabled && hasAnyLtv;

  function kpiRow(name, kpi, cls) {
    const cpa  = kpi.conversions > 0 ? kpi.spend / kpi.conversions : null;
    const roas = kpi.spend > 0 ? kpi.revenue / kpi.spend : null;
    return `<tr class="${cls}">
      <td>${name}</td>
      <td>${fmt(kpi.spend)}</td>
      <td>${fmtN(kpi.conversions)}</td>
      <td>${fmt(kpi.revenue)}</td>
      <td>${cpa !== null ? fmt(cpa, 2) : '—'}</td>
      <td class="${roas !== null ? (roas >= 1 ? 'pv' : 'nv') : ''}">${roas !== null ? roas.toFixed(2) + '×' : '—'}</td>
    </tr>`;
  }

  let html = '';
  let grandSpend = 0, grandConvs = 0, grandRev = 0, grandDeferred = 0;

  verticals.forEach(vert => {
    let vertSpend = 0, vertConvs = 0, vertRev = 0, vertDeferred = 0;
    let vertHasData = false;
    let chRows = '';

    channels.filter(ch => ch.vertId === vert.id).forEach(ch => {
      let chSpend = 0, chConvs = 0, chRev = 0, chDeferred = 0;
      let chHasData = false;
      let platRows = '';

      platforms.filter(p => p.channelId === ch.id).forEach(plat => {
        const kpi = byPlatform.get(plat.id);
        if (!kpi) return;
        chHasData = true;
        chSpend += kpi.spend; chConvs += kpi.conversions; chRev += kpi.revenue; chDeferred += kpi.revenueDeferred;
        platRows += kpiRow(esc(plat.name), kpi, 'ks-plat-row');
      });

      if (chHasData) {
        vertHasData = true;
        vertSpend += chSpend; vertConvs += chConvs; vertRev += chRev; vertDeferred += chDeferred;
        chRows += kpiRow(esc(ch.name), { spend: chSpend, conversions: chConvs, revenue: chRev }, 'ks-ch-row');
        chRows += platRows;
      }
    });

    if (vertHasData) {
      grandSpend += vertSpend; grandConvs += vertConvs; grandRev += vertRev; grandDeferred += vertDeferred;
      html += kpiRow(esc(vert.name), { spend: vertSpend, conversions: vertConvs, revenue: vertRev }, 'ks-vert-row');
      html += chRows;
    }
  });

  // Grand total
  html += kpiRow('Total', { spend: grandSpend, conversions: grandConvs, revenue: grandRev }, 'ks-total-row');

  // Deferred revenue footer — mirrors the scorecard "+ £X still beyond window" pattern
  // CPA is omitted since conversions all occur in months 0–11 regardless of tail
  if (hasAnyLtv && grandDeferred > 0) {
    const defRoas = grandSpend > 0 ? (grandRev + grandDeferred) / grandSpend : null;
    html += `<tr class="ks-deferred-row">
      <td colspan="3">+ ${fmt(grandDeferred)} revenue still beyond window</td>
      <td>${fmt(grandRev + grandDeferred)} incl. deferred</td>
      <td></td>
      <td class="${defRoas !== null ? (defRoas >= 1 ? 'pv' : 'nv') : ''}">${defRoas !== null ? defRoas.toFixed(2) + '× incl. deferred' : '—'}</td>
    </tr>`;
  }

  body.innerHTML = html;

  // Update subtitle
  const sub = document.getElementById('kpiSummarySubtitle');
  if (sub) {
    const windowLabel = hasTail ? 'full period incl. tail' : '12 months';
    sub.textContent = isFiltered
      ? `Showing ${byPlatform.size} of ${platforms.length} platforms (${windowLabel}) — filtered by selection above`
      : `Spend, conversions, revenue, CPA and ROAS by vertical and platform (${windowLabel})`;
  }
}

// ─────────────────────────────────────────────────────────────
// RENDER — LEGEND
// ─────────────────────────────────────────────────────────────

function renderLegend() {
  document.getElementById('channelLegend').innerHTML = platforms
    .map((plat, idx) => {
      const ch    = channels.find(c => c.id === plat.channelId);
      const label = ch ? `${esc(ch.name)} › ${esc(plat.name)}` : esc(plat.name);
      return `<span class="legend-item"><span class="legend-dot" style="background:${COLOURS[idx%COLOURS.length]}"></span>${label}</span>`;
    }).join('');
}

// ─────────────────────────────────────────────────────────────
// PLATFORM FILTER (controls panels ③ ④ ⑤)
// ─────────────────────────────────────────────────────────────

function renderChannelFilter() {
  const container = document.getElementById('channelFilterPills');
  if (!container) return;
  const isAll = activeChannelFilter.size === 0;

  let html = `<button class="ch-filter-pill${isAll ? ' all-active' : ''}" onclick="clearChannelFilter()">All</button>`;

  // ── Verticals ──
  if (verticals.length > 1) {
    html += `<span class="ch-filter-divider"></span>`;
    html += `<span class="ch-filter-group-label">Verticals</span>`;
    verticals.forEach(vert => {
      const childPlatIds = platforms.filter(p => {
        const ch = channels.find(c => c.id === p.channelId);
        return ch && ch.vertId === vert.id;
      }).map(p => p.id);
      if (childPlatIds.length === 0) return;
      const activeCount = childPlatIds.filter(id => activeChannelFilter.has(id)).length;
      const allActive   = activeCount === childPlatIds.length && activeCount > 0;
      const partial     = activeCount > 0 && !allActive;
      let cls = 'ch-filter-pill';
      let style = '';
      if (allActive) { cls += ' all-active'; }
      else if (partial) { cls += ' partial'; style = 'border-color:#00E5FF;color:#00E5FF;'; }
      html += `<button class="${cls}" style="${style}" onclick="toggleVertFilter(${vert.id})">${esc(vert.name)}</button>`;
    });
  }

  // ── Channels ──
  if (channels.length > 1) {
    html += `<span class="ch-filter-divider"></span>`;
    html += `<span class="ch-filter-group-label">Channels</span>`;
    channels.forEach(ch => {
      const childPlatIds = platforms.filter(p => p.channelId === ch.id).map(p => p.id);
      if (childPlatIds.length === 0) return;
      const activeCount = childPlatIds.filter(id => activeChannelFilter.has(id)).length;
      const allActive   = activeCount === childPlatIds.length && activeCount > 0;
      const partial     = activeCount > 0 && !allActive;
      let cls = 'ch-filter-pill';
      let style = '';
      if (allActive) { cls += ' all-active'; }
      else if (partial) { cls += ' partial'; style = 'border-color:#00E5FF;color:#00E5FF;'; }
      html += `<button class="${cls}" style="${style}" onclick="toggleChFilter(${ch.id})">${esc(ch.name)}</button>`;
    });
  }

  // ── Platforms ──
  if (platforms.length > 1) {
    html += `<span class="ch-filter-divider"></span>`;
    html += `<span class="ch-filter-group-label">Platforms</span>`;
    platforms.forEach((plat, idx) => {
      const colour = COLOURS[idx % COLOURS.length];
      const active = activeChannelFilter.has(plat.id);
      const style  = active ? `background:${colour};border-color:${colour};color:white;` : '';
      html += `<button class="ch-filter-pill" style="${style}" onclick="togglePlatFilter(${plat.id})">
        <span class="ch-filter-dot" style="background:${colour};${active ? 'opacity:0.7;' : ''}"></span>${esc(plat.name)}
      </button>`;
    });
  }

  if (!isAll) {
    const n = activeChannelFilter.size;
    html += `<span class="ch-filter-active-note">— ${n} of ${platforms.length}</span>`;
  }
  container.innerHTML = html;
}

// ── Filter toggles ──

function togglePlatFilter(platId) {
  if (activeChannelFilter.has(platId)) {
    activeChannelFilter.delete(platId);
  } else {
    activeChannelFilter.add(platId);
  }
  refreshForecast();
}

function toggleVertFilter(vertId) {
  const childPlatIds = platforms.filter(p => {
    const ch = channels.find(c => c.id === p.channelId);
    return ch && ch.vertId === vertId;
  }).map(p => p.id);

  const allActive = childPlatIds.every(id => activeChannelFilter.has(id));
  if (allActive) {
    // Deselect all children
    childPlatIds.forEach(id => activeChannelFilter.delete(id));
  } else {
    // Select all children
    childPlatIds.forEach(id => activeChannelFilter.add(id));
  }
  refreshForecast();
}

function toggleChFilter(chId) {
  const childPlatIds = platforms.filter(p => p.channelId === chId).map(p => p.id);

  const allActive = childPlatIds.every(id => activeChannelFilter.has(id));
  if (allActive) {
    childPlatIds.forEach(id => activeChannelFilter.delete(id));
  } else {
    childPlatIds.forEach(id => activeChannelFilter.add(id));
  }
  refreshForecast();
}

function clearChannelFilter() {
  activeChannelFilter.clear();
  refreshForecast();
}




// ─────────────────────────────────────────────────────────────
// NICE NUMBERS — PRESENTATION ROUNDING
// ─────────────────────────────────────────────────────────────

function toggleNiceNumbers() {
  nnEnabled = !nnEnabled;
  const track = document.getElementById('nnToggleTrack');
  const text  = document.getElementById('nnToggleText');
  if (track) track.classList.toggle('active', nnEnabled);
  if (text)  text.textContent = nnEnabled ? 'On' : 'Off';
  render();
}


// ─────────────────────────────────────────────────────────────
// FULL RENDER + PARTIAL REFRESH
// ─────────────────────────────────────────────────────────────

function render() {
  const filtered   = buildForecast();
  const unfiltered = buildForecast({ skipFilter: true });
  renderCampaignStructure();
  renderBudgetPhasing();

  renderNnPanelState();
  renderKPIs(unfiltered.months, unfiltered.revenueDeferred);
  renderChart(filtered.months);
  renderMonthlyChart(filtered.months);
  renderMonthlyTable(filtered.months);
  renderKpiSummary(filtered.byPlatform);
  renderLegend();
  renderChannelFilter();
  renderTailToggle();
  // Render organic state (if on organic tab, or when restoring)
  orgRenderImportState();
  // Sync budget input
  const budgetInput = document.getElementById('kpi-budget-input');
  if (budgetInput && totalBudget > 0 && !budgetInput.matches(':focus')) budgetInput.value = totalBudget;
  // Sync currency symbol
  const sym   = document.getElementById('currencySelect')?.value || '£';
  const symEl = document.getElementById('kpi-budget-sym');
  if (symEl) symEl.textContent = sym;
  // Sync season snap
  const snapCb = document.getElementById('seasonSnap5Toggle');
  if (snapCb) snapCb.checked = seasonSnap5;
  saveToLocalStorage();
}

function refreshForecast() {
  const filtered   = buildForecast();
  const unfiltered = buildForecast({ skipFilter: true });
  renderCampaignStructure();
  renderBudgetPhasing();

  renderNnPanelState();
  renderKPIs(unfiltered.months, unfiltered.revenueDeferred);
  renderChart(filtered.months);
  renderMonthlyChart(filtered.months);
  renderMonthlyTable(filtered.months);
  renderKpiSummary(filtered.byPlatform);
  renderChannelFilter();
  renderTailToggle();
}

function renderNnPanelState() {
  const track = document.getElementById('nnToggleTrack');
  const text  = document.getElementById('nnToggleText');
  if (track) track.classList.toggle('active', nnEnabled);
  if (text)  text.textContent = nnEnabled ? 'On' : 'Off';
}


// ─────────────────────────────────────────────────────────────
// MUTATIONS — PLATFORM BUDGETS
// ─────────────────────────────────────────────────────────────

function updateBudget(id, monthIdx, value) {
  const plat = platforms.find(p => p.id === id);
  if (!plat) return;
  plat.budgets[monthIdx] = value;

  // Keep plat.pct honest after a direct monthly edit:
  // recompute the platform's implied annual share of its channel budget.
  const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
  const ch     = channels.find(c => c.id === plat.channelId);
  const vert   = ch && verticals.find(v => v.id === ch.vertId);
  const parent = (vert && ch) ? totalBudget * vert.pct / 100 * ch.pct / 100 : 0;
  if (parent > 1) plat.pct = Math.round(annual / parent * 10000) / 100;

  const filtered   = buildForecast();
  const unfiltered = buildForecast({ skipFilter: true });
  renderBudgetPhasing();

  renderKPIs(unfiltered.months, unfiltered.revenueDeferred);
  renderChart(filtered.months);
  renderMonthlyTable(filtered.months);
  renderKpiSummary(filtered.byPlatform);
}



function onSeasonCatChange() {
  const catSel = document.getElementById('seasonCatSelect');
  if (!catSel) return;
  seasonEditorCat = catSel.value;
  const sel = document.getElementById('seasonShapeSelect');
  if (!sel) return;
  sel.innerHTML = Object.keys(SEASONALITY_SHAPES[seasonEditorCat] || {})
    .map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  seasonEditorShape = sel.value || null;
  renderSeasonPreview();
}

function onSeasonShapeChange() {
  const sel = document.getElementById('seasonShapeSelect');
  if (sel) seasonEditorShape = sel.value || null;
  renderSeasonPreview();
}

function renderSeasonPreview() {
  const cat     = document.getElementById('seasonCatSelect')?.value;
  const shape     = document.getElementById('seasonShapeSelect')?.value;
  const calWeights = SEASONALITY_SHAPES[cat]?.[shape];
  const canvas    = document.getElementById('seasonPreview');
  if (!calWeights || !canvas) return;

  const weights = rotateWeights(calWeights);
  const ctx  = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 3, n = 12;
  const slotW = (W - pad * 2) / n;
  const barW  = Math.max(1, slotW - 1.5);
  const maxW  = Math.max(...weights);

  ctx.clearRect(0, 0, W, H);
  weights.forEach((w, i) => {
    const barH = Math.max(2, (w / maxW) * (H - pad * 2 - 2));
    const x    = pad + i * slotW + (slotW - barW) / 2;
    const y    = H - pad - barH;
    // colour-code: high = indigo, mid = green, low = slate
    ctx.fillStyle = w >= 1.5 ? '#00E5FF' : w >= 1.0 ? '#00E5FF' : '#7A8A9A';
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(barW), Math.round(barH));
  });
}

// Distribute `annual` across 12 months using normalised weights.
// Uses proper largest-remainder (Hamilton) method: floor first, then award
// +1 to months with the biggest fractional remainders until the sum matches.
// This guarantees every value is within 1 of the ideal and the sum is exact.
function distributeWeighted(annual, norm, snap) {
  const s = Math.max(1, snap || 1);
  const target = Math.round(annual / s) * s;
  if (target <= 0) return Array(12).fill(0);

  // Detect near-flat shapes: if all weights are within 0.1% of each other,
  // use perfect equal division to avoid micro-drift accumulation
  const maxN = Math.max(...norm);
  const minN = Math.min(...norm);
  if (maxN > 0 && (maxN - minN) / maxN < 0.001) {
    const perMonth = Math.floor(target / 12 / s) * s;
    const remainder = target - perMonth * 12;
    const result = Array(12).fill(perMonth);
    // Distribute remainder 1 snap-unit at a time starting from month 0
    for (let i = 0; i < remainder / s; i++) result[i] += s;
    return result;
  }

  const exact = norm.map(w => w * target);
  const floored = exact.map(v => Math.floor(v / s) * s);
  let deficit = target - floored.reduce((a, b) => a + b, 0);

  // Award surplus in s-sized increments to months with largest fractional remainders
  const remainders = exact.map((v, i) => ({ i, r: (v / s) - Math.floor(v / s) }));
  remainders.sort((a, b) => b.r - a.r);
  let k = 0;
  while (deficit >= s && k < remainders.length) {
    floored[remainders[k].i] += s;
    deficit -= s;
    k++;
  }
  // Absorb any sub-snap residual into the largest month
  if (deficit > 0 && floored.length > 0) {
    const biggest = floored.indexOf(Math.max(...floored));
    floored[biggest] += deficit;
  }
  return floored;
}

function toggleSeasonSnap5() {
  const cb = document.getElementById('seasonSnap5Toggle');
  seasonSnap5 = cb ? cb.checked : false;
  saveToLocalStorage();
}


// ─────────────────────────────────────────────────────────────
// SEASON SHAPE EDITOR
// ─────────────────────────────────────────────────────────────

// Derive the current shape as percentages from the total monthly budgets.
// Only uses channels without a custom shape — custom-shaped channels are excluded
// so the default shape editor purely reflects the channels it actually controls.
function shapeFromBudgets() {
  const nonCustom = platforms.filter(p => p.customShape === null);
  const monthly   = Array(12).fill(0).map((_, m) =>
    nonCustom.reduce((s, p) => s + (p.budgets[m] || 0), 0));
  const total = monthly.reduce((a, b) => a + b, 0);
  if (total === 0) return Array(12).fill(Math.round(1000 / 12) / 10);
  return monthly.map(v => Math.round(v / total * 1000) / 10);
}

function toggleSeasonEditor() {
  if (seasonEditorOpen) {
    seasonEditorOpen = false;
    seasonActiveBar  = null;
    const wrap = document.getElementById('seasonEditorWrap');
    if (wrap) wrap.style.display = 'none';
  } else {
    seasonEditorOpen = true;
    seasonDraftVals  = shapeFromBudgets(); // always reflect current budget on open
    seasonLocked     = Array(12).fill(false);
    const wrap = document.getElementById('seasonEditorWrap');
    if (wrap) wrap.style.display = '';
    renderSeasonEditor();
  }
}

// Load the selected preset into the bar editor (always called from inside the lightbox)
function loadSeasonPreset() {
  const cat       = document.getElementById('seasonCatSelect')?.value;
  const shape     = document.getElementById('seasonShapeSelect')?.value;
  const calWeights = SEASONALITY_SHAPES[cat]?.[shape];
  if (!calWeights) return;
  const weights  = rotateWeights(calWeights);
  const total    = weights.reduce((a, b) => a + b, 0);
  seasonDraftVals = weights.map(w => Math.round(w / total * 1000) / 10);
  // Correct rounding drift so they sum to exactly 100
  const drift = 100 - seasonDraftVals.reduce((a, b) => a + b, 0);
  if (Math.abs(drift) > 0.001) seasonDraftVals[11] = Math.round((seasonDraftVals[11] + drift) * 10) / 10;
  seasonLocked    = Array(12).fill(false);
  seasonActiveBar = null;
  renderSeasonEditor();
}

function renderSeasonEditor() {
  const wrap = document.getElementById('seasonEditorWrap');
  if (!wrap) return;
  if (!seasonDraftVals) seasonDraftVals = shapeFromBudgets();

  const currency  = document.getElementById('currencySelect')?.value || '£';
  const leafTotal = channels.filter(c => !c.isGroup)
    .reduce((s, ch) => s + ch.budgets.reduce((a, b) => a + (b || 0), 0), 0);
  const annualBase = targetBudget > 0 ? targetBudget : leafTotal;

  const total    = seasonDraftVals.reduce((a, b) => a + b, 0);
  const pctR     = Math.round(total * 10) / 10;
  const diff     = Math.abs(total - 100);
  const balanced = diff < 0.1;
  const over     = total > 100;
  const sumCls   = balanced ? 'ok' : over ? 'bad' : '';
  const sumLbl   = balanced
    ? `${pctR}%`
    : over
      ? `${pctR}% — ${(total - 100).toFixed(1)}% over`
      : `${pctR}% — ${(100 - total).toFixed(1)}% remaining`;

  const maxVal = Math.max(...seasonDraftVals, 0.1);

  const bars = seasonDraftVals.map((val, m) => {
    const locked  = seasonLocked[m];
    const barH    = Math.max(3, Math.round(val / maxVal * 76));
    const amtStr  = annualBase > 0
      ? `${currency}${Math.round(annualBase * val / 100).toLocaleString()}`
      : '';
    const isActive = m === seasonActiveBar;

    const barContent = isActive
      ? `<input class="sbar-active-input" type="number" min="0" max="100" step="0.5"
           value="${val.toFixed(1)}"
           oninput="previewSeasonBar(${m}, +this.value)"
           onchange="setSeasonBar(${m}, +this.value)"
           onblur="setSeasonBar(${m}, +this.value)"
           onkeydown="if(event.key==='Enter') this.blur(); if(event.key==='Escape') cancelSeasonBar(${m}, this)" />`
      : `<span class="sbar-pct">${val.toFixed(1)}%</span>
         ${amtStr ? `<span class="sbar-amt">${amtStr}</span>` : ''}
         <div class="sbar-fill" style="height:${barH}px;"
              onclick="activateSeasonBar(${m})" title="Click to edit ${MONTHS[m]}"></div>`;

    return `
      <div class="sbar-col${locked ? ' locked' : ''}" id="sbar-col-${m}">
        <div class="sbar-wrap">${barContent}</div>
        <span class="sbar-label">${MONTHS[m]}</span>
        <button class="sbar-lock" onclick="toggleSeasonLock(${m})"
          title="${locked ? 'Unlock' : 'Lock'} ${MONTHS[m]}">${locked ? '🔒' : '🔓'}</button>
      </div>`;
  }).join('');

  const unlockedCount = seasonLocked.filter(l => !l).length;
  const canBalance    = unlockedCount > 0 && !balanced;

  const catOptions = ['Basic','USA Sports','Canadian Sports','European Sports','Philippines Sports']
    .map(c => `<option value="${esc(c)}"${c === seasonEditorCat ? ' selected' : ''}>${esc(c)}</option>`).join('');

  wrap.innerHTML = `
    <div class="season-editor-modal" onclick="event.stopPropagation()">
      <div class="season-editor-modal-head">
        <div>
          <strong>Edit Default Season Shape</strong>
          <p>Drag or click a bar to adjust. Locked months are preserved when applying.</p>
        </div>
        <button class="season-editor-modal-close" onclick="toggleSeasonEditor()" title="Close">✕</button>
      </div>
      <div class="season-editor-modal-body">
        <!-- Preset picker -->
        <div style="margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid #0F1D2E;">
          <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#7A8A9A;margin-bottom:9px;">Load a preset</div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <select id="seasonCatSelect" class="shape-controls-select" onchange="onSeasonCatChange()">${catOptions}</select>
            <select id="seasonShapeSelect" class="shape-controls-select" onchange="onSeasonShapeChange()" style="min-width:155px;"></select>
            <canvas id="seasonPreview" width="96" height="28"
              style="border:1px solid #1A2A3F;border-radius:4px;vertical-align:middle;background:#0D1B2A;flex-shrink:0;"></canvas>
            <button class="btn btn-secondary btn-sm" onclick="loadSeasonPreset()">Load →</button>
          </div>
        </div>
        <!-- Bar editor -->
        <div class="sbar-grid">${bars}</div>
        <div class="season-editor-footer">
          <span id="seasonSumPill" class="sum-pill ${sumCls}">${sumLbl}</span>
          <button class="btn btn-secondary btn-sm" onclick="balanceSeason()"
            ${canBalance ? '' : 'disabled'}
            title="Distribute over/under proportionally across unlocked months"
            style="${canBalance ? '' : 'opacity:0.4;cursor:default;'}">🎯 Balance</button>
          <label style="display:flex;align-items:center;gap:5px;font-size:0.75rem;color:#64748b;cursor:pointer;">
            <input type="checkbox" id="seasonSnap5Toggle" ${seasonSnap5 ? 'checked' : ''}
              onchange="toggleSeasonSnap5()" />
            Round to nearest £5
          </label>
          <span style="flex:1;"></span>
          <button class="btn btn-primary btn-sm" onclick="applySeasonShape()">Apply ✓</button>
        </div>
      </div>
    </div>`;

  // After innerHTML is set: populate shape dropdown, restore selection, draw preview
  setTimeout(() => {
    const shapeSel = document.getElementById('seasonShapeSelect');
    const cat = seasonEditorCat || 'Basic';
    if (shapeSel) {
      shapeSel.innerHTML = Object.keys(SEASONALITY_SHAPES[cat] || {})
        .map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
      if (seasonEditorShape) shapeSel.value = seasonEditorShape;
      seasonEditorShape = shapeSel.value || null;
    }
    renderSeasonPreview();
    // Auto-focus the active bar input if one is open
    if (seasonActiveBar !== null) {
      const inp = document.querySelector(`#sbar-col-${seasonActiveBar} .sbar-active-input`);
      if (inp) { inp.focus(); inp.select(); }
    }
  }, 20);
}

// Called on oninput — updates the sum pill live without re-rendering bars
function previewSeasonBar(m, draftVal) {
  const temp  = [...seasonDraftVals];
  temp[m]     = isNaN(draftVal) ? 0 : draftVal;
  const total = temp.reduce((a, b) => a + b, 0);
  const pctR  = Math.round(total * 10) / 10;
  const diff  = Math.abs(total - 100);
  const over  = total > 100;
  const pill  = document.getElementById('seasonSumPill');
  if (!pill) return;
  pill.className   = `sum-pill ${diff < 0.1 ? 'ok' : over ? 'bad' : ''}`;
  pill.textContent = diff < 0.1
    ? `${pctR}%`
    : over ? `${pctR}% — ${(total - 100).toFixed(1)}% over`
           : `${pctR}% — ${(100 - total).toFixed(1)}% remaining`;
}

function activateSeasonBar(m) {
  if (seasonLocked[m]) return;
  seasonActiveBar = m;
  renderSeasonEditor();
}

function setSeasonBar(m, val) {
  if (seasonLocked[m]) return;
  seasonDraftVals[m] = Math.max(0, Math.round(val * 10) / 10);
  seasonActiveBar    = null;
  renderSeasonEditor();
}

function cancelSeasonBar(m, input) {
  input.value     = seasonDraftVals[m].toFixed(1);
  seasonActiveBar = null;
  renderSeasonEditor();
}

function toggleSeasonLock(m) {
  seasonLocked[m] = !seasonLocked[m];
  renderSeasonEditor();
}

function balanceSeason() {
  if (!seasonDraftVals) return;
  const total      = seasonDraftVals.reduce((a, b) => a + b, 0);
  const diff       = 100 - total;
  if (Math.abs(diff) < 0.05) return;

  const unlocked    = seasonDraftVals.map((_, i) => i).filter(i => !seasonLocked[i]);
  const unlockedSum = unlocked.reduce((s, i) => s + seasonDraftVals[i], 0);
  if (unlockedSum === 0) return; // nothing to redistribute into

  // Proportional redistribution across unlocked months
  unlocked.forEach(i => {
    seasonDraftVals[i] = Math.round(
      (seasonDraftVals[i] + diff * (seasonDraftVals[i] / unlockedSum)) * 10) / 10;
  });
  // Fix rounding drift on the last unlocked month
  const newTotal = seasonDraftVals.reduce((a, b) => a + b, 0);
  const drift    = Math.round((100 - newTotal) * 10) / 10;
  if (Math.abs(drift) > 0.001 && unlocked.length) {
    seasonDraftVals[unlocked[unlocked.length - 1]] =
      Math.round((seasonDraftVals[unlocked[unlocked.length - 1]] + drift) * 10) / 10;
  }
  renderSeasonEditor();
}

function applySeasonShape() {
  if (!seasonDraftVals) return;
  const norm     = seasonDraftVals.map(v => v / 100);
  const snap     = seasonSnap5 ? 5 : 1;
  let skipped = 0;

  // Months locked in the spread chart are treated as frozen —
  // the shape is applied only to unlocked months, with weights
  // renormalised to fit the remaining budget.
  const unlockedMonths = spreadLocked.map((l, m) => l ? -1 : m).filter(m => m >= 0);
  const allUnlocked    = unlockedMonths.length === 12;

  // Only apply to platforms that don't have a per-platform custom shape set.
  platforms.forEach(plat => {
    if (plat.customShape !== null) { skipped++; return; }
    const annual = plat.budgets.reduce((a, b) => a + (b || 0), 0);
    if (annual === 0) return;

    if (allUnlocked) {
      plat.budgets = distributeWeighted(annual, norm, snap);
    } else if (unlockedMonths.length === 0) {
      // All months locked — nothing to do
    } else {
      const lockedSum  = spreadLocked.reduce((s, locked, m) => s + (locked ? (plat.budgets[m] || 0) : 0), 0);
      const remaining  = Math.max(0, annual - lockedSum);
      const rawWeights = unlockedMonths.map(m => norm[m]);
      const rawSum     = rawWeights.reduce((a, b) => a + b, 0);
      const distributed = rawSum > 0
        ? rawWeights.map(w => Math.round(w / rawSum * remaining / snap) * snap)
        : rawWeights.map(() => Math.round(remaining / unlockedMonths.length / snap) * snap);
      const drift = remaining - distributed.reduce((a, b) => a + b, 0);
      distributed[distributed.length - 1] = Math.max(0, distributed[distributed.length - 1] + drift);
      plat.budgets = plat.budgets.map((v, m) => {
        if (spreadLocked[m]) return v || 0;
        return distributed[unlockedMonths.indexOf(m)];
      });
    }
  });

  const msgs = [];
  if (skipped > 0) msgs.push(`${skipped} custom-shaped platform${skipped !== 1 ? 's' : ''} unchanged`);
  const lockedCount = spreadLocked.filter(l => l).length;
  if (lockedCount > 0) msgs.push(`${lockedCount} locked month${lockedCount !== 1 ? 's' : ''} preserved`);
  showToast(msgs.length ? `Default shape applied — ${msgs.join(', ')}` : 'Default shape applied');

  seasonEditorOpen = false;
  seasonActiveBar  = null;
  const _ew = document.getElementById('seasonEditorWrap');
  if (_ew) _ew.style.display = 'none';
  render();
}

// ─────────────────────────────────────────────────────────────
// MUTATIONS — LTV SETTINGS
// ─────────────────────────────────────────────────────────────

function setRoiMode(mode) {
  roiMode = mode;
  refreshForecast();
}

function onTailToggle() {
  tail.enabled = document.getElementById('tailToggle').checked;
  refreshForecast();
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────────────────────────
// SAVE / LOAD STATE
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mktForecast_v37';
const ONBOARD_KEY = 'mktForecast_v37_onboard';
const VIEWTAB_KEY = 'mktForecast_v37_viewTab';

function getState() {
  return {
    totalBudget,
    allocMode,
    verticals,
    channels,
    platforms,
    vertNextId,
    chNextId,
    platNextId,
    tail,
    roiMode,
    seasonSnap5,
    targets,
    nnEnabled,
    startMonth,
    customShapes,
    customCpcShapes,
    orgKeywords,
    orgNextId,
    orgVerticals,
    orgCtrCurve,
    orgAgencyFees,
    currency: document.getElementById('currencySelect')?.value || '£',
  };
}

function setState(data) {
  if (!data) return false;
  // V14 format: requires platforms array
  if (!Array.isArray(data.platforms) || !Array.isArray(data.verticals) || !Array.isArray(data.channels)) {
    return false;
  }
  totalBudget  = data.totalBudget ?? 0;
  allocMode    = data.allocMode    ?? 'amt';

  // Migrate old global LTV to per-vertical LTV
  const globalLtvSettings = data.ltv || { enabled: false, lag: 1, pct3m: 30, pct6m: 50, pct12m: 20 };

  verticals    = data.verticals.map(v => {
    const defaults = {
      collapsed: false, locked: false, arpu: 30, lifespan: 6,
      ltv: {
        enabled: v.ltv?.enabled ?? globalLtvSettings.enabled,
        lag: v.ltv?.lag ?? globalLtvSettings.lag,
        pct3m: v.ltv?.pct3m ?? globalLtvSettings.pct3m,
        pct6m: v.ltv?.pct6m ?? globalLtvSettings.pct6m,
        pct12m: v.ltv?.pct12m ?? globalLtvSettings.pct12m
      }
    };
    return { ...defaults, ...v };
  });
  channels     = data.channels.map(c => ({ collapsed: false, locked: false, ...c }));
  platforms    = data.platforms.map(p => ({
    locked: false, customShape: null, model: 'cpc', cpc: 1.50, ctr: 3.0, cvr: 3.0,
    budgets: Array(12).fill(0), cpcRates: null, cpmRates: null,
    flatCpcBackup: null, flatCpmBackup: null, ...p
  }));
  vertNextId   = data.vertNextId  ?? (verticals.length  > 0 ? Math.max(...verticals.map(v => v.id))  + 1 : 1);
  chNextId     = data.chNextId    ?? (channels.length   > 0 ? Math.max(...channels.map(c => c.id))   + 1 : 1);
  platNextId   = data.platNextId  ?? (platforms.length  > 0 ? Math.max(...platforms.map(p => p.id))  + 1 : 1);
  tail         = { ...tail, ...(data.tail || {}) };
  roiMode      = data.roiMode     ?? roiMode;
  seasonSnap5  = data.seasonSnap5 ?? seasonSnap5;
  nnEnabled    = data.nnEnabled   ?? nnEnabled;
  startMonth   = data.startMonth  ?? 0;
  customShapes = Array.isArray(data.customShapes) ? data.customShapes : [];
  customCpcShapes = Array.isArray(data.customCpcShapes) ? data.customCpcShapes : [];
  orgKeywords  = Array.isArray(data.orgKeywords) ? data.orgKeywords : [];
  orgNextId    = data.orgNextId ?? (orgKeywords.length > 0 ? Math.max(...orgKeywords.map(k => k.id)) + 1 : 1);
  orgVerticals = Array.isArray(data.orgVerticals) ? data.orgVerticals : [];
  orgCtrCurve  = Array.isArray(data.orgCtrCurve) ? data.orgCtrCurve : null;
  orgAgencyFees = Array.isArray(data.orgAgencyFees) ? data.orgAgencyFees : Array(12).fill(0);
  targets      = { ...targets, ...(data.targets || {}) };
  if (data.currency) {
    const sel = document.getElementById('currencySelect');
    if (sel) sel.value = data.currency;
  }
  // Restore start month dropdown
  const smSel = document.getElementById('startMonthSelect');
  if (smSel) smSel.value = startMonth;
  return true;
}


// ─────────────────────────────────────────────────────────────
// VIEW TAB SWITCHING (Paid / Organic / Combined)
// ─────────────────────────────────────────────────────────────

let activeView = 'paid';

function switchView(view) {
  activeView = view;
  // Update tab pills
  document.querySelectorAll('#viewTabs .view-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  // Show/hide view containers
  document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
  if (target) target.classList.add('active');
  // Persist
  try { localStorage.setItem(VIEWTAB_KEY, view); } catch(e) {}
}

function restoreViewTab() {
  try {
    const saved = localStorage.getItem(VIEWTAB_KEY);
    if (saved && ['paid','organic','combined'].includes(saved)) {
      switchView(saved);
    }
  } catch(e) {}
}

function onStartMonthChange(val) {
  startMonth = val;
  // Existing platform budgets are NOT rearranged — the user must re-apply
  // shapes manually if they want the new rotation. Previews and future shape
  // applications will use the updated rotation automatically.
  saveToLocalStorage();
  render();
  showToast(`Forecast starts: ${['January','February','March','April','May','June','July','August','September','October','November','December'][val]}. Re-apply shapes to see the effect.`);
}

function saveToLocalStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getState())); } catch(e) { /* unavailable */ }
}

function showToast(msg) {
  const t = document.getElementById('saveToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
  const date = new Date().toISOString().slice(0, 10);
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: `forecast-${date}.json`
  });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('💾 Forecast saved to file');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (setState(data)) {
        render();
        showToast('📂 Forecast loaded');
      } else {
        alert('Unrecognised format — please load a .json file saved from this tool.');
      }
    } catch {
      alert('Could not read file. Make sure it is a valid forecast .json file.');
    }
    event.target.value = ''; // allow same file to be re-loaded
  };
  reader.readAsText(file);
}

// ─────────────────────────────────────────────────────────────
// EXCEL EXPORT (SheetJS / xlsx)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// ORGANIC — KEYWORD TEMPLATE DOWNLOAD
// ─────────────────────────────────────────────────────────────

function downloadKeywordTemplate() {
  const data = [
    { keyword: 'best online slots',         vertical: 'Slots',          search_volume: 12100, current_rank: 18 },
    { keyword: 'online slots real money',    vertical: 'Slots',          search_volume: 8100,  current_rank: 24 },
    { keyword: 'free slots no download',     vertical: 'Slots',          search_volume: 6600,  current_rank: 35 },
    { keyword: 'new slot sites',             vertical: 'Slots',          search_volume: 4400,  current_rank: 12 },
    { keyword: 'slot games with bonus',      vertical: 'Slots',          search_volume: 3200,  current_rank: 42 },
    { keyword: 'sports betting sites',       vertical: 'Sports Betting', search_volume: 22200, current_rank: 15 },
    { keyword: 'best betting offers',        vertical: 'Sports Betting', search_volume: 9900,  current_rank: 28 },
    { keyword: 'football betting tips',      vertical: 'Sports Betting', search_volume: 14800, current_rank: 8 },
    { keyword: 'live betting',               vertical: 'Sports Betting', search_volume: 5400,  current_rank: 21 },
    { keyword: 'bet builder tips',           vertical: 'Sports Betting', search_volume: 3600,  current_rank: 33 },
    { keyword: 'online casino UK',           vertical: 'Casino',         search_volume: 18100, current_rank: 19 },
    { keyword: 'best casino bonuses',        vertical: 'Casino',         search_volume: 8800,  current_rank: 14 },
    { keyword: 'live casino games',          vertical: 'Casino',         search_volume: 5200,  current_rank: 27 },
    { keyword: 'casino welcome offer',       vertical: 'Casino',         search_volume: 3900,  current_rank: 31 },
    { keyword: 'blackjack online',           vertical: 'Casino',         search_volume: 7300,  current_rank: 22 },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws['!cols'] = [
    { wch: 30 },  // keyword
    { wch: 18 },  // vertical
    { wch: 16 },  // search_volume
    { wch: 14 },  // current_rank
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Keywords');
  XLSX.writeFile(wb, 'keyword-template.xlsx');
  showToast('📥 Keyword template downloaded');
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — KEYWORD IMPORT & PARSING
// ─────────────────────────────────────────────────────────────

/**
 * Column auto-detection — maps user-facing headers to our internal names.
 * Forgiving: case-insensitive, trims whitespace, handles common variants.
 */
function orgDetectColumns(headers) {
  const map = {};
  const patterns = {
    keyword:      /^keywords?$/i,
    vertical:     /^verticals?$|^niche$|^category$/i,
    searchVolume: /^search.?vol(ume)?$|^volume$|^avg.?monthly.?search(es)?$|^msv$/i,
    currentRank:  /^(current.?)?rank(ing)?$|^position$|^pos$/i,
  };
  headers.forEach((h, i) => {
    const clean = (h || '').toString().trim();
    for (const [field, rx] of Object.entries(patterns)) {
      if (!map[field] && rx.test(clean)) {
        map[field] = i;
      }
    }
  });
  return map;
}

/**
 * Parse a 2D array (rows of columns) into orgKeywords[].
 * Returns { keywords: [], errors: [] }.
 */
function orgParseRows(rows) {
  if (rows.length < 2) return { keywords: [], errors: ['File has no data rows (only header or empty).'] };

  const headers = rows[0].map(h => (h || '').toString().trim());
  const colMap = orgDetectColumns(headers);
  const errors = [];

  // Check required columns
  const required = ['keyword', 'vertical', 'searchVolume', 'currentRank'];
  const missing = required.filter(f => colMap[f] === undefined);
  if (missing.length > 0) {
    return { keywords: [], errors: [`Could not detect column(s): ${missing.join(', ')}. Found headers: ${headers.join(', ')}`] };
  }

  const keywords = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const kw  = (row[colMap.keyword] || '').toString().trim();
    const vert = (row[colMap.vertical] || '').toString().trim();
    const sv  = parseInt(row[colMap.searchVolume], 10);
    const rank = parseInt(row[colMap.currentRank], 10);

    if (!kw) continue; // skip blank rows

    if (!vert) { errors.push(`Row ${r + 1}: missing vertical for "${kw}"`); continue; }
    if (isNaN(sv) || sv < 0) { errors.push(`Row ${r + 1}: invalid search volume for "${kw}"`); continue; }
    if (isNaN(rank) || rank < 1) { errors.push(`Row ${r + 1}: invalid rank for "${kw}"`); continue; }

    keywords.push({
      id: orgNextId++,
      keyword: kw,
      vertical: vert,
      searchVolume: sv,
      currentRank: Math.min(rank, 50),
    });
  }

  return { keywords, errors };
}

/**
 * Parse CSV text into 2D array.
 */
function orgCsvToRows(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    // Simple CSV parse — handles quoted fields with commas
    const cols = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    return cols;
  });
}

/** Parse from the textarea */
function orgParseFromPaste() {
  const text = document.getElementById('orgCsvPaste')?.value?.trim();
  if (!text) { showToast('Paste CSV data first'); return; }
  const rows = orgCsvToRows(text);
  orgImportRows(rows);
}

/** Parse from file upload (.csv or .xlsx) */
function orgParseFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = e => {
      const rows = orgCsvToRows(e.target.result);
      orgImportRows(rows);
    };
    reader.readAsText(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        orgImportRows(rows);
      } catch(err) {
        showToast('Failed to read Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    showToast('Unsupported file type — use .csv or .xlsx');
  }

  // Reset input so same file can be re-uploaded
  event.target.value = '';
}

/**
 * Common import handler — takes parsed 2D rows, validates, stores in state, renders.
 */
function orgImportRows(rows) {
  const { keywords, errors } = orgParseRows(rows);

  if (keywords.length === 0) {
    alert(errors.length > 0 ? errors.join('\n') : 'No valid keywords found.');
    return;
  }

  // Store in state
  orgKeywords = keywords;

  // Auto-detect verticals from keywords — preserve existing config where possible
  const vertNames = [...new Set(keywords.map(k => k.vertical))];
  const prevVerts = new Map(orgVerticals.map(v => [v.name, v]));
  orgVerticals = vertNames.map((name, i) => {
    const prev = prevVerts.get(name);
    return {
      id: prev?.id ?? (i + 1),
      name,
      cvr: prev?.cvr ?? 2.0,
      arpu: prev?.arpu ?? 50,
      trajectoryShape: prev?.trajectoryShape ?? 'linear',
      trajectoryWeights: prev?.trajectoryWeights ?? null,
    };
  });

  // Show warnings for skipped rows
  if (errors.length > 0) {
    showToast(`Imported ${keywords.length} keywords (${errors.length} row(s) skipped)`);
  } else {
    showToast(`Imported ${keywords.length} keywords across ${vertNames.length} vertical(s)`);
  }

  orgRenderImportState();
  saveToLocalStorage();
}

/** Clear all organic keywords */
function orgClearKeywords() {
  if (!confirm('Clear all imported keywords? This cannot be undone.')) return;
  orgKeywords = [];
  orgVerticals = [];
  orgNextId = 1;
  orgRenderImportState();
  saveToLocalStorage();
  showToast('Organic keywords cleared');
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — RENDER IMPORT STATE (preview table + sidebar stats)
// ─────────────────────────────────────────────────────────────

function orgRenderImportState() {
  const hasData = orgKeywords.length > 0;

  // Toggle clear button
  const clearBtn = document.getElementById('orgClearBtn');
  if (clearBtn) clearBtn.style.display = hasData ? '' : 'none';

  // Toggle preview panel
  const previewPanel = document.getElementById('orgPreviewPanel');
  if (previewPanel) previewPanel.style.display = hasData ? '' : 'none';

  // Sidebar stats
  const totalSV = orgKeywords.reduce((s, k) => s + k.searchVolume, 0);
  const statKw = document.getElementById('orgStatKeywords');
  const statVert = document.getElementById('orgStatVerticals');
  const statSV = document.getElementById('orgStatSearchVol');
  if (statKw) statKw.textContent = orgKeywords.length.toLocaleString();
  if (statVert) statVert.textContent = orgVerticals.length;
  if (statSV) statSV.textContent = totalSV.toLocaleString();

  // Vertical breakdown in sidebar
  const breakdownEl = document.getElementById('orgVerticalBreakdown');
  if (breakdownEl) {
    if (!hasData) { breakdownEl.innerHTML = ''; return; }
    let html = '<span class="kpi-sidebar-label" style="margin-top:6px;">By Vertical</span>';
    orgVerticals.forEach(v => {
      const kws = orgKeywords.filter(k => k.vertical === v.name);
      const sv = kws.reduce((s, k) => s + k.searchVolume, 0);
      html += `<div class="org-stat-card" style="padding:10px 12px;">
        <label>${v.name}</label>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;">
          <span>${kws.length} keywords</span>
          <span style="color:#8899AA;">${sv.toLocaleString()} vol</span>
        </div>
      </div>`;
    });
    breakdownEl.innerHTML = html;
  }

  // Preview subtitle
  const subtitle = document.getElementById('orgPreviewSubtitle');
  if (subtitle) subtitle.textContent = `${orgKeywords.length} keywords across ${orgVerticals.length} vertical(s) — total monthly search volume: ${totalSV.toLocaleString()}`;

  // Preview table body
  const tbody = document.getElementById('orgPreviewBody');
  if (tbody) {
    // Group by vertical for better readability
    let html = '';
    orgVerticals.forEach(v => {
      const kws = orgKeywords.filter(k => k.vertical === v.name);
      kws.forEach(k => {
        html += `<tr>
          <td>${k.keyword}</td>
          <td><span class="org-vert-badge">${k.vertical}</span></td>
          <td>${k.searchVolume.toLocaleString()}</td>
          <td>${k.currentRank}</td>
        </tr>`;
      });
    });
    tbody.innerHTML = html;
  }
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — DRAG & DROP SUPPORT
// ─────────────────────────────────────────────────────────────

(function initOrgDragDrop() {
  // Deferred — elements may not exist yet during script parse
  setTimeout(() => {
    const zone = document.getElementById('orgDropZone');
    if (!zone) return;
    ['dragenter','dragover'].forEach(evt => zone.addEventListener(evt, e => {
      e.preventDefault(); zone.classList.add('drag-over');
    }));
    ['dragleave','drop'].forEach(evt => zone.addEventListener(evt, () => {
      zone.classList.remove('drag-over');
    }));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      // Create a synthetic event for orgParseFromFile
      orgParseFromFile({ target: { files: [file], value: '' } });
    });
  }, 100);
})();

// ─────────────────────────────────────────────────────────────
// ORGANIC — DEFAULT CTR CURVE
// ─────────────────────────────────────────────────────────────

function orgDefaultCtrCurve() {
  const curve = [];
  for (let p = 1; p <= 50; p++) {
    let ctr;
    if (p === 1) ctr = 28.5;
    else if (p === 2) ctr = 15.7;
    else if (p === 3) ctr = 11.0;
    else if (p === 4) ctr = 8.0;
    else if (p === 5) ctr = 7.2;
    else if (p === 6) ctr = 5.1;
    else if (p === 7) ctr = 4.0;
    else if (p === 8) ctr = 3.2;
    else if (p === 9) ctr = 2.8;
    else if (p === 10) ctr = 2.5;
    else if (p <= 20) ctr = Math.max(0.5, 2.5 - (p - 10) * 0.15);
    else ctr = Math.max(0.1, 1.0 - (p - 20) * 0.03);
    curve.push(Math.round(ctr * 100) / 100);
  }
  return curve;
}

function orgGetCtrCurve() {
  if (!orgCtrCurve || orgCtrCurve.length !== 50) orgCtrCurve = orgDefaultCtrCurve();
  return orgCtrCurve;
}

function orgResetCtrCurve() {
  orgCtrCurve = orgDefaultCtrCurve();
  orgRenderCtrBars();
  saveToLocalStorage();
  showToast('CTR curve reset to defaults');
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — TRAJECTORY SHAPE PRESETS
// ─────────────────────────────────────────────────────────────

const ORG_TRAJECTORY_PRESETS = {
  linear: {
    name: 'Linear',
    desc: 'Steady improvement each month',
    weights: Array.from({length: 12}, (_, i) => (i + 1) / 12)
  },
  scurve: {
    name: 'S-Curve',
    desc: 'Slow start, fast middle, slow finish — most realistic for SEO',
    weights: [0.02, 0.05, 0.12, 0.25, 0.42, 0.58, 0.72, 0.83, 0.90, 0.95, 0.98, 1.0]
  },
  backloaded: {
    name: 'Back-loaded',
    desc: 'Slow for first few months, accelerates later',
    weights: [0.02, 0.04, 0.07, 0.11, 0.18, 0.28, 0.42, 0.58, 0.72, 0.85, 0.94, 1.0]
  },
  frontloaded: {
    name: 'Front-loaded',
    desc: 'Fast initial gains, tapering off',
    weights: [0.18, 0.34, 0.48, 0.60, 0.70, 0.78, 0.84, 0.89, 0.93, 0.96, 0.98, 1.0]
  },
};

// ─────────────────────────────────────────────────────────────
// ORGANIC — DRAWABLE BAR ENGINE (DAW velocity-painting style)
// ─────────────────────────────────────────────────────────────
// Reusable: pass in a config object. Click+hold+sweep paints bars to cursor Y.

/**
 * drawBarEngine(config):
 *   containerId  — DOM id of the .draw-bar-container
 *   wrapId       — DOM id of the .draw-bar-wrap
 *   getData()    — returns the current values array
 *   setData(i,v) — sets value at index i to v
 *   getMax()     — returns max value for the y-scale
 *   formatVal(v) — formats a value for the label
 *   formatLabel(i) — label below each bar
 *   onEnd()      — called when drawing stops
 */
function drawBarEngine(config) {
  let drawing = false;

  function render() {
    const container = document.getElementById(config.containerId);
    if (!container) return;
    const data = config.getData();
    const maxVal = config.getMax();
    container.innerHTML = data.map((v, i) => {
      const pct = maxVal > 0 ? (v / maxVal) * 100 : 0;
      return `<div class="draw-bar-col" data-dbi="${i}">
        <span class="draw-bar-value">${config.formatVal(v)}</span>
        <div class="draw-bar" style="height:${Math.max(pct, 1)}%"></div>
        <span class="draw-bar-label">${config.formatLabel(i)}</span>
      </div>`;
    }).join('');
  }

  function getIdxAndVal(e) {
    const container = document.getElementById(config.containerId);
    const wrap = document.getElementById(config.wrapId);
    if (!container || !wrap) return null;
    // Find which bar column the mouse is over
    const rect = container.getBoundingClientRect();
    const data = config.getData();
    const colWidth = rect.width / data.length;
    const relX = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(data.length - 1, Math.floor(relX / colWidth)));
    // Calculate value from Y position within the container
    const pct = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const maxVal = config.getMax();
    const val = pct * maxVal;
    return { idx, val };
  }

  function onDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    drawing = true;
    const container = document.getElementById(config.containerId);
    if (container) container.classList.add('drawing');
    paint(e);
  }

  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    paint(e);
  }

  function onUp() {
    if (!drawing) return;
    drawing = false;
    const container = document.getElementById(config.containerId);
    if (container) container.classList.remove('drawing');
    if (config.onEnd) config.onEnd();
  }

  function paint(e) {
    const result = getIdxAndVal(e);
    if (!result) return;
    config.setData(result.idx, result.val);
    render();
  }

  // Attach listeners
  function init() {
    const wrap = document.getElementById(config.wrapId);
    if (!wrap) return;
    wrap.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    // Touch support
    wrap.addEventListener('touchstart', e => { e.preventDefault(); onDown(e.touches[0]); }, { passive: false });
    document.addEventListener('touchmove', e => { if (drawing) { e.preventDefault(); onMove(e.touches[0]); } }, { passive: false });
    document.addEventListener('touchend', onUp);
    render();
  }

  return { init, render };
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — CTR CURVE BAR CHART (drawable, 100 bars)
// ─────────────────────────────────────────────────────────────

let orgCtrBarEngine = null;

function orgRenderCtrBars() {
  const curve = orgGetCtrCurve();
  if (!orgCtrBarEngine) {
    orgCtrBarEngine = drawBarEngine({
      containerId: 'orgCtrBarContainer',
      wrapId: 'orgCtrBarWrap',
      getData: () => orgGetCtrCurve(),
      setData: (i, v) => {
        const curve = orgGetCtrCurve();
        curve[i] = Math.max(0, Math.round(v * 100) / 100);
      },
      getMax: () => 35,  // Max CTR% for scale (pos 1 is ~28.5%)
      formatVal: v => v.toFixed(1) + '%',
      formatLabel: i => {
        const p = i + 1;
        if (p <= 10 || p % 5 === 0) return '' + p;
        return '';
      },
      onEnd: () => saveToLocalStorage(),
    });
    orgCtrBarEngine.init();
  } else {
    orgCtrBarEngine.render();
  }
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — TRAJECTORY SHAPE MODAL (drawable, 12 bars)
// ─────────────────────────────────────────────────────────────

let trajModalVertId = null;
let trajDraftWeights = null;
let trajDraftShape = null;
let trajBarEngine = null;

function openTrajModal(vertId) {
  const vert = orgVerticals.find(v => v.id === vertId);
  if (!vert) return;
  trajModalVertId = vertId;
  trajDraftShape = vert.trajectoryShape || 'linear';
  // Start from current weights if custom, otherwise from preset
  if (vert.trajectoryWeights) {
    trajDraftWeights = [...vert.trajectoryWeights];
  } else {
    trajDraftWeights = [...(ORG_TRAJECTORY_PRESETS[trajDraftShape]?.weights || ORG_TRAJECTORY_PRESETS.linear.weights)];
  }

  const overlay = document.createElement('div');
  overlay.className = 'traj-modal-overlay';
  overlay.id = 'trajModalOverlay';
  overlay.onclick = e => { if (e.target === overlay) closeTrajModal(false); };

  // Build preset cards with mini canvas previews
  let presetsHtml = '';
  for (const [key, preset] of Object.entries(ORG_TRAJECTORY_PRESETS)) {
    presetsHtml += `<div class="traj-preset-card${trajDraftShape === key ? ' active' : ''}" data-traj-key="${key}" onclick="trajSelectPreset('${key}')">
      <div class="traj-preset-name">${preset.name}</div>
      <div class="traj-preset-desc">${preset.desc}</div>
      <canvas data-traj-preview="${key}" width="200" height="40"></canvas>
    </div>`;
  }

  overlay.innerHTML = `
    <div class="traj-modal" onclick="event.stopPropagation()">
      <div class="traj-modal-head">
        <div>
          <strong>Rank Trajectory — ${esc(vert.name)}</strong>
          <p>Choose a preset or draw a custom progression curve. Values represent fraction of total rank improvement achieved by each month.</p>
        </div>
        <button class="season-editor-modal-close" onclick="closeTrajModal(false)" title="Close">✕</button>
      </div>
      <div class="traj-modal-body">
        <div class="traj-section-label">Presets</div>
        <div class="traj-presets">${presetsHtml}</div>
        <div class="traj-section-label">Custom Shape — draw to adjust</div>
        <div class="draw-bar-wrap" id="trajBarWrap">
          <div class="draw-bar-container" id="trajBarContainer"></div>
        </div>
        <div class="traj-modal-actions">
          <button class="org-btn" onclick="closeTrajModal(false)">Cancel</button>
          <button class="org-btn primary" onclick="closeTrajModal(true)">Apply</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Draw preset previews
  for (const [key, preset] of Object.entries(ORG_TRAJECTORY_PRESETS)) {
    const canvas = overlay.querySelector(`canvas[data-traj-preview="${key}"]`);
    if (canvas) trajDrawPreviewCanvas(canvas, preset.weights);
  }

  // Init drawable bar chart for the draft
  trajBarEngine = drawBarEngine({
    containerId: 'trajBarContainer',
    wrapId: 'trajBarWrap',
    getData: () => trajDraftWeights,
    setData: (i, v) => {
      trajDraftWeights[i] = Math.max(0, Math.min(1, v));
      // Mark as custom since user drew on it
      trajDraftShape = 'custom';
      trajUpdatePresetHighlight();
    },
    getMax: () => 1.0,
    formatVal: v => (v * 100).toFixed(0) + '%',
    formatLabel: i => 'M' + (i + 1),
    onEnd: () => {},
  });
  trajBarEngine.init();
}

function trajDrawPreviewCanvas(canvas, weights) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  weights.forEach((v, i) => {
    const x = (i / (weights.length - 1)) * w;
    const y = h - v * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function trajSelectPreset(key) {
  const preset = ORG_TRAJECTORY_PRESETS[key];
  if (!preset) return;
  trajDraftShape = key;
  trajDraftWeights = [...preset.weights];
  trajBarEngine?.render();
  trajUpdatePresetHighlight();
}

function trajUpdatePresetHighlight() {
  document.querySelectorAll('.traj-preset-card').forEach(card => {
    card.classList.toggle('active', card.dataset.trajKey === trajDraftShape);
  });
}

function closeTrajModal(apply) {
  if (apply && trajModalVertId !== null && trajDraftWeights) {
    const vert = orgVerticals.find(v => v.id === trajModalVertId);
    if (vert) {
      vert.trajectoryShape = trajDraftShape;
      vert.trajectoryWeights = [...trajDraftWeights];
      saveToLocalStorage();
      orgRenderVertConfig();
      showToast(`Trajectory applied to ${vert.name}`);
    }
  }
  const overlay = document.getElementById('trajModalOverlay');
  if (overlay) overlay.remove();
  trajModalVertId = null;
  trajDraftWeights = null;
  trajDraftShape = null;
  trajBarEngine = null;
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — VERTICAL CONFIG RENDERER
// ─────────────────────────────────────────────────────────────

function orgRenderVertConfig() {
  const panel = document.getElementById('orgVertConfigPanel');
  const tbody = document.getElementById('orgVertConfigBody');
  if (!panel || !tbody) return;
  const hasData = orgKeywords.length > 0;
  panel.style.display = hasData ? '' : 'none';
  if (!hasData) return;

  const currency = document.getElementById('currencySelect')?.value || '£';
  tbody.innerHTML = orgVerticals.map(v => {
    const kwCount = orgKeywords.filter(k => k.vertical === v.name).length;
    const shapeName = ORG_TRAJECTORY_PRESETS[v.trajectoryShape]?.name || 'Custom';
    return `<tr>
      <td><span class="org-vert-badge">${esc(v.name)}</span></td>
      <td>${kwCount}</td>
      <td><input type="number" min="0" max="100" step="0.1" value="${v.cvr}"
        onchange="orgSetVertField(${v.id},'cvr',+this.value)" /> %</td>
      <td>${currency} <input type="number" min="0" step="1" value="${v.arpu}"
        onchange="orgSetVertField(${v.id},'arpu',+this.value)" /></td>
      <td><button class="org-shape-btn${v.trajectoryShape !== 'linear' ? ' active' : ''}"
        onclick="openTrajModal(${v.id})">${shapeName} ▾</button></td>
    </tr>`;
  }).join('');
}

function orgSetVertField(vertId, field, val) {
  const vert = orgVerticals.find(v => v.id === vertId);
  if (!vert) return;
  vert[field] = val;
  saveToLocalStorage();
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — AGENCY FEE PANEL
// ─────────────────────────────────────────────────────────────

function orgRenderFeeGrid() {
  const panel = document.getElementById('orgFeePanel');
  const grid = document.getElementById('orgFeeGrid');
  if (!panel || !grid) return;
  const hasData = orgKeywords.length > 0;
  panel.style.display = hasData ? '' : 'none';
  if (!hasData) return;

  const currency = document.getElementById('currencySelect')?.value || '£';
  const MONTHS_LABELS = Array.from({length: 12}, (_, i) => 'M' + (i + 1));
  grid.innerHTML = orgAgencyFees.map((fee, i) =>
    `<div class="org-fee-cell">
      <label>${MONTHS_LABELS[i]}</label>
      <input type="number" min="0" step="100" value="${fee}"
        onchange="orgSetFee(${i}, +this.value)" onfocus="this.select()" />
    </div>`
  ).join('');
}

function orgSetFee(month, val) {
  orgAgencyFees[month] = Math.max(0, val || 0);
  saveToLocalStorage();
}

function orgFeeSetAll() {
  const val = +(document.getElementById('orgFeeAllVal')?.value || 0);
  orgAgencyFees = Array(12).fill(Math.max(0, val));
  orgRenderFeeGrid();
  saveToLocalStorage();
  showToast(`All months set to ${sym()}${val.toLocaleString()}`);
}

function orgFeeSplit() {
  const splitMonth = +(document.getElementById('orgFeeSplitMonth')?.value || 3);
  const valA = +(document.getElementById('orgFeeSplitA')?.value || 0);
  const valB = +(document.getElementById('orgFeeSplitB')?.value || 0);
  for (let i = 0; i < 12; i++) {
    orgAgencyFees[i] = i < splitMonth ? Math.max(0, valA) : Math.max(0, valB);
  }
  orgRenderFeeGrid();
  saveToLocalStorage();
  showToast(`Split applied: M1–${splitMonth} / M${splitMonth + 1}–12`);
}

// ─────────────────────────────────────────────────────────────
// ORGANIC — RENDER ALL (called from orgRenderImportState)
// ─────────────────────────────────────────────────────────────

// Patch orgRenderImportState to also render the new panels
const _origOrgRenderImportState = orgRenderImportState;
orgRenderImportState = function() {
  _origOrgRenderImportState();
  orgRenderVertConfig();
  orgRenderCtrBars();
  orgRenderFeeGrid();
  // Show/hide CTR panel
  const ctrPanel = document.getElementById('orgCtrPanel');
  if (ctrPanel) ctrPanel.style.display = orgKeywords.length > 0 ? '' : 'none';
};

function exportToExcel() {
  const currency = sym();
  const filtered   = buildForecast();
  const unfiltered = buildForecast({ skipFilter: true });
  const months     = filtered.months;
  const uf         = unfiltered.months;
  const ufLast     = uf[uf.length - 1];
  const hasAnyLtv  = anyLtvEnabled();
  const hasTail    = tail.enabled && hasAnyLtv;
  const breakeven  = uf.find(m => m.cumNet >= 0);
  const byPlatform = filtered.byPlatform;
  const isFiltered = activeChannelFilter.size > 0;

  const wb = XLSX.utils.book_new();

  // ─── SHEET 1: Overview ────────────────────────────────────
  {
    const totalSpend = ufLast.cumSpend;
    const totalRev   = ufLast.cumRevenue;
    const totalConvs = ufLast.cumConversions;
    const rows = [
      ['Forecast Overview'],
      [],
      ['Metric', 'Value'],
      ['Total Budget', totalBudget],
      ['Total Spend (allocated)', totalSpend],
      ['Total Revenue', totalRev],
      ['Conversions', totalConvs],
      ['CPA', totalConvs > 0 ? totalSpend / totalConvs : 0],
      ['ROAS', totalSpend > 0 ? totalRev / totalSpend : 0],
      ['Net ROI', totalRev - totalSpend],
      ['Breakeven Month', breakeven ? periodLabel(breakeven.month - 1) : 'N/A'],
      ['Currency', currency],
      ['Start Month', ['January','February','March','April','May','June','July','August','September','October','November','December'][startMonth]],
      ['Forecast Window', hasTail ? 'Full period incl. tail' : '12 months'],
    ];
    if (unfiltered.revenueDeferred > 0) {
      rows.push(['Revenue Beyond Window', unfiltered.revenueDeferred]);
      rows.push(['Total Revenue (incl. deferred)', totalRev + unfiltered.revenueDeferred]);
      rows.push(['ROAS (incl. deferred)', totalSpend > 0 ? (totalRev + unfiltered.revenueDeferred) / totalSpend : 0]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Overview');
  }

  // ─── SHEET 2: Monthly Breakdown ───────────────────────────
  {
    const header = ['Month', 'Spend', 'Conversions', 'Revenue', 'Monthly Net', 'Cumul. Spend', 'Cumul. Revenue', 'Cumul. Net', 'Cumul. ROAS'];
    const rows = [header];
    months.forEach((m, i) => {
      rows.push([
        periodLabel(i),
        m.isTail ? 0 : Math.round(m.spend),
        m.isTail ? 0 : Math.round(m.conversions),
        Math.round(m.revenue),
        Math.round(m.monthlyNet),
        Math.round(m.cumSpend),
        Math.round(m.cumRevenue),
        Math.round(m.cumNet),
        m.cumSpend > 0 ? Math.round((m.cumRevenue / m.cumSpend) * 100) / 100 : 0,
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Breakdown');
  }

  // ─── SHEET 3: KPI Summary ────────────────────────────────
  {
    const header = ['Level', 'Vertical', 'Channel', 'Platform', 'Annual Spend', 'Conversions', 'Revenue', 'Revenue Deferred', 'CPA', 'ROAS'];
    const rows = [header];
    let grandSpend = 0, grandConvs = 0, grandRev = 0, grandDeferred = 0;

    verticals.forEach(vert => {
      let vertSpend = 0, vertConvs = 0, vertRev = 0, vertDeferred = 0;
      let vertHasData = false;

      channels.filter(ch => ch.vertId === vert.id).forEach(ch => {
        let chSpend = 0, chConvs = 0, chRev = 0, chDeferred = 0;
        let chHasData = false;

        platforms.filter(p => p.channelId === ch.id).forEach(plat => {
          const kpi = byPlatform.get(plat.id);
          if (!kpi) return;
          chHasData = true;
          chSpend += kpi.spend; chConvs += kpi.conversions; chRev += kpi.revenue; chDeferred += kpi.revenueDeferred;
          rows.push([
            'Platform', vert.name, ch.name, plat.name,
            Math.round(kpi.spend), Math.round(kpi.conversions), Math.round(kpi.revenue), Math.round(kpi.revenueDeferred),
            kpi.conversions > 0 ? Math.round((kpi.spend / kpi.conversions) * 100) / 100 : 0,
            kpi.spend > 0 ? Math.round((kpi.revenue / kpi.spend) * 100) / 100 : 0,
          ]);
        });

        if (chHasData) {
          vertHasData = true;
          vertSpend += chSpend; vertConvs += chConvs; vertRev += chRev; vertDeferred += chDeferred;
        }
      });

      if (vertHasData) {
        grandSpend += vertSpend; grandConvs += vertConvs; grandRev += vertRev; grandDeferred += vertDeferred;
        // Insert vertical summary row before its children
        const vertRowIdx = rows.length;
        const insertBefore = rows.findIndex((r, i) => i > 0 && r[1] === vert.name);
        const vertRow = [
          'Vertical', vert.name, '', '',
          Math.round(vertSpend), Math.round(vertConvs), Math.round(vertRev), Math.round(vertDeferred),
          vertConvs > 0 ? Math.round((vertSpend / vertConvs) * 100) / 100 : 0,
          vertSpend > 0 ? Math.round((vertRev / vertSpend) * 100) / 100 : 0,
        ];
        if (insertBefore > 0) rows.splice(insertBefore, 0, vertRow);
        else rows.push(vertRow);
      }
    });

    // Grand total
    rows.push([
      'Total', '', '', '',
      Math.round(grandSpend), Math.round(grandConvs), Math.round(grandRev), Math.round(grandDeferred),
      grandConvs > 0 ? Math.round((grandSpend / grandConvs) * 100) / 100 : 0,
      grandSpend > 0 ? Math.round((grandRev / grandSpend) * 100) / 100 : 0,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, 'KPI Summary');
  }

  // ─── SHEET 4: Platform Monthly Detail ─────────────────────
  // One row per platform per month — raw data for pivot tables and charts
  {
    const header = ['Vertical', 'Channel', 'Platform', 'Month', 'Month Index', 'Spend', 'Conversions'];
    const rows = [header];

    platforms.forEach(plat => {
      if (isFiltered && !activeChannelFilter.has(plat.id)) return;
      const ch   = channels.find(c => c.id === plat.channelId);
      const vert = ch ? verticals.find(v => v.id === ch.vertId) : null;
      const enriched = { ...plat, arpu: vert?.arpu ?? 30, lifespan: vert?.lifespan ?? 6, vert };

      for (let m = 0; m < 12; m++) {
        const c = calcChannelMonth(enriched, m);
        rows.push([
          vert?.name || '', ch?.name || '', plat.name,
          periodLabel(m), m + 1,
          Math.round(c.budget), Math.round(c.conversions),
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Platform Monthly');
  }

  // ─── SHEET 5: Platform Config ─────────────────────────────
  // Snapshot of model inputs for reference
  {
    const header = ['Vertical', 'Channel', 'Platform', 'Model', 'CPC/CPM Rate', 'CTR %', 'CVR %', 'Alloc %', 'Annual Budget', 'Shape', 'ARPU', 'Lifespan', 'LTV Enabled'];
    const rows = [header];

    platforms.forEach(plat => {
      const ch   = channels.find(c => c.id === plat.channelId);
      const vert = ch ? verticals.find(v => v.id === ch.vertId) : null;
      const annual = plat.budgets.reduce((a, b) => a + (b || 0), 0);
      const shapeName = plat.customShape ? plat.customShape.shape : 'Flat';
      rows.push([
        vert?.name || '', ch?.name || '', plat.name,
        plat.model || 'cpc',
        (plat.model === 'var-cpc' || plat.model === 'var-cpm') ? 'Variable'
          : (plat.model === 'cpc' ? (plat.cpc || 0) : (plat.cpmRate || 0)),
        plat.ctr || 0, plat.cvr || 0, plat.pct || 0,
        Math.round(annual), shapeName,
        vert?.arpu || 30, vert?.lifespan || 6,
        vert?.ltv?.enabled ? 'Yes' : 'No',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Config');
  }

  // ─── DOWNLOAD ─────────────────────────────────────────────
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `forecast-${date}.xlsx`);
  showToast('📊 Excel exported');
}

function clearSavedState() {
  if (!confirm('Reset to defaults and clear all saved data? This cannot be undone.')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  try { localStorage.removeItem(ONBOARD_KEY); } catch(e) {}
  try { localStorage.removeItem(VIEWTAB_KEY); } catch(e) {}
  location.reload();
}

// ─────────────────────────────────────────────────────────────
// GUIDED ONBOARDING
// ─────────────────────────────────────────────────────────────

// Step definitions: each step highlights a sidebar element and prompts the user
const ONBOARD_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
    text: "Let's set up your forecast. We'll walk through the key inputs one at a time.",
    target: null,
    validate: () => true,
  },
  {
    id: 'budget',
    title: 'Step 1 of 4',
    text: 'Enter your annual marketing budget. You can change the currency using the selector in the header bar.',
    target: () => document.querySelector('.budget-card'),
    extraHighlight: () => document.getElementById('currencySelect'),
    validate: () => totalBudget > 0,
    inputId: 'kpi-budget-input',
    focusOnEnter: true,
  },
  {
    id: 'revenue',
    title: 'Step 2 of 4',
    text: 'Set your 12-month revenue target.',
    target: () => document.getElementById('kpi-revenue-target')?.closest('.kpi'),
    validate: () => targets.revenue > 0,
    inputId: 'kpi-revenue-target',
    focusOnEnter: true,
  },
  {
    id: 'conversions',
    title: 'Step 3 of 4',
    text: 'How many total conversions are you targeting over 12 months?',
    target: () => document.getElementById('kpi-conversions-target')?.closest('.kpi'),
    validate: () => targets.conversions > 0,
    inputId: 'kpi-conversions-target',
    focusOnEnter: true,
  },
  {
    id: 'cpa',
    title: 'Step 4 of 4',
    text: 'What\'s the maximum cost per acquisition you\'re willing to pay?',
    target: () => document.getElementById('kpi-cpa-target')?.closest('.kpi'),
    validate: () => targets.cpa > 0,
    inputId: 'kpi-cpa-target',
    focusOnEnter: true,
  },
  {
    id: 'done',
    title: "You're all set!",
    text: 'Start by configuring your campaign structure — add verticals, channels, and platforms to build the forecast.',
    target: () => document.getElementById('addVerticalBtn'),
    validate: () => true,
    isFinal: true,
    finalLabel: 'Start',
  },
];

let onboardStep = null; // null = onboarding complete; 0..N = active step
let _prevHighlightEl = null;
let _prevExtraHighlightEl = null;
let _elevatedParents = [];

function loadOnboardState() {
  try {
    const raw = localStorage.getItem(ONBOARD_KEY);
    if (raw === null) return 0; // first visit → start onboarding
    const val = JSON.parse(raw);
    if (val === null || val === 'done') return null; // completed
    return typeof val === 'number' ? val : 0;
  } catch { return 0; }
}

function saveOnboardState() {
  try {
    localStorage.setItem(ONBOARD_KEY, JSON.stringify(onboardStep === null ? 'done' : onboardStep));
  } catch {}
}

function skipOnboarding() {
  finishOnboarding();
}

function finishOnboarding() {
  onboardStep = null;
  saveOnboardState();
  hideOnboardUI();
}

function advanceOnboard() {
  if (onboardStep === null) return;
  const step = ONBOARD_STEPS[onboardStep];
  if (step.isFinal) {
    finishOnboarding();
    return;
  }
  onboardStep = Math.min(onboardStep + 1, ONBOARD_STEPS.length - 1);
  saveOnboardState();
  showOnboardStep();
}

function _clearOnboardHighlights() {
  if (_prevHighlightEl) {
    _prevHighlightEl.classList.remove('onboard-highlight');
    _prevHighlightEl = null;
  }
  if (_prevExtraHighlightEl) {
    _prevExtraHighlightEl.classList.remove('onboard-highlight');
    _prevExtraHighlightEl.style.position = '';
    _prevExtraHighlightEl.style.zIndex = '';
    _prevExtraHighlightEl = null;
  }
  _elevatedParents.forEach(el => el.classList.remove('onboard-elevate'));
  _elevatedParents = [];
}

function _elevateAncestors(el) {
  // Walk up the DOM and elevate any ancestors that create stacking contexts
  // (sticky, fixed, or transformed) so the highlighted child can sit above the backdrop
  let node = el?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const pos = style.position;
    if (pos === 'sticky' || pos === 'fixed' || style.transform !== 'none' || style.zIndex !== 'auto') {
      node.classList.add('onboard-elevate');
      _elevatedParents.push(node);
    }
    node = node.parentElement;
  }
}

function hideOnboardUI() {
  const backdrop = document.getElementById('onboardBackdrop');
  const prompt = document.getElementById('onboardPrompt');
  if (backdrop) backdrop.classList.add('hidden');
  if (prompt) prompt.classList.add('hidden');
  _clearOnboardHighlights();
}

function showOnboardStep() {
  if (onboardStep === null || onboardStep >= ONBOARD_STEPS.length) {
    hideOnboardUI();
    return;
  }

  const step = ONBOARD_STEPS[onboardStep];
  const backdrop = document.getElementById('onboardBackdrop');
  const prompt = document.getElementById('onboardPrompt');

  // Show backdrop
  backdrop.classList.remove('hidden');

  // Remove previous highlights and elevated parents
  _clearOnboardHighlights();

  // Highlight target element and elevate its ancestor stacking contexts
  let targetEl = null;
  if (step.target) {
    targetEl = typeof step.target === 'function' ? step.target() : step.target;
    if (targetEl) {
      targetEl.classList.add('onboard-highlight');
      _prevHighlightEl = targetEl;
      _elevateAncestors(targetEl);
    }
  }

  // Highlight extra element (e.g. currency selector) and elevate its ancestors
  if (step.extraHighlight) {
    const extraEl = typeof step.extraHighlight === 'function' ? step.extraHighlight() : step.extraHighlight;
    if (extraEl) {
      extraEl.classList.add('onboard-highlight');
      extraEl.style.position = 'relative';
      extraEl.style.zIndex = '8001';
      _prevExtraHighlightEl = extraEl;
      _elevateAncestors(extraEl);
    }
  }

  // Build step dots
  const dots = ONBOARD_STEPS.map((s, i) => {
    const cls = i < onboardStep ? 'done' : i === onboardStep ? 'active' : '';
    return `<span class="onboard-dot ${cls}"></span>`;
  }).join('');

  // Build prompt content
  const isValid = step.validate();
  const nextLabel = step.finalLabel || (step.isFinal ? 'Start' : 'Next');
  const nextDisabled = (!step.isFinal && !isValid && step.id !== 'welcome') ? 'disabled' : '';

  prompt.innerHTML = `
    <h3>${esc(step.title)}</h3>
    <p>${esc(step.text)}</p>
    <div class="onboard-actions">
      <div class="onboard-step-dots">${dots}</div>
      <div style="flex:1;"></div>
      ${onboardStep > 0 && !step.isFinal ? '<button class="onboard-btn skip" onclick="advanceOnboard()">Skip</button>' : ''}
      ${step.id === 'welcome' ? '<button class="onboard-btn skip" onclick="skipOnboarding()">Skip setup</button>' : ''}
      <button class="onboard-btn primary" id="onboardNextBtn" onclick="advanceOnboard()" ${nextDisabled}>${nextLabel}</button>
    </div>
  `;
  prompt.classList.remove('hidden');

  // Scroll target into view if needed, then position prompt
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Wait for scroll to settle before positioning
    setTimeout(() => positionOnboardPrompt(targetEl), 350);
  } else {
    positionOnboardPrompt(targetEl);
  }

  // Focus input if applicable
  if (step.focusOnEnter && step.inputId) {
    setTimeout(() => {
      const inp = document.getElementById(step.inputId);
      if (inp) inp.focus();
    }, 100);
  }
}

function positionOnboardPrompt(targetEl) {
  const prompt = document.getElementById('onboardPrompt');
  if (!prompt) return;

  if (!targetEl) {
    // Centre on screen (welcome step)
    prompt.style.top = '50%';
    prompt.style.left = '50%';
    prompt.style.transform = 'translate(-50%, -50%)';
    return;
  }

  // Reset transform — prompt is position:fixed so use viewport coords (getBoundingClientRect)
  prompt.style.transform = '';

  const rect = targetEl.getBoundingClientRect();

  // Position to the right of the target if there's space, otherwise overlay centred on target
  const spaceRight = window.innerWidth - rect.right;
  if (spaceRight > 340) {
    // Right of the target, vertically aligned to its top (clamped to viewport)
    prompt.style.top = Math.max(12, Math.min(rect.top, window.innerHeight - 200)) + 'px';
    prompt.style.left = (rect.right + 16) + 'px';
  } else {
    // Centred horizontally over the target, positioned at the vertical centre
    const centreY = rect.top + rect.height / 2;
    prompt.style.top = Math.max(12, Math.min(centreY - 80, window.innerHeight - 200)) + 'px';
    prompt.style.left = Math.max(12, Math.min(rect.left + rect.width / 2 - 160, window.innerWidth - 340)) + 'px';
  }
}

// Re-validate and update Next button state when inputs change during onboarding
function onboardCheckInputs() {
  if (onboardStep === null) return;
  const step = ONBOARD_STEPS[onboardStep];
  const btn = document.getElementById('onboardNextBtn');
  if (btn && step && step.id !== 'welcome') {
    btn.disabled = !step.validate();
  }
}

// Hook into input events for onboarding validation
const _origOnBudgetInput = onBudgetInput;
onBudgetInput = function(val) {
  _origOnBudgetInput(val);
  onboardCheckInputs();
};

const _origSetKpiTarget = setKpiTarget;
setKpiTarget = function(type, val) {
  _origSetKpiTarget(type, val);
  onboardCheckInputs();
};

// Allow pressing Enter to advance during onboarding
document.addEventListener('keydown', e => {
  if (onboardStep === null) return;
  if (e.key === 'Enter') {
    const step = ONBOARD_STEPS[onboardStep];
    if (step && step.validate()) {
      advanceOnboard();
    }
  }
});

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────

function initApp() {
  // Restore last session from localStorage if available
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setState(JSON.parse(saved));
  } catch(e) { /* first visit or private browsing */ }
  // Sync budget input from loaded state
  const budgetInput = document.getElementById('kpi-budget-input');
  if (budgetInput && totalBudget > 0) budgetInput.value = totalBudget;
  // Sync alloc-mode toggle buttons
  document.getElementById('cs-mode-pct')?.classList.toggle('active', allocMode === 'pct');
  document.getElementById('cs-mode-amt')?.classList.toggle('active', allocMode === 'amt');
  // Sync target inputs from loaded state
  if (targets.conversions > 0) {
    const el = document.getElementById('kpi-conversions-target');
    if (el) el.value = targets.conversions;
  }
  if (targets.cpa > 0) {
    const el = document.getElementById('kpi-cpa-target');
    if (el) el.value = targets.cpa;
  }
  if (targets.revenue > 0) {
    const el = document.getElementById('kpi-revenue-target');
    if (el) el.value = targets.revenue;
  }
  restoreViewTab();
  render();

  // Start onboarding if needed
  onboardStep = loadOnboardState();
  if (onboardStep !== null) {
    // Delay slightly so the DOM is fully rendered before positioning
    setTimeout(() => showOnboardStep(), 150);
  }
}

initApp();

// ─────────────────────────────────────────────────────────────
// KPI BADGE POPOVER
// ─────────────────────────────────────────────────────────────

let _popoverAnchor = null;

function openBadgePopover(type, anchorEl) {
  const pop = document.getElementById('kpiPopover');
  if (!pop) return;

  // Toggle off if same badge clicked again
  if (_popoverAnchor === anchorEl && pop.style.display !== 'none') {
    closeBadgePopover(); return;
  }
  _popoverAnchor = anchorEl;

  const html = _buildPopoverHTML(type);
  if (!html) { closeBadgePopover(); return; }

  pop.innerHTML = html;
  pop.style.display = 'block';

  // Position below the badge, aligned to its left edge
  const rect = anchorEl.getBoundingClientRect();
  const pw   = 310;
  let left   = rect.left + window.scrollX;
  // Clamp so it doesn't overflow viewport
  left = Math.min(left, window.innerWidth + window.scrollX - pw - 12);
  left = Math.max(left, 12);
  pop.style.top  = (rect.bottom + window.scrollY + 7) + 'px';
  pop.style.left = left + 'px';
}

function closeBadgePopover() {
  _popoverAnchor = null;
  const pop = document.getElementById('kpiPopover');
  if (pop) pop.style.display = 'none';
}

// Close popover on outside click
document.addEventListener('click', e => {
  const pop = document.getElementById('kpiPopover');
  if (!pop || pop.style.display === 'none') return;
  if (pop.contains(e.target)) return;
  if (_popoverAnchor && _popoverAnchor.contains(e.target)) return;
  closeBadgePopover();
});

function _buildPopoverHTML(type) {
  const actual = lastKpiActuals[type];
  const target = targets[type];
  if (!actual || !target) return '';

  const s         = sym();
  const leafChs   = channels.filter(c => !c.isGroup);
  const totalSpend = leafChs.reduce((sum, ch) =>
    sum + ch.budgets.reduce((a, b) => a + (b||0), 0), 0);
  const totalClicks = leafChs.reduce((sum, ch) => {
    const ann = ch.budgets.reduce((a,b) => a+(b||0), 0);
    return sum + (ann/1000) * ch.imprPer1k * (ch.ctr/100);
  }, 0);
  const totalConversions = lastKpiActuals.conversions;
  const totalRevenue     = lastKpiActuals.revenue;
  const currentCvr       = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const revPerConv       = totalConversions > 0 ? totalRevenue / totalConversions : 0;
  const revPerPound      = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const effRate          = totalSpend > 0 ? totalConversions / totalSpend : 0; // convs / £
  const avgLs = leafChs.length > 0
    ? leafChs.reduce((s, ch) => s + effectiveLifespan(ch), 0) / leafChs.length : 6;
  const avgCurrentArpu = leafChs.length > 0
    ? leafChs.reduce((s, ch) => s + ch.arpu, 0) / leafChs.length : 0;

  const _moneyFmt = (n) => s + Math.round(Math.abs(n)).toLocaleString('en-GB');
  const _lever = (icon, strong, note, client=false) => `
    <div class="pop-lever${client?' client-lever':''}">
      <span class="pop-lever-icon">${icon}</span>
      <div><strong>${strong}</strong><div class="pop-lever-note">${note}</div></div>
    </div>`;

  let titleHtml = '', leversHtml = '';

  if (type === 'conversions') {
    const gap = target - actual;
    if (gap <= 0) return '';
    titleHtml = `<div class="pop-title">🎯 Conversions gap: ${Math.round(gap).toLocaleString('en-GB')} short</div>
                 <div class="pop-subtitle">Close it by adjusting any of these levers…</div>`;

    // Budget lever
    if (effRate > 0) {
      const extra = Math.ceil((gap / effRate) / 100) * 100;
      leversHtml += _lever('💰',
        `+${_moneyFmt(extra)} budget`,
        `at current conversion efficiency (${s}${(1/effRate).toFixed(0)} CPA)`);
    }
    // CVR lever
    if (totalClicks > 0) {
      const neededCvr = (target / totalClicks) * 100;
      const cvrDelta  = neededCvr - currentCvr;
      if (cvrDelta > 0) leversHtml += _lever('📈',
        `+${cvrDelta.toFixed(2)}% CVR across all channels`,
        `${currentCvr.toFixed(2)}% → ${neededCvr.toFixed(2)}% — agency lever`);
    }

  } else if (type === 'revenue') {
    const gap = target - actual;
    if (gap <= 0) return '';
    titleHtml = `<div class="pop-title">📊 Revenue gap: ${_moneyFmt(gap)} short</div>
                 <div class="pop-subtitle">Close it by adjusting any of these levers…</div>`;

    // Budget lever
    if (revPerPound > 0) {
      const extra = Math.ceil((gap / revPerPound) / 100) * 100;
      leversHtml += _lever('💰',
        `+${_moneyFmt(extra)} budget`,
        `at current revenue efficiency (${s}${revPerPound.toFixed(2)} revenue per £1 spent)`);
    }
    // CVR lever
    if (totalClicks > 0 && revPerConv > 0) {
      const neededConvs   = totalConversions + gap / revPerConv;
      const neededCvr     = (neededConvs / totalClicks) * 100;
      const cvrDelta      = neededCvr - currentCvr;
      if (cvrDelta > 0) leversHtml += _lever('📈',
        `+${cvrDelta.toFixed(2)}% CVR across all channels`,
        `drives more conversions at the same ARPU — agency lever`);
    }
    // ARPU lever (client-supplied)
    if (totalConversions > 0 && avgLs > 0) {
      const neededRpc          = target / totalConversions;
      const neededArpu         = neededRpc / avgLs;
      const arpuDelta          = neededArpu - avgCurrentArpu;
      if (arpuDelta > 0) leversHtml += _lever('🔒',
        `+${s}${arpuDelta.toFixed(2)} average ARPU`,
        `${s}${avgCurrentArpu.toFixed(2)} → ${s}${neededArpu.toFixed(2)} — client-supplied lever`,
        true);
    }

  } else if (type === 'cpa') {
    const gap = actual - target; // positive = over target
    if (gap <= 0) return '';
    titleHtml = `<div class="pop-title">⚠️ CPA is ${s}${gap.toFixed(2)} over max</div>
                 <div class="pop-subtitle">Bring it down by…</div>`;

    // CVR is the only true lever for CPA in this model — budget changes scale
    // spend and conversions proportionally, so CPA stays constant regardless of budget level.
    if (totalClicks > 0 && totalSpend > 0) {
      const neededConvs = totalSpend / target;
      const neededCvr   = (neededConvs / totalClicks) * 100;
      const cvrDelta    = neededCvr - currentCvr;
      if (cvrDelta > 0) leversHtml += _lever('📈',
        `+${cvrDelta.toFixed(2)}% CVR across all channels`,
        `drives ${Math.round(neededConvs - totalConversions).toLocaleString('en-GB')} more conversions from the same spend — agency lever`);
    }
  }

  if (!leversHtml) return '';

  return `
    <div class="pop-header">${titleHtml}</div>
    <div class="pop-levers">${leversHtml}</div>
    <div class="pop-footer">
      <span style="font-size:0.7rem;color:#7A8A9A;">🔒 = client-supplied</span>
      <button class="pop-close-btn" onclick="closeBadgePopover()">Close</button>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// BUDGET PHASING HELPERS
// ─────────────────────────────────────────────────────────────

function setPhasingMode(mode) {
  phasingMode = mode;
  document.querySelectorAll('.bp-mode-toggle input').forEach(inp => {
    inp.checked = (inp.value === mode);
  });
  renderBudgetPhasing();
}

function toggleBpMonthLock(m) {
  spreadLocked[m] = !spreadLocked[m];
  renderBudgetPhasing();
}

function toggleBpVertical(vertId) {
  const vert = verticals.find(v => v.id === vertId);
  if (vert) {
    vert.collapsed = !vert.collapsed;
    renderBudgetPhasing();
  }
}

function toggleBpChannel(chId) {
  const ch = channels.find(c => c.id === chId);
  if (ch) {
    ch.collapsed = !ch.collapsed;
    renderBudgetPhasing();
  }
}

function startSpreadDrag(monthIdx, e) {
  if (spreadLocked[monthIdx]) return;
  e.preventDefault();

  const startY = e.clientY;
  // Snapshot every platform's value for this month (skip row-locked platforms during drag)
  const snapshots = platforms.map(p => ({ id: p.id, startVal: p.budgets[monthIdx] || 0, locked: isPlatLocked(p.id) || bpCellLocked.has(`${p.id}-${monthIdx}`) }));
  const startTotal = snapshots.filter(s => !s.locked).reduce((s, p) => s + p.startVal, 0);
  const sensitivity = Math.max(50, startTotal / 40);
  let dragged = false;

  const onMove = (ev) => {
    const dy = startY - ev.clientY;
    if (!dragged && Math.abs(dy) < 3) return;
    dragged = true;

    // Scale factor from drag distance
    const delta = dy * sensitivity;
    const newTotal = Math.max(0, startTotal + delta);
    const ratio = startTotal > 0 ? newTotal / startTotal : 0;

    // Apply proportionally to unlocked platforms only
    snapshots.forEach(snap => {
      if (snap.locked) return;
      const plat = platforms.find(p => p.id === snap.id);
      if (!plat) return;
      plat.budgets[monthIdx] = startTotal > 0
        ? Math.max(0, Math.round(snap.startVal * ratio))
        : Math.round(newTotal / snapshots.filter(ss => !ss.locked).length);
    });

    // Update spread bar + total in-place
    const currency = document.getElementById('currencySelect')?.value || '£';
    const actualTotal = platforms.reduce((s, p) => s + (p.budgets[monthIdx] || 0), 0);
    const totalEl = document.getElementById(`bp-spread-total-${monthIdx}`);
    if (totalEl) totalEl.textContent = currency + Math.round(actualTotal).toLocaleString();

    // Update individual platform bars + values in-place (unlocked only)
    snapshots.forEach(snap => {
      if (snap.locked) return;
      const plat = platforms.find(p => p.id === snap.id);
      if (!plat) return;
      const barEl = document.getElementById(`bp-bar-${snap.id}-${monthIdx}`);
      const valEl = document.getElementById(`bp-val-${snap.id}-${monthIdx}`);
      if (barEl) {
        const maxVal = Math.max(...plat.budgets, 0.1) * 1.5;
        barEl.style.height = Math.max(3, Math.round((plat.budgets[monthIdx] / maxVal) * 45)) + 'px';
      }
      if (valEl) {
        const v = plat.budgets[monthIdx];
        if (phasingMode === 'pct') {
          const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
          valEl.textContent = annual > 0 ? ((v / annual) * 100).toFixed(1) + '%' : '0%';
        } else {
          valEl.textContent = v > 0 ? currency + Math.round(v).toLocaleString() : currency + '—';
        }
      }
    });
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    if (dragged) render();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
}

function startBpDrag(platId, monthIdx, e) {
  if (spreadLocked[monthIdx] || isPlatLocked(platId) || bpCellLocked.has(`${platId}-${monthIdx}`)) return;
  e.preventDefault();
  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;

  const startY = e.clientY;
  const startVal = plat.budgets[monthIdx] || 0;
  let dragged = false;

  // Scale sensitivity to the row's budget range so small drags feel meaningful.
  // Dragging the full bar height (~45px) should sweep roughly the max monthly value.
  const maxMonthly = Math.max(...plat.budgets, 1);
  const sensitivity = Math.max(50, maxMonthly / 40); // £ per pixel of drag

  // Store references so we can reliably remove them
  const onMove = (ev) => {
    const dy = startY - ev.clientY; // Up = positive = more budget
    if (!dragged && Math.abs(dy) < 3) return; // Dead zone: ignore tiny movements (likely a click)
    dragged = true;
    const deltaVal = dy * sensitivity;
    const newVal = Math.max(0, Math.round(startVal + deltaVal));
    plat.budgets[monthIdx] = newVal;
    // Update just the bar + value in-place (no full re-render during drag)
    const barEl = document.getElementById(`bp-bar-${platId}-${monthIdx}`);
    const valEl = document.getElementById(`bp-val-${platId}-${monthIdx}`);
    if (barEl) {
      const maxVal = Math.max(...plat.budgets, 0.1) * 1.5;
      barEl.style.height = Math.max(3, Math.round((newVal / maxVal) * 45)) + 'px';
    }
    if (valEl) {
      const currency = document.getElementById('currencySelect')?.value || '£';
      if (phasingMode === 'pct') {
        const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
        valEl.textContent = annual > 0 ? ((newVal / annual) * 100).toFixed(1) + '%' : '0%';
      } else {
        valEl.textContent = newVal > 0 ? currency + Math.round(newVal).toLocaleString() : currency + '—';
      }
    }
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    phasingDragState = null;
    if (dragged) {
      render(); // Full re-render only if we actually dragged
    }
  };

  phasingDragState = { platId, monthIdx, onMove, onEnd };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
}

function activateBpCell(platId, monthIdx, e) {
  e.stopPropagation();
  // If we just finished a drag, don't open the input
  if (phasingDragState) return;
  const plat = platforms.find(p => p.id === platId);
  if (!plat || spreadLocked[monthIdx] || isPlatLocked(platId) || bpCellLocked.has(`${platId}-${monthIdx}`)) return;

  const currentVal = plat.budgets[monthIdx] || 0;
  const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
  let inputVal = currentVal.toString();
  if (phasingMode === 'pct' && annual > 0) {
    inputVal = ((currentVal / annual) * 100).toFixed(1);
  }

  const cell = e.target.closest('.bp-cell-bar');
  if (!cell) return;

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'bp-cell-input';
  input.value = inputVal;
  input.min = '0';
  input.step = phasingMode === 'pct' ? '1' : '100';

  const commitAndClose = () => {
    let newVal = parseFloat(input.value) || 0;
    if (phasingMode === 'pct') {
      newVal = (annual * newVal) / 100;
    }
    plat.budgets[monthIdx] = Math.max(0, Math.round(newVal));
    render();
  };

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { input.blur(); }
    if (ev.key === 'Escape') { render(); } // Cancel — re-render restores original display
  });
  input.addEventListener('blur', commitAndClose);

  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();
  input.select();
}

// Check if a platform is locked via row or vertical lock
function isPlatLocked(platId) {
  if (bpRowLocked.has(platId)) return true;
  const ch = channels.find(c => c.id === platforms.find(p => p.id === platId)?.channelId);
  return ch ? bpVertLocked.has(ch.vertId) : false;
}

function toggleBpVertLock(vertId) {
  if (bpVertLocked.has(vertId)) {
    bpVertLocked.delete(vertId);
  } else {
    bpVertLocked.add(vertId);
  }
  renderBudgetPhasing();
}

function toggleBpCellLock(platId, monthIdx) {
  const key = `${platId}-${monthIdx}`;
  if (bpCellLocked.has(key)) {
    bpCellLocked.delete(key);
  } else {
    bpCellLocked.add(key);
  }
  renderBudgetPhasing();
}

function toggleBpRowLock(platId) {
  if (bpRowLocked.has(platId)) {
    bpRowLocked.delete(platId);
  } else {
    bpRowLocked.add(platId);
  }
  renderBudgetPhasing();
}

function rebalanceBpRow(platId) {
  if (isPlatLocked(platId)) return;
  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;

  const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
  const isCellFree = (m) => !spreadLocked[m] && !bpCellLocked.has(`${platId}-${m}`);
  const unlockedSum = plat.budgets.reduce((s, v, m) => isCellFree(m) ? s + v : s, 0);
  const unlockedMonths = MONTHS.filter((_, m) => isCellFree(m));

  if (unlockedMonths.length === 0) return; // All months locked

  // Get the allocated budget for this platform
  const ch = channels.find(c => c.id === plat.channelId);
  const vert = ch && verticals.find(v => v.id === ch.vertId);
  const allocBudget = totalBudget > 0 ? totalBudget * (vert?.pct || 0) / 100 * (ch?.pct || 0) / 100 * (plat.pct || 0) / 100 : 0;

  if (allocBudget === 0) return;

  // Calculate locked sum (column-locked + cell-locked months)
  const lockedSum = plat.budgets.reduce((s, v, m) => !isCellFree(m) ? s + v : s, 0);
  const targetForUnlocked = allocBudget - lockedSum;

  if (targetForUnlocked <= 0) return;

  // Redistribute across unlocked months using snap-aware largest-remainder
  const target = Math.round(targetForUnlocked);
  const freeIdxs = unlockedMonths.map(mo => MONTHS.indexOf(mo));

  if (unlockedSum > 0) {
    freeIdxs.forEach(m => {
      plat.budgets[m] = Math.round((plat.budgets[m] / unlockedSum) * target);
    });
  } else {
    const perMonth = Math.round(target / freeIdxs.length);
    freeIdxs.forEach(m => { plat.budgets[m] = perMonth; });
  }
  // Correct rounding drift
  const freeSum = freeIdxs.reduce((s, m) => s + plat.budgets[m], 0);
  const drift = target - freeSum;
  if (drift !== 0 && freeIdxs.length > 0) {
    const biggest = freeIdxs.reduce((best, m) => plat.budgets[m] > plat.budgets[best] ? m : best, freeIdxs[0]);
    plat.budgets[biggest] = Math.max(0, plat.budgets[biggest] + drift);
  }

  render();
}

function rebalanceAllSpread() {
  if (totalBudget <= 0) return;
  const unlockedIdxs = MONTHS.map((_, m) => m).filter(m => !spreadLocked[m]);
  if (unlockedIdxs.length === 0) return;

  // Helper: is this specific cell free to adjust?
  const isFree = (pId, m) => !spreadLocked[m] && !isPlatLocked(pId) && !bpCellLocked.has(`${pId}-${m}`);

  // Sum of all frozen values (row-locked, col-locked, or cell-locked)
  const frozenSum = platforms.reduce((s, p) =>
    s + p.budgets.reduce((ss, v, m) => ss + (!isFree(p.id, m) ? (v||0) : 0), 0), 0);
  const targetUnlocked = totalBudget - frozenSum;
  if (targetUnlocked <= 0) return;

  const adjustablePlats = platforms.filter(p => !isPlatLocked(p.id));
  const currentUnlocked = adjustablePlats.reduce((s, p) =>
    s + p.budgets.reduce((ss, v, m) => ss + (isFree(p.id, m) ? (v||0) : 0), 0), 0);

  const roundTarget = Math.round(targetUnlocked);
  adjustablePlats.forEach(plat => {
    const platFreeIdxs = unlockedIdxs.filter(m => isFree(plat.id, m));
    if (platFreeIdxs.length === 0) return;
    if (currentUnlocked > 0) {
      const platUnlocked = platFreeIdxs.reduce((s, m) => s + (plat.budgets[m]||0), 0);
      const platShare = platUnlocked / currentUnlocked;
      const platTarget = Math.round(roundTarget * platShare);
      if (platUnlocked > 0) {
        platFreeIdxs.forEach(m => {
          plat.budgets[m] = Math.round((plat.budgets[m] / platUnlocked) * platTarget);
        });
        // Correct per-platform rounding drift
        const newFreeSum = platFreeIdxs.reduce((s, m) => s + plat.budgets[m], 0);
        const d = platTarget - newFreeSum;
        if (d !== 0 && platFreeIdxs.length > 0) {
          const biggest = platFreeIdxs.reduce((best, m) => plat.budgets[m] > plat.budgets[best] ? m : best, platFreeIdxs[0]);
          plat.budgets[biggest] = Math.max(0, plat.budgets[biggest] + d);
        }
      }
    } else {
      const freeCount = adjustablePlats.reduce((c, p) => c + unlockedIdxs.filter(m => isFree(p.id, m)).length, 0);
      const perCell = Math.round(roundTarget / freeCount);
      platFreeIdxs.forEach(m => { plat.budgets[m] = perCell; });
    }
  });
  // Final grand drift correction
  const actualFreeTotal = adjustablePlats.reduce((s, p) =>
    s + unlockedIdxs.filter(m => isFree(p.id, m)).reduce((ss, m) => ss + p.budgets[m], 0), 0);
  const grandDrift = roundTarget - actualFreeTotal;
  if (grandDrift !== 0) {
    let bestPlat = null, bestM = -1, bestVal = -1;
    adjustablePlats.forEach(p => {
      unlockedIdxs.filter(m => isFree(p.id, m)).forEach(m => {
        if (p.budgets[m] > bestVal) { bestVal = p.budgets[m]; bestPlat = p; bestM = m; }
      });
    });
    if (bestPlat && bestM >= 0) {
      bestPlat.budgets[bestM] = Math.max(0, bestPlat.budgets[bestM] + grandDrift);
    }
  }

  render();
}

// ─── SHAPE PRESET PICKER MODAL ──────────────────────────────
let shapePickerPlatId = null;

function openShapePicker(platId) {
  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;

  if (isPlatLocked(platId)) {
    showToast('Cannot change shape — this platform is locked', 'warn');
    return;
  }

  shapePickerPlatId = platId;
  const currentCat   = plat.customShape?.cat   || null;
  const currentShape = plat.customShape?.shape || null;

  let bodyHtml = '';

  // Flat card at top
  const flatActive = !plat.customShape ? ' active' : '';
  bodyHtml += `<div class="shape-picker-grid">
    <div class="shape-picker-card${flatActive}" onclick="applyShapeToPlatform(${platId}, null, 'Flat')" title="Equal monthly distribution">
      <canvas class="sp-card-canvas" width="140" height="40" data-sp-weights="1,1,1,1,1,1,1,1,1,1,1,1"></canvas>
      <div class="shape-picker-card-name">Flat (equal)</div>
    </div>
  </div>`;

  // Grouped presets
  for (const [cat, shapes] of Object.entries(SEASONALITY_SHAPES)) {
    bodyHtml += `<div class="shape-picker-cat">${esc(cat)}</div><div class="shape-picker-grid">`;
    for (const [shapeName, weights] of Object.entries(shapes)) {
      if (cat === 'Basic' && shapeName === 'Flat') continue;
      const isActive = currentCat === cat && currentShape === shapeName;
      const wStr = rotateWeights(weights).join(',');
      bodyHtml += `<div class="shape-picker-card${isActive ? ' active' : ''}" onclick="applyShapeToPlatform(${platId}, '${esc(cat)}', '${esc(shapeName)}')" title="${esc(shapeName)}">
        <canvas class="sp-card-canvas" width="140" height="40" data-sp-weights="${wStr}"></canvas>
        <div class="shape-picker-card-name">${esc(shapeName)}</div>
      </div>`;
    }
    bodyHtml += `</div>`;
  }

  // Custom shapes section
  if (customShapes.length > 0) {
    bodyHtml += `<div class="shape-picker-cat">Custom Shapes</div><div class="shape-picker-grid">`;
    for (const cs of customShapes) {
      const isActive = currentCat === '_custom' && currentShape === cs.name;
      const wStr = rotateWeights(cs.weights).join(',');
      bodyHtml += `<div class="shape-picker-card${isActive ? ' active' : ''}" style="position:relative;">
        <div onclick="applyShapeToPlatform(${platId}, '_custom', '${esc(cs.name)}')" style="cursor:pointer;">
          <canvas class="sp-card-canvas" width="140" height="40" data-sp-weights="${wStr}"></canvas>
          <div class="shape-picker-card-name">${esc(cs.name)}</div>
        </div>
        <button class="sp-delete-btn" onclick="event.stopPropagation();deleteCustomShape('${esc(cs.name)}');closeShapePicker();" title="Delete this custom shape">✕</button>
      </div>`;
    }
    bodyHtml += `</div>`;
  }

  const overlay = document.createElement('div');
  overlay.className = 'shape-picker-overlay';
  overlay.id = 'shapePickerOverlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeShapePicker(); };
  overlay.innerHTML = `
    <div class="shape-picker-modal" onclick="event.stopPropagation()">
      <div class="shape-picker-head">
        <div>
          <strong>Choose Shape — ${esc(plat.name)}</strong>
          <p>Select a seasonality preset to apply to this platform's monthly budget distribution</p>
        </div>
        <button class="season-editor-modal-close" onclick="closeShapePicker()" title="Close">✕</button>
      </div>
      <div class="shape-picker-body">${bodyHtml}</div>
    </div>`;

  document.body.appendChild(overlay);

  // Draw sparklines on all canvases
  requestAnimationFrame(() => {
    overlay.querySelectorAll('.sp-card-canvas').forEach(drawSparkline);
  });
}

function closeShapePicker() {
  const overlay = document.getElementById('shapePickerOverlay');
  if (overlay) overlay.remove();
  shapePickerPlatId = null;
}

function drawSparkline(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const weights = canvas.dataset.spWeights.split(',').map(Number);
  const maxW = Math.max(...weights);
  const minW = Math.min(...weights);
  const range = maxW - minW || 1;

  ctx.clearRect(0, 0, w, h);

  // Fill area
  const padX = 4;
  const padY = 4;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  ctx.beginPath();
  ctx.moveTo(padX, h - padY);
  weights.forEach((wt, i) => {
    const x = padX + (i / (weights.length - 1)) * plotW;
    const y = h - padY - ((wt - minW) / range) * plotH;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(padX + plotW, h - padY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,229,255,0.12)';
  ctx.fill();

  // Line
  ctx.beginPath();
  weights.forEach((wt, i) => {
    const x = padX + (i / (weights.length - 1)) * plotW;
    const y = h - padY - ((wt - minW) / range) * plotH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function applyShapeToPlatform(platId, cat, shapeName) {
  closeShapePicker();

  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;

  // Block if row or vertical is locked
  if (isPlatLocked(platId)) {
    showToast('Cannot apply shape — this platform is locked', 'warn');
    return;
  }

  const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
  if (annual <= 0) return;

  // "Flat" resets to equal distribution
  if (!cat || shapeName === 'Flat') {
    plat.customShape = null;
    const isCellFree = (m) => !spreadLocked[m] && !bpCellLocked.has(`${platId}-${m}`);
    const lockedSum = plat.budgets.reduce((s, v, m) => !isCellFree(m) ? s + v : s, 0);
    const freeIdxs = MONTHS.map((_, m) => m).filter(m => isCellFree(m));
    if (freeIdxs.length === 0) { showToast('All months are locked', 'warn'); return; }
    const targetForFree = annual - lockedSum;
    if (targetForFree <= 0) return;
    const n = freeIdxs.length;
    const perMonth = Math.floor(targetForFree / n);
    let remainder = targetForFree - perMonth * n;
    freeIdxs.forEach(m => {
      plat.budgets[m] = perMonth + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    });
    showToast('Shape reset to flat');
    saveToLocalStorage();
    render();
    return;
  }

  // Apply shaped preset — look up calendar weights from built-in or custom library
  let calWeights;
  if (cat === '_custom') {
    const cs = customShapes.find(s => s.name === shapeName);
    calWeights = cs?.weights;
  } else {
    calWeights = SEASONALITY_SHAPES[cat]?.[shapeName];
  }
  if (!calWeights) return;

  // Rotate calendar-month weights to position-order for the current startMonth
  const weights = rotateWeights(calWeights);

  const isCellFree = (m) => !spreadLocked[m] && !bpCellLocked.has(`${platId}-${m}`);
  const lockedIdxs = MONTHS.map((_, m) => m).filter(m => !isCellFree(m));
  const freeIdxs   = MONTHS.map((_, m) => m).filter(m => isCellFree(m));

  if (freeIdxs.length === 0) {
    showToast('All months are locked — cannot apply shape', 'warn');
    return;
  }

  const lockedSum    = lockedIdxs.reduce((s, m) => s + (plat.budgets[m] || 0), 0);
  const targetForFree = annual - lockedSum;

  if (targetForFree <= 0) {
    showToast('No budget remaining for unlocked months', 'warn');
    return;
  }

  // Normalise weights for free months only, then distribute
  const freeWeights = freeIdxs.map(m => weights[m]);
  const fwSum = freeWeights.reduce((a, b) => a + b, 0);
  const freeNorm = fwSum > 0 ? freeWeights.map(w => w / fwSum) : freeWeights.map(() => 1 / freeWeights.length);
  const snap = seasonSnap5 ? 5 : 1;
  const distributed = distributeWeighted(targetForFree, freeNorm, snap);

  freeIdxs.forEach((m, i) => {
    plat.budgets[m] = distributed[i];
  });

  // Store shape reference with inline weights for resilience
  plat.customShape = { cat, shape: shapeName, weights: [...calWeights] };

  const lockedCount = lockedIdxs.length;
  showToast(lockedCount > 0
    ? `${shapeName} applied — ${lockedCount} locked month${lockedCount !== 1 ? 's' : ''} preserved`
    : `${shapeName} applied`);

  saveToLocalStorage();
  render();
}

// ─────────────────────────────────────────────────────────────
// SAVE CUSTOM SHAPE
// ─────────────────────────────────────────────────────────────

function promptSaveCustomShape(platId) {
  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;
  const annual = plat.budgets.reduce((a, b) => a + (b||0), 0);
  if (annual <= 0) return;

  const name = prompt('Name this shape:');
  if (!name || !name.trim()) return;
  const trimmed = name.trim();

  // Check for duplicate name
  if (customShapes.some(s => s.name === trimmed)) {
    if (!confirm(`A custom shape called "${trimmed}" already exists. Overwrite it?`)) return;
    customShapes = customShapes.filter(s => s.name !== trimmed);
  }

  // Convert position-order budgets to relative weights, then un-rotate to calendar-month order
  const posWeights = plat.budgets.map(b => (b||0) / annual);
  const calWeights = unrotateWeights(posWeights);

  customShapes.push({ name: trimmed, weights: calWeights });

  // Also set this platform's customShape to reference the new custom shape
  plat.customShape = { cat: '_custom', shape: trimmed, weights: calWeights };

  saveToLocalStorage();
  render();
  showToast(`Shape "${trimmed}" saved to library`);
}

function deleteCustomShape(shapeName) {
  customShapes = customShapes.filter(s => s.name !== shapeName);
  // Platforms referencing this shape keep their inline weights — just clear the library reference
  saveToLocalStorage();
  render();
  showToast(`Shape "${shapeName}" removed from library`);
}

// ─────────────────────────────────────────────────────────────
// CPC/CPM RATE EDITOR MODAL
// ─────────────────────────────────────────────────────────────

let cpcEditorPlatId = null;
let cpcEditorDraft  = null; // number[12] — working copy during editing
let cpcEditorDrag   = null; // drag state

function openCpcEditor(platId) {
  const plat = platforms.find(p => p.id === platId);
  if (!plat) return;

  cpcEditorPlatId = platId;
  const model = plat.model || 'cpc';
  const isCpc = model === 'var-cpc';
  const rates = isCpc ? (plat.cpcRates || Array(12).fill(plat.cpc || 1.50))
                      : (plat.cpmRates || Array(12).fill(plat.cpmRate || 10.0));
  cpcEditorDraft = [...rates];

  const label = isCpc ? 'CPC' : 'CPM';
  const currency = document.getElementById('currencySelect')?.value || '£';

  // Build preset pills from SEASONALITY_SHAPES
  let presetHtml = '';
  presetHtml += `<div class="cpc-preset-pill" onclick="cpcApplyFlat()">Flat</div>`;
  for (const [cat, shapes] of Object.entries(SEASONALITY_SHAPES)) {
    for (const [name, weights] of Object.entries(shapes)) {
      if (name === 'Flat') continue;
      presetHtml += `<div class="cpc-preset-pill" onclick="cpcApplyPreset('${esc(cat)}','${esc(name)}')">${esc(name)}</div>`;
    }
  }

  // Custom CPC shapes — rendered into a stable wrapper div, updated in-place by cpcRenderCustomShapes()
  let customInner = '';
  if (customCpcShapes.length > 0) {
    customInner = `<div class="cpc-editor-presets-label">Saved ${label} Shapes</div>`;
    customCpcShapes.forEach(cs => {
      customInner += `<div class="cpc-custom-shape-card" onclick="cpcLoadCustomShape('${esc(cs.name)}')">
        <span class="cpc-cs-name">${esc(cs.name)}</span>
        <span class="cpc-cs-del" onclick="event.stopPropagation();cpcDeleteCustomShape('${esc(cs.name)}')" title="Delete">✕</span>
      </div>`;
    });
  }

  const overlay = document.createElement('div');
  overlay.className = 'cpc-editor-overlay';
  overlay.id = 'cpcEditorOverlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeCpcEditor(false); };

  overlay.innerHTML = `
    <div class="cpc-editor-modal" onclick="event.stopPropagation()">
      <div class="cpc-editor-head">
        <div>
          <strong>Monthly ${label} Rates — ${esc(plat.name)}</strong>
          <p>Drag bars or type values to set ${label} rates for each month. Apply a preset as a starting point.</p>
        </div>
        <button class="season-editor-modal-close" onclick="closeCpcEditor(false)" title="Close">✕</button>
      </div>
      <div class="cpc-editor-body">
        <div class="cpc-custom-shapes" id="cpcCustomShapesWrap">${customInner}</div>
        <div class="cpc-editor-presets">
          <div class="cpc-editor-presets-label">Presets (applies shape to current average)</div>
          <div class="cpc-preset-pills">${presetHtml}</div>
        </div>
        <div class="cpc-editor-chart-wrap" id="cpcBarChart">
          <div class="cpc-bar-container" id="cpcBarContainer"></div>
        </div>
        <div class="cpc-inputs-row" id="cpcInputsRow"></div>
        <div class="cpc-editor-actions">
          <button class="cpc-btn-save-shape" onclick="cpcSaveCustomShape()">Save as Shape</button>
          <button class="cpc-btn-cancel" onclick="closeCpcEditor(false)">Cancel</button>
          <button class="cpc-btn-save" onclick="closeCpcEditor(true)">Apply</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  cpcRenderBars();
  cpcRenderInputs();

  // Set up drag on bar container
  const container = document.getElementById('cpcBarContainer');
  container.addEventListener('mousedown', cpcDragStart);
  document.addEventListener('mousemove', cpcDragMove);
  document.addEventListener('mouseup', cpcDragEnd);
}

function closeCpcEditor(apply) {
  if (apply && cpcEditorPlatId !== null && cpcEditorDraft) {
    const plat = platforms.find(p => p.id === cpcEditorPlatId);
    if (plat) {
      const isCpc = plat.model === 'var-cpc';
      if (isCpc) {
        plat.cpcRates = [...cpcEditorDraft];
      } else {
        plat.cpmRates = [...cpcEditorDraft];
      }
      saveToLocalStorage();
      render();
      showToast('Variable rates applied');
    }
  }
  const overlay = document.getElementById('cpcEditorOverlay');
  if (overlay) overlay.remove();
  document.removeEventListener('mousemove', cpcDragMove);
  document.removeEventListener('mouseup', cpcDragEnd);
  cpcEditorPlatId = null;
  cpcEditorDraft = null;
  cpcEditorDrag = null;
}

function cpcRenderBars() {
  const container = document.getElementById('cpcBarContainer');
  if (!container || !cpcEditorDraft) return;
  const maxRate = Math.max(...cpcEditorDraft, 0.01);
  const currency = document.getElementById('currencySelect')?.value || '£';
  const labels = MONTHS.map((_, i) => {
    const calIdx = (i + startMonth) % 12;
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calIdx];
  });

  container.innerHTML = cpcEditorDraft.map((rate, i) => {
    const pct = (rate / maxRate) * 100;
    return `<div class="cpc-bar-col" data-cpc-idx="${i}">
      <span class="cpc-bar-value">${currency}${rate.toFixed(2)}</span>
      <div class="cpc-bar" style="height:${Math.max(pct, 3)}%"></div>
      <span class="cpc-bar-label">${labels[i]}</span>
    </div>`;
  }).join('');
}

function cpcRenderInputs() {
  const row = document.getElementById('cpcInputsRow');
  if (!row || !cpcEditorDraft) return;
  const labels = MONTHS.map((_, i) => {
    const calIdx = (i + startMonth) % 12;
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calIdx];
  });

  row.innerHTML = cpcEditorDraft.map((rate, i) =>
    `<div class="cpc-input-cell">
      <label>${labels[i]}</label>
      <input type="number" min="0" step="0.01" value="${rate.toFixed(2)}"
        onchange="cpcSetRate(${i}, +this.value)" onfocus="this.select()">
    </div>`
  ).join('');
}

function cpcSetRate(idx, val) {
  if (!cpcEditorDraft) return;
  cpcEditorDraft[idx] = Math.max(0, val || 0);
  cpcRenderBars();
}

// Drag to adjust bars
function cpcDragStart(e) {
  const col = e.target.closest('.cpc-bar-col');
  if (!col) return;
  e.preventDefault();
  const idx = +col.dataset.cpcIdx;
  const chart = document.getElementById('cpcBarChart');
  const rect = chart.getBoundingClientRect();
  cpcEditorDrag = { idx, chartTop: rect.top, chartHeight: rect.height };
  cpcDragUpdate(e);
}

function cpcDragMove(e) {
  if (!cpcEditorDrag) return;
  e.preventDefault();
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const col = el?.closest?.('.cpc-bar-col');
  if (col) cpcEditorDrag.idx = +col.dataset.cpcIdx;
  cpcDragUpdate(e);
}

function cpcDragEnd() {
  if (cpcEditorDrag) {
    cpcEditorDrag = null;
    cpcRenderInputs();
  }
}

function cpcDragUpdate(e) {
  if (!cpcEditorDrag || !cpcEditorDraft) return;
  const { idx, chartTop, chartHeight } = cpcEditorDrag;
  const maxRate = Math.max(...cpcEditorDraft, 0.01) * 1.3;
  const pct = 1 - Math.max(0, Math.min(1, (e.clientY - chartTop) / chartHeight));
  const newRate = Math.round(pct * maxRate * 100) / 100;
  cpcEditorDraft[idx] = Math.max(0.01, newRate);
  cpcRenderBars();
}

// Apply a seasonality preset as multipliers on current average
function cpcApplyPreset(cat, shapeName) {
  if (!cpcEditorDraft) return;
  const calWeights = SEASONALITY_SHAPES[cat]?.[shapeName];
  if (!calWeights) return;
  const weights = rotateWeights(calWeights);
  const avg = cpcEditorDraft.reduce((a, b) => a + b, 0) / 12;
  if (avg <= 0) return;
  const wSum = weights.reduce((a, b) => a + b, 0);
  cpcEditorDraft = weights.map(w => Math.round((w / wSum * 12) * avg * 100) / 100);
  cpcRenderBars();
  cpcRenderInputs();
}

function cpcApplyFlat() {
  if (!cpcEditorDraft) return;
  const avg = cpcEditorDraft.reduce((a, b) => a + b, 0) / 12;
  cpcEditorDraft = Array(12).fill(Math.round(avg * 100) / 100);
  cpcRenderBars();
  cpcRenderInputs();
}

// Re-render just the custom shapes section inside the open modal
function cpcRenderCustomShapes() {
  const wrap = document.getElementById('cpcCustomShapesWrap');
  if (!wrap) return;
  const plat = platforms.find(p => p.id === cpcEditorPlatId);
  const label = (plat?.model === 'var-cpc') ? 'CPC' : 'CPM';
  if (customCpcShapes.length === 0) { wrap.innerHTML = ''; return; }
  let html = `<div class="cpc-editor-presets-label">Saved ${label} Shapes</div>`;
  customCpcShapes.forEach(cs => {
    html += `<div class="cpc-custom-shape-card" onclick="cpcLoadCustomShape('${esc(cs.name)}')">
      <span class="cpc-cs-name">${esc(cs.name)}</span>
      <span class="cpc-cs-del" onclick="event.stopPropagation();cpcDeleteCustomShape('${esc(cs.name)}')" title="Delete">✕</span>
    </div>`;
  });
  wrap.innerHTML = html;
}

// Save current draft as a custom CPC shape
function cpcSaveCustomShape() {
  if (!cpcEditorDraft) return;
  const name = prompt('Name this CPC/CPM shape:');
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  if (customCpcShapes.some(s => s.name === trimmed)) {
    if (!confirm(`"${trimmed}" already exists — overwrite?`)) return;
    customCpcShapes = customCpcShapes.filter(s => s.name !== trimmed);
  }
  // Store in calendar-month order (un-rotate from position order)
  const calRates = unrotateWeights(cpcEditorDraft);
  customCpcShapes.push({ name: trimmed, rates: calRates });
  saveToLocalStorage();
  showToast(`CPC/CPM shape "${trimmed}" saved`);
  cpcRenderCustomShapes();
}

function cpcLoadCustomShape(shapeName) {
  if (!cpcEditorDraft) return;
  const cs = customCpcShapes.find(s => s.name === shapeName);
  if (!cs) return;
  // Rotate calendar-month rates to position order
  cpcEditorDraft = [...rotateWeights(cs.rates)];
  cpcRenderBars();
  cpcRenderInputs();
}

function cpcDeleteCustomShape(shapeName) {
  if (!confirm(`Delete CPC/CPM shape "${shapeName}"?`)) return;
  customCpcShapes = customCpcShapes.filter(s => s.name !== shapeName);
  saveToLocalStorage();
  showToast(`Shape "${shapeName}" removed`);
  cpcRenderCustomShapes();
}


</script>

