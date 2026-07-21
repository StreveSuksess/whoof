// Port of the source CameraControls + DeviceOrientationControls
// (pretty line 14992-15101), including the mobile gyro branch.

import { Camera, Euler, MathUtils, Quaternion, Vector2, Vector3, Vector4 } from 'three';
import type { Mesh, Object3D, WebGLRenderer } from 'three';
import { browser } from './browser';
import { clamp, saturate } from './math';
import { input } from './input';
import { properties } from './properties';
import { scrollManager } from './ScrollPane';

// Source DeviceOrientationControls (pretty 14992-15040).
interface DeviceOrientationData {
  alpha?: number | null;
  beta?: number | null;
  gamma?: number | null;
}

class DeviceOrientationControls {
  object: Object3D;
  enabled = true;
  hasValue: boolean | number = false;
  deviceOrientation: DeviceOrientationData = {};
  screenOrientation = 0;
  alphaOffset = 0;
  zee = new Vector3(0, 0, 1);
  euler = new Euler();
  q0 = new Quaternion();
  q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  granted = false;
  private _onBoundDeviceOrientationChangeEvent: (e: DeviceOrientationEvent) => void;
  private _onBoundScreenOrientationChangeEvent: () => void;

  constructor(object: Object3D) {
    this.object = object;
    this.object.rotation.reorder('YXZ');
    this._onBoundDeviceOrientationChangeEvent = this._onDeviceOrientationChangeEvent.bind(this);
    this._onBoundScreenOrientationChangeEvent = this._onScreenOrientationChangeEvent.bind(this);
    this.connect();
  }

  private _onDeviceOrientationChangeEvent(e: DeviceOrientationEvent): void {
    this.deviceOrientation = e;
  }

  private _onScreenOrientationChangeEvent(): void {
    this.screenOrientation = (window.orientation as number) || 0;
  }

  private setObjectQuaternion(
    q: Quaternion,
    alpha: number,
    beta: number,
    gamma: number,
    orient: number,
  ): void {
    this.euler.set(beta, alpha, -gamma, 'YXZ');
    q.setFromEuler(this.euler);
    q.multiply(this.q1);
    q.multiply(this.q0.setFromAxisAngle(this.zee, -orient));
  }

  connect(): void {
    this._onBoundScreenOrientationChangeEvent();
    const DOE = window.DeviceOrientationEvent as unknown as
      | { requestPermission?: () => Promise<string> }
      | undefined;
    if (DOE !== undefined && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('orientationchange', this._onBoundScreenOrientationChangeEvent, false);
            window.addEventListener('deviceorientation', this._onBoundDeviceOrientationChangeEvent, false);
            this.granted = true;
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener('orientationchange', this._onBoundScreenOrientationChangeEvent, false);
      window.addEventListener('deviceorientation', this._onBoundDeviceOrientationChangeEvent, false);
      this.granted = true;
    }
    this.enabled = true;
  }

  disconnect(): void {
    window.removeEventListener('orientationchange', this._onBoundScreenOrientationChangeEvent, false);
    window.removeEventListener('deviceorientation', this._onBoundDeviceOrientationChangeEvent, false);
    this.enabled = false;
  }

  update(): void {
    if (this.enabled === false) return;
    const device = this.deviceOrientation;
    if (device) {
      const alpha = device.alpha ? MathUtils.degToRad(device.alpha) + this.alphaOffset : 0;
      const beta = device.beta ? MathUtils.degToRad(device.beta) : 0;
      const gamma = device.gamma ? MathUtils.degToRad(device.gamma) : 0;
      const orient = this.screenOrientation ? MathUtils.degToRad(this.screenOrientation) : 0;
      this.setObjectQuaternion(this.object.quaternion, alpha, beta, gamma, orient);
      this.hasValue = this.hasValue || (device.alpha && device.beta && device.gamma) || false;
    }
  }

  dispose(): void {
    this.disconnect();
  }
}

const _q = new Quaternion();
const _e = new Euler();
let _scissor = new Vector4();
let _scissorTest = false;
let _deviceOrientationControls: DeviceOrientationControls | null = null;
let _baseDeviceControlQuaternion: Quaternion;
let _targetDeviceControlQuaternion: Quaternion;
let _deviceOrientationCamera: Camera;

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
  deviceQuaterion = new Quaternion(0, 0, 0, 1);
  deviceEuler = new Euler(0, 0, 0);
  deviceVirtualMouseXY = new Vector2(0, 0);
  deviceVirtualMouseXYPrev = new Vector2(0, 0);
  isDeviceReady = false;

  preInit(): void {
    properties.camera.position.copy(this.position);
    if (browser.isMobile) {
      _deviceOrientationCamera = new Camera();
      _baseDeviceControlQuaternion = new Quaternion();
      _targetDeviceControlQuaternion = new Quaternion();
      const connect = (): void => {
        if (!_deviceOrientationControls) {
          _deviceOrientationControls = new DeviceOrientationControls(_deviceOrientationCamera);
        }
        if (!_deviceOrientationControls.granted) _deviceOrientationControls.connect();
      };
      if (browser.isIOS) {
        connect();
        properties.onFirstClicked.addOnce(connect);
      } else {
        connect();
      }
    }
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

  preUpdate(dt = 0): void {
    this.position.set(0, 0, 5);
    this.quaternion.set(0, 0, 0, 1);
    this.fov = 60;
    this.cameraDistance = 1;
    this.zoom = 1;
    this.needsClipping = false;
    this.viewOffsetX = 0;
    this.viewOffsetY = 0;
    if (browser.isMobile && _deviceOrientationControls) {
      _deviceOrientationControls.update();
      if (_deviceOrientationControls.hasValue) {
        if (!this.isDeviceReady) {
          this.isDeviceReady = true;
          _targetDeviceControlQuaternion.copy(_deviceOrientationCamera.quaternion);
          _baseDeviceControlQuaternion.copy(_deviceOrientationCamera.quaternion);
        }
        _targetDeviceControlQuaternion.slerp(
          _deviceOrientationCamera.quaternion,
          1 - Math.exp(-dt * 10),
        );
        _baseDeviceControlQuaternion.slerp(_targetDeviceControlQuaternion, 1 - Math.exp(-dt * 6));
        this.deviceQuaterion
          .copy(_baseDeviceControlQuaternion)
          .invert()
          .multiply(_targetDeviceControlQuaternion);
        this.deviceEuler.setFromQuaternion(this.deviceQuaterion);
        const vx = clamp(this.deviceEuler.y * 5, -1, 1);
        const vy = clamp(this.deviceEuler.x * 5, -1, 1);
        this.deviceVirtualMouseXYPrev.copy(this.deviceVirtualMouseXY);
        this.deviceVirtualMouseXY.set(vx, vy);
      }
    }
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
    if (this.isDeviceReady) {
      properties.cameraLookX = clamp(
        this.deviceEuler.x,
        -properties.cameraLookStrength,
        properties.cameraLookStrength,
      );
      properties.cameraLookY = clamp(
        this.deviceEuler.y,
        -properties.cameraLookStrength,
        properties.cameraLookStrength,
      );
    } else {
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
