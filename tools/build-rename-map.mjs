#!/usr/bin/env node
/**
 * build-rename-map.mjs — derive docs/rename-map.json for the oryzo retrofit.
 *
 * The July rebuild hand-translated the bundle into TS modules (REBUILD_PLAN §6
 * D-R3), so the port↔src correspondence is a CLASSIFICATION, not a bijection
 * (readable-source.md §3.0.5). This tool derives the mechanical entries and
 * merges the hand-authored decisions from docs/rename-overrides.json:
 *
 *   identity      port name declared verbatim in exactly one src/engine file
 *   suffix        Rollup collision suffix stripped ($f/$1…), colocated with the
 *                 slice's dominant class's src file
 *   glsl          byte-identical GLSL string content (port const ↔ glsl/index.ts)
 *   overrides     declarations / rewrites / plumbing / omitted / allow_orphans
 *
 * Output: docs/rename-map.json (schema oryzo-decls-v1, consumed by
 * scripts/verify-decls.mjs — the gate NEVER imports this tool) and a residue
 * report on stdout. Evidence tier + reason recorded per entry; entries this
 * tool cannot derive stay unresolved and FAIL the gate until a human either
 * maps or registers them — that is the point.
 *
 *   node tools/build-rename-map.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanSrcDecls } from "../scripts/lib/decl-scan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GEN = path.join(ROOT, "port/_gen/engine.gen.js");
const SRC_ROOT = path.join(ROOT, "src/src/engine");
const GLSL = path.join(SRC_ROOT, "glsl/index.ts");
const OVERRIDES = path.join(ROOT, "docs/rename-overrides.json");
const OUT = path.join(ROOT, "docs/rename-map.json");

// ---- port side: acorn (pinned, spawned — never imported) --------------------
const acorn = spawnSync("npx", ["--yes", "acorn@8.14.0", "--ecma2023", "--module", GEN], { maxBuffer: 1 << 30 });
if (acorn.status !== 0) { console.error(acorn.stderr.toString().slice(0, 1500)); process.exit(1); }
const ast = JSON.parse(acorn.stdout.toString());
const genText = readFileSync(GEN, "utf8");
const genLines = genText.split("\n");
const lineAt = (() => { const idx = [0]; for (let i = 0; i < genText.length; i++) if (genText[i] === "\n") idx.push(i + 1);
  return (off) => { let lo = 0, hi = idx.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (idx[m] <= off) lo = m; else hi = m - 1; } return lo + 1; }; })();

// _gen line -> source (_pretty) line, via the slice markers extract-source wrote.
const MARK = /^\/\/ ===== .*L(\d+)-L(\d+) =====$/;
const marks = []; // {genLine, srcFrom}
genLines.forEach((l, i) => { const m = MARK.exec(l); if (m) marks.push({ genLine: i + 1, srcFrom: +m[1], srcTo: +m[2] }); });
const srcLineOf = (genLine) => {
  let best = null;
  for (const m of marks) { if (m.genLine < genLine) best = m; else break; }
  if (!best) return null;
  // slice body starts after the marker line + its note comment line(s): find the
  // first non-comment line after the marker and anchor the offset there.
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
const strOf = (node) => {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis.map((q) => q.value.cooked).join("");
  return null;
};
const portDecls = []; // {name, kind, genLine, srcLine, str}
for (const n of ast.body) {
  if (n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") {
    const gl = lineAt(n.start);
    portDecls.push({ name: n.id.name, kind: n.type === "ClassDeclaration" ? "class" : "function", genLine: gl, srcLine: srcLineOf(gl) });
  } else if (n.type === "VariableDeclaration") {
    for (const d of n.declarations) {
      const names = []; idsOf(d.id, names);
      const gl = lineAt(d.start);
      for (const nm of names) portDecls.push({ name: nm, kind: n.kind, genLine: gl, srcLine: srcLineOf(gl), str: names.length === 1 ? strOf(d.init) : null });
    }
  }
}

// ---- src side (shared scanner — scripts/lib/decl-scan.mjs) ------------------
const srcDecls = scanSrcDecls(SRC_ROOT, ROOT); // {file, name, line}
const srcByName = new Map();
for (const s of srcDecls) { (srcByName.get(s.name) ?? srcByName.set(s.name, []).get(s.name)).push(s); }
const classFile = new Map(); // class/singleton name -> file (for slice-context)
for (const s of srcDecls) if (!classFile.has(s.name)) classFile.set(s.name, s.file);

// ---- GLSL content index -----------------------------------------------------
const glslText = readFileSync(GLSL, "utf8");
const glslIndex = new Map(); // content -> [name]
for (const m of glslText.matchAll(/^export const (\w+) = `([\s\S]*?)`;$/gm)) {
  const content = m[2];
  (glslIndex.get(content) ?? glslIndex.set(content, []).get(content)).push(m[1]);
}
const GLSL_REL = path.relative(ROOT, GLSL).replace(/\\/g, "/");

// ---- slice context: dominant class per _gen region --------------------------
// The note line under each marker lists the first declared names of the slice;
// the first class-cased one that exists in src names the context file.
const contextAt = (genLine) => {
  let best = null;
  for (const m of marks) { if (m.genLine < genLine) best = m; else break; }
  if (!best) return null;
  const note = genLines[best.genLine]; // line after marker (0-indexed +1)
  if (!note?.startsWith("//")) return null;
  for (const w of note.slice(2).trim().split(/[\s,…]+/)) {
    if (classFile.has(w)) return classFile.get(w);
    const inst = w.charAt(0).toLowerCase() + w.slice(1);
    if (classFile.has(inst)) return classFile.get(inst);
  }
  return null;
};

// ---- overrides --------------------------------------------------------------
let ov = { declarations: {}, rewrites: [], plumbing: {}, omitted: {}, collapsed: {}, allow_orphans: {} };
try { ov = { ...ov, ...JSON.parse(readFileSync(OVERRIDES, "utf8")) }; } catch {}
// Overrides must name real port declarations — a typo'd id must die loudly
// (readable-source.md §3.0.1.3: a silently void override looks identical to a
// working one in the diff).
const portNames = new Set(portDecls.map((p) => p.name));
for (const k of [...Object.keys(ov.declarations), ...Object.keys(ov.plumbing), ...Object.keys(ov.omitted), ...Object.keys(ov.collapsed), ...Object.keys(ov.internalized ?? {})]) {
  if (!portNames.has(k)) { console.error(`FATAL: override names unknown port declaration "${k}"`); process.exit(1); }
}

// ---- classification ---------------------------------------------------------
const map = { schema: "oryzo-decls-v1", generatedBy: "tools/build-rename-map.mjs", declarations: {}, rewrites: ov.rewrites, plumbing: ov.plumbing, omitted: ov.omitted, collapsed: ov.collapsed, internalized: ov.internalized ?? {}, allow_orphans: ov.allow_orphans };
const unresolved = [];
const claimed = new Map(); // "file#name" -> portName (injectivity)
const inRewrite = (p) => map.rewrites.find((r) => p.srcLine >= r.range[0] && p.srcLine <= r.range[1]);
// A failed precise match inside a registered rewrite range falls back to the
// range's excuse (the bundle carries DUPLICATE copies of some vendored libs —
// three MinSignal declarations map onto one src class; only one can win the
// precise claim and the rest are the rewrite's business anyway).
const failOrExcuse = (p, why) => {
  const r = inRewrite(p);
  if (!r) unresolved.push({ ...p, why });
};
const claim = (p, target, tier, why) => {
  const key = target.file + "#" + target.name;
  if (claimed.has(key)) { failOrExcuse(p, `collision: ${key} already claimed by ${claimed.get(key)}`); return; }
  claimed.set(key, p.name);
  map.declarations[p.name] = { to: key, tier, why, port: `engine.gen.js:${p.genLine} (_pretty L${p.srcLine})` };
};

// Pass 1: classes claim first (identity is near-total for them), giving pass 2
// a neighbour-class file context for the module-scope var clusters. In this
// bundle a module's vars sit BETWEEN the previous class's singleton and their
// own class, so "nearest claimed class before/after" brackets the right file.
const classDecls = portDecls.filter((p) => p.kind === "class");
const classAnchors = []; // {genLine, file} in order, filled as classes claim
const resolveInto = (p, tier, why, target) => { claim(p, target, tier, why); };
for (const p of classDecls) {
  if (ov.declarations[p.name]) { const o = ov.declarations[p.name]; const [file, name] = o.to.split("#");
    claim(p, { file, name }, 0, o.why || "manual override");
    if (map.declarations[p.name]) classAnchors.push({ genLine: p.genLine, file }); continue; }
  if (map.plumbing[p.name] || map.omitted[p.name] || map.collapsed[p.name] || map.internalized[p.name]) continue;
  const exact = srcByName.get(p.name) ?? [];
  if (exact.length === 1) { claim(p, exact[0], 1, "identity: declared verbatim in exactly one src/engine file");
    if (map.declarations[p.name]) classAnchors.push({ genLine: p.genLine, file: exact[0].file }); continue; }
  if (exact.length > 1) { failOrExcuse(p, `class name in ${exact.length} src files`); continue; }
  failOrExcuse(p, "class with no identity match, not in any registered rewrite range");
}
classAnchors.sort((a, b) => a.genLine - b.genLine);
const neighbourFiles = (genLine) => {
  let before = null, after = null;
  for (const a of classAnchors) { if (a.genLine <= genLine) before = a; else { after = a; break; } }
  return [...new Set([before?.file, after?.file].filter(Boolean))];
};

// Usage attribution: which claimed classes reference a name? The strongest
// mechanical evidence for a module-scope scratch var — the bundle welds
// neighbouring modules' vars into one comma chain, so adjacency alone cannot
// say whose var it is, but the method bodies that read it can.
const classRanges = []; // {start, end, name}
for (const n of ast.body) if (n.type === "ClassDeclaration") classRanges.push({ start: n.start, end: n.end, name: n.id.name });
const usageFiles = (name) => {
  const re = new RegExp(`(?<![\\w$])${name.replace(/\$/g, "\\$")}(?![\\w$])`, "g");
  const users = new Set();
  let m;
  while ((m = re.exec(genText))) {
    const cls = classRanges.find((c) => m.index >= c.start && m.index < c.end);
    if (!cls) continue;
    const t = map.declarations[cls.name]?.to;
    if (t) users.add(t.split("#")[0]);
  }
  return [...users];
};

// Pass 2: everything else.
for (const p of portDecls) {
  if (p.kind === "class") continue;
  if (ov.declarations[p.name]) { const o = ov.declarations[p.name]; const [file, name] = o.to.split("#");
    claim(p, { file, name }, 0, o.why || "manual override"); continue; }
  if (map.plumbing[p.name] || map.omitted[p.name] || map.collapsed[p.name] || map.internalized[p.name]) continue;
  const exact = srcByName.get(p.name) ?? [];
  if (exact.length === 1) { claim(p, exact[0], 1, "identity: declared verbatim in exactly one src/engine file"); continue; }
  if (exact.length > 1) {
    const nf = neighbourFiles(p.genLine);
    let hits = exact.filter((s) => nf.includes(s.file));
    if (hits.length > 1) {
      const uf = usageFiles(p.name);
      if (uf.length === 1) hits = hits.filter((s) => s.file === uf[0]);
    }
    if (hits.length === 1) { claim(p, hits[0], 2, `identity, disambiguated by neighbour/usage evidence (${hits[0].file})`); continue; }
    failOrExcuse(p, `name in ${exact.length} src files, neighbours=[${nf.join(", ")}]`); continue;
  }
  if (p.str && p.str.length > 20) {
    const g = glslIndex.get(p.str) ?? [];
    if (g.length === 1) { claim(p, { file: GLSL_REL, name: g[0] }, 1, "byte-identical GLSL content in glsl/index.ts"); continue; }
    if (g.length > 1) { failOrExcuse(p, `GLSL content matches ${g.length} exports: ${g.join(",")}`); continue; }
  }
  const base = p.name.replace(/\$[0-9a-z]+$/i, "");
  if (base !== p.name) {
    const cands = srcByName.get(base) ?? [];
    if (cands.length === 1) { claim(p, cands[0], 2, "collision suffix stripped; unique in src/engine"); continue; }
    if (cands.length > 1) {
      const nf = neighbourFiles(p.genLine);
      let hits = cands.filter((s) => nf.includes(s.file));
      if (hits.length > 1) {
        const uf = usageFiles(p.name);
        if (uf.length === 1) hits = hits.filter((s) => s.file === uf[0]);
      }
      if (hits.length === 1) { claim(p, hits[0], 2, `collision suffix stripped, disambiguated by neighbour/usage evidence (${hits[0].file})`); continue; }
      failOrExcuse(p, `base "${base}" in ${cands.length} src files, neighbours=[${nf.join(", ")}]`); continue;
    }
  }
  // No src counterpart anywhere. If its only consumers map to one src file,
  // register it as INTERNALIZED there: "no top-level counterpart in src; its
  // only consumers live in <file>" is a statement of fact, not of mechanism.
  // Tier 3 — these are the entries the human spot-check must sample.
  {
    const uf = usageFiles(p.name);
    if (uf.length === 1 && !inRewrite(p)) {
      map.internalized[p.name] = { into: uf[0], tier: 3, why: `no top-level counterpart in src; every consumer of this module-scope binding maps to ${uf[0]}`, port: `engine.gen.js:${p.genLine} (_pretty L${p.srcLine})` };
      continue;
    }
  }
  failOrExcuse(p, "no identity/suffix/GLSL match, not in any registered rewrite range");
}

writeFileSync(OUT, JSON.stringify(map, null, 1));
const n = Object.keys(map.declarations).length;
console.log(`declarations ${n} (tier0 ${Object.values(map.declarations).filter((d) => d.tier === 0).length}, tier1 ${Object.values(map.declarations).filter((d) => d.tier === 1).length}, tier2 ${Object.values(map.declarations).filter((d) => d.tier === 2).length})`);
console.log(`rewrites ${map.rewrites.length} region(s), plumbing ${Object.keys(map.plumbing).length}, omitted ${Object.keys(map.omitted).length}, allow_orphans ${Object.keys(map.allow_orphans).length}`);
console.log(`unresolved ${unresolved.length}`);
for (const u of unresolved.slice(0, 60)) console.log(`  _pretty L${u.srcLine}  ${u.kind} ${u.name}  — ${u.why}`);
if (unresolved.length > 60) console.log(`  … ${unresolved.length - 60} more`);
