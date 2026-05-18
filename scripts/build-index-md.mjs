// One-shot script that ports marketing-forecast-v37.html into src/index.md.
// Run once (after which it's not needed again). Kept in the repo as a
// record of exactly what transformations were applied, so the port is
// reproducible if we ever need to re-run it against a newer source file.
//
//   node scripts/build-index-md.mjs <path-to-source.html>
//
// What it does:
//   1. Reads the source HTML.
//   2. Pulls out the two CDN <script src> lines from <head>.
//   3. Pulls out the <style> block.
//   4. Pulls out the body inner HTML (everything between <body>…</body>).
//   5. Writes src/index.md with:
//        - Observable Framework frontmatter (dark theme, no chrome)
//        - A <style> override block that zeroes Framework's sidebar/ToC
//          gutters so the app uses the full viewport width
//        - The original CDN scripts
//        - The original <style> block
//        - The original body content

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || resolve(__dirname, "..", "..", "..", "forecast app", "marketing-forecast-v37.html");
const out = resolve(__dirname, "..", "src", "index.md");

const html = await readFile(src, "utf8");

// Snip helpers — non-greedy, dotall via [\s\S].
function between(re) {
  const m = html.match(re);
  if (!m) throw new Error(`Pattern not found: ${re}`);
  return m[1];
}

// 1. CDN scripts (two of them, in head).
const cdnScripts = [...html.matchAll(/<script\s+src="https:\/\/cdnjs\.cloudflare\.com[^>]+><\/script>/g)]
  .map((m) => m[0])
  .join("\n");
if (!cdnScripts) throw new Error("CDN scripts not found");

// 2. The single <style> block in head.
const styleBlock = between(/<style>([\s\S]*?)<\/style>/);

// 3. Body inner HTML.
const bodyInner = between(/<body>([\s\S]*?)<\/body>/);

const frontmatter = `---
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

`;

const indexMd =
  frontmatter +
  cdnScripts + "\n\n" +
  "<style>\n" + styleBlock + "\n</style>\n\n" +
  bodyInner + "\n";

await mkdir(dirname(out), { recursive: true });
await writeFile(out, indexMd, "utf8");
console.log(`Wrote ${out} (${indexMd.length.toLocaleString()} bytes)`);
