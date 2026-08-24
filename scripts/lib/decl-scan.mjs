// decl-scan.mjs — THE src/engine top-level declaration scanner, shared by
// scripts/verify-decls.mjs (the gate) and tools/build-rename-map.mjs (the
// builder). One implementation on purpose: two scanners drift, and the gate
// then audits a different set of declarations than the map was built from
// (verification-gates.md §2.1.1). Living in scripts/lib keeps the gate free of
// tools/ imports; tools importing scripts/lib is the allowed direction.
//
// Text-level by design (the gate must not run a TS compiler), with ONE piece of
// state: template-literal tracking. Without it, GLSL source inside backticks
// leaks fake declarations — `const int SAMPLES` on a line of shader code read
// as a src declaration named "int" on the scanner's first real run.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const DECL = /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(class|function|const|let|var)\s+([A-Za-z_$][\w$]*)/;

/** Count backticks that are real template delimiters on this line (ignores \` escapes). */
const tickCount = (line) => {
  let n = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "`" && line[i - 1] !== "\\") n++;
  }
  return n;
};

/**
 * Scan every .ts file under rootDir for top-level declarations.
 * Returns [{file, name, line}] with file relative to relBase (or rootDir).
 */
export function scanSrcDecls(rootDir, relBase = rootDir) {
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d)) {
      const p = path.join(d, e);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else if (/\.ts$/.test(e)) files.push(p);
    }
  };
  walk(rootDir);
  const out = [];
  for (const f of files) {
    const rel = path.relative(relBase, f).replace(/\\/g, "/");
    let inTemplate = false;
    readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (!inTemplate) {
        const m = DECL.exec(l);
        if (m) out.push({ file: rel, name: m[2], line: i + 1 });
      }
      if (tickCount(l) % 2 === 1) inTemplate = !inTemplate;
    });
  }
  return out;
}
