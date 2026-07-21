// 1:1 port of the source TAAMesh (pretty line 17271-17305): per-mesh TAA
// matrices, camera jitter application and velocity-MRT drawBuffers toggling.

import { Matrix4, Mesh } from 'three';
import type { BufferGeometry, Camera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { EngineCamera, properties } from '../core/properties';
import { postprocessing } from './postprocessing';

export class TAAMesh extends Mesh {
  tick = -1;
  isTAAMesh = true;
  onBeforeRenderCustom: ((...args: unknown[]) => void) | null = null;
  onAfterRenderCustom: ((...args: unknown[]) => void) | null = null;

  constructor(geometry: BufferGeometry, material: ShaderMaterial | ShaderMaterial[]) {
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((mat) => {
      mat.uniforms = Object.assign(mat.uniforms, {
        viewProjectionMatrixJittered: { value: new Matrix4() },
        viewProjectionMatrix: { value: new Matrix4() },
        prevViewProjectionMatrix: { value: new Matrix4() },
        prevModelMatrix: { value: new Matrix4() },
      });
      if (!postprocessing.useMSAA) (mat.defines as Record<string, unknown>).USE_TAA = 1;
      mat.needsUpdate = true;
    });
    super(geometry, materials[0]);
    if (!postprocessing.useMSAA) {
      this.onBeforeRender = (renderer: WebGLRenderer, scene: Scene, camera: Camera) => {
        // Duck-typed check (instanceof breaks across Vite chunks).
        const jitterCamera = camera as EngineCamera;
        if (!postprocessing.taa.isActive && typeof jitterCamera.applyJitter === 'function') {
          jitterCamera.applyJitter(properties.resolution);
        }
        this.updatesTAAMatricesOnBeforeRender(camera);
        this.onBeforeRenderCustom?.(renderer, scene, camera);
        const gl = renderer.getContext() as WebGL2RenderingContext;
        // Source: disable blending on the velocity attachment so alpha-blended
        // materials don't corrupt the packed motion vectors.
        properties.drawBuffersExt?.disableiOES(gl.BLEND, 1);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        postprocessing.taa.isActive = true;
      };
      this.onAfterRender = (renderer: WebGLRenderer, scene: Scene, camera: Camera) => {
        this.updatesTAAMatricesOnAfterRender();
        this.onAfterRenderCustom?.(renderer, scene, camera);
        const gl = renderer.getContext() as WebGL2RenderingContext;
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
      };
    }
  }

  private updatesTAAMatricesOnBeforeRender(camera: Camera): void {
    const uniforms = (this.material as ShaderMaterial).uniforms;
    (uniforms.viewProjectionMatrix.value as Matrix4).multiplyMatrices(
      (camera as EngineCamera).projectionMatrix,
      camera.matrixWorldInverse,
    );
    (uniforms.viewProjectionMatrixJittered.value as Matrix4).multiplyMatrices(
      (camera as EngineCamera).projectionMatrixJittered,
      camera.matrixWorldInverse,
    );
    if (this.tick + 1 !== properties.tick) this.updatesTAAMatricesOnAfterRender();
  }

  private updatesTAAMatricesOnAfterRender(): void {
    const uniforms = (this.material as ShaderMaterial).uniforms;
    (uniforms.prevViewProjectionMatrix.value as Matrix4).copy(
      uniforms.viewProjectionMatrix.value as Matrix4,
    );
    (uniforms.prevModelMatrix.value as Matrix4).copy(this.matrixWorld);
    this.tick = properties.tick;
  }
}
