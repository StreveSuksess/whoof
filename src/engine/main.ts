// Engine bootstrap (M2.2): state classes, input, virtual scroll, preload
// queue, preloader dismissal and page fade-in. The WebGL renderer and scenes
// arrive in M2.3+.

import { testSupport } from './core/browser';
import { input } from './core/input';
import { loader } from './core/Loader';
import { preloader } from './Preloader';
import { properties } from './core/properties';
import { scrollManager } from './core/ScrollPane';
import { parseBuf } from './BufLoader';
import { parseSog } from './SogLoader';
import { Splats } from './Splats';
import { siteFooter } from './SiteFooter';
import { siteHeader } from './SiteHeader';
import { letterFlippers } from './LetterFlippers';
import { videoOverlay } from './VideoOverlay';
import { wearableGallery } from './scenes/wearableGallery';
import { webglApp, _pp } from './webgl';

function detectMobile(): boolean {
  return matchMedia('(pointer: coarse)').matches && matchMedia('(max-width: 820px)').matches;
}

function setStateClasses(): void {
  const root = document.documentElement;
  root.classList.remove('no-js');
  properties.isMobile = properties.useMobileLayout = detectMobile();
  root.classList.add(properties.isMobile ? 'is-mobile' : 'is-desktop');
}

function preInit(): void {
  loader.registerParser('buf', (buffer) => parseBuf(buffer));
  loader.registerParser('sog', (buffer) => parseSog(buffer));
  webglApp.initEngine();
  webglApp.preInit();
}

// Source init() (pretty 30473): runs when the loader reaches 1, before the
// compile/start gap.
function onInit(): void {
  webglApp.init();
  siteHeader.init();
  siteFooter.init();
  videoOverlay.init();
  // Source ui.init (pretty 30355): register every .is-flipper element.
  document.querySelectorAll('.is-flipper').forEach((dom) => {
    let targets: NodeListOf<HTMLElement> | HTMLElement[] = dom.querySelectorAll(
      '.is-flipper-target',
    );
    if (targets.length === 0) targets = [dom as HTMLElement];
    letterFlippers.add(dom as HTMLElement, Array.from(targets));
  });
  properties.hasInitialized = true;
}

// Source start() (pretty 30483): runs once the init→start percent fills;
// hasStarted releases the scene update and startTime accumulation, and the
// Final preloader pass wipes the frame in.
function onStart(): void {
  properties.hasStarted = true;
  scrollManager.isActive = true;
  // Source HomePage.preShow on first show (pretty 29296): kick off the
  // wearable gallery image/video loads.
  wearableGallery.start();
  // pagesManager.start stand-in: Page.show tweens the page container's
  // opacity 0→1 over 0.3s (pretty 13029-13032; .page CSS default is 0).
  const page = document.getElementById('home');
  if (page) {
    page.style.transition = 'opacity 0.3s linear';
    page.style.opacity = '1';
  }
}

function interceptAnchorNav(): void {
  document.addEventListener('click', (e) => {
    const anchor = (e.target as Element).closest?.('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href')!.slice(1);
    if (!id) return;
    e.preventDefault();
    scrollManager.scrollTo(id);
  });
}

export function boot(): void {
  setStateClasses();
  input.init();
  scrollManager.init();
  interceptAnchorNav();
  // Source preRun/run split: the avif support probe finishes in the first
  // loader round before app.preInit computes any texture URLs.
  void testSupport().then(bootStage2);
}

// Source run() (pretty 30467): engine + UI preInit, resize, loop, then
// ui.preload(init, start) hands the bootstrap callbacks to the preloader.
function bootStage2(): void {
  preInit();
  document.documentElement.classList.add('is-ready');
  preloader.preInit();
  siteHeader.preInit();
  siteFooter.preInit();
  videoOverlay.preInit();

  const onResize = (): void => {
    properties.viewportWidth = window.innerWidth;
    properties.viewportHeight = window.innerHeight;
    scrollManager.resize(window.innerWidth, window.innerHeight);
    preloader.resize(window.innerWidth, window.innerHeight);
    siteHeader.resize(window.innerWidth, window.innerHeight);
    siteFooter.resize(window.innerWidth, window.innerHeight);
    videoOverlay.resize();
    webglApp.resize();
  };
  window.addEventListener('resize', onResize);
  onResize();

  let lastTime = performance.now();
  const frame = (now: number): void => {
    // Source frame loop (pretty 30523): dt clamped to 1/20, startTime
    // accumulates unclamped (choreography reads ranges past 1).
    const dt = Math.min((now - lastTime) / 1000, 1 / 20);
    lastTime = now;
    properties.time += dt;
    properties.deltaTime = dt;
    if (properties.hasStarted) {
      properties.startTime += dt;
    }
    // Debug probe (dev aid, keep until the engine stabilizes).
    (window as never as Record<string, unknown>).__t = {
      startTime: properties.startTime,
      hasStarted: properties.hasStarted,
      tick: properties.tick,
    };
    (window as never as Record<string, unknown>).__pp = _pp;
    (window as never as Record<string, unknown>).__props = properties;
    (window as never as Record<string, unknown>).__app = webglApp;
    (window as never as Record<string, unknown>).__Splats = Splats;
    input.update(dt);
    scrollManager.update(dt);
    // Source ui.update order (pretty 30367): preloader, siteHeader,
    // siteFooter, videoOverlay before the app update; the WebGL frame renders
    // during preload (Final's preloader branch paints the dark green base).
    preloader.update(dt);
    siteHeader.update(dt);
    siteFooter.update(dt);
    videoOverlay.update(dt);
    letterFlippers.update(dt);
    webglApp.update(dt);
    input.postUpdate();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  preloader.show(onInit, onStart);
}
