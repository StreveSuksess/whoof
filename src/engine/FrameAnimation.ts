// 1:1 port of the source bundle's FrameAnimation (pretty line 18500):
// per-frame position/orient/scale/focal tracks stored as buf attributes,
// applied to a target Object3D (or camera) by frame index with lerp/slerp.

import { Object3D, Quaternion, Vector3 } from 'three';
import type { BufferGeometry, PerspectiveCamera } from 'three';
import { clamp, mix } from './core/math';

const _v0 = new Vector3();
const _q0 = new Quaternion();

export class FrameAnimation {
  target: Object3D | PerspectiveCamera = new Object3D();
  frameCount = 0;
  isUniformScale = false;
  aperture = 41.4214;
  viewPixelWidth = 2048;
  viewPixelHeight = 1024;
  private positions?: ArrayLike<number>;
  private orients?: ArrayLike<number>;
  private scales?: ArrayLike<number>;
  private focals?: ArrayLike<number>;

  setTarget(target: Object3D | PerspectiveCamera): void {
    this.target = target;
  }

  setGeometry(geometry: BufferGeometry): void {
    const position = geometry.getAttribute('position');
    const orient = geometry.getAttribute('orient');
    const scale = geometry.getAttribute('scale');
    const focal = geometry.getAttribute('focal');
    this.positions = position?.array;
    this.orients = orient?.array;
    this.scales = scale?.array;
    this.focals = focal?.array;
    this.frameCount = position?.count ?? 0;
    if (scale?.count) this.isUniformScale = scale.itemSize === 1;
  }

  getFovFromFocal(focal: number): number {
    const filmHeight = (this.viewPixelHeight * this.aperture) / this.viewPixelWidth;
    return 2 * Math.atan(filmHeight / 2 / focal) * (180 / Math.PI);
  }

  applyTransformByRatio(ratio: number): void {
    if (!this.frameCount) return;
    this.applyTransform(ratio * (this.frameCount - 1));
  }

  applyTransform(frame: number): void {
    if (!this.frameCount) return;
    const last = this.frameCount - 1;
    frame = clamp(frame, 0, last);
    const i = Math.floor(frame);
    const j = Math.min(i + 1, last);
    const t = frame - i;
    const target = this.target;
    if (this.positions) {
      target.position.fromArray(this.positions, i * 3).lerp(_v0.fromArray(this.positions, j * 3), t);
    }
    if (this.orients) {
      target.quaternion.fromArray(this.orients, i * 4).slerp(_q0.fromArray(this.orients, j * 4), t);
    }
    if (this.scales) {
      if (this.isUniformScale) {
        target.scale.setScalar(mix(this.scales[i], this.scales[j], t));
      } else {
        target.scale.fromArray(this.scales, i * 3).lerp(_v0.fromArray(this.scales, j * 3), t);
      }
    }
    if (this.focals) {
      (target as PerspectiveCamera).fov = this.getFovFromFocal(mix(this.focals[i], this.focals[j], t));
    }
  }
}
