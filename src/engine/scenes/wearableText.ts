// 1:1 port of the source WearableText (pretty 19633-19718): MSDF "WEARABLE."
// glow text drawn between rectFrom/rectTo in viewport space.

import { Color, Mesh, Object3D, Sphere, Vector2 } from 'three';
import { GLSL3, LinearFilter } from 'three';
import type { Texture } from 'three';
import { blueNoise } from '../core/blueNoise';
import { DomGLRect } from '../core/DomGLRect';
import { fboHelper } from '../core/fboHelper';
import { loader } from '../core/Loader';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { wearableTextFrag, wearableTextVert } from '../glsl';
import { bg } from './bg';

// Source constants (pretty 19641-19645).
const _pixelRange = 4;
const _rawSize = new Vector2(1500, 205.17);
const _textureSize = new Vector2(458, 69);
const containScale = Math.min(
  (_textureSize.x - _pixelRange) / _rawSize.x,
  (_textureSize.y - _pixelRange) / _rawSize.y,
);
const _scaleFix = new Vector2(
  (_rawSize.x * containScale) / _textureSize.x,
  (_rawSize.y * containScale) / _textureSize.y,
);

export class WearableText {
  activeRatio = 0;
  shrinkRatio = 0;
  rectFrom = new DomGLRect();
  rectTo = new DomGLRect();
  size = _rawSize;
  container = new Object3D();
  mesh!: Mesh;
  pulseRatio = 0;
  glowRatio = 0;
  opacity = 0;
  sharedUniforms = {
    u_activeRatio: { value: 0 },
    u_shrinkRatio: { value: 0 },
    u_rectFrom: { value: this.rectFrom },
    u_rectTo: { value: this.rectTo },
    u_pulseRatio: { value: 0 },
    u_glowRatio: { value: 0 },
    u_opacity: { value: 0 },
  };

  preInit(): void {
    this.mesh = new Mesh(
      fboHelper.quadGeom,
      fboHelper.createRawShaderMaterial({
        uniforms: Object.assign(
          {
            u_texture: {
              value: loader.add(settings.TEXTURE_PATH + 'wearable/wearable_text.webp', {
                type: 'texture',
                minFilter: LinearFilter,
              }).content as Texture,
            },
            u_scaleFix: { value: _scaleFix },
            u_textureSize: { value: _textureSize },
            u_color: { value: new Color().setStyle('#ffedd7').convertLinearToSRGB() },
            u_viewportResolution: properties.sharedUniforms.u_viewportResolution,
            u_pixelRange: { value: _pixelRange },
            u_resolution: properties.sharedUniforms.u_resolution,
            u_time: properties.sharedUniforms.u_time,
          },
          this.sharedUniforms,
          blueNoise.sharedUniforms,
          bg.sharedUniforms,
        ),
        vertexShader: wearableTextVert,
        fragmentShader: wearableTextFrag,
        derivatives: true,
        glslVersion: GLSL3,
        depthWrite: false,
        depthTest: false,
      }),
    );
    this.mesh.geometry.boundingSphere = new Sphere();
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -2;
    this.container.add(this.mesh);
  }

  init(): void {}

  update(_dt: number): void {
    this.sharedUniforms.u_activeRatio.value = this.activeRatio;
    this.sharedUniforms.u_shrinkRatio.value = this.shrinkRatio;
    this.sharedUniforms.u_pulseRatio.value = this.pulseRatio;
    this.sharedUniforms.u_glowRatio.value = this.glowRatio;
    this.sharedUniforms.u_opacity.value = this.opacity;
  }
}

export const wearableText = new WearableText();
