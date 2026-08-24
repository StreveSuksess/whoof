// 1:1 port of the source HandScene (pretty line 19941-19992): hero camera and
// coaster flight tracks, hand activation window and env/light blending.
// postprocessing.blendProfile calls are deferred until the post chain lands.

import { Object3D, RepeatWrapping, Vector3 } from 'three';
import type { IUniform, Texture } from 'three';
import { cameraControls } from '../core/cameraControls';
import { loader } from '../core/Loader';
import { fit } from '../core/math';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { textureHelper } from '../core/textureHelper';
import { FrameAnimation } from '../FrameAnimation';
import { postprocessing } from '../post/postprocessing';
import { PostProfile } from '../post/PostProfile';
import { bg } from './bg';
import { coaster } from './coaster';
import { hand } from './hand';
import { fov } from './heroScene';

// Source constants (pretty line 19929-19930).
export const HAND_FRAME_START = 71;
export const HAND_FRAME_END = 116;

const _v0 = new Vector3();
const _v1 = new Vector3();
// Source POST_PROFILE$6 / APPLE_PROFILE (pretty line 19933-19940).
const POST_PROFILE = new PostProfile({ bloomAmount: 1.4, bloomLumaStrength: 0.2 });
const APPLE_PROFILE = new PostProfile({ bloomAmount: 3, bloomSelectiveStrength: 1 });

class HandScene {
  container = new Object3D();
  frame = 0;
  animationRatio = 0;
  fingersActiveRatio = 0;
  handOpacity = 1;
  isActive = false;
  cameraAnimation = new FrameAnimation();
  coasterAnimation = new FrameAnimation();
  coasterLightPosition = new Vector3(0.0237565, 0.77265, 0.435661);
  highlightRatio = 0;
  viewOffsetY = 0;
  sharedUniforms = {
    u_envTexture: { value: null as Texture | null },
    u_specEnvTexture: { value: null as Texture | null },
  };

  preInit(): void {
    this.cameraAnimation.preInit(cameraControls as never, settings.MODEL_PATH + 'hero_camera.buf');
    this.coasterAnimation.preInit(coaster.container, settings.MODEL_PATH + 'coaster_hero_animation.buf');
    this.sharedUniforms.u_envTexture.value = textureHelper.loadRGBMTexture(
      settings.TEXTURE_PATH + 'hero/env_hand.webp',
      { maxRange: 20 },
    );
    this.sharedUniforms.u_specEnvTexture.value = loader.add(
      settings.TEXTURE_PATH + 'hero/env_hand_spec_20.webp',
      { type: 'texture', wrapS: RepeatWrapping },
    ).content as Texture;
    hand.preInit();
    this.container.add(hand.container);
  }

  init(): void {
    hand.init();
  }

  resize(): void {
    hand.resize();
  }

  preUpdate(): void {
    const ratio = this.animationRatio;
    this.container.visible = this.isActive;
    hand.opacity = this.handOpacity;
    postprocessing.blendProfile(POST_PROFILE, fit(ratio, 0, 0.1, 0, 1));
    postprocessing.blendProfile(APPLE_PROFILE, this.highlightRatio);
    const frame = ratio * (this.cameraAnimation.frameCount - 1);
    this.coasterAnimation.applyTransformByRatio(ratio);
    this.cameraAnimation.applyTransformByRatio(ratio);
    cameraControls.fov = fov;
    bg.opacity = ratio > 0 ? 1 : 0;
    bg.clearColorRatio = fit(frame, HAND_FRAME_START * 0.5, HAND_FRAME_START, 1, 0);
    if (ratio < 1) bg.bgColor.set('#4c3e37').convertSRGBToLinear();
    const handPhase = fit(frame, 0, HAND_FRAME_START, 0, 1);
    if (properties.useMobileLayout) {
      const mobilePhase = fit(frame, HAND_FRAME_START * 0.5, HAND_FRAME_START, 0, 1);
      cameraControls.viewOffsetY = fit(mobilePhase, 0, 1, cameraControls.viewOffsetY, this.viewOffsetY);
      cameraControls.zoom = fit(mobilePhase, 0, 1, cameraControls.zoom, 1 / (1 - this.viewOffsetY));
    }
    properties.cameraLookStrength = fit(
      handPhase * this.handOpacity,
      0,
      1,
      properties.cameraLookStrength,
      0.1,
    );
    const coasterDistance = _v0
      .set(0, 0, -1)
      .applyQuaternion(cameraControls.quaternion)
      .dot(_v1.copy(coaster.container.position).sub(cameraControls.position));
    properties.cameraDistance = fit(handPhase, 0, 1, properties.cameraDistance, coasterDistance);
    if (this.isActive) {
      hand.animationRatio = fit(frame, HAND_FRAME_START, HAND_FRAME_END - 1, 0, 1) * this.handOpacity;
      hand.fingersActiveRatio = this.fingersActiveRatio;
      hand.highlightRatio = this.highlightRatio;
      hand.preUpdate();
    }
    coaster.extraBumpScale = fit(ratio, 0.45, 0.5, 1.75, 0);
    coaster.envTexture2Uniform = this.sharedUniforms.u_envTexture as IUniform;
    coaster.envBlendRatio = fit(frame, 47, 73, 0, 1);
    coaster.lightPosition.lerp(this.coasterLightPosition, fit(frame, 47, 73, 0, 1));
    coaster.handSectionHighlightRatio = this.highlightRatio;
  }

  update(dt: number): void {
    if (this.isActive) hand.update(dt);
  }
}

export const handScene = new HandScene();
