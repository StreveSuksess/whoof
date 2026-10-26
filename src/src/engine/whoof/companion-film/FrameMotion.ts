const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** One-dimensional pose, independent of clip length or rendering speed. */
export class FrameMotion {
  value = .5;
  target = .5;
  neutral = .5;

  setTarget(value: number) {
    if (Number.isFinite(value)) this.target = clamp(value, 0, 1);
  }
  reset(neutral = this.neutral) {
    this.neutral = clamp(neutral, 0, 1);
    this.value = this.target = this.neutral;
  }
  leave() { this.target = this.neutral; }
  update(delta: number, reduced = false) {
    if (reduced) return this.value = this.target = this.neutral;
    const dt = Number.isFinite(delta) ? clamp(delta, 0, .05) : 0;
    const step = (this.target - this.value) * (1 - Math.exp(-9 * dt));
    this.value = clamp(this.value + clamp(step, -1.35 * dt, 1.35 * dt), 0, 1);
    if (Math.abs(this.value - this.target) < .00005) this.value = this.target;
    return this.value;
  }
}
