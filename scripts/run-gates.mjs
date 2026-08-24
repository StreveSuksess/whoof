#!/usr/bin/env node
/**
 * run-gates.mjs — the one-command static gate battery (GATES.md §0).
 *
 * Runs every gate that needs no server, in dependency order, and stops on the
 * first red. The runtime gates (CLEAN probe, verify-walk) need the two serve.mjs
 * sides up — their exact commands are GATES.md §5-6; this runner prints a
 * reminder instead of silently not running them (a gate that silently exits 0
 * and a gate that checked everything look identical from outside).
 *
 *   node scripts/run-gates.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const GATES = [
  ["mirror", ["scripts/verify-mirror.mjs", "--mirror", "mirror", "--allow-missing", "mirror/external.txt"]],
  ["port --check", ["scripts/extract-source.mjs", "--slices", "scripts/slices.config.mjs", "--check"]],
  ["coverage", ["scripts/verify-coverage.mjs"]],
  ["decls", ["scripts/verify-decls.mjs"]],
  ["zerodep", ["scripts/verify-zerodep.mjs"]],
  ["standalone (static)", ["scripts/verify-standalone.mjs"]],
];

let failed = null;
for (const [name, argv] of GATES) {
  process.stdout.write(`[gates] ${name} … `);
  const r = spawnSync("node", argv, { cwd: root, encoding: "utf8" });
  if (r.status === 0) console.log("PASS");
  else {
    console.log("FAIL\n");
    console.log(((r.stdout || "") + (r.stderr || "")).split("\n").slice(-30).join("\n"));
    failed = name;
    break;
  }
}
if (failed) {
  console.log(`\nFAIL — stopped at gate "${failed}".`);
  process.exit(1);
}
console.log(`\nPASS — ${GATES.length}/${GATES.length} static gates green.`);
console.log(`⚠ runtime gates NOT run here (they need the serve.mjs pair): GATES.md §5-6 —`);
console.log(`  probe --walk on both sides, verify-walk self-band + cross, standalone --full.`);
