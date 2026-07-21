// Port of the source Gobo (pretty line 15552-15619). The mouse-driven
// dynamics (input.goboClickDynamic) are not yet ported; the projection
// matrix, texture scrolling and opacity behavior are 1:1.

import { Euler, Matrix4, NearestFilter, Quaternion, Vector3, Vector4 } from 'three';
import type { RawShaderMaterial, Texture, WebGLRenderTarget } from 'three';
import { browser } from '../core/browser';
import { fboHelper } from '../core/fboHelper';
import { loader } from '../core/Loader';
import { properties } from '../core/properties';
import { shaderHelper } from '../core/shaderHelper';
import * as settings from '../core/settings';
import { getGoboBlurRatio as getGoboBlurRatioShader, goboFrag } from '../glsl';

const _goboMatrixIn = new Matrix4();
const _goboMatrixOut = new Matrix4();
const _e = new Euler();
const _q = new Quaternion();
const _v0 = new Vector3();
const _v1 = new Vector3();

interface GoboData {
  texture: Texture | null;
  strength: number;
}

const _data: Record<string, GoboData> = {
  gobo_b: { texture: null, strength: 0 },
  gobo_c: { texture: null, strength: 0 },
};

let _material: RawShaderMaterial;
let _rt: WebGLRenderTarget;
let _rawTexture: Texture | null = null;

class Gobo {
  time = 0;
  speed = 4;
  opacity = 1;
  mouseStrength = 0;
  mouseExtraSpeed = 0;
  sharedUniforms = {
    u_goboTexture: { value: null as Texture | null },
    u_goboMatrix: { value: _goboMatrixOut },
    u_goboOpacity: { value: 0 },
    u_goboParams: { value: new Vector4(0, 0, 0, 0) },
  };

  preInit(): void {
    shaderHelper.addChunk('getGoboBlurRatio', getGoboBlurRatioShader);
    _material = fboHelper.createRawShaderMaterial({
      uniforms: {
        u_texture: { value: null },
        u_time: { value: 0 },
        u_strength: { value: 0 },
      },
      fragmentShader: goboFrag,
    });
    _rt = fboHelper.createRenderTarget(512, 512);
    this.sharedUniforms.u_goboTexture.value = _rt.texture;
    this._loadTexture('gobo_b_0.4630597');
    this._loadTexture('gobo_c_0.38847005');
  }

  private _loadTexture(name: string): void {
    const key = name.substring(name.lastIndexOf('/') + 1, name.lastIndexOf('_'));
    const strength = parseFloat(name.substring(name.lastIndexOf('_') + 1));
    const url =
      settings.TEXTURE_PATH + 'gobo/' + name + '.' + (browser.isSupportAvif ? 'avif' : 'png');
    _data[key].texture = loader.add(url, {
      type: 'texture',
      minFilter: NearestFilter,
    }).content as Texture;
    _data[key].strength = strength;
  }

  init(): void {}

  resize(): void {}

  reset(): void {
    this.setTexture();
    this.opacity = 0;
    this.speed = 4;
    this.mouseStrength = 0.003;
    this.mouseExtraSpeed = 0.5;
  }

  setTexture(name?: string): void {
    const data = name ? _data[name] : undefined;
    _rawTexture = data ? data.texture : null;
    _material.uniforms.u_strength.value = data ? data.strength : 0;
  }

  setMatrix(matrix: Matrix4, x: number, y: number, near = 0.01, far = 20): void {
    _goboMatrixIn.copy(matrix);
    (this.sharedUniforms.u_goboParams.value as Vector4).set(x, y, near, far);
  }

  update(dt: number): void {
    if (_rawTexture && this.opacity > 0) {
      // Mouse-driven gobo shake (input.goboClickDynamic) not yet ported.
      _e.set(0, 0, 0);
      _q.setFromEuler(_e);
      _v0.set(0, 0, 0);
      _v1.set(1, 1, 1);
      _goboMatrixOut.compose(_v0, _q, _v1);
      _goboMatrixOut.multiply(_goboMatrixIn);
      _material.uniforms.u_texture.value = _rawTexture;
      this.time += dt * (this.speed + 1);
      _material.uniforms.u_time.value = this.time;
      fboHelper.render(_material, _rt);
    }
    this.sharedUniforms.u_goboOpacity.value = this.opacity;
  }
}

export const gobo = new Gobo();
export { properties as _goboProps };
