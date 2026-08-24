# _pretty/ — beautified bundle coordinate system

Beautified with **js-beautify@1.15.1** (PINNED — a version bump shifts
line numbers and invalidates every recorded `file:line` provenance reference;
never regenerate with a different version).

Generated 2026-08-24T09:09:49.787Z by scripts/beautify-bundle.mjs.

| pretty file | source | source sha256 | regenerate |
|---|---|---|---|
| SplatsWorker-DSMxtdkh.js | mirror/_astro/SplatsWorker-DSMxtdkh.js | `a91fcfc466196b7e…` | `npx -y js-beautify@1.15.1 --type js -f mirror/_astro/SplatsWorker-DSMxtdkh.js -o mirror/_pretty/SplatsWorker-DSMxtdkh.js` |

Rules:
- Files in _pretty/ are READ-ONLY reference material; never edit them.
- If a source bundle changes upstream (sha256 mismatch), re-mirror first,
  regenerate, and re-audit every line-number citation that pointed into it.
