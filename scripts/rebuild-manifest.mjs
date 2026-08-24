#!/usr/bin/env node
/**
 * rebuild-manifest.mjs — reconstruct the mirror ledger for a mirror that was
 * captured BEFORE this toolchain existed (oryzo: hand-collected 2026-07-20,
 * pre-skill; no mirror-manifest.json / inventory.tsv / urlpath-policy.json
 * were written at capture time).
 *
 * This is a RETROFIT, not a re-mirror: it never writes a byte under mirror/
 * outside the ledger files. URLs are reconstructed by inverting the one shared
 * mapping (lib/urlpath.mjs), so verify-mirror's mapping-injectivity assertion
 * audits the same function that produced them.
 *
 *   node scripts/rebuild-manifest.mjs --mirror mirror --origin https://oryzo.ai
 *     [--live]           recover each file's DECLARED content-type from the
 *                        origin (HEAD, 400ms apart, single session). Without
 *                        it, `type` is left "" (= unknown; verify-mirror's
 *                        type-vs-magic check then skips those rows).
 *
 * Registered limitation (REBUILD_PLAN §6): `mirroredAt` predates the ledger.
 * sha256/bytes describe the July bytes on disk; `type` (with --live) is the
 * origin's declaration as of the day this script ran. On 2026-08-24 the live
 * site was byte-identical to the mirror (index.html + bundle sha256 match), so
 * the two dates describe the same deploy.
 */
import { readFile, readdir, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { localRelPath, savePolicy, DEFAULT_POLICY } from "./lib/urlpath.mjs";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf("--" + n);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d;
};
const ROOT = path.resolve(flag("mirror", "mirror"));
const ORIGIN = (flag("origin", "https://oryzo.ai")).replace(/\/+$/, "");
const ORIGIN_HOST = new URL(ORIGIN).hostname;
const LIVE = args.includes("--live");
const DELAY = Number(flag("delay", 400));
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Same bookkeeping definition as verify-mirror.mjs: ledger files, top-level
// toolchain dirs, dotfiles. Divergence here would make the gate see "orphans"
// this script refused to ledger, or vice versa.
const LEDGER_FILES = new Set([
  "mirror-manifest.json",
  "inventory.tsv",
  "redirects.tsv",
  "netcapture.tsv",
  "external.txt",
  "urlpath-policy.json",
]);
const TOOL_DIRS = ["_pretty/", "_scripts/"];
const isBookkeeping = (rel) =>
  LEDGER_FILES.has(rel) ||
  TOOL_DIRS.some((d) => rel.startsWith(d)) ||
  rel.split("/").some((seg) => seg.startsWith("."));

async function walk(dir, base = "") {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? base + "/" + e.name : e.name;
    if (e.isDirectory()) out.push(...(await walk(path.join(dir, e.name), rel)));
    else out.push(rel);
  }
  return out;
}

// Invert localRelPath for the simple shapes this mirror actually contains
// (query-less, same-origin, extensioned paths + the root document). The
// round-trip below asserts the inversion agrees with the forward mapping for
// EVERY file — an unrepresentable path is a loud failure, not a guess.
function urlForRel(rel) {
  if (rel === "index.html") return ORIGIN + "/";
  if (rel.endsWith("/index.html")) return ORIGIN + "/" + rel.slice(0, -"/index.html".length);
  return ORIGIN + "/" + rel;
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rels = (await walk(ROOT)).filter((r) => !isBookkeeping(r)).sort();
console.log(`${rels.length} mirrored files under ${path.relative(process.cwd(), ROOT)}/`);

const files = {};
let liveMiss = 0;
for (const rel of rels) {
  const url = urlForRel(rel);
  const roundtrip = localRelPath(url, ORIGIN_HOST, DEFAULT_POLICY);
  if (roundtrip !== rel) {
    console.error(`FATAL: mapping round-trip failed for ${rel}`);
    console.error(`       reconstructed URL ${url} maps to ${roundtrip}`);
    console.error(`       this file's URL cannot be reconstructed mechanically — record it by hand.`);
    process.exit(1);
  }
  const buf = await readFile(path.join(ROOT, rel));
  let type = "";
  if (LIVE) {
    try {
      let res = await fetch(url, { method: "HEAD", headers: { "user-agent": UA, accept: "*/*", referer: ORIGIN + "/" } });
      if (!res.ok) {
        // Some origins refuse HEAD; a 1-byte ranged GET carries the same header.
        res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*", referer: ORIGIN + "/", range: "bytes=0-0" } });
      }
      if (res.ok) type = res.headers.get("content-type") || "";
      else {
        liveMiss++;
        console.log(`  [no-live] HTTP ${res.status} ${url}`);
      }
      if (res.body) await res.body.cancel?.().catch(() => {});
    } catch (e) {
      liveMiss++;
      console.log(`  [no-live] ${url} (${e.message})`);
    }
    await sleep(DELAY);
  }
  files[url] = { path: rel, bytes: buf.length, sha256: sha256(buf), type };
  process.stdout.write(`\r  ledgered ${Object.keys(files).length}/${rels.length}   `);
}
console.log("");

await writeFile(
  path.join(ROOT, "mirror-manifest.json"),
  JSON.stringify(
    {
      origin: ORIGIN,
      mirroredAt: "2026-07-20T00:00:00.000Z",
      ledgerReconstructedAt: new Date().toISOString(),
      note:
        "Mirror captured 2026-07-20/22 (pre-toolchain, hand-collected; see REBUILD_PLAN §1). " +
        "Ledger reconstructed by scripts/rebuild-manifest.mjs; `type` is the origin's declared " +
        "content-type as re-observed at reconstruction time (live site verified byte-identical).",
      files,
    },
    null,
    2,
  ),
);
await writeFile(
  path.join(ROOT, "inventory.tsv"),
  ["SHA256", "BYTES", "PATH", "URL"].join("\t") + "\n" +
    Object.entries(files)
      .sort((a, b) => a[1].path.localeCompare(b[1].path))
      .map(([url, f]) => [f.sha256, f.bytes, f.path, url].join("\t"))
      .join("\n") + "\n",
);
await savePolicy(ROOT, DEFAULT_POLICY);
console.log(`wrote mirror-manifest.json (${Object.keys(files).length} files), inventory.tsv, urlpath-policy.json`);
if (LIVE) console.log(liveMiss ? `⚠ ${liveMiss} file(s) got no live content-type (left "")` : "all declared content-types recovered live");
console.log(`next: node scripts/verify-mirror.mjs --mirror ${path.relative(process.cwd(), ROOT)} --allow-missing ${path.relative(process.cwd(), ROOT)}/external.txt`);
