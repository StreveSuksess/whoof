#!/usr/bin/env node
/**
 * verify-walk.mjs — oryzo's checkpoint cruise (the project-shaped pixel walk).
 *
 * Why not scripts/pixel-walk.mjs directly: this site is a ~46k-px virtual
 * scroll whose ScrollPane EASES toward the native scroll position, gated
 * behind a preloader. Fraction-based checkpoints + a one-shot scrollTo made
 * two artefacts we measured on 2026-08-24 (docs/compare/standalone):
 *
 *   1. one-jump drive: the side whose preloader finished LATER received the
 *      full-height jump in fewer effective frames — its eased pane was still
 *      travelling at shot time, so one checkpoint per run photographed two
 *      different SECTIONS (meanAbsDiff 26-42 with a self-band of 0.35).
 *   2. fraction landings sit near state boundaries: the wearable gallery
 *      quantises pages from pane position, so a boundary landing flips a whole
 *      gallery item on a sub-pixel pane difference.
 *
 * This driver fixes both, per determinism.md (drive-to-state belongs to the
 * caller):
 *   - checkpoints are SECTION-ANCHORED (element.offsetTop + 40% of the
 *     section, mid-section, away from quantisation boundaries) — the July
 *     acceptance's "section-aligned scroll points", now committed;
 *   - three-phase drive: (a) wait for the page's own started signal
 *     (#preloader display:none — same signal on both sides), (b) ramp the
 *     native scroll to the anchor over several chunks (no full-height jump for
 *     the eased pane to overshoot), (c) hold the target and count STABLE
 *     chunks; the shot is only taken after the hold (--ready), so both panes
 *     have converged to the same value.
 *
 * Establish the self-band FIRST (--self), then read cross-side against it.
 *
 *   node scripts/verify-walk.mjs --a <rebuildUrl> --b <mirrorUrl>
 *     [--self] [--max-mean 4] [--out docs/compare/walk]
 *     [--sections hero,wearable,features,sustainability,testimonies,footer]
 *
 * URLs must carry ?__probe (serve.mjs injects the determinism shim).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf("--" + n);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d;
};
const A = flag("a", null);
const B = flag("b", null);
const SELF = args.includes("--self");
const OUT = flag("out", "docs/compare/walk");
const MAX_MEAN = SELF ? null : Number(flag("max-mean", 4));
// "id" or "id:offsetFraction". Default offset 0.4 (mid-section). wearable uses
// 0.12: at 0.4 the gallery shows an AUTOPLAYING VIDEO item, and media clocks
// are outside the determinism shim — measured self-band 17.97 there vs ≤0.05
// at every other checkpoint; at 0.12 the section shows the static tear photo.
const SECTIONS = flag("sections", "hero,wearable:0.12,features,sustainability,testimonies,footer")
  .split(",")
  .map((s) => { const [id, off] = s.split(":"); return { id, off: off ? Number(off) : 0.4 }; });
const PUMP = flag("pump", "16.7,2400");
const SETTLE = flag("settle", "20000");
if (!A || !B) {
  console.error("usage: verify-walk.mjs --a <rebuild ?__probe url> --b <mirror ?__probe url> [--self] [--max-mean N]");
  process.exit(2);
}

// Three-phase drive. Runs once per pump chunk on each side (identical text on
// both — the phases key off the PAGE's state, not the wall clock, which is
// exactly what makes the two sides comparable).
const driveFor = (id, off) => `
  (function () {
    var w = window.__oryzoWalk || (window.__oryzoWalk = { phase: "wait", ramp: 0, stable: 0, target: -1 });
    var pre = document.getElementById("preloader");
    if (w.phase === "wait") {
      if (!pre || getComputedStyle(pre).display === "none") w.phase = "ramp";
      else return;
    }
    var el = document.getElementById(${JSON.stringify(id)});
    var doc = document.scrollingElement || document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    // Mid-section anchor: offsetTop + a fraction of the section keeps the
    // landing off the neighbouring sections' show/hide and gallery-page
    // quantisation boundaries.
    var target = el ? Math.min(max, Math.round(el.offsetTop + el.offsetHeight * ${off})) : 0;
    w.target = target;
    if (w.phase === "ramp") {
      w.ramp++;
      window.scrollTo(0, Math.round(target * Math.min(1, w.ramp / 12)));
      if (w.ramp >= 12) w.phase = "hold";
    } else {
      window.scrollTo(0, target);
      if (Math.round(window.scrollY) === target) w.stable++; else w.stable = 0;
    }
    window.__walkScroll = { tag: "HTML", max: max, target: target, landed: Math.round(window.scrollY) };
  })();
`;
// Shot only after the hold: started + ramped + 8 stable chunks.
const READY = `window.__oryzoWalk && window.__oryzoWalk.phase === "hold" && window.__oryzoWalk.stable >= 8`;

const here = path.dirname(fileURLToPath(import.meta.url));
const run = (extra) =>
  new Promise((res) => {
    const p = spawn("node", [path.join(here, "pixelcompare.mjs"), ...extra], { stdio: ["ignore", "pipe", "pipe"] });
    let o = "";
    p.stdout.on("data", (d) => (o += d));
    p.stderr.on("data", (d) => (o += d));
    p.on("close", (code) => res({ code, out: o }));
  });

console.log(`=== verify-walk — ${SECTIONS.length} section checkpoint(s)${SELF ? " (SELF-BAND SAMPLE, not a verdict)" : ""} ===`);
console.log(`  A ${A}\n  B ${B}\n`);
console.log(`  ${"checkpoint".padEnd(16)} ${"colours".padStart(8)} ${"meanAbsDiff".padStart(12)} ${"worstCell".padStart(10)}  similarity`);

let fail = 0;
const rows = [];
for (const { id, off } of SECTIONS) {
  const a = ["--a", A, "--b", B, "--name", `sec-${id}`, "--pump", PUMP, "--settle", SETTLE,
    "--drive", driveFor(id, off), "--ready", READY, "--out", OUT, "--format", "jpeg", "--quality", "92"];
  if (SELF) a.push("--self");
  const { code, out } = await run(a);
  const m = out.match(/\{"meanAbsDiff":[^}]+\}/);
  const census = out.match(/REBUILD: (\d+) colours/);
  if (code !== 0 || !m) {
    fail++;
    const why = (out.match(/FATAL[^\n]*/) || ["no metric produced"])[0];
    console.log(`  ${("sec-" + id).padEnd(16)} ${"-".padStart(8)} ${"FAIL".padStart(12)}  ${why.slice(0, 80)}`);
    continue;
  }
  const metric = JSON.parse(m[0]);
  rows.push({ id, metric });
  const over = MAX_MEAN !== null && metric.meanAbsDiff > MAX_MEAN;
  if (over) fail++;
  console.log(
    `  ${("sec-" + id).padEnd(16)} ${String(census?.[1] ?? "?").padStart(8)} ${String(metric.meanAbsDiff).padStart(12)} ${String(metric.worstCellDiff).padStart(10)}  ${metric.similarityPct}%${over ? "  << over --max-mean " + MAX_MEAN : ""}`,
  );
}

if (SELF) {
  const worst = Math.max(...rows.map((r) => r.metric.meanAbsDiff));
  console.log(`\n  worst meanAbsDiff ${worst}  (this is the BAND; cross-side must be read against it)`);
  console.log(`\n⚠ SELF-BAND SAMPLE — not a pass.`);
  process.exit(0);
}
console.log(fail ? `\nFAIL — ${fail} checkpoint(s) failed or exceeded --max-mean.` : `\nPASS — ${rows.length}/${SECTIONS.length} section checkpoints within --max-mean ${MAX_MEAN}.`);
process.exit(fail ? 1 : 0);
