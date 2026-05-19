// Forecasts Manager — Phase 2 of the Marketing Forecast App rollout.
//
// Mounts a "📁 Forecasts ▾" dropdown into the existing header toolbar
// without touching the v37 HTML, so future v38+ snapshots drop into
// public/index.html and pick up this feature for free (server.js injects
// `<script defer src="/forecasts-manager.js"></script>` before </body>).
//
// What it does:
//   - "Save as new…"           POST /api/forecasts {name, state}
//   - "Save changes to <name>" PUT  /api/forecasts/:id {state}
//   - Click a saved forecast   GET  /api/forecasts/:id → setState()
//   - ✏ rename                 PUT  /api/forecasts/:id {name}
//   - 🗑 delete                 DELETE /api/forecasts/:id
//
// Reads/writes the v37 state through the globals `getState()` and
// `setState(data)` which v37's <script> already defines on window.
// Reuses v37's `render()` and `showSaveToast()` if present for UX
// consistency; falls back to a built-in toast otherwise.
//
// If the API returns 503 (FORECASTS_BUCKET unset on the server) the
// dropdown surfaces a "shared forecasts unavailable on this deployment"
// notice and the rest of the app keeps working — the legacy JSON
// Save/Load buttons remain functional as a backup.

(() => {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────
  let currentId = null;          // id of the currently-loaded forecast, or null
  let currentName = null;        // its name, or null
  let savedStateHash = null;     // hash of state at last save/load — used for dirty detection
  let listCache = [];            // most recent /api/forecasts response, for the dropdown

  // ── Utilities ──────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v;
      else if (k === "style") e.style.cssText = v;
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, String(v));
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return e;
  }

  function relativeTime(iso) {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return "";
    const dSec = Math.max(0, (Date.now() - t) / 1000);
    if (dSec < 60) return "just now";
    if (dSec < 3600) return `${Math.round(dSec / 60)}m ago`;
    if (dSec < 86400) return `${Math.round(dSec / 3600)}h ago`;
    if (dSec < 86400 * 7) return `${Math.round(dSec / 86400)}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // Lightweight hash of the state for "is the page dirty?" checks. We
  // don't need cryptographic strength — collisions are harmless here.
  function hashState(state) {
    const s = JSON.stringify(state);
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return `${h}|${s.length}`;
  }

  function isDirty() {
    if (currentId == null) return false;
    if (typeof window.getState !== "function") return false;
    return hashState(window.getState()) !== savedStateHash;
  }

  function toast(msg, kind = "info") {
    // Reuse v37's save-toast slot if present so styling matches.
    const slot = $("saveToast");
    if (slot) {
      slot.textContent = msg;
      slot.style.background = kind === "error" ? "#7F1D1D"
                            : kind === "ok"    ? "#065F46"
                                                : "#0D1B2A";
      slot.classList.add("show");
      clearTimeout(slot._fmHide);
      slot._fmHide = setTimeout(() => slot.classList.remove("show"), 2400);
      return;
    }
    // Fallback toast
    let fb = $("fm-fallback-toast");
    if (!fb) {
      fb = el("div", { id: "fm-fallback-toast", style:
        "position:fixed;right:18px;bottom:18px;padding:10px 14px;border-radius:9px;font-size:13px;font-weight:600;color:#E8EDF2;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.25);transition:opacity .2s;" });
      document.body.appendChild(fb);
    }
    fb.textContent = msg;
    fb.style.background = kind === "error" ? "#7F1D1D"
                       : kind === "ok"    ? "#065F46"
                                          : "#0D1B2A";
    fb.style.opacity = "1";
    clearTimeout(fb._fmHide);
    fb._fmHide = setTimeout(() => { fb.style.opacity = "0"; }, 2400);
  }

  async function fetchJson(url, options) {
    const r = await fetch(url, options);
    const ct = r.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    if (!r.ok) {
      const body = isJson ? await r.json().catch(() => ({})) : {};
      const err = new Error(body.error || `HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
    if (r.status === 204) return null;
    return isJson ? await r.json() : null;
  }

  // ── Styles ─────────────────────────────────────────────────────────
  // Injected once at startup. Keep names prefixed (fm-…) to avoid any
  // collision with v37's existing CSS.
  const STYLE = `
    .fm-btn { position: relative; }
    .fm-loaded-indicator {
      position: absolute; top: -7px; right: -7px;
      background: #00E5FF; color: #010E21; font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 8px; pointer-events: none;
    }
    .fm-loaded-indicator.dirty { background: #FF9100; color: #010E21; }
    .fm-dropdown {
      position: fixed; min-width: 320px;
      max-width: 440px; max-height: 70vh; overflow-y: auto;
      background: #0A1628; border: 1px solid #1A2A3F; border-radius: 10px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.45); padding: 6px;
      z-index: 9000; font-size: 0.83rem;
    }
    .fm-dd-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 6px; cursor: pointer;
      color: #E8EDF2;
    }
    .fm-dd-row:hover { background: #0F1E30; }
    .fm-dd-row.fm-action { color: #00E5FF; font-weight: 600; }
    .fm-dd-row.fm-action.fm-disabled { color: #4A5566; cursor: not-allowed; }
    .fm-dd-row .fm-dd-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fm-dd-row .fm-dd-meta { color: #7A8A9A; font-size: 0.72rem; flex-shrink: 0; }
    .fm-dd-row .fm-dd-actions { display: flex; gap: 2px; opacity: 0; transition: opacity .12s; flex-shrink: 0; }
    .fm-dd-row:hover .fm-dd-actions { opacity: 1; }
    .fm-dd-actions button {
      background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px;
      color: #7A8A9A; font-size: 13px;
    }
    .fm-dd-actions button:hover { background: #1A2A3F; color: #E8EDF2; }
    .fm-dd-divider { height: 1px; background: #1A2A3F; margin: 4px 6px; }
    .fm-dd-empty { padding: 14px 12px; color: #7A8A9A; font-style: italic; text-align: center; }
    .fm-dd-error { padding: 12px; color: #FF8A50; }
    .fm-dd-current { background: rgba(0,229,255,0.08); }
    .fm-dd-current .fm-dd-name { color: #00E5FF; font-weight: 600; }
  `;

  function injectStyle() {
    if (document.getElementById("fm-styles")) return;
    const s = document.createElement("style");
    s.id = "fm-styles";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // ── Mount point: insert the Forecasts button into the header toolbar
  // before the existing "💾 Save JSON" button (which after server.js's
  // label rewrite is `button[onclick="exportJSON()"]`). If we can't find
  // the toolbar, we bail without crashing.
  function findToolbar() {
    const exportBtn = document.querySelector('button[onclick="exportJSON()"]');
    if (exportBtn?.parentElement) return { container: exportBtn.parentElement, before: exportBtn };
    const headerControls = document.querySelector(".header-controls");
    return headerControls ? { container: headerControls, before: headerControls.firstChild } : null;
  }

  let buttonEl = null;
  let dropdownEl = null;
  let outsideHandler = null;

  function renderButtonLabel() {
    if (!buttonEl) return;
    const labelText = "📁 Forecasts ▾";
    buttonEl.innerHTML = "";
    buttonEl.appendChild(document.createTextNode(labelText));
    if (currentId) {
      const tag = el("span", {
        class: "fm-loaded-indicator" + (isDirty() ? " dirty" : ""),
        title: isDirty() ? `Unsaved changes to "${currentName}"` : `Loaded: ${currentName}`
      }, "●");
      buttonEl.appendChild(tag);
    }
  }

  function mount() {
    injectStyle();
    const slot = findToolbar();
    if (!slot) {
      console.warn("[forecasts-manager] header toolbar not found; UI not mounted");
      return;
    }
    buttonEl = el("button", {
      class: "btn-header fm-btn",
      title: "Open the team's shared forecast library",
      onclick: toggleDropdown
    });
    slot.container.insertBefore(buttonEl, slot.before);
    renderButtonLabel();

    // Re-render the dirty indicator periodically. We don't try to hook
    // every state-mutating callback in v37; a 1s poll is cheap and
    // doesn't compete with the app's own render cycle.
    setInterval(renderButtonLabel, 1000);
  }

  let repositionHandler = null;

  function positionDropdown() {
    if (!dropdownEl || !buttonEl) return;
    const r = buttonEl.getBoundingClientRect();
    // Pin the dropdown's right edge to the button's right edge; let max-width
    // and min-width drive the actual width. Top sits 6px below the button.
    const top = Math.round(r.bottom + 6);
    const right = Math.round(window.innerWidth - r.right);
    dropdownEl.style.top = `${top}px`;
    dropdownEl.style.right = `${right}px`;
    dropdownEl.style.left = "auto";
  }

  function closeDropdown() {
    if (!dropdownEl) return;
    dropdownEl.remove();
    dropdownEl = null;
    if (outsideHandler) {
      document.removeEventListener("mousedown", outsideHandler, true);
      outsideHandler = null;
    }
    if (repositionHandler) {
      window.removeEventListener("scroll", repositionHandler, true);
      window.removeEventListener("resize", repositionHandler);
      repositionHandler = null;
    }
  }

  function toggleDropdown(ev) {
    // Stop the button's click from bubbling so subsequent listeners (e.g.
    // v37's global kpiPopover close-on-click) don't run and so a parent
    // never sees our toggle click.
    if (ev) ev.stopPropagation();
    if (dropdownEl) { closeDropdown(); return; }
    openDropdown();
  }

  async function openDropdown() {
    // Mount on <body>, not inside the button, so clicks in the dropdown
    // don't bubble back to the button's onclick (which would re-toggle).
    dropdownEl = el("div", { class: "fm-dropdown" });
    document.body.appendChild(dropdownEl);
    positionDropdown();

    repositionHandler = () => positionDropdown();
    window.addEventListener("scroll", repositionHandler, true);
    window.addEventListener("resize", repositionHandler);

    // Close on outside click. "Outside" means: not inside the button, and
    // not inside the dropdown itself. Capture phase so we run before any
    // inner handlers can call stopPropagation.
    outsideHandler = (ev) => {
      if (!dropdownEl) return;
      if (buttonEl.contains(ev.target)) return;
      if (dropdownEl.contains(ev.target)) return;
      closeDropdown();
    };
    document.addEventListener("mousedown", outsideHandler, true);

    renderDropdown([{ kind: "loading" }]);

    try {
      listCache = await fetchJson("/api/forecasts");
      renderDropdown();
    } catch (err) {
      if (err.status === 503) {
        renderDropdown([{ kind: "unavailable" }]);
      } else {
        renderDropdown([{ kind: "error", message: err.message || String(err) }]);
      }
    }
  }

  function renderDropdown(overlayItems) {
    if (!dropdownEl) return;
    dropdownEl.innerHTML = "";

    // Top actions: Save as new (always) + Save changes (when loaded)
    dropdownEl.appendChild(el("div", {
      class: "fm-dd-row fm-action",
      onclick: () => { closeDropdown(); saveAsNew(); }
    }, el("span", { class: "fm-dd-name" }, "+ Save as new…")));

    if (currentId) {
      const dirty = isDirty();
      const label = dirty
        ? `↑ Save changes to "${currentName}"`
        : `↑ Saved · "${currentName}"`;
      dropdownEl.appendChild(el("div", {
        class: "fm-dd-row fm-action" + (dirty ? "" : " fm-disabled"),
        onclick: () => { if (dirty) { closeDropdown(); saveOverwrite(); } }
      }, el("span", { class: "fm-dd-name" }, label)));
    }

    dropdownEl.appendChild(el("div", { class: "fm-dd-divider" }));

    if (overlayItems?.[0]) {
      const o = overlayItems[0];
      if (o.kind === "loading") {
        dropdownEl.appendChild(el("div", { class: "fm-dd-empty" }, "Loading…"));
        return;
      }
      if (o.kind === "unavailable") {
        dropdownEl.appendChild(el("div", { class: "fm-dd-error" },
          "Shared forecasts are not configured on this deployment yet."));
        return;
      }
      if (o.kind === "error") {
        dropdownEl.appendChild(el("div", { class: "fm-dd-error" },
          `Couldn't load list: ${o.message}`));
        return;
      }
    }

    if (listCache.length === 0) {
      dropdownEl.appendChild(el("div", { class: "fm-dd-empty" },
        "No saved forecasts yet. Use 'Save as new…' to create the first."));
      return;
    }

    for (const f of listCache) {
      const isCurrent = f.id === currentId;
      const row = el("div", {
        class: "fm-dd-row" + (isCurrent ? " fm-dd-current" : ""),
        onclick: (ev) => {
          // Don't trigger load when clicking the inline action buttons.
          if (ev.target.closest(".fm-dd-actions")) return;
          closeDropdown(); loadOne(f.id);
        }
      },
        el("span", { class: "fm-dd-name", title: f.name }, f.name),
        el("span", { class: "fm-dd-meta" }, relativeTime(f.savedAt)),
        el("div", { class: "fm-dd-actions" },
          el("button", {
            title: "Rename",
            onclick: (ev) => { ev.stopPropagation(); closeDropdown(); renameOne(f); }
          }, "✏"),
          el("button", {
            title: "Delete",
            onclick: (ev) => { ev.stopPropagation(); closeDropdown(); deleteOne(f); }
          }, "🗑")
        )
      );
      dropdownEl.appendChild(row);
    }
  }

  // ── Actions ────────────────────────────────────────────────────────
  async function saveAsNew() {
    if (typeof window.getState !== "function") {
      toast("Page not ready yet — try again in a moment", "error");
      return;
    }
    const defaultName = currentName
      ? `${currentName} (copy)`
      : `Forecast ${new Date().toLocaleDateString()}`;
    const name = window.prompt("Name this forecast:", defaultName);
    if (!name) return;
    const state = window.getState();
    try {
      const { id, savedAt } = await fetchJson("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), state })
      });
      currentId = id;
      currentName = name.trim();
      savedStateHash = hashState(state);
      renderButtonLabel();
      toast(`Saved "${currentName}"`, "ok");
    } catch (err) {
      toast(`Save failed: ${err.message || err}`,
        err.status === 503 ? "info" : "error");
    }
  }

  async function saveOverwrite() {
    if (!currentId || typeof window.getState !== "function") return;
    const state = window.getState();
    try {
      const { savedAt } = await fetchJson(`/api/forecasts/${currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state })
      });
      savedStateHash = hashState(state);
      renderButtonLabel();
      toast(`Saved changes to "${currentName}"`, "ok");
    } catch (err) {
      if (err.status === 404) {
        toast("Forecast was deleted by someone else. Use Save as new instead.", "error");
        currentId = null; currentName = null; savedStateHash = null;
        renderButtonLabel();
      } else {
        toast(`Save failed: ${err.message || err}`, "error");
      }
    }
  }

  async function loadOne(id) {
    if (isDirty()) {
      const proceed = window.confirm(
        `You have unsaved changes to "${currentName}". Load this forecast anyway and discard them?`);
      if (!proceed) return;
    }
    try {
      const data = await fetchJson(`/api/forecasts/${id}`);
      if (typeof window.setState !== "function") {
        toast("Page not ready yet", "error");
        return;
      }
      const ok = window.setState(data.state);
      if (ok === false) {
        toast("This forecast is in an old format and couldn't be loaded.", "error");
        return;
      }
      currentId = data.id;
      currentName = data.name;
      savedStateHash = hashState(window.getState());
      if (typeof window.render === "function") window.render();
      renderButtonLabel();
      toast(`Loaded "${currentName}"`, "ok");
    } catch (err) {
      toast(`Load failed: ${err.message || err}`, "error");
    }
  }

  async function renameOne(f) {
    const next = window.prompt(`Rename "${f.name}" to:`, f.name);
    if (!next || next.trim() === f.name) return;
    try {
      await fetchJson(`/api/forecasts/${f.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() })
      });
      if (f.id === currentId) {
        currentName = next.trim();
        renderButtonLabel();
      }
      toast(`Renamed to "${next.trim()}"`, "ok");
    } catch (err) {
      toast(`Rename failed: ${err.message || err}`, "error");
    }
  }

  async function deleteOne(f) {
    if (!window.confirm(`Delete "${f.name}"? This cannot be undone.`)) return;
    try {
      await fetchJson(`/api/forecasts/${f.id}`, { method: "DELETE" });
      if (f.id === currentId) {
        currentId = null; currentName = null; savedStateHash = null;
        renderButtonLabel();
      }
      toast(`Deleted "${f.name}"`, "ok");
    } catch (err) {
      toast(`Delete failed: ${err.message || err}`, "error");
    }
  }

  // ── Boot ───────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
