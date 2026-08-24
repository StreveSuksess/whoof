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
import { footerScene } from './scenes/footerScene';
import { stackScene } from './scenes/stackScene';
import { sustainabilityScene } from './scenes/sustainabilityScene';
import { tableScene } from './scenes/tableScene';
import { wearableScene } from './scenes/wearableScene';
import { heroSection } from './sections/heroSection';
import { aiSection } from './sections/aiSection';
import { encryptionSection } from './sections/encryptionSection';
import { featuresSection } from './sections/featuresSection';
import { gripSection } from './sections/gripSection';
import { sustainabilitySection } from './sections/sustainabilitySection';
import { testimoniesSection } from './sections/testimoniesSection';
import { socialContentSection } from './sections/socialSection';
import { productSection } from './sections/productSection';
import { openWeightSection } from './sections/openWeightSection';
import { footerSection } from './sections/footerSection';
import { wearableSection } from './sections/wearableSection';
import { siteFooter } from './SiteFooter';
import { siteHeader } from './SiteHeader';

const DEFAULT_POST_PROFILE = new PostProfile();

class WebGLApp {
  scene = new Scene();

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
    footerScene.preInit();
    this.scene.add(footerScene.container);
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
    footerScene.init();
    coaster.init();
    sketches.init();
    heroSection.preInit(document.documentElement);
    heroSection.init();
    heroSection.resize(properties.width, properties.height);
    aiSection.preInit(document.documentElement);
    aiSection.init();
    aiSection.resize(properties.width, properties.height);
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
    socialContentSection.preInit(document.documentElement);
    socialContentSection.init();
    socialContentSection.resize(properties.width, properties.height);
    productSection.preInit(document.documentElement);
    productSection.init();
    productSection.resize(properties.width, properties.height);
    openWeightSection.preInit(document.documentElement);
    openWeightSection.init();
    openWeightSection.resize(properties.width, properties.height);
    footerSection.preInit(document.documentElement);
    footerSection.init();
    footerSection.resize(properties.width, properties.height);
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
      heroSection.resize(properties.width, properties.height);
      aiSection.resize(properties.width, properties.height);
      wearableSection.resize();
      featuresSection.resize();
      encryptionSection.resize();
      gripSection.resize();
      sustainabilitySection.resize();
      testimoniesSection.resize(properties.width, properties.height);
      socialContentSection.resize(properties.width, properties.height);
      productSection.resize(properties.width, properties.height);
      openWeightSection.resize(properties.width, properties.height);
      footerSection.resize(properties.width, properties.height);
    }
    sustainabilityScene.resize();
    stackScene.resize(properties.width, properties.height);
    footerScene.resize(properties.width, properties.height);
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
    footerScene.preUpdate(dt);
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
    footerScene.update(dt);
    coaster.update();
    sketches.update(dt);
    // Source Visuals.update tail: tableScene/footerScene postUpdate after the
    // scene updates.
    tableScene.postUpdate(dt);
    footerScene.postUpdate(dt);
    postprocessing.render(this.scene, properties.camera, true);
    properties.tick++;
  }

  /** Source HomePage.update (pretty 29298-29300): per-frame chrome defaults,
   * then every section in order. blurBox resets first (pagesManager.update,
   * pretty 29496). */
  private updateSectionDriving(): void {
    blurBox.reset();
    if (properties.hasInitialized) {
      siteHeader.changeNav('hero');
      siteHeader.setTheme('dark');
      siteFooter.setScroll('left', 0, 0);
      siteFooter.setTheme('dark');
      heroSection.update(properties.deltaTime);
      aiSection.update(properties.deltaTime);
      wearableSection.update(properties.deltaTime);
      featuresSection.update(properties.deltaTime);
      encryptionSection.update(properties.deltaTime);
      gripSection.update(properties.deltaTime);
      sustainabilitySection.update(properties.deltaTime);
      testimoniesSection.update(properties.deltaTime);
      socialContentSection.update(properties.deltaTime);
      productSection.update(properties.deltaTime);
      openWeightSection.update(properties.deltaTime);
      footerSection.update(properties.deltaTime);
    }
  }
}

export const webglApp = new WebGLApp();
export { postprocessing as _pp };
