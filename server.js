// Express server that serves the marketing forecast HTML app behind an
// IP allowlist. The app is a single self-contained HTML file in public/
// — no build step, no framework — so this server's only jobs are:
//   - gate requests by IP (Cloud Run XFF-aware; CIDR via ipaddr.js)
//   - serve public/ as a static site
//
// Phase 2 will add /api/forecasts endpoints (multi-forecast save/load
// backed by GCS); when it lands, the express.json middleware and route
// handlers go in this same file alongside the static handler.
//
// Local development runs without restriction (ALLOWED_IPS unset) so
// `node server.js` behaves like a plain static server. Production on
// Cloud Run sets ALLOWED_IPS=ip1,cidr2,... via env var.

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ipaddr from "ipaddr.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");

const app = express();

// ── IP allowlist ──────────────────────────────────────────────────────
// Parse ALLOWED_IPS once at startup into the [parsed-ip, prefix-length]
// tuples that ipaddr.js's match() expects. Each entry is a single IP
// (e.g. "203.0.113.5") or a CIDR (e.g. "203.0.113.0/29"). Unset / empty
// means no restriction — local dev keeps working unchanged.
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
// `req.ip` returns the leftmost entry, which would let any caller spoof
// their source. We read XFF explicitly and take the last entry.
// Ref: https://cloud.google.com/run/docs/container-contract#headers
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

// ── Static site ────────────────────────────────────────────────────────
app.use(express.static(PUBLIC, { extensions: ["html"] }));
// 404 fallback serves the dashboard so typos still land somewhere useful.
app.use((_req, res) => res.status(404).sendFile(path.join(PUBLIC, "index.html")));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`▸ Dashboard  http://localhost:${port}/`);
});
