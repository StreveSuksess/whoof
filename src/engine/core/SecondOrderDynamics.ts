// 1:1 port of the source SecondOrderDynamics (pretty line 12775-12834) —
// second-order easing used by input.easedMouseDynamics.

import type { Vector2 } from 'three';

export class SecondOrderDynamics {
  target0: Vector2;
  target: Vector2;
  prevTarget: Vector2;
  value: Vector2;
  valueVel: Vector2;
  k1 = 0;
  k2 = 0;
  k3 = 0;
  private _w = 0;
  private _z = 0;
  private _d = 0;
  private _targetVelCache: Vector2;
  private _cache1: Vector2;
  private _cache2: Vector2;
  private _k1Stable = 0;
  private _k2Stable = 0;
  isRobust: boolean;

  constructor(value: Vector2, f = 1.5, z = 0.8, r = 2, isRobust = true) {
    this.isRobust = isRobust;
    this.setFZR(f, z, r);
    this.target = value;
    this.target0 = value.clone();
    this.prevTarget = value.clone();
    this.value = value.clone();
    this.valueVel = value.clone().setScalar(0);
    this._targetVelCache = this.valueVel.clone();
    this._cache1 = this.valueVel.clone();
    this._cache2 = this.valueVel.clone();
  }

  reset(target: Vector2 = this.target0): void {
    this.valueVel.setScalar(0);
    this.prevTarget.copy(target);
    this.target.copy(target);
    this.value.copy(target);
  }

  setFZR(f: number, z: number, r: number): void {
    const w = Math.PI * 2 * f;
    if (this.isRobust) {
      this._w = w;
      this._z = z;
      this._d = this._w * Math.sqrt(Math.abs(this._z * this._z - 1));
    }
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / (w * w);
    this.k3 = (r * z) / w;
  }

  private computeStableCoefficients(dt: number): void {
    if (!this.isRobust) {
      this._k1Stable = this.k1;
      this._k2Stable = Math.max(this.k2, (1.1 * dt * dt) / 4 + (dt * this.k1) / 2);
      return;
    }
    if (this._w * dt < this._z) {
      this._k1Stable = this.k1;
      this._k2Stable = Math.max(this.k2, (dt * dt) / 2 + (dt * this.k1) / 2, dt * this.k1);
    } else {
      const t = Math.exp(-this._z * this._w * dt);
      const i = 2 * t * (this._z <= 1 ? Math.cos(dt * this._d) : Math.cosh(dt * this._d));
      const r = t * t;
      const o = dt / (1 + r - i);
      this._k1Stable = (1 - r) * o;
      this._k2Stable = dt * o;
    }
  }

  update(dt: number): void {
    if (dt > 0) {
      this._targetVelCache.copy(this.target).sub(this.prevTarget).divideScalar(dt);
      this.prevTarget.copy(this.target);
      this.computeStableCoefficients(dt);
      this.value.add(this._cache1.copy(this.valueVel).multiplyScalar(dt));
      this._cache1
        .copy(this.target)
        .add(this._targetVelCache.multiplyScalar(this.k3))
        .sub(this.value)
        .sub(this._cache2.copy(this.valueVel).multiplyScalar(this._k1Stable))
        .multiplyScalar(dt / this._k2Stable);
      this.valueVel.add(this._cache1);
    }
  }
}
