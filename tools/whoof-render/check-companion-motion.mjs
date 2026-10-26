import assert from 'node:assert/strict';
import { build } from '../../src/node_modules/esbuild/lib/main.js';
const { outputFiles } = await build({
  entryPoints: [new URL('../../src/src/engine/whoof/companion/CompanionMotion.ts', import.meta.url).pathname],
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { CompanionMotion } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const motion = new CompanionMotion();
motion.pointer(500, -500);
let pose, previous = 0;
for (let i = 0; i < 600; i++) {
  pose = motion.update(1 / 60, false, false);
  assert.ok(Object.values(pose).every(Number.isFinite), 'pose is finite');
  assert.ok(pose.headYaw >= previous - 1e-10, 'no head overshoot');
  assert.ok(Math.abs(pose.headYaw + pose.neckYaw) <= 12 * Math.PI / 180 + 1e-10, 'yaw remains anatomical');
  assert.ok(Math.abs(pose.headPitch) <= 5 * Math.PI / 180 + 1e-10, 'pitch remains anatomical');
  previous = pose.headYaw;
}
assert.ok(pose.headYaw > .17, 'full attention is reachable');
motion.leave();
for (let i = 0; i < 180; i++) pose = motion.update(1 / 60, false, false);
assert.ok(Math.abs(pose.headYaw) < .0001, 'head returns to rest after leaving');
motion.pointer(-1, 1);
for (let i = 0; i < 180; i++) pose = motion.update(1 / 60, false, true);
assert.ok(Math.abs(pose.headYaw) < .0001, 'coarse pointer ignores mouse target');
pose = motion.update(1 / 60, true, false);
assert.ok(Object.values(pose).every(value => value === 0), 'reduced motion is static');
motion.pointer(NaN, Infinity);
pose = motion.update(NaN, false, false);
assert.ok(Object.values(pose).every(Number.isFinite), 'invalid input cannot corrupt the rig');
const run = fps => {
  const item = new CompanionMotion(); item.pointer(1, .5);
  let state;
  for (let i = 0; i < fps * 2; i++) state = item.update(1 / fps, false, false);
  return state;
};
assert.ok(Math.abs(run(30).headYaw - run(120).headYaw) < .001, 'settling stable across frame rates');
console.log('Companion motion: bounds, damping, return, touch, reduced motion and finite input passed.');
