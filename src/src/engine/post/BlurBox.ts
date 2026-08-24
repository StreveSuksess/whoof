// 1:1 port of the source BlurBox (pretty line 13411-13508): screen-space
// rounded-rect gradient blur/tint driven per-frame by sections (hero card,
// footer field). Singleton, reset each frame before section updates.

import { Color, Vector2, Vector4 } from 'three';
import { blueNoise } from '../core/blueNoise';
import { fboHelper } from '../core/fboHelper';
import { properties } from '../core/properties';
import { blurBoxFrag, blurBoxVert } from '../glsl';
import { PostEffect } from './PostEffect';
import type { Postprocessing } from './postprocessing';

interface BlurBoxRect {
  blurRadiusA: number;
  blurRadiusB: number;
  posA: Vector2;
  posB: Vector2;
  x: number;
  y: number;
  width: number;
  height: number;
  color: Color;
  colorAlphaA: number;
  colorAlphaB: number;
  outline: number;
}

export class BlurBox extends PostEffect {
  renderOrder = 50;
  blurRadiusA = 0;
  blurRadiusB = 0;
  posA = new Vector2();
  posB = new Vector2();
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  color = new Color();
  colorAlphaA = 0;
  colorAlphaB = 0;
  outline = 0;
  useExtra = false;
  extra: BlurBoxRect = {
    blurRadiusA: 0,
    blurRadiusB: 0,
    posA: new Vector2(),
    posB: new Vector2(),
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: new Color(),
    colorAlphaA: 0,
    colorAlphaB: 0,
    outline: 0,
  };

  init(options?: Record<string, unknown>): void {
    Object.assign(this, options);
    super.init();
    this.material = fboHelper.createRawShaderMaterial({
      uniforms: Object.assign(
        {
          u_texture: { value: null },
          u_rect: { value: new Vector4() },
          u_posA: { value: this.posA },
          u_dir: { value: new Vector2() },
          u_length: { value: 0 },
          u_texelSize: { value: null },
          u_blurRadii: { value: new Vector2() },
          u_color: { value: new Color() },
          u_colorAlphaA: { value: 1 },
          u_colorAlphaB: { value: 1 },
          u_boxSize: { value: new Vector2() },
          u_radius: { value: 0 },
          u_outline: { value: 0 },
        },
        blueNoise.sharedUniforms,
      ),
      vertexShader: blurBoxVert,
      fragmentShader: blurBoxFrag,
    });
    (this.material.defines as Record<string, unknown>).BLUR_SAMPLE = 16;
  }

  needsRender(): boolean {
    return (
      this.blurRadiusA > 0
      || this.blurRadiusB > 0
      || this.colorAlphaA > 0
      || this.colorAlphaB > 0
      || this.useExtra
    );
  }

  reset(): void {
    this.blurRadiusA = 0;
    this.blurRadiusB = 0;
    this.colorAlphaA = 0;
    this.colorAlphaB = 0;
    this.outline = 0;
    this.useExtra = false;
  }

  anchor(range: { screenX: number; screenY: number; width: number; height: number }, offsetY = 0): void {
    this.x = range.screenX;
    this.y = range.screenY + offsetY;
    this.width = range.width;
    this.height = range.height;
    this.posA.set(0, 0);
    this.posB.set(0, properties.viewportHeight);
  }

  private updateUniforms(post: Postprocessing, rect: BlurBoxRect | this): void {
    const height = post.height;
    const vw = properties.viewportWidth;
    const vh = properties.viewportHeight;
    const u = this.material!.uniforms;
    u.u_texture.value = post.fromTexture;
    (u.u_rect.value as Vector4).set(
      (rect.x / vw) * 2 - 1,
      1 - ((rect.y + rect.height) / vh) * 2,
      (rect.width / vw) * 2,
      (rect.height / vh) * 2,
    );
    (u.u_boxSize.value as Vector2).set(rect.width, rect.height);
    (u.u_dir.value as Vector2).copy(rect.posB).sub(rect.posA).normalize();
    u.u_length.value = Math.max(0.1, rect.posB.sub(rect.posA).length());
    u.u_texelSize.value = post.texelSize;
    (u.u_blurRadii.value as Vector2)
      .set(rect.blurRadiusA, rect.blurRadiusB)
      .multiplyScalar(height);
    (u.u_color.value as Color).copy(rect.color).convertLinearToSRGB();
    u.u_colorAlphaA.value = rect.colorAlphaA;
    u.u_colorAlphaB.value = rect.colorAlphaB;
    u.u_outline.value = rect.outline;
  }

  render(post: Postprocessing, toScreen = false): void {
    const u = this.material!.uniforms;
    this.updateUniforms(post, this);
    u.u_radius.value = 0;
    fboHelper.copy(post.fromTexture!, toScreen ? undefined : post.toRenderTarget!);
    fboHelper.renderGeometry(
      fboHelper.quadGeom,
      this.material!,
      toScreen ? undefined : post.toRenderTarget!,
    );
    if (this.useExtra) {
      this.updateUniforms(post, this.extra);
      u.u_radius.value = Math.min(this.extra.width, this.extra.height) / 2;
      fboHelper.renderGeometry(
        fboHelper.quadGeom,
        this.material!,
        toScreen ? undefined : post.toRenderTarget!,
      );
    }
    post.swap();
  }
}

export const blurBox = new BlurBox();
