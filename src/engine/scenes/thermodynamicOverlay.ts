// 1:1 port of the source ThermodynamicOverlay (pretty 17367-17407): the
// thermal-camera wipe that recolors the cached scene through the thermal
// gradient LUT.

import { Mesh, Object3D, PlaneGeometry, ShaderMaterial } from 'three';
import type { Texture } from 'three';
import { loader } from '../core/Loader';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { shaderHelper } from '../core/shaderHelper';
import { thermodynamicFrag, thermodynamicPars, thermodynamicVert } from '../glsl';
import { postprocessing } from '../post/postprocessing';

export class ThermodynamicOverlay {
  showRatio = 0;
  hideRatio = 0;
  container = new Object3D();
  mesh!: Mesh;
  sharedUniforms = {
    u_thermalTexture: { value: null as Texture | null },
    u_thermalRatio: { value: 0 },
    u_thermalAnimation: { value: 0 },
  };

  preInit(): void {
    shaderHelper.addChunk('thermodynamicPars', thermodynamicPars);
    this.sharedUniforms.u_thermalTexture.value = loader.add(
      settings.TEXTURE_PATH + 'thermal_gradient.webp',
      { type: 'texture' },
    ).content as Texture;
  }

  init(): void {
    this.mesh = new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({
        vertexShader: thermodynamicVert,
        fragmentShader: thermodynamicFrag,
        depthTest: false,
        depthWrite: false,
        uniforms: Object.assign(
          {
            u_sceneCacheTexture: postprocessing.sharedUniforms.u_sceneCacheTexture,
            u_resolution: postprocessing.sharedUniforms.u_resolution,
          },
          this.sharedUniforms,
        ),
      }),
    );
    this.mesh.renderOrder = -1;
    this.mesh.frustumCulled = false;
    this.mesh.onBeforeRender = () => {
      postprocessing.cacheScene(true, 0);
    };
    this.container.add(this.mesh);
  }

  resize(): void {}

  preUpdate(_dt: number): void {}

  update(_dt: number): void {
    const ratio = this.showRatio * (1 - this.hideRatio);
    this.mesh.visible = ratio > 0;
    (this.mesh.material as ShaderMaterial).uniforms.u_thermalRatio.value = ratio;
    (this.mesh.material as ShaderMaterial).uniforms.u_thermalAnimation.value =
      this.showRatio + this.hideRatio;
  }
}

export const thermodynamicOverlay = new ThermodynamicOverlay();
