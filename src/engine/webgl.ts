// WebGL app — port of the source App + Visuals orchestration (pretty line
// 30174-30216) restricted to the subsystems ported so far: gobo, bg,
// heroScene (staged), coaster, plus the HandScene camera/coaster animation
// choreography. Postprocessing renders directly until the post chain lands.

import { Scene, Vector3 } from 'three';
import { WebGLRenderer } from 'three';
import type { BufferGeometry } from 'three';
import { blueNoise } from './core/blueNoise';
import { cameraControls } from './core/cameraControls';
import { fboHelper } from './core/fboHelper';
import { loader } from './core/Loader';
import { fit } from './core/math';
import { properties } from './core/properties';
import { scrollManager } from './core/ScrollPane';
import * as settings from './core/settings';
import { shaderHelper } from './core/shaderHelper';
import { textureHelper } from './core/textureHelper';
import { FrameAnimation } from './FrameAnimation';
import {
  aces,
  cart2Polar,
  hsb2rgb,
  linearstep,
  perturbNormalArb,
  rgb2hsb,
  sampleBlur,
  sampleBlurSRGB,
  sampleHarmonics,
  sdCappedCone,
  taaJitteringFrag,
  taaJitteringFragPars,
  taaJitteringVert,
  textureBicubic,
} from './glsl';
import { bg } from './scenes/bg';
import { bindHeroScene, coaster } from './scenes/coaster';
import { gobo } from './scenes/gobo';
import { fov, heroScene } from './scenes/heroScene';

// Source HandScene constants: hand appears between these hero-camera frames.
const HAND_FRAME_START = 47;

class WebGLApp {
  scene = new Scene();
  cameraAnimation = new FrameAnimation();
  coasterAnimation = new FrameAnimation();
  private aiSection: HTMLElement | null = null;
  private heroSection: HTMLElement | null = null;

  /** Source App.initEngine (renderer/chunk/helpers) — needs the canvas. */
  initEngine(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2', properties.webglOpts) as WebGL2RenderingContext;
    properties.renderer = new WebGLRenderer({ canvas, context: gl });
    // Source: TAAPerspectiveCamera(20, 1, .2, 3)
    properties.camera.fov = 20;
    properties.camera.aspect = 1;
    properties.camera.near = 0.2;
    properties.camera.far = 3;
    this.scene.add(properties.camera);
    shaderHelper.addChunk('textureBicubic', textureBicubic);
    shaderHelper.addChunk('sampleBlur', sampleBlur);
    shaderHelper.addChunk('sampleBlurSRGB', sampleBlurSRGB);
    shaderHelper.addChunk('hsb2rgb', hsb2rgb);
    shaderHelper.addChunk('rgb2hsb', rgb2hsb);
    shaderHelper.addChunk('linearstep', linearstep);
    shaderHelper.addChunk('sampleHarmonics', sampleHarmonics);
    shaderHelper.addChunk('sdCappedCone', sdCappedCone);
    shaderHelper.addChunk('perturbNormalArb', perturbNormalArb);
    shaderHelper.addChunk('cart2Polar', cart2Polar);
    shaderHelper.addChunk('aces', aces);
    shaderHelper.addChunk('taaJitteringVert', taaJitteringVert);
    shaderHelper.addChunk('taaJitteringFrag', taaJitteringFrag);
    shaderHelper.addChunk('taaJitteringFragPars', taaJitteringFragPars);
    fboHelper.init(properties.renderer, settings.RENDER_TARGET_FLOAT_TYPE);
    textureHelper.init();
    blueNoise.preInit();
  }

  /** Source App.preInit + Visuals.preInit (ported subset, source order). */
  preInit(): void {
    cameraControls.preInit();
    properties.sharedUniforms.u_brdfLut.value = loader.add(settings.TEXTURE_PATH + 'brdf.png', {
      type: 'texture',
    }).content;
    gobo.preInit();
    bg.preInit();
    this.scene.add(bg.container);
    bindHeroScene(heroScene);
    heroScene.preInit();
    this.scene.add(heroScene.container);
    coaster.preInit();
    this.scene.add(coaster.container);
    // HandScene animations (source HandScene.preInit).
    loader.add(settings.MODEL_PATH + 'hero_camera.buf', {
      onLoad: (content) => this.cameraAnimation.setGeometry(content as BufferGeometry),
    });
    loader.add(settings.MODEL_PATH + 'coaster_hero_animation.buf', {
      onLoad: (content) => this.coasterAnimation.setGeometry(content as BufferGeometry),
    });
  }

  /** Source App.init + Visuals.init (ported subset, source order). */
  init(): void {
    cameraControls.init();
    gobo.init();
    bg.init();
    heroScene.init();
    coaster.init();
    this.coasterAnimation.setTarget(coaster.container);
    this.aiSection = document.getElementById('ai');
    this.heroSection = document.getElementById('hero');
  }

  resize(): void {
    if (!properties.renderer) return;
    // Source _onResize resolution math (pretty line 30496-30509).
    const viewportWidth = (properties.viewportWidth = window.innerWidth);
    const viewportHeight = (properties.viewportHeight = window.innerHeight);
    properties.viewportResolution.set(viewportWidth, viewportHeight);
    document.documentElement.style.setProperty('--vh', viewportHeight * 0.01 + 'px');
    properties.useMobileLayout = viewportWidth < 768;
    properties.sharedUniforms.u_useMobileLayout.value = properties.useMobileLayout;
    const heroInner = document.querySelector('#hero .section__inner');
    if (heroInner) {
      const style = getComputedStyle(heroInner);
      properties.paddingX = parseFloat(style.getPropertyValue('padding-left'));
      properties.paddingY = parseFloat(style.getPropertyValue('padding-top'));
    }
    const upScale = settings.UP_SCALE;
    let renderWidth = viewportWidth * settings.DPR;
    let renderHeight = viewportHeight * settings.DPR;
    if (settings.USE_PIXEL_LIMIT === true && renderWidth * renderHeight > settings.MAX_PIXEL_COUNT) {
      const aspect = renderWidth / renderHeight;
      renderHeight = Math.sqrt(settings.MAX_PIXEL_COUNT / aspect);
      renderWidth = Math.ceil(renderHeight * aspect);
      renderHeight = Math.ceil(renderHeight);
    }
    properties.width = Math.ceil(renderWidth / upScale);
    properties.height = Math.ceil(renderHeight / upScale);
    properties.resolution.set(properties.width, properties.height);
    // Source App.resize.
    properties.renderer.setSize(properties.width, properties.height);
    const canvas = properties.renderer.domElement;
    canvas.style.width = `${properties.viewportWidth}px`;
    canvas.style.height = `${properties.viewportHeight}px`;
    properties.camera.aspect = properties.width / properties.height;
    properties.camera.updateProjectionMatrix();
    heroScene.resize(properties.width, properties.height);
  }

  /** Source App.update + Visuals.preUpdate/update + HandScene choreography. */
  update(dt: number): void {
    if (!properties.renderer) return;
    properties.time = properties.sharedUniforms.u_time.value += dt;
    properties.deltaTime = properties.sharedUniforms.u_deltaTime.value = dt;
    properties.bgColor.setStyle(properties.bgColorHex);
    blueNoise.update();
    cameraControls.preUpdate();
    // Visuals.preUpdate order: gobo.reset, coaster.resetTransform, bg/heroScene/…
    gobo.reset();
    coaster.resetTransform();
    bg.preUpdate();
    heroScene.preUpdate();
    this.updateHandSceneChoreography();
    cameraControls.update(dt);
    gobo.update(dt);
    bg.update();
    heroScene.update(dt);
    coaster.update();
    properties.renderer.render(this.scene, properties.camera);
    properties.tick++;
  }

  /**
   * Source AiSection.update -> HandScene.preUpdate wiring:
   * animationRatio = fit(aiRange.showScreenOffset, 0, 5.5, 0, 1), applied to
   * hero camera + coaster tracks; fov pinned to the hero constant; hero/bg
   * colors from the source HandScene.preUpdate.
   */
  private updateHandSceneChoreography(): void {
    let offset = 0;
    if (this.aiSection) {
      offset = scrollManager.getDomRange(this.aiSection).showScreenOffset;
    }
    const ratio = fit(offset, 0, 5.5, 0, 1);
    const frame = ratio * (this.cameraAnimation.frameCount - 1);
    // Source HeroSection.update: activeRatio from the HERO container's
    // hideScreenOffset (pretty line 21205).
    if (this.heroSection) {
      heroScene.activeRatio = fit(
        scrollManager.getDomRange(this.heroSection).hideScreenOffset,
        -1,
        -0.5,
        1,
        0,
      );
    }
    // Source HeroSection.update: heroScene.isActive = activeRatio > 0.
    heroScene.isActive = heroScene.activeRatio > 0;
    // Source HandScene: 3D content hides once the hand phase ends (r ~9).
    coaster.isActive = offset < 9;
    this.coasterAnimation.applyTransformByRatio(ratio);
    // Camera track drives cameraControls (not the camera directly).
    this.cameraAnimation.setTarget(cameraControls as never);
    this.cameraAnimation.applyTransformByRatio(ratio);
    cameraControls.fov = fov;
    bg.opacity = 1;
    bg.clearColorRatio = fit(frame, HAND_FRAME_START * 0.5, HAND_FRAME_START, 1, 0);
    if (ratio < 1) {
      bg.bgColor.set('#4c3e37').convertSRGBToLinear();
    }
    // env blend toward the hand env over frames 47..73 (source line 19987).
    coaster.envBlendRatio = fit(frame, 47, 73, 0, 1);
    coaster.lightPosition.lerp(_handLightPosition, fit(frame, 47, 73, 0, 1));
    coaster.extraBumpScale = fit(ratio, 0.45, 0.5, 1.75, 0);
  }
}

// Source HandScene.coasterLightPosition.
const _handLightPosition = new Vector3(0.0237565, 0.77265, 0.435661);

export const webglApp = new WebGLApp();
