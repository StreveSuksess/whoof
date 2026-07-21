// Port of the source CameraControls (pretty line 15044-15101). The mobile
// DeviceOrientationControls branch is not yet ported (desktop path complete);
// it only activates on mobile devices in the source.

import { Euler, Quaternion, Vector2, Vector3, Vector4 } from 'three';
import type { Mesh, WebGLRenderer } from 'three';
import { clamp, saturate } from './math';
import { input } from './input';
import { properties } from './properties';
import { scrollManager } from './ScrollPane';

const _q = new Quaternion();
const _e = new Euler();
let _scissor = new Vector4();
let _scissorTest = false;

type ClippableMesh = Mesh & {
  needsClipping?: boolean;
  _onBeforeRender?: Mesh['onBeforeRender'];
  _onAfterRender?: Mesh['onAfterRender'];
};

class CameraControls {
  useOrbitControls = false;
  viewOffsetX = 0;
  viewOffsetY = 0;
  needsClipping = false;
  clipScissor = new Vector4();
  position = new Vector3(0, 0, 5);
  quaternion = new Quaternion(0, 0, 0, 1);
  fov = 60;
  zoom = 1;
  cameraDistance = 1;

  preInit(): void {
    properties.camera.position.copy(this.position);
  }

  init(): void {}

  initClippingMesh(mesh: ClippableMesh): void {
    mesh._onBeforeRender = mesh.onBeforeRender;
    mesh._onAfterRender = mesh.onAfterRender;
    mesh.onBeforeRender = this._onBeforeRenderClip.bind(this, mesh) as Mesh['onBeforeRender'];
    mesh.onAfterRender = this._onAfterRenderClip.bind(this, mesh) as Mesh['onAfterRender'];
  }

  private _onBeforeRenderClip(mesh: ClippableMesh, renderer: WebGLRenderer, ...args: unknown[]): void {
    (mesh._onBeforeRender as (...a: unknown[]) => void)?.(renderer, ...args);
    if (mesh.needsClipping && this.needsClipping) {
      _scissorTest = renderer.getScissorTest();
      renderer.getScissor(_scissor);
      renderer.setScissorTest(true);
      renderer.setScissor(this.clipScissor);
    }
  }

  private _onAfterRenderClip(mesh: ClippableMesh, renderer: WebGLRenderer, ...args: unknown[]): void {
    if (mesh.needsClipping && this.needsClipping) {
      renderer.setScissor(_scissor.x, _scissor.y, _scissor.z, _scissor.w);
      renderer.setScissorTest(_scissorTest);
    }
    mesh.needsClipping = false;
    (mesh._onAfterRender as (...a: unknown[]) => void)?.(renderer, ...args);
  }

  resize(): void {}

  preUpdate(): void {
    this.position.set(0, 0, 5);
    this.quaternion.set(0, 0, 0, 1);
    this.fov = 60;
    this.cameraDistance = 1;
    this.zoom = 1;
    this.needsClipping = false;
    this.viewOffsetX = 0;
    this.viewOffsetY = 0;
  }

  update(dt: number): void {
    const camera = properties.camera;
    camera.matrix.identity();
    camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
    camera.position.copy(this.position);
    camera.quaternion.copy(this.quaternion);
    camera.fov = this.fov;
    camera.zoom = this.zoom;
    this.cameraDistance = properties.cameraDistance;
    camera.translateZ(this.cameraDistance * -1);
    {
      const lookX = clamp(input.mouseXY.y, -1, 1) * properties.cameraLookStrength;
      const lookY = clamp(-input.mouseXY.x, -1, 1) * properties.cameraLookStrength;
      let ease = 1 - Math.exp(-dt * properties.cameraLookEaseFactor);
      ease = saturate(Math.max(Math.abs(scrollManager.scrollViewDelta) * 10, ease));
      properties.cameraLookX += (lookX - properties.cameraLookX) * ease;
      properties.cameraLookY += (lookY - properties.cameraLookY) * ease;
    }
    _e.set(properties.cameraLookX, properties.cameraLookY, 0);
    _q.setFromEuler(_e);
    camera.quaternion.multiply(_q);
    camera.translateZ(this.cameraDistance);
    const width = properties.viewportWidth;
    const height = properties.viewportHeight;
    camera.setViewOffset(
      width,
      height,
      -this.viewOffsetX * width,
      -this.viewOffsetY * height,
      width,
      height,
    );
    camera.updateProjectionMatrix();
    camera.updateMatrix();
    camera.updateMatrixWorld(true);
    camera.mvp.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
  }
}

export const cameraControls = new CameraControls();
export const _cameraControlsMouse = new Vector2();
