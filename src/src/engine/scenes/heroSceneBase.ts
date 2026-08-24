// 1:1 port of the source HeroSceneBase (pretty line 20669-20736):
// the cutting-mat screen mesh (baseVert/baseFrag) rendered into the hero RT.

import { Color, LinearFilter, Mesh, SRGBColorSpace, Vector2, Vector4 } from 'three';
import type { RawShaderMaterial, Texture } from 'three';
import { blueNoise } from '../core/blueNoise';
import { browser } from '../core/browser';
import { fboHelper } from '../core/fboHelper';
import { loader } from '../core/Loader';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { baseFrag, baseVert } from '../glsl';
import { bg } from './bg';
import { coaster } from './coaster';
import { gobo } from './gobo';
import type { HeroSceneShared } from './heroScene';

class HeroSceneBase {
  mesh!: Mesh;
  sharedUniforms = {
    u_blurRectRadius: { value: 0 },
    u_blurRect: { value: new Vector4() },
    u_blurRatio: { value: 0 },
    u_blurColor: { value: new Color() },
  };

  preInit(hero: HeroSceneShared, viewPixelWidth: number, viewPixelHeight: number): void {
    const texture = loader.add(settings.TEXTURE_PATH + 'hero/BASE.webp', {
      type: 'texture',
      minFilter: LinearFilter,
      colorSpace: SRGBColorSpace,
      autoMobile: true,
    }).content as Texture;
    this.mesh = new Mesh(
      fboHelper.triGeom,
      fboHelper.createRawShaderMaterial({
        uniforms: Object.assign(
          {
            u_texture: { value: texture },
            u_shadowMap: { value: hero.shadowRT.texture },
            u_resolution: properties.sharedUniforms.u_resolution,
            u_heroViewResolution: { value: new Vector2(viewPixelWidth, viewPixelHeight) },
            u_viewResolution: properties.sharedUniforms.u_viewportResolution,
            u_planeResolution: hero.sharedUniforms.u_planeResolution,
            u_deskPadTexture: { value: null },
            u_2DlightPos: hero.sharedUniforms.u_2DlightPos,
            u_screenToWorld: hero.sharedUniforms.u_screenToWorld,
            u_screenTableNDCDepth: hero.sharedUniforms.u_screenTableNDCDepth,
            u_activeRatio: hero.sharedUniforms.u_activeRatio,
            u_coasterPos: coaster.sharedUniforms.u_position,
            u_textureCorrection: { value: new Vector2(browser.isMobile ? 1280 / 3296 : 1, 1) },
            u_zoom: hero.sharedUniforms.u_zoom,
            u_rotation: { value: 0 },
            u_useMobileLayout: properties.sharedUniforms.u_useMobileLayout,
          },
          gobo.sharedUniforms,
          blueNoise.sharedUniforms,
          bg.sharedUniforms,
          this.sharedUniforms,
        ),
        vertexShader: baseVert,
        fragmentShader: baseFrag,
        defines: { BLUR_SAMPLE: 6 },
      }),
    );
  }

  init(): void {}

  resize(): void {}

  preUpdate(): void {}

  update(hero: HeroSceneShared): void {
    this.mesh.visible = hero.activeRatio > 0;
    const material = this.mesh.material as RawShaderMaterial;
    material.uniforms.u_rotation.value = hero.camera2D.rotation.z;
    material.uniforms.u_deskPadTexture.value = hero.canvasTexture;
  }
}

export const heroSceneBase = new HeroSceneBase();
