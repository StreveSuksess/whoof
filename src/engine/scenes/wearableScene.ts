// 1:1 port of the source WearableScene (pretty 20259-20313): the condom
// tear-off choreography around the coaster, driven by the wearable section's
// table cluster (it reads tableCoffee state).

import { Euler, Matrix4, Object3D, Quaternion, Vector3, Vector4 } from 'three';
import { cameraControls } from '../core/cameraControls';
import { ease } from '../core/ease';
import { fit, mix } from '../core/math';
import { properties } from '../core/properties';
import { scrollManager } from '../core/ScrollPane';
import * as settings from '../core/settings';
import { FrameAnimation } from '../FrameAnimation';
import { postprocessing } from '../post/postprocessing';
import { PostProfile } from '../post/PostProfile';
import { coaster } from './coaster';
import { wearableCondom } from './wearableCondom';
import { wearableFrame } from './wearableFrame';
import { wearableRise } from './wearableRise';
import { wearableText } from './wearableText';

// Source module state (pretty 20259-20274).
const _e = new Euler();
const _q = new Quaternion();
const _rotX = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2).normalize();
const _rotZ = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI).normalize();
const _m = new Matrix4();
const _v0 = new Vector3();
const _v1 = new Vector3();
const coasterAnimation = new FrameAnimation();
const coasterDummy = new Object3D();
let _forceHasMoved = false;

export function forceWearableHasMoved(): void {
  _forceHasMoved = true;
}

const POST_PROFILE = new PostProfile({
  bloomSelectiveStrength: 1,
  bloomSaturation: 1.5,
  haloMaskInner: 0.1,
  haloMaskOuter: 0.2,
});

export class WearableScene {
  container = new Object3D();
  container3d = new Object3D();
  clipScissor = new Vector4();
  animation = 0;
  hasMoved = false;
  frameZoom = 1;
  coasterLightPosition = new Vector3(0.0237565, 0.77265, 0.435661);
  wearableLightPosition = new Vector3(-10, -2, 6);

  preInit(): void {
    this.container.add(this.container3d);
    wearableText.preInit();
    this.container.add(wearableText.container);
    wearableCondom.preInit();
    this.container3d.add(wearableCondom.container);
    coasterAnimation.preInit(coasterDummy, settings.MODEL_PATH + 'wearable/coaster_first.buf');
    wearableFrame.preInit();
    this.container3d.add(wearableFrame.container);
    wearableRise.preInit();
    postprocessing.magazineLayer.scene.add(wearableRise.container);
  }

  init(): void {
    wearableText.init();
    wearableCondom.init();
    wearableFrame.init();
    wearableRise.init();
  }

  resize(width: number, height: number): void {
    wearableRise.resize(width, height);
    _forceHasMoved = true;
  }

  preUpdate(dt: number): void {
    const t = this.animation;
    const isActive = t > 0 && t < 6;
    coaster.isActive = t <= 3;
    this.hasMoved = _forceHasMoved || scrollManager.isScrolling;
    _forceHasMoved = false;
    POST_PROFILE.bloomAmount = mix(1, 2, fit(t, 1.5, 1.7, 0, 1) * fit(t, 1.8, 2.5, 1, 0));
    POST_PROFILE.haloStrength = mix(0.05, 0, fit(t, 1.8, 2.5, 0, 1));
    postprocessing.blendProfile(POST_PROFILE, fit(t, 0, 1, 0, 1));
    const r = fit(t, 0, 1, 0, 1);
    const o = fit(t, 1, 2, 0, 1);
    const container3d = this.container3d;
    container3d.position.copy(coaster.container.position);
    container3d.quaternion.copy(coaster.container.quaternion);
    container3d.scale.copy(coaster.container.scale);
    container3d.quaternion.premultiply(_rotZ);
    container3d.quaternion.premultiply(_rotX);
    let lookStrength = properties.cameraLookStrength;
    lookStrength = fit(t, 0, 0.5, lookStrength, 0.2);
    properties.cameraLookStrength = fit(t, 1.4, 1.75, lookStrength, 0);
    let zoom = 1;
    if (isActive) {
      _q.setFromEuler(_e.set(0, Math.PI * 2 * r, 0));
      container3d.quaternion.multiply(_q);
      _q.setFromEuler(_e.set(0, 0, Math.PI * 2 * r));
      coaster.container.quaternion.multiply(_q);
      coaster.innerContainer.position.y -= fit(r, 0, 0.15, 0, 0.0086);
      wearableCondom.opacity = fit(r, 0.75, 0.85, 0, o < 1 ? 1 : 0);
      wearableCondom.tearRatio = o;
      wearableCondom.preUpdate(dt);
      if (t >= 1.55) {
        coasterAnimation.applyTransformByRatio(fit(t, 1.55, 2.6, 0, 1));
        coasterDummy.updateMatrix();
        _m.compose(_v0.set(0, 0, 0), cameraControls.quaternion, _v1.set(1, 1, 1));
        coasterDummy.matrix.premultiply(_m);
        _m.invert();
        coasterDummy.matrix.multiply(_m);
        coasterDummy.matrix.decompose(
          coaster.innerContainer.position,
          coaster.innerContainer.quaternion,
          coaster.innerContainer.scale,
        );
      }
      wearableFrame.isActive = t > 2 && t < 4;
      wearableFrame.showRatio = fit(t, 2, 2.8, 0, 1);
      wearableFrame.hideRatio = fit(t, 3, 4, 0, 1);
      wearableText.pulseRatio = fit(t, 1.55, 2, 0, 1);
      wearableText.glowRatio = fit(t, 3, 4, 1, 0);
      zoom = fit(t, 1.55, 2, 1, 1.5);
      zoom = fit(t, 2, 2.8, zoom, 1, ease.cubicOut);
      wearableFrame.preUpdate(dt);
      if (wearableFrame.isActive) {
        cameraControls.needsClipping = true;
        cameraControls.clipScissor
          .copy(this.clipScissor)
          .multiplyScalar(properties.width / properties.viewportWidth);
      }
      wearableRise.preUpdate(dt);
    }
    coaster.sharedUniforms.u_zoom.value = zoom;
    const condomRatio = fit(t, 0.3, 1, 0, 1) * fit(t, 1, 2, 1, 0);
    coaster.lightPosition.lerp(this.coasterLightPosition, condomRatio);
    coaster.condomSceneRatio = condomRatio;
    coaster.lightPosition.lerp(this.wearableLightPosition, fit(t, 2, 2.6, 0, 1));
    coaster.wearableBlendingRatio = fit(t, 2, 2.6, 0, 1);
    if (properties.useMobileLayout) {
      cameraControls.zoom = fit(t, 0, 1, cameraControls.zoom, this.frameZoom);
    }
    postprocessing.magazineLayer.enabled = wearableRise.isActive;
  }

  update(dt: number): void {
    const t = this.animation;
    const isActive = t > 0 && t < 6;
    this.container.visible = isActive;
    wearableText.activeRatio = fit(t, 5, 6, 1, 0);
    if (isActive) {
      wearableText.update(dt);
      wearableCondom.update(dt);
      wearableFrame.update(dt);
      wearableRise.update(dt);
    }
  }
}

export const wearableScene = new WearableScene();
