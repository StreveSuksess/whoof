// Port of the source bundle's `properties` singleton (pretty line 12540-12643),
// restricted to the fields the ported subsystems consume.

import { Color, Matrix4, PerspectiveCamera, Vector2, Vector3 } from 'three';
import type { WebGLRenderer } from 'three';

// Source camera is a TAAPerspectiveCamera carrying an .mvp matrix.
export class EngineCamera extends PerspectiveCamera {
  mvp = new Matrix4();
}

export const properties = {
  time: 0,
  deltaTime: 0,
  tick: 0,
  hasInitialized: false,
  hasStarted: false,
  startTime: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  width: 0,
  height: 0,
  renderer: null as WebGLRenderer | null,
  camera: new EngineCamera(),
  resolution: new Vector2(),
  viewportResolution: new Vector2(),
  bgColor: new Color(),
  cameraDirection: new Vector3(),
  isMobile: false,
  useMobileLayout: false,
  webglOpts: { antialias: false, alpha: false, xrCompatible: true },
  paddingX: 0,
  paddingY: 0,
  cameraLookX: 0,
  cameraLookY: 0,
  cameraDistance: 0.01,
  cameraLookStrength: 0.05,
  cameraLookEaseFactor: 5,
  cameraShakePositionStrength: 0.5,
  cameraShakePositionSpeed: 0.15,
  cameraShakeRotationStrength: 0.003,
  cameraShakeRotationSpeed: 0.3,
  bgColorHex: '#100904',
  sharedUniforms: {
    u_useMobileLayout: { value: false },
    u_brdfLut: { value: null as unknown },
    u_cameraMVP: { value: null as unknown },
    u_cameraDirection: { value: null as unknown },
    u_time: { value: 0 },
    u_deltaTime: { value: 1 },
    u_resolution: { value: null as unknown },
    u_viewportResolution: { value: null as unknown },
    u_bgColor: { value: null as unknown },
  },

  /** Source: url.replace(/\.([^.]+)$/, "_MOBILE.$1") */
  getMobileUrl(url: string): string {
    return url.replace(/\.([^.]+)$/, '_MOBILE.$1');
  },
};

properties.sharedUniforms.u_cameraDirection.value = properties.cameraDirection;
properties.sharedUniforms.u_resolution.value = properties.resolution;
properties.sharedUniforms.u_viewportResolution.value = properties.viewportResolution;
properties.sharedUniforms.u_bgColor.value = properties.bgColor;
properties.sharedUniforms.u_cameraMVP.value = properties.camera.mvp;
