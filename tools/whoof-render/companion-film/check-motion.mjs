import assert from 'node:assert/strict';
import { build } from '../../../src/node_modules/esbuild/lib/main.js';

const { outputFiles } = await build({
  entryPoints: [new URL('../../../src/src/engine/whoof/companion-film/FrameMotion.ts', import.meta.url).pathname],
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { FrameMotion } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);

const run = fps => {
  const m = new FrameMotion(); m.setTarget(1);
  for (let i = 0; i < fps; i++) m.update(1 / fps);
  const right = m.value;
  m.setTarget(0);
  for (let i = 0; i < fps; i++) m.update(1 / fps);
  return [right, m.value];
};
const slow = run(30), fast = run(120);
assert.ok(Math.abs(slow[0] - fast[0]) < .005 && Math.abs(slow[1] - fast[1]) < .015, 'Stable at different refresh rates');
const m = new FrameMotion();
for (let i = 0; i < 1000; i++) {
  m.setTarget(i % 3 ? 10 : -10);
  const before = m.value;
  m.update(1 / 60);
  assert.ok(m.value >= 0 && m.value <= 1);
  assert.ok(Math.abs(m.value - before) <= 1.35 / 60 + 1e-8, 'Rapid reversals respect velocity limit');
}
m.reset(.43); m.setTarget(1); m.update(1 / 60, true); assert.equal(m.value, .43);
m.setTarget(1); m.update(100); assert.ok(m.value <= .43 + 1.35 * .05 + 1e-8, 'Background pause cannot jump');
m.setTarget(NaN); assert.equal(m.target, 1);
m.leave(); for (let i = 0; i < 240; i++) m.update(1 / 60); assert.equal(m.value, .43);
console.log('Frame motion: bounds, refresh rates, rapid reversals, neutral return, reduced motion and long pause passed.');
