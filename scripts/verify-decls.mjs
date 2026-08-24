#!/usr/bin/env node
/**
 * verify-decls.mjs — the oryzo-shaped symbol gate (readable-source.md §3.0.5:
 * the gate's shape follows the artifact's shape).
 *
 * This project's src/ is a hand TS-translation of the bundle (REBUILD_PLAN §6
 * D-R3), so verify-symbols.mjs's flat bijection reports noise here. This gate
 * instead requires every top-level declaration of port/_gen/engine.gen.js to be
 * CLASSIFIED into exactly one bucket of docs/rename-map.json:
 *
 *   declarations   port name -> one src/engine declaration (injective)
 *   collapsed      N port names -> 1 src declaration (registered rewrite)
 *   internalized   no top-level src counterpart; consumers map to one src file
 *   plumbing       bundler/vendor-adoption artifacts with no counterpart
 *                  by construction
 *   omitted        registered deviations (D-O*)
 *   rewrite range  a registered region src reimplements semantically (D-R*)
 *
 * Reverse closure: every top-level declaration in src/engine/**\/*.ts must be a
 * mapping target, live in a registered rewrite's srcFiles, or be registered in
 * allow_orphans. Scope is src/engine only: the .astro components are the DOM
 * shell layer whose provenance ledger is scripts/gen_components.py against
 * mirror/index.html, not the bundle.
 *
 * ⛔ Identity and presence only — behaviour is the runtime gates' half.
 * ⛔ Reads ONLY docs/rename-map.json and the two sides' text. Never imports
 *    tools/ (verification-gates.md §2.1.2); the port side is parsed by a
 *    PINNED acorn spawned as a subprocess (module-map.mjs precedent).
 * ⚠ Wrong-but-plausible mappings are invisible here: spot-check tier 2-3
 *    entries by hand (readable-source.md §3.2.1/§4.4).
 *
 *   node scripts/verify-decls.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanSrcDecls } from "./lib/decl-scan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GEN = path.join(ROOT, "port/_gen/engine.gen.js");
const SRC_ROOT = path.join(ROOT, "src/src/engine");
const MAP_PATH = path.join(ROOT, "docs/rename-map.json");

let failures = 0;
const fail = (gate, msg) => { failures++; console.log(`  FAIL ${gate} — ${msg}`); };
const ok = (gate, msg) => console.log(`  ok   ${gate} — ${msg}`);
const list = (rows, render, cap = 25) => {
  for (const r of rows.slice(0, cap)) console.log(render(r));
  if (rows.length > cap) console.log(`         … ${rows.length - cap} more`);
};

// ---- the map (shape-checked: a wrong-schema map must die, not read as empty) --
let map;
try { map = JSON.parse(readFileSync(MAP_PATH, "utf8")); } catch (e) {
  console.error(`FATAL: cannot read ${MAP_PATH}: ${e.message}`); process.exit(5);
}
if (map.schema !== "oryzo-decls-v1") {
  console.error(`FATAL: ${MAP_PATH} schema is "${map.schema}", expected "oryzo-decls-v1".`);
  console.error(`       A map in an unexpected shape would read as zero classifications and`);
  console.error(`       this gate would pass while knowing nothing.`);
  process.exit(5);
}
for (const k of ["declarations", "rewrites", "plumbing", "omitted", "collapsed", "internalized", "allow_orphans"]) {
  if (!(k in map)) { console.error(`FATAL: ${MAP_PATH} is missing bucket "${k}".`); process.exit(5); }
}
const decls = Object.assign(Object.create(null), map.declarations);
const plumbing = Object.assign(Object.create(null), map.plumbing);
const omitted = Object.assign(Object.create(null), map.omitted);
const collapsed = Object.assign(Object.create(null), map.collapsed);
const internalized = Object.assign(Object.create(null), map.internalized);
const allowOrphans = Object.assign(Object.create(null), map.allow_orphans);

// ---- port side: pinned acorn, spawned --------------------------------------
const acorn = spawnSync("npx", ["--yes", "acorn@8.14.0", "--ecma2023", "--module", GEN], { maxBuffer: 1 << 30 });
if (acorn.status !== 0) { console.error(`FATAL: acorn failed on ${GEN}:\n${acorn.stderr.toString().slice(0, 1200)}`); process.exit(5); }
const ast = JSON.parse(acorn.stdout.toString());
const genText = readFileSync(GEN, "utf8");
const lineAt = (() => { const idx = [0]; for (let i = 0; i < genText.length; i++) if (genText[i] === "\n") idx.push(i + 1);
  return (off) => { let lo = 0, hi = idx.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (idx[m] <= off) lo = m; else hi = m - 1; } return lo + 1; }; })();
// _gen line -> _pretty line via the slice markers extract-source wrote.
const MARK = /^\/\/ ===== .*L(\d+)-L(\d+) =====$/;
const genLines = genText.split("\n");
const marks = [];
genLines.forEach((l, i) => { const m = MARK.exec(l); if (m) marks.push({ genLine: i + 1, srcFrom: +m[1] }); });
const srcLineOf = (genLine) => {
  let best = null;
  for (const m of marks) { if (m.genLine < genLine) best = m; else break; }
  if (!best) return null;
  let bodyStart = best.genLine + 1;
  while (bodyStart <= genLines.length && genLines[bodyStart - 1].startsWith("//")) bodyStart++;
  return best.srcFrom + (genLine - bodyStart);
};
const idsOf = (pat, out) => {
  if (!pat) return;
  if (pat.type === "Identifier") out.push(pat.name);
  else if (pat.type === "ObjectPattern") pat.properties.forEach((p) => idsOf(p.value ?? p.argument, out));
  else if (pat.type === "ArrayPattern") pat.elements.forEach((e) => idsOf(e, out));
  else if (pat.type === "AssignmentPattern") idsOf(pat.left, out);
  else if (pat.type === "RestElement") idsOf(pat.argument, out);
};
const portDecls = [];
for (const n of ast.body) {
  if (n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") {
    const gl = lineAt(n.start);
    portDecls.push({ name: n.id.name, genLine: gl, srcLine: srcLineOf(gl) });
  } else if (n.type === "VariableDeclaration") {
    for (const d of n.declarations) { const names = []; idsOf(d.id, names);
      const gl = lineAt(d.start);
      for (const nm of names) portDecls.push({ name: nm, genLine: gl, srcLine: srcLineOf(gl) }); }
  }
}
if (portDecls.length === 0) {
  console.error("FATAL: 0 declarations found in port/_gen — a gate that finds nothing agrees with everything.");
  process.exit(5);
}

// ---- src side (shared scanner — scripts/lib/decl-scan.mjs) ------------------
const scanned = scanSrcDecls(SRC_ROOT, ROOT);
const srcDecls = new Map(); // "file#name" -> line
const srcFilesRel = new Set();
for (const s of scanned) { srcFilesRel.add(s.file); srcDecls.set(s.file + "#" + s.name, s.line); }
const files = [...srcFilesRel];

console.log(`=== verify-decls ===`);
console.log(`  port  ${path.relative(ROOT, GEN)}  ${portDecls.length} top-level declarations`);
console.log(`  src   src/engine  ${srcDecls.size} top-level declarations in ${files.length} files`);
console.log(`  map   ${Object.keys(decls).length} declarations, ${map.rewrites.length} rewrites, ` +
  `${Object.keys(plumbing).length} plumbing, ${Object.keys(omitted).length} omitted, ` +
  `${Object.keys(collapsed).length} collapsed, ${Object.keys(internalized).length} internalized, ` +
  `${Object.keys(allowOrphans).length} allowed orphans\n`);

// ---- map hygiene ------------------------------------------------------------
const badRewrites = map.rewrites.filter((r) => !Array.isArray(r.range) || r.range.length !== 2 || !r.deviation || !r.note);
if (badRewrites.length) fail("hygiene", `${badRewrites.length} rewrite(s) missing range/deviation/note`);
else ok("hygiene", `${map.rewrites.length}/${map.rewrites.length} rewrites carry range + deviation id + note`);
const badRewriteFiles = map.rewrites.flatMap((r) => (r.srcFiles ?? []).filter((f) => !srcFilesRel.has(f)));
if (badRewriteFiles.length) { fail("hygiene", `rewrite srcFiles not found on disk:`); list(badRewriteFiles, (f) => `         ${f}`); }

// ---- forward: every port declaration in exactly one bucket ------------------
const inRewrite = (srcLine) => map.rewrites.find((r) => srcLine >= r.range[0] && srcLine <= r.range[1]);
const unclassified = [];
const multi = [];
const missingTargets = [];
const targetOf = new Map(); // target -> [portName] (injectivity over declarations)
let nRewriteExcused = 0;
for (const p of portDecls) {
  const buckets = [];
  if (p.name in decls) buckets.push("declarations");
  if (p.name in plumbing) buckets.push("plumbing");
  if (p.name in omitted) buckets.push("omitted");
  if (p.name in collapsed) buckets.push("collapsed");
  if (p.name in internalized) buckets.push("internalized");
  if (buckets.length > 1) { multi.push({ ...p, buckets }); continue; }
  if (buckets.length === 0) {
    if (p.srcLine !== null && inRewrite(p.srcLine)) { nRewriteExcused++; continue; }
    unclassified.push(p); continue;
  }
  if (buckets[0] === "declarations") {
    const to = decls[p.name].to;
    if (!srcDecls.has(to)) missingTargets.push({ ...p, to });
    (targetOf.get(to) ?? targetOf.set(to, []).get(to)).push(p.name);
  } else if (buckets[0] === "collapsed") {
    const into = collapsed[p.name].into;
    if (!srcDecls.has(into)) missingTargets.push({ ...p, to: into });
  } else if (buckets[0] === "internalized") {
    const into = internalized[p.name].into;
    if (!srcFilesRel.has(into)) missingTargets.push({ ...p, to: into });
  }
}
const nMapped = portDecls.length - unclassified.length - multi.length;
if (unclassified.length) {
  fail("forward", `${unclassified.length}/${portDecls.length} port declaration(s) in NO bucket:`);
  list(unclassified, (u) => `         ${u.name}  engine.gen.js:${u.genLine} (_pretty L${u.srcLine})`);
} else ok("forward", `${portDecls.length}/${portDecls.length} port declarations classified (${nRewriteExcused} by rewrite range)`);
if (multi.length) {
  fail("forward", `${multi.length} port declaration(s) in MORE than one bucket:`);
  list(multi, (u) => `         ${u.name}: ${u.buckets.join(" + ")}`);
}
if (missingTargets.length) {
  fail("targets", `${missingTargets.length} mapping target(s) not found in src/engine:`);
  list(missingTargets, (u) => `         ${u.name} -> ${u.to}`);
} else ok("targets", `all declaration/collapsed/internalized targets exist in src/engine`);
const manyToOne = [...targetOf].filter(([, from]) => from.length > 1);
if (manyToOne.length) {
  fail("injective", `${manyToOne.length} src symbol(s) claimed by more than one port declaration (use "collapsed" if registered):`);
  list(manyToOne, ([to, from]) => `         ${to}  <-  ${from.join(", ")}`);
} else ok("injective", `declarations mapping is injective over ${targetOf.size} targets`);

// ---- reverse: every src declaration accounted for ---------------------------
const claimedTargets = new Set([
  ...Object.values(decls).map((d) => d.to),
  ...Object.values(collapsed).map((c) => c.into),
]);
const rewriteFiles = new Set(map.rewrites.flatMap((r) => r.srcFiles ?? []));
const orphans = [];
for (const [key, line] of srcDecls) {
  const [file, name] = key.split("#");
  if (claimedTargets.has(key)) continue;
  if (rewriteFiles.has(file)) continue;
  if (key in allowOrphans || name in allowOrphans) continue;
  orphans.push({ key, line });
}
if (orphans.length) {
  fail("reverse", `${orphans.length}/${srcDecls.size} src declaration(s) with no registered port origin:`);
  list(orphans, (o) => `         ${o.key}:${o.line}`, 40);
  console.log(`         invention, or a mapping/registration gap. Register in docs/rename-overrides.json`);
  console.log(`         (allow_orphans with a reason) or map it — then rebuild the map.`);
} else ok("reverse", `${srcDecls.size}/${srcDecls.size} src declarations have a registered origin or excuse`);

console.log(`\n  ⚠   identity only — no claim any mapping BEHAVES correctly (runtime gates' half)`);
console.log(`  ⚠   invented names pass every gate: spot-check tier 2-3 entries by hand`);
console.log(failures ? `\nFAIL — ${failures} assertion(s) failed.` : `\nPASS — forward + targets + injectivity + reverse closed over ${nMapped}+${nRewriteExcused} port / ${srcDecls.size} src declarations.`);
process.exit(failures ? 1 : 0);
