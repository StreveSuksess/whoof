// 1:1 port of the source Simple1DNoise + BrownianMotion (pretty 14885-14991):
// fBm noise-driven position/rotation jitter (water bear head/leg motion).

import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { mix } from './math';

const _v = new Vector3();

class Simple1DNoise {
  static MAX_VERTICES = 256;
  static MAX_VERTICES_MASK = Simple1DNoise.MAX_VERTICES - 1;
  private _scale = 1;
  private _amplitude = 1;
  private _r: number[] = [];

  constructor() {
    for (let i = 0; i < Simple1DNoise.MAX_VERTICES; ++i) this._r.push(Math.random() - 0.5);
  }

  getVal(x: number): number {
    const scaled = x * this._scale;
    const floor = Math.floor(scaled);
    const t = scaled - floor;
    const smooth = t * t * (3 - 2 * t);
    const min = floor & Simple1DNoise.MAX_VERTICES_MASK;
    const max = (min + 1) & Simple1DNoise.MAX_VERTICES_MASK;
    return mix(this._r[min], this._r[max], smooth) * this._amplitude;
  }
}

export class BrownianMotion {
  _position = new Vector3();
  _rotation = new Quaternion();
  _euler = new Euler();
  _scale = new Vector3(1, 1, 1);
  _matrix = new Matrix4();
  _enablePositionNoise = true;
  _enableRotationNoise = true;
  _autoMatrixUpdate = true;
  _positionFrequency = 0.25;
  _rotationFrequency = 0.25;
  _positionAmplitude = 0.3;
  _rotationAmplitude = 0.003;
  _positionScale = new Vector3(1, 1, 1);
  _rotationScale = new Vector3(1, 1, 0);
  _positionFractalLevel = 3;
  _rotationFractalLevel = 3;
  private _times = new Float32Array(6);
  private _noise = new Simple1DNoise();
  static FBM_NORM = 1 / 0.75;

  constructor() {
    this.rehash();
  }

  rehash(): void {
    for (let i = 0; i < 6; i++) this._times[i] = Math.random() * -1e4;
  }

  private _fbm(x: number, levels: number): number {
    let result = 0;
    let amplitude = 0.5;
    for (let i = 0; i < levels; i++) {
      result += amplitude * this._noise.getVal(x);
      x *= 2;
      amplitude *= 0.5;
    }
    return result;
  }

  update(dt?: number): void {
    const t = dt === undefined ? 16.666666666666668 : dt;
    if (this._enablePositionNoise) {
      for (let i = 0; i < 3; i++) this._times[i] += this._positionFrequency * t;
      _v.set(
        this._fbm(this._times[0], this._positionFractalLevel),
        this._fbm(this._times[1], this._positionFractalLevel),
        this._fbm(this._times[2], this._positionFractalLevel),
      );
      _v.multiply(this._positionScale);
      _v.multiplyScalar(this._positionAmplitude * BrownianMotion.FBM_NORM);
      this._position.copy(_v);
    }
    if (this._enableRotationNoise) {
      for (let i = 0; i < 3; i++) this._times[i + 3] += this._rotationFrequency * t;
      _v.set(
        this._fbm(this._times[3], this._rotationFractalLevel),
        this._fbm(this._times[4], this._rotationFractalLevel),
        this._fbm(this._times[5], this._rotationFractalLevel),
      );
      _v.multiply(this._rotationScale);
      _v.multiplyScalar(this._rotationAmplitude * BrownianMotion.FBM_NORM);
      this._euler.set(_v.x, _v.y, _v.z);
      this._rotation.setFromEuler(this._euler);
    }
    if (this._autoMatrixUpdate) this._matrix.compose(this._position, this._rotation, this._scale);
  }
}
