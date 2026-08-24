#!/usr/bin/env node
/**
 * verify-coverage.mjs — the flat-bundle coverage account (this project's
 * cold-head audit shape): does every line of the beautified bundle belong to
 * EXACTLY ONE of {engine slice, registered vendor range}?
 *
 * The slice table and the vendor table live in scripts/slices.config.mjs (one
 * source of truth — extract-source.mjs reads the same file). This gate asserts:
 *
 *   1. seam-to-seam — slices ∪ vendors cover line 1..N with no gap, no overlap
 *      (a gap is where a surviving comment silently disappears —
 *      readable-source.md §3.1.3)
 *   2. sha256 — the coverage claim is about the file that is actually on disk
 *   3. byte-reuse — the SplatsWorker bundle + splat-sorter wasm the rebuild
 *      ships are byte-identical to the mirror's (the worker is REUSED, not
 *      translated — REBUILD_PLAN §6 D-R15)
 *
 *   node scripts/verify-coverage.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CFG = path.join(ROOT, "scripts/slices.config.mjs");
const cfg = (await import(pathToFileURL(CFG).href)).default;

let failures = 0;
const fail = (g, m) => { failures++; console.log(`  FAIL ${g} — ${m}`); };
const ok = (g, m) => console.log(`  ok   ${g} — ${m}`);

const srcPath = path.resolve(path.dirname(CFG), cfg.root ?? ".", cfg.source);
const bytes = readFileSync(srcPath);
const totalLines = bytes.toString("utf8").split("\n").length;
const sha = createHash("sha256").update(bytes).digest("hex");
console.log(`=== verify-coverage  ${path.relative(ROOT, srcPath)} (${totalLines} lines) ===`);

if (sha !== cfg.sha256) fail("sha256", `source is ${sha.slice(0, 16)}…, config pins ${String(cfg.sha256).slice(0, 16)}… — the coverage claim is about a different file`);
else ok("sha256", "source file matches the pinned sha256");

const spans = [
  ...cfg.slices.map((s) => ({ from: s.from, to: s.to, kind: "slice", label: s.note })),
  ...(cfg.vendors ?? []).map((v) => ({ from: v.from, to: v.to, kind: "vendor", label: `${v.id} -> ${v.npm}` })),
].sort((a, b) => a.from - b.from);

const gaps = [];
const overlaps = [];
let cursor = 1;
for (const s of spans) {
  if (s.from > cursor) gaps.push({ from: cursor, to: s.from - 1 });
  else if (s.from < cursor) overlaps.push({ at: s.from, span: s });
  cursor = Math.max(cursor, s.to + 1);
}
if (cursor <= totalLines) gaps.push({ from: cursor, to: totalLines });

const nSlice = cfg.slices.length;
const nVendor = (cfg.vendors ?? []).length;
if (gaps.length) {
  fail("seam", `${gaps.length} gap(s) — lines belonging to NOTHING (comments die there silently):`);
  for (const g of gaps.slice(0, 10)) console.log(`         L${g.from}-L${g.to}`);
} else ok("seam", `no gaps: ${nSlice} slices + ${nVendor} vendor ranges tile 1..${totalLines}`);
if (overlaps.length) {
  fail("seam", `${overlaps.length} overlap(s):`);
  for (const o of overlaps.slice(0, 10)) console.log(`         at L${o.at}: ${o.span.kind} "${String(o.span.label).slice(0, 60)}"`);
} else ok("seam", "no overlaps between slices and vendor ranges");

// --- byte-reuse: the worker + wasm are shipped verbatim from the mirror ------
const REUSED = [
  ["mirror/_astro/SplatsWorker-DSMxtdkh.js", "_astro/SplatsWorker-DSMxtdkh.js"],
  ["mirror/_astro/splat_sorter_bg-BfJrILzx.wasm", "_astro/splat_sorter_bg-BfJrILzx.wasm"],
];
// The runtime copy lives in the Astro publicDir; support both layouts (repo
// root pre-restructure, src/public/ after).
const pubRoots = ["src/public", "public"].map((p) => path.join(ROOT, p)).filter((p) => existsSync(p));
if (!pubRoots.length) fail("byte-reuse", "no public/ dir found (looked for src/public and public)");
for (const [m, p] of REUSED) {
  const mAbs = path.join(ROOT, m);
  const pAbs = pubRoots.length ? path.join(pubRoots[0], p) : null;
  if (!pAbs || !existsSync(pAbs)) { fail("byte-reuse", `${p} missing from ${pubRoots[0] ?? "public dir"}`); continue; }
  const a = createHash("sha256").update(readFileSync(mAbs)).digest("hex");
  const b = createHash("sha256").update(readFileSync(pAbs)).digest("hex");
  if (a !== b) fail("byte-reuse", `${p} differs from the mirror copy — the reused worker must stay byte-identical (D-R15)`);
  else ok("byte-reuse", `${p} byte-identical to mirror (${a.slice(0, 12)}…)`);
}

console.log(failures ? `\nFAIL — ${failures} assertion(s) failed.` : `\nPASS — every line accounted for; reused runtime bytes identical to the mirror.`);
process.exit(failures ? 1 : 0);
