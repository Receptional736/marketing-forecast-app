// Express server that serves the marketing forecast HTML app behind an
// IP allowlist, and exposes a /api/forecasts CRUD endpoint set backed by
// GCS so the team can share named forecasts via the in-app Forecasts
// dropdown (Phase 2 of the dashboard rollout).
//
// What this server does:
//   1. IP allowlist gating (Cloud Run XFF-aware; CIDR via ipaddr.js).
//   2. /api/forecasts list/get/create/update/delete — each saved forecast
//      is one GCS object at `forecasts/<id>.json` in FORECASTS_BUCKET,
//      with `name` and `savedAt` duplicated into custom metadata so the
//      list endpoint doesn't have to download every object body.
//   3. Serves public/index.html — but transformed on the fly to inject
//      the Forecasts UI script and rename the legacy "Save / Load" JSON
//      buttons. Future v38+ snapshots drop into public/index.html and
//      pick up the transformations without any HTML edits.
//   4. Serves the rest of public/ as static (forecasts-manager.js etc.).
//
// Local development runs without restriction (ALLOWED_IPS unset) so
// `node server.js` behaves like a plain static server. FORECASTS_BUCKET
// being unset disables the /api/forecasts endpoints (they 503); the UI
// catches that and surfaces a friendly message.
//
// Production on Cloud Run sets both ALLOWED_IPS and FORECASTS_BUCKET.

import express from "express";
import path from "node:path";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ipaddr from "ipaddr.js";
import { Storage } from "@google-cloud/storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");

const app = express();

// ── IP allowlist ──────────────────────────────────────────────────────
function parseAllowlist(spec) {
  if (!spec) return null;
  return spec
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      if (entry.includes("/")) return ipaddr.parseCIDR(entry);
      const single = ipaddr.parse(entry);
      return [single, single.kind() === "ipv4" ? 32 : 128];
    });
}

const ALLOWLIST = parseAllowlist(process.env.ALLOWED_IPS);
if (ALLOWLIST) {
  console.log(`IP allowlist active: ${process.env.ALLOWED_IPS}`);
} else {
  console.log("IP allowlist disabled (ALLOWED_IPS unset) — accepting all requests");
}

// Cloud Run appends the real client IP at the RIGHT end of X-Forwarded-For
// — earlier entries are client-supplied and forgeable. Express's default
// `req.ip` returns the leftmost entry; we read XFF explicitly and take
// the last entry instead.
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const parts = String(xff).split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return req.socket.remoteAddress || "";
}

function ipAllowlist(req, res, next) {
  if (!ALLOWLIST) return next();
  const raw = getClientIp(req);
  let addr;
  try {
    addr = ipaddr.process(raw); // strips ::ffff: IPv4-in-IPv6 wrapper
  } catch {
    console.warn(`Rejected: could not parse client IP "${raw}"`);
    return res.status(403).send("Forbidden");
  }
  for (const range of ALLOWLIST) {
    if (addr.kind() === range[0].kind() && addr.match(range)) return next();
  }
  console.warn(`Blocked ${raw} → ${req.originalUrl}`);
  res.status(403).send("Forbidden");
}

app.use(ipAllowlist);

// ── /api/forecasts (multi-forecast manager backed by GCS) ─────────────
// Each saved forecast is one object at `forecasts/<id>.json` in
// FORECASTS_BUCKET. The body contains the full v37 state snapshot. The
// human-readable `name` and the ISO `savedAt` are duplicated into custom
// metadata so listing can render the dropdown without downloading every
// object body. 200 KB request cap so a buggy client can't blow up storage.
//
// Authorization model: the IP allowlist gates the whole service, so any
// caller who can reach the app can read/write any forecast. No per-user
// auth — intentional, this is a team-internal tool. Last-write-wins on
// the same id; the UI shows savedAt so users can see whether their copy
// is stale before overwriting.

const FORECASTS_BUCKET = process.env.FORECASTS_BUCKET || "";
const forecastsBucket = FORECASTS_BUCKET ? new Storage().bucket(FORECASTS_BUCKET) : null;
if (forecastsBucket) {
  console.log(`Forecasts API enabled: gs://${FORECASTS_BUCKET}/forecasts/`);
} else {
  console.log("Forecasts API disabled (FORECASTS_BUCKET unset)");
}

// 8-char id from a confusables-free alphabet (no I/l/1/O/0).
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const ID_RE = /^[A-Za-z2-9]{8}$/;
function genId() {
  const bytes = crypto.randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return s;
}

function objectFor(id) {
  return forecastsBucket.file(`forecasts/${id}.json`);
}

// Re-encode the name through Buffer→base64 to survive HTTP-header
// transport: GCS custom metadata values are HTTP-header-encoded, and
// arbitrary unicode in a name (emoji, accents) would otherwise either
// be rejected or silently mangled.
function encodeName(name) {
  return Buffer.from(String(name), "utf8").toString("base64");
}
function decodeName(b64) {
  try { return Buffer.from(String(b64 || ""), "base64").toString("utf8"); }
  catch { return ""; }
}

app.use(express.json({ limit: "200kb" }));

function requireBucket(_req, res, next) {
  if (!forecastsBucket) {
    return res.status(503).json({ error: "Forecasts API is not configured on this deployment" });
  }
  next();
}

function isString(v, max = 200) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}
function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

// List: returns lightweight metadata only (id, name, savedAt). Body
// contents are NOT included; the client calls GET /api/forecasts/:id to
// load a specific one. Pulling metadata from GCS custom metadata keeps
// this O(1) per object instead of O(body size).
app.get("/api/forecasts", requireBucket, async (_req, res) => {
  try {
    const [files] = await forecastsBucket.getFiles({ prefix: "forecasts/" });
    const items = files
      .filter((f) => f.name.endsWith(".json"))
      .map((f) => {
        const id = f.name.replace(/^forecasts\//, "").replace(/\.json$/, "");
        const m = f.metadata.metadata || {};
        return {
          id,
          name: decodeName(m.nameB64) || id,
          savedAt: m.savedAt || f.metadata.updated || null
        };
      })
      .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
    res.json(items);
  } catch (err) {
    console.error("Forecasts list error:", err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Get one: returns full body plus metadata. 404 if missing.
app.get("/api/forecasts/:id", requireBucket, async (req, res) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const file = objectFor(id);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ error: "Forecast not found" });
    const [buf] = await file.download();
    const [meta] = await file.getMetadata();
    const custom = meta.metadata || {};
    const state = JSON.parse(buf.toString("utf8"));
    res.set("Cache-Control", "no-store");
    res.json({
      id,
      name: decodeName(custom.nameB64) || id,
      savedAt: custom.savedAt || meta.updated,
      state
    });
  } catch (err) {
    console.error(`Forecasts get error (${id}):`, err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Create: body is {name, state}. Server allocates a fresh id, retries up
// to 3x in the (vanishingly unlikely) case of a collision.
app.post("/api/forecasts", requireBucket, async (req, res) => {
  const { name, state } = req.body || {};
  if (!isString(name)) return res.status(400).json({ error: "Body must include a non-empty `name` string" });
  if (!isPlainObject(state)) return res.status(400).json({ error: "Body must include a `state` object" });
  try {
    let id, file, exists;
    for (let attempt = 0; attempt < 3; attempt++) {
      id = genId();
      file = objectFor(id);
      [exists] = await file.exists();
      if (!exists) break;
    }
    if (exists) throw new Error("Could not allocate a unique id after 3 attempts");
    const savedAt = new Date().toISOString();
    await file.save(JSON.stringify(state), {
      contentType: "application/json",
      metadata: {
        cacheControl: "no-store",
        metadata: { nameB64: encodeName(name), savedAt }
      },
      resumable: false
    });
    res.status(201).json({ id, savedAt });
  } catch (err) {
    console.error("Forecasts create error:", err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Update: body may include `state` (overwrite body) and/or `name`
// (rename). At least one must be present.
app.put("/api/forecasts/:id", requireBucket, async (req, res) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) return res.status(400).json({ error: "Invalid id" });
  const { name, state } = req.body || {};
  if (name !== undefined && !isString(name)) {
    return res.status(400).json({ error: "If provided, `name` must be a non-empty string" });
  }
  if (state !== undefined && !isPlainObject(state)) {
    return res.status(400).json({ error: "If provided, `state` must be an object" });
  }
  if (name === undefined && state === undefined) {
    return res.status(400).json({ error: "Provide `name` or `state` (or both)" });
  }
  try {
    const file = objectFor(id);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ error: "Forecast not found" });
    const savedAt = new Date().toISOString();

    // If state is provided, rewrite the body. Otherwise, only metadata
    // changes — but GCS doesn't have a "patch metadata, keep body" op,
    // so we re-read and re-write the body either way. The double-trip is
    // unavoidable on rename-only; on save-with-state it's a single PUT.
    let nextBody;
    if (state !== undefined) {
      nextBody = JSON.stringify(state);
    } else {
      const [buf] = await file.download();
      nextBody = buf.toString("utf8");
    }

    // Preserve existing name if not renaming.
    let nextName = name;
    if (nextName === undefined) {
      const [meta] = await file.getMetadata();
      nextName = decodeName(meta.metadata?.nameB64) || id;
    }

    await file.save(nextBody, {
      contentType: "application/json",
      metadata: {
        cacheControl: "no-store",
        metadata: { nameB64: encodeName(nextName), savedAt }
      },
      resumable: false
    });
    res.json({ savedAt });
  } catch (err) {
    console.error(`Forecasts update error (${id}):`, err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.delete("/api/forecasts/:id", requireBucket, async (req, res) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const file = objectFor(id);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ error: "Forecast not found" });
    await file.delete();
    res.status(204).end();
  } catch (err) {
    console.error(`Forecasts delete error (${id}):`, err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ── Index transform (runtime injection) ───────────────────────────────
// We don't want to edit public/index.html every time a new v37+ snapshot
// drops in. So we read it once at startup and apply two transformations:
//
//   1. Rename the legacy `💾 Save` and `📂 Load` toolbar buttons to
//      `💾 Save JSON` / `📂 Load JSON` so they aren't confused with the
//      new server-backed Save in the Forecasts dropdown.
//   2. Inject `<script defer src="/forecasts-manager.js"></script>` just
//      before `</body>` so the Forecasts dropdown UI mounts on every page
//      load.
//
// If the source HTML doesn't contain the expected anchor strings (e.g. a
// future redesign), the transformations no-op and the file is served as
// shipped — log a warning so we notice.
const INDEX_PATH = path.join(PUBLIC, "index.html");
const INDEX_RAW = readFileSync(INDEX_PATH, "utf8");

function transformIndex(html) {
  let out = html;
  let warned = false;
  const replacements = [
    [">\n      💾 Save\n    <", ">\n      💾 Save JSON\n    <"],
    [">\n      📂 Load\n      <", ">\n      📂 Load JSON\n      <"]
  ];
  for (const [from, to] of replacements) {
    if (!out.includes(from)) {
      if (!warned) console.warn("transformIndex: anchor not found, skipping label rewrite");
      warned = true;
      continue;
    }
    out = out.replace(from, to);
  }
  if (!out.includes("</body>")) {
    console.warn("transformIndex: </body> not found, skipping script injection");
    return out;
  }
  return out.replace(
    "</body>",
    '<script defer src="/forecasts-manager.js"></script>\n</body>'
  );
}

const INDEX_TRANSFORMED = transformIndex(INDEX_RAW);
const INDEX_LEN = Buffer.byteLength(INDEX_TRANSFORMED, "utf8");

app.get(["/", "/index.html"], (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("html").send(INDEX_TRANSFORMED);
});

// ── Static site (everything else: forecasts-manager.js, assets, …) ────
app.use(express.static(PUBLIC, { extensions: ["html"] }));
// 404 fallback serves the dashboard so typos still land somewhere useful.
app.use((_req, res) => res.status(404).type("html").send(INDEX_TRANSFORMED));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`▸ Dashboard       http://localhost:${port}/   (${INDEX_LEN} bytes)`);
  if (forecastsBucket) console.log(`▸ Forecasts API   http://localhost:${port}/api/forecasts`);
});
