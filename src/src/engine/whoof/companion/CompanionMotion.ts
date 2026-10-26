/** Damped, bounded secondary motion. Angles are in radians. The rig adapter
 * applies these after its authored idle clip so gaze never replaces breathing.
 */
export type CompanionPose = {
  headYaw: number;
  headPitch: number;
  neckYaw: number;
  earTilt: number;
  breath: number;
};
const limit = (value: number, extent = 1) => Math.max(-extent, Math.min(extent, value));
const DEG = Math.PI / 180;

export class CompanionMotion {
  private headX = 0;
  private headY = 0;
  private gazeX = 0;
  private gazeY = 0;
  private elapsed = 0;
  private pointerInside = false;
  private targetX = 0;
  private targetY = 0;

  pointer(x: number, y: number) {
    this.targetX = Number.isFinite(x) ? limit(x) : 0;
    this.targetY = Number.isFinite(y) ? limit(y) : 0;
    this.pointerInside = true;
  }

  leave() { this.pointerInside = false; }

  update(dt: number, reduced: boolean, coarse: boolean): CompanionPose {
    const step = Math.min(.05, Math.max(0, Number.isFinite(dt) ? dt : 0));
    if (reduced) {
      this.headX = this.headY = this.gazeX = this.gazeY = 0;
      return { headYaw: 0, headPitch: 0, neckYaw: 0, earTilt: 0, breath: 0 };
    }
    this.elapsed += step;
    const following = this.pointerInside && !coarse;
    const x = following ? this.targetX : 0;
    const y = following ? this.targetY : 0;
    // Fast attention, slower head response. Body and camera do not follow.
    this.gazeX += (x - this.gazeX) * (1 - Math.exp(-10 * step));
    this.gazeY += (y - this.gazeY) * (1 - Math.exp(-10 * step));
    this.headX += (this.gazeX - this.headX) * (1 - Math.exp(-4.6 * step));
    this.headY += (this.gazeY - this.headY) * (1 - Math.exp(-4.1 * step));
    return {
      headYaw: this.headX * 10 * DEG,
      headPitch: this.headY * 5 * DEG,
      neckYaw: this.headX * 2 * DEG,
      earTilt: (this.gazeX - this.headX) * 1.8 * DEG,
      breath: Math.sin(this.elapsed * Math.PI * 2 / 4.8) * .003,
    };
  }
}
