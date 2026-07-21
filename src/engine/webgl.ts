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
import { handScene } from './scenes/handScene';
import { heroScene } from './scenes/heroScene';

class WebGLApp {
  scene = new Scene();
  private aiSection: HTMLElement | null = null;
  private heroSection: HTMLElement | null = null;
  private wearableSection: HTMLElement | null = null;

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
    handScene.preInit();
    this.scene.add(handScene.container);
    coaster.preInit();
    this.scene.add(coaster.container);
  }

  /** Source App.init + Visuals.init (ported subset, source order). */
  init(): void {
    cameraControls.init();
    gobo.init();
    bg.init();
    heroScene.init();
    handScene.init();
    coaster.init();
    this.aiSection = document.getElementById('ai');
    this.heroSection = document.getElementById('hero');
    this.wearableSection = document.getElementById('wearable');
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
    handScene.resize();
  }

  /** Source App.update + Visuals.preUpdate/update + HandScene choreography. */
  update(dt: number): void {
    if (!properties.renderer) return;
    properties.time = properties.sharedUniforms.u_time.value += dt;
    properties.deltaTime = properties.sharedUniforms.u_deltaTime.value = dt;
    properties.bgColor.setStyle(properties.bgColorHex);
    blueNoise.update();
    this.updateSectionDriving();
    cameraControls.preUpdate();
    // Visuals.preUpdate order: gobo.reset, coaster.resetTransform, bg/heroScene/…
    gobo.reset();
    coaster.resetTransform();
    bg.preUpdate();
    heroScene.preUpdate();
    handScene.preUpdate();
    cameraControls.update(dt);
    gobo.update(dt);
    bg.update();
    heroScene.update(dt);
    handScene.update(dt);
    coaster.update();
    properties.renderer.render(this.scene, properties.camera);
    properties.tick++;
  }

  /**
   * Stand-in for the not-yet-ported DOM section classes, feeding the scene
   * singletons exactly as the source sections do:
   * - HeroSection.update (pretty 21205-21206): heroScene.activeRatio from the
   *   hero container's hideScreenOffset; isActive = activeRatio > 0
   * - AiSection.update (pretty 21368): handScene ratios from the AI
   *   container's showScreenOffset
   * - WearableScene.preUpdate (pretty 20296): coaster.isActive = t <= 3
   */
  private updateSectionDriving(): void {
    if (this.heroSection) {
      const heroRange = scrollManager.getDomRange(this.heroSection);
      heroScene.activeRatio = fit(heroRange.hideScreenOffset, -1, -0.5, 1, 0);
      heroScene.isActive = heroScene.activeRatio > 0;
    }
    if (this.aiSection) {
      const r = scrollManager.getDomRange(this.aiSection).showScreenOffset;
      const aiActive = scrollManager.getDomRange(this.aiSection).isActive;
      handScene.animationRatio = fit(r, 0, 5.5, 0, 1);
      handScene.fingersActiveRatio = fit(r, 5.5, 6, 0, 1) * fit(r, 7.5, 8, 1, 0);
      handScene.handOpacity = fit(r, 8, 9, 1, 0);
      handScene.isActive =
        aiActive || handScene.animationRatio === 0 || handScene.handOpacity > 0;
      handScene.highlightRatio = fit(r, 5.5, 6, 0, 1) * fit(r, 7.5, 8, 1, 0);
    }
    if (this.wearableSection) {
      const t = scrollManager.getDomRange(this.wearableSection).showScreenOffset;
      coaster.isActive = t <= 3;
    }
  }
}

export const webglApp = new WebGLApp();
