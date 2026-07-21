// Engine bootstrap (M2.2): state classes, input, virtual scroll, preload
// queue, preloader dismissal and page fade-in. The WebGL renderer and scenes
// arrive in M2.3+.

import { input } from './core/input';
import { loader } from './core/Loader';
import { properties } from './core/properties';
import { scrollManager } from './core/ScrollPane';
import { parseBuf } from './BufLoader';
import { initSections, updateSections } from './sections';
import { webglApp } from './webgl';

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
  webglApp.initEngine();
  webglApp.preInit();
}

function onReady(): void {
  webglApp.init();
  initSections();
  document.documentElement.classList.add('is-ready');
  const preloader = document.getElementById('preloader');
  const page = document.getElementById('home');
  // Fade the page in and dismiss the preloader, as the source engine does
  // once preloading completes.
  if (page) {
    page.style.opacity = '0';
    void page.offsetHeight; // flush so the transition has a start value
    page.style.transition = 'opacity 0.6s';
    page.style.opacity = '1';
  }
  if (preloader) {
    preloader.style.transition = 'opacity 0.4s';
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 450);
  }
  properties.hasStarted = true;
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
  scrollManager.isActive = true;
  interceptAnchorNav();
  preInit();

  const onResize = (): void => {
    properties.viewportWidth = window.innerWidth;
    properties.viewportHeight = window.innerHeight;
    scrollManager.resize(window.innerWidth, window.innerHeight);
    webglApp.resize();
  };
  window.addEventListener('resize', onResize);
  onResize();
  properties.hasInitialized = true;

  let lastTime = performance.now();
  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    properties.time += dt;
    properties.deltaTime = dt;
    if (properties.hasStarted) {
      properties.startTime = Math.min(1, properties.startTime + dt);
    }
    input.update(dt);
    scrollManager.update(dt);
    if (properties.hasStarted) {
      updateSections();
      webglApp.update(dt);
    }
    input.postUpdate();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  loader.start().then(onReady);
}
