// Staged port of the source HeroScene (pretty line 20737-20990). This module
// carries the scene's constants, sharedUniforms and the hero camera pose from
// preUpdate — the parts other ported systems (Coaster, HeroSceneBase) consume.
// The RT pipeline (props, shadows, desk pad canvas) is not yet ported.

import { Matrix4, PerspectiveCamera, Vector2, Vector3 } from 'three';
import { cameraControls } from '../core/cameraControls';
import { properties } from '../core/properties';
import { fit } from '../core/math';
import { textureHelper } from '../core/textureHelper';
import * as settings from '../core/settings';
import { gobo } from './gobo';
import { coaster } from './coaster';

// Source constants (pretty line 20737-20745).
export const focalLength = 50;
export const aperture = 41.4;
export const viewPixelWidth = 2240;
export const viewPixelHeight = 1260;
export const expandedViewPixelWidth = 3296;
export const expandedViewPixelHeight = 1460;
const apy = (viewPixelHeight * aperture) / viewPixelWidth;
export const fov = 2 * Math.atan(apy / 2 / focalLength) * (180 / Math.PI);

const _goboMatrix = new Matrix4();

class HeroScene {
  screenToWorld = new Matrix4();
  lightPos = new Vector2(0, 0);
  activeRatio = 1;
  isActive = false;
  coasterLightPosition = new Vector3(0.346682, 1.00875, -0.368255);
  sharedUniforms = {
    u_2DlightPos: { value: this.lightPos },
    u_planeResolution: { value: new Vector2(expandedViewPixelWidth, expandedViewPixelHeight) },
    u_screenToWorld: { value: this.screenToWorld },
    u_screenTableNDCDepth: { value: 0 },
    u_activeRatio: { value: 0 },
    u_zoom: { value: 1 },
    u_envTexture: { value: null as unknown },
  };

  preInit(): void {
    this.sharedUniforms.u_envTexture.value = textureHelper.loadRGBMTexture(
      settings.TEXTURE_PATH + 'hero/env_hero.webp',
    );
    // Gobo projection matrix from the source preInit's fixed camera pose.
    const goboCamera = new PerspectiveCamera(60, 1, 0.01, 20);
    goboCamera.position.set(0.466854, 0.992917, -0.252766);
    goboCamera.quaternion.set(0.16182, -0.776664, -0.221667, -0.566984);
    goboCamera.updateMatrix();
    goboCamera.updateMatrixWorld();
    _goboMatrix.multiplyMatrices(goboCamera.projectionMatrix, goboCamera.matrixWorldInverse);
  }

  /** Source HeroScene.preUpdate: fixed hero camera pose + gobo + env binding. */
  preUpdate(): void {
    properties.cameraLookStrength = 0;
    properties.cameraShakePositionStrength = 0;
    properties.cameraShakeRotationStrength = 0;
    properties.camera.fov = fov;
    cameraControls.position.set(-0.0105761, 1.22526, -0.0485146);
    cameraControls.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
    cameraControls.fov = fov;
    coaster.envTexture1Uniform = this.sharedUniforms.u_envTexture;
    coaster.envBlendRatio = 0;
    coaster.lightPosition.copy(this.coasterLightPosition);
    if (this.activeRatio > 0) {
      gobo.setTexture('gobo_c');
      gobo.setMatrix(_goboMatrix, 0.372991, 0.79059);
    }
    gobo.opacity = fit(this.activeRatio, 0, 0.5, 0, 1);
  }

  update(): void {
    this.sharedUniforms.u_activeRatio.value = this.activeRatio;
  }
}

export const heroScene = new HeroScene();
