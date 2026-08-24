// 1:1 port of the source StackScene (pretty 28308-28366): the product coaster
// tower. Drives the stack_camera.buf frame animation, the innerContainer
// tumble (fold-up + triple spin around (1,1,1)), the bg framing/clear-color
// blend, the pro/proMax stacking ratios and the stacked coaster uniforms
// (halo, env blend, image-based overlay from coaster/STACK.webp).

import { Euler, Matrix4, Object3D, Quaternion, SRGBColorSpace, Vector3 } from 'three';
import type { Texture } from 'three';
import { FrameAnimation } from '../FrameAnimation';
import { cameraControls } from '../core/cameraControls';
import { loader } from '../core/Loader';
import { fit, saturate } from '../core/math';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { postprocessing } from '../post/postprocessing';
import { PostProfile } from '../post/PostProfile';
import { bg } from './bg';
import { coaster } from './coaster';
import { heroScene } from './heroScene';
import { productSection } from '../sections/productSection';

const _e = new Euler();
const _q = new Quaternion();
const _v0 = new Vector3();
const _v1 = new Vector3();
const POST_PROFILE = new PostProfile({
  bloomAmount: 6,
  bloomSelectiveStrength: 4,
  bloomSaturation: 2,
});

export class StackScene {
  container = new Object3D();
  isActive = false;
  animation = 0;
  fromViewOffsetX = 0;
  fromViewOffsetY = 0;
  viewOffsetX = 0;
  viewOffsetY = 0;
  cameraAnimation = new FrameAnimation();
  isOryzoProActive = false;
  oryzoProRatio = 0;
  isOryzoProMaxActive = false;
  oryzoProMaxRatio = 0;
  lightPosition = new Vector3(-1, 0.125, -0.5);
  coasterImgBaseMVP!: Matrix4;
  coasterImgBaseTexture: Texture | null = null;

  preInit(): void {
    this.cameraAnimation.viewPixelWidth = 2240;
    this.cameraAnimation.viewPixelHeight = 1260;
    this.cameraAnimation.preInit(cameraControls as never, settings.MODEL_PATH + 'stack_camera.buf');
    this.coasterImgBaseMVP = new Matrix4(
      5.24828, -0.203069, -0.456906, 0.247969,
      0, 8.61441, -4.37579, 0.172101,
      0, 0.020409, 0.0459202, -0.0299466,
      0, -0.406138, -0.913812, 0.495937,
    );
    productSection.onOptionChanged.add((option: number) => {
      this.isOryzoProActive = option >= 1;
      this.isOryzoProMaxActive = option === 2;
    });
  }

  init(): void {
    this.coasterImgBaseTexture = loader.load(settings.TEXTURE_PATH + 'coaster/STACK.webp', {
      type: 'texture',
      colorSpace: SRGBColorSpace,
      autoMobile: true,
    }).content as Texture;
  }

  resize(_width: number, _height: number): void {}

  preUpdate(dt: number): void {
    const t = this.animation;
    coaster.areStackMeshesActive = this.isActive;
    let profileRatio = fit(t, 2, 3, 0, 1);
    profileRatio = fit(t, 3.5, 4, profileRatio, 0);
    postprocessing.blendProfile(POST_PROFILE, profileRatio);
    if (this.isActive) {
      bg.opacity = fit(this.animation, 2, 3, 1, 0);
      bg.opacity = 1;
      bg.renderOrder = -10;
      coaster.isActive = true;
      const r = fit(this.animation, 2, 3, 0, 1);
      this.cameraAnimation.applyTransformByRatio(r);
      if (this.animation < 1) {
        cameraControls.needsClipping = true;
        cameraControls.clipScissor.set(0, 0, properties.width, properties.height * this.animation);
        (bg.mesh as unknown as { needsClipping: boolean }).needsClipping = true;
        (coaster.mesh as unknown as { needsClipping: boolean }).needsClipping = true;
      }
      cameraControls.viewOffsetX = this.viewOffsetX;
      cameraControls.viewOffsetY = this.viewOffsetY;
      const bgSize = Math.min(1, properties.height / properties.width);
      bg.size.set(bgSize, bgSize);
      bg.clearColorRatio = r;
      const a = fit(this.animation, 0.98, 1.05, 1, 0);
      bg.offset.set(0.5, 1 + r + 0 * a);
      coaster.container.position.set(0, 0, 0);
      coaster.container.quaternion.set(0, 0, 0, 1);
      coaster.innerContainer.position.set(0, -0.00860424, 0);
      _e.set(fit(this.animation, 2, 3, Math.PI / 2, 0), 0, 0);
      _q.setFromEuler(_e);
      coaster.innerContainer.position.applyQuaternion(_q);
      coaster.innerContainer.quaternion.premultiply(_q);
      const spin = fit(this.animation, 1, 2, 0, Math.PI * 2 * -3);
      _q.setFromAxisAngle(_v0.set(1, 1, 1).normalize(), spin);
      coaster.innerContainer.position.applyQuaternion(_q);
      coaster.innerContainer.quaternion.premultiply(_q);
      properties.cameraLookStrength = 0.05;
      const cameraDistance = _v0
        .set(0, 0, -1)
        .applyQuaternion(cameraControls.quaternion)
        .dot(_v1.copy(coaster.innerContainer.position).sub(cameraControls.position));
      properties.cameraDistance = cameraDistance;
      this.oryzoProRatio = saturate(this.oryzoProRatio + 2 * dt * (this.isOryzoProActive ? 1 : -1));
      this.oryzoProMaxRatio = saturate(
        this.oryzoProMaxRatio + 2 * dt * (this.isOryzoProMaxActive ? 0.8 : -1.2),
      );
      const stackReveal = fit(this.animation, 2.7, 3, 0, 1);
      coaster.oryzoProRatio = stackReveal * this.oryzoProRatio;
      coaster.oryzoProMaxRatio = stackReveal * this.oryzoProMaxRatio;
      cameraControls.viewOffsetY -= 0.015 * this.oryzoProRatio;
      cameraControls.viewOffsetY -= 0.015 * this.oryzoProMaxRatio;
      coaster.lightPosition.copy(heroScene.coasterLightPosition);
      coaster.lightPosition.z *= -1;
      coaster.lightPosition.lerp(this.lightPosition, r);
      coaster.stackedSharedUniforms.u_haloIntensity.value = fit(this.animation, 0.5, 1.2, 1, 0);
      coaster.stackedSharedUniforms.u_blendEnvRatio.value = fit(this.animation, 2.3, 2.925, 0, 1);
      coaster.imgBasedTexture = this.coasterImgBaseTexture;
      coaster.imgBasedMVP.copy(this.coasterImgBaseMVP);
      coaster.imgBasedOpacity = fit(this.animation, 2.925, 3, 0, 1);
    }
  }

  update(_dt: number): void {}
}

export const stackScene = new StackScene();
