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
import { blurBox } from './post/BlurBox';
import { postprocessing } from './post/postprocessing';
import { PostProfile } from './post/PostProfile';
import { screenPaint } from './post/ScreenPaint';
import { ease } from './core/ease';
import { bg } from './scenes/bg';
import { bindHeroScene, coaster } from './scenes/coaster';
import { gobo } from './scenes/gobo';
import { handScene } from './scenes/handScene';
import { heroScene } from './scenes/heroScene';
import { sketches } from './scenes/sketches';
import { stackScene } from './scenes/stackScene';
import { sustainabilityScene } from './scenes/sustainabilityScene';
import { tableScene } from './scenes/tableScene';
import { wearableScene } from './scenes/wearableScene';
import { encryptionSection } from './sections/encryptionSection';
import { featuresSection } from './sections/featuresSection';
import { gripSection } from './sections/gripSection';
import { sustainabilitySection } from './sections/sustainabilitySection';
import { testimoniesSection } from './sections/testimoniesSection';
import { productSection } from './sections/productSection';
import { wearableSection } from './sections/wearableSection';

const DEFAULT_POST_PROFILE = new PostProfile();

class WebGLApp {
  scene = new Scene();
  private aiSection: HTMLElement | null = null;
  private heroSection: HTMLElement | null = null;
  private heroInner: Element | null = null;
  private heroCard: HTMLElement | null = null;
  private wearableSection: HTMLElement | null = null;

  /** Source App.initEngine (renderer/chunk/helpers) — needs the canvas. */
  initEngine(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2', properties.webglOpts) as WebGL2RenderingContext;
    properties.drawBuffersExt = gl.getExtension('OES_draw_buffers_indexed');
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
    postprocessing.init(this.scene, properties.camera);
    blueNoise.preInit();
    screenPaint.init();
    postprocessing.addQueue();
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
    wearableScene.preInit();
    this.scene.add(wearableScene.container);
    tableScene.preInit();
    this.scene.add(tableScene.container);
    sustainabilityScene.preInit();
    this.scene.add(sustainabilityScene.container);
    stackScene.preInit();
    this.scene.add(stackScene.container);
    coaster.preInit();
    this.scene.add(coaster.container);
    sketches.preInit();
    this.scene.add(sketches.container);
  }

  /** Source App.init + Visuals.init (ported subset, source order). */
  init(): void {
    postprocessing.updateSmaaTextures();
    cameraControls.init();
    gobo.init();
    bg.init();
    heroScene.init();
    handScene.init();
    wearableScene.init();
    tableScene.init();
    sustainabilityScene.init();
    stackScene.init();
    coaster.init();
    sketches.init();
    wearableSection.preInit(document.documentElement);
    wearableSection.init();
    wearableSection.resize();
    featuresSection.preInit(document.documentElement);
    featuresSection.init();
    featuresSection.resize();
    encryptionSection.preInit(document.documentElement);
    encryptionSection.init();
    encryptionSection.resize();
    gripSection.preInit(document.documentElement);
    gripSection.init();
    gripSection.resize();
    sustainabilitySection.preInit(document.documentElement);
    sustainabilitySection.init();
    sustainabilitySection.resize();
    testimoniesSection.preInit(document.documentElement);
    testimoniesSection.init();
    testimoniesSection.resize(properties.width, properties.height);
    productSection.preInit(document.documentElement);
    productSection.init();
    productSection.resize(properties.width, properties.height);
    this.aiSection = document.getElementById('ai');
    this.heroSection = document.getElementById('hero');
    this.heroInner = this.heroSection?.querySelector('.section__inner') ?? null;
    this.heroCard = document.getElementById('hero-card');
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
    postprocessing.setSize(properties.width, properties.height);
    screenPaint.resize(properties.width, properties.height);
    heroScene.resize(properties.width, properties.height);
    handScene.resize();
    wearableScene.resize(properties.width, properties.height);
    tableScene.resize(properties.width, properties.height);
    if (properties.hasInitialized) {
      wearableSection.resize();
      featuresSection.resize();
      encryptionSection.resize();
      gripSection.resize();
      sustainabilitySection.resize();
      testimoniesSection.resize(properties.width, properties.height);
      productSection.resize(properties.width, properties.height);
    }
    sustainabilityScene.resize();
    stackScene.resize(properties.width, properties.height);
  }

  /** Source App.update + Visuals.preUpdate/update + HandScene choreography. */
  update(dt: number): void {
    if (!properties.renderer) return;
    properties.time = properties.sharedUniforms.u_time.value += dt;
    properties.deltaTime = properties.sharedUniforms.u_deltaTime.value = dt;
    properties.bgColor.setStyle(properties.bgColorHex);
    blueNoise.update();
    this.updateSectionDriving();
    cameraControls.preUpdate(dt);
    // Visuals.preUpdate order: profile reset, gobo.reset, coaster.resetTransform, …
    postprocessing.blendProfile(DEFAULT_POST_PROFILE, 1);
    gobo.reset();
    coaster.resetTransform();
    bg.preUpdate();
    heroScene.preUpdate();
    handScene.preUpdate();
    wearableScene.preUpdate(dt);
    tableScene.preUpdate(dt);
    sustainabilityScene.preUpdate(dt);
    stackScene.preUpdate(dt);
    postprocessing.syncProfile();
    // Source App.update: screenPaint.update between visuals.preUpdate and
    // cameraControls.update.
    screenPaint.update(dt);
    cameraControls.update(dt);
    gobo.update(dt);
    bg.update();
    heroScene.update(dt);
    handScene.update(dt);
    wearableScene.update(dt);
    tableScene.update(dt);
    sustainabilityScene.update(dt);
    stackScene.update(dt);
    coaster.update();
    sketches.update(dt);
    // Source Visuals.update tail: tableScene/footerScene postUpdate after the
    // scene updates.
    tableScene.postUpdate(dt);
    postprocessing.render(this.scene, properties.camera, true);
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
    // Source pagesManager.update (pretty 29496): blurBox resets before the
    // section updates re-anchor it each frame.
    blurBox.reset();
    if (this.heroSection) {
      const heroRange = scrollManager.getDomRange(this.heroSection);
      const l = (heroScene.activeRatio = fit(heroRange.hideScreenOffset, -1, -0.5, 1, 0));
      heroScene.isActive = l > 0;
      // HeroSection.update tail (pretty 21257): logo choreography also flips
      // the scroll indicator into its button state while the hero is active.
      scrollManager.isBtn = l > 0.99;
      // HeroSection.update blurBox block (pretty 21210-21215): the hero card
      // backdrop blur/tint, anchored to #hero-card each frame while active.
      if (heroScene.isActive && this.heroInner && this.heroCard) {
        const startTime = properties.startTime;
        const innerRange = scrollManager.getDomRange(this.heroInner);
        const cardRange = scrollManager.getDomRange(this.heroCard);
        const b = fit(startTime, 0.5, 1, -properties.paddingX, 0, ease.cubicOut);
        blurBox.anchor(cardRange);
        blurBox.x += b;
        blurBox.outline = 1;
        blurBox.y = cardRange.screenY - innerRange.screenY;
        blurBox.color.setStyle('#FFEDD6');
        const S = fit(l * 1.5, 0, 1, 0, 1) * fit(startTime, 0.5, 1.5, 0, 1);
        const A = fit(l * 1.5, 0.5, 1.5, 0, 1) * fit(startTime, 1, 2, 0, 1);
        blurBox.colorAlphaA = 0.15 * S;
        blurBox.colorAlphaB = 0.15 * A;
        blurBox.blurRadiusA = 0.08 * S;
        blurBox.blurRadiusB = 0.08 * A;
        blurBox.posB.set(cardRange.width, 0);
      }
    }
    if (this.aiSection) {
      const r = scrollManager.getDomRange(this.aiSection).showScreenOffset;
      const aiActive = scrollManager.getDomRange(this.aiSection).isActive;
      handScene.animationRatio = fit(r, 0, 5.5, 0, 1);
      handScene.fingersActiveRatio = fit(r, 5.5, 6, 0, 1) * fit(r, 7.5, 8, 1, 0);
      handScene.handOpacity = fit(r, 8, 9, 1, 0);
      handScene.isActive =
        aiActive || handScene.animationRatio === 0 || handScene.handOpacity > 0;
      handScene.highlightRatio = postprocessing.appleEfx.amount =
        fit(r, 5.5, 6, 0, 1) * fit(r, 7.5, 8, 1, 0);
    }
    if (properties.hasInitialized) {
      wearableSection.update(properties.deltaTime);
      featuresSection.update(properties.deltaTime);
      encryptionSection.update(properties.deltaTime);
      gripSection.update(properties.deltaTime);
      sustainabilitySection.update(properties.deltaTime);
      testimoniesSection.update(properties.deltaTime);
      productSection.update(properties.deltaTime);
    }
  }
}

export const webglApp = new WebGLApp();
export { postprocessing as _pp };
