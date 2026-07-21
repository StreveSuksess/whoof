// 1:1 port of the source Blur (pretty line 15870-15895): separable 9-tap
// gaussian, varying-array variant when MAX_VARYING_VECTORS > 8.

import { RawShaderMaterial, Vector2 } from 'three';
import type { Texture, WebGLRenderTarget } from 'three';
import { fboHelper } from './fboHelper';
import {
  blur9FragmentShader,
  blur9VaryingFragmentShader,
  blur9VaryingVertexShader,
} from '../glsl';

class Blur {
  private blur9Material: RawShaderMaterial | null = null;

  getBlur9Material(): RawShaderMaterial {
    const useVarying = fboHelper.MAX_VARYING_VECTORS > 8;
    if (!this.blur9Material) {
      this.blur9Material = new RawShaderMaterial({
        uniforms: {
          u_texture: { value: null },
          u_delta: { value: new Vector2() },
        },
        vertexShader: useVarying
          ? fboHelper.precisionPrefix + blur9VaryingVertexShader
          : fboHelper.vertexShader,
        fragmentShader:
          fboHelper.precisionPrefix
          + (useVarying ? blur9VaryingFragmentShader : blur9FragmentShader),
        depthWrite: false,
        depthTest: false,
      });
    }
    return this.blur9Material;
  }

  blur(
    radius: number,
    scale: number,
    fromRT: WebGLRenderTarget,
    intermediateRT: WebGLRenderTarget,
    toRT?: WebGLRenderTarget,
    skipToResize = false,
  ): void {
    const step = 0.25;
    const width = Math.ceil(fromRT.width * scale) || 0;
    const height = Math.ceil(fromRT.height * scale) || 0;
    const material = this.getBlur9Material();
    if (!intermediateRT) console.warn('You have to pass intermediateRenderTarget to blur');
    if (width !== intermediateRT.width || height !== intermediateRT.height) {
      intermediateRT.setSize(width, height);
    }
    if (toRT) {
      if (!skipToResize) toRT.setSize(fromRT.width, fromRT.height);
    } else {
      toRT = fromRT;
    }
    material.uniforms.u_texture.value = (fromRT.texture || fromRT) as Texture;
    (material.uniforms.u_delta.value as Vector2).set((radius / width) * step, 0);
    fboHelper.render(material, intermediateRT);
    material.uniforms.u_texture.value = (intermediateRT.texture || intermediateRT) as Texture;
    (material.uniforms.u_delta.value as Vector2).set(0, (radius / height) * step);
    fboHelper.render(material, toRT);
  }
}

export const blur = new Blur();
