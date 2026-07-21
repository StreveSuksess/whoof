// WebGL layer, M2.3 vertical slice: renderer on #canvas, hero coaster mesh,
// scroll-driven hero camera + coaster animation (the source's HandScene
// choreography: AI-section showScreenOffset -> fit(0..5.5) -> animationRatio).
// Materials are placeholder-level for now; the full material system is M2.5.

import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three';
import type { BufferGeometry } from 'three';
import { FrameAnimation } from './FrameAnimation';
import { loader } from './core/Loader';
import { fit } from './core/math';
import { properties } from './core/properties';
import { scrollManager } from './core/ScrollPane';
import * as settings from './core/settings';

const BG_COLOR = '#4c3e37'; // hero bg from the source bundle

class WebGLApp {
  renderer!: WebGLRenderer;
  scene = new Scene();
  camera = new PerspectiveCamera(45, 1, 0.01, 100);
  cameraAnimation = new FrameAnimation();
  coasterAnimation = new FrameAnimation();
  coaster: Mesh | null = null;
  private aiSection: HTMLElement | null = null;

  preInit(): void {
    loader.add(settings.MODEL_PATH + 'coaster.buf');
    loader.add(settings.MODEL_PATH + 'hero_camera.buf');
    loader.add(settings.MODEL_PATH + 'coaster_hero_animation.buf');
    loader.add(settings.TEXTURE_PATH + 'coaster/DIFF.webp', { autoMobile: true });
  }

  init(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setClearColor(new Color(BG_COLOR));
    this.camera.matrixAutoUpdate = true;
    this.cameraAnimation.setTarget(this.camera);

    const coasterGeom = loader.get(settings.MODEL_PATH + 'coaster.buf') as BufferGeometry | null;
    const cameraGeom = loader.get(settings.MODEL_PATH + 'hero_camera.buf') as BufferGeometry | null;
    const coasterAnimGeom = loader.get(
      settings.MODEL_PATH + 'coaster_hero_animation.buf',
    ) as BufferGeometry | null;
    const diff = loader.get(settings.TEXTURE_PATH + 'coaster/DIFF.webp', {
      autoMobile: true,
    }) as ImageBitmap | null;

    if (cameraGeom) this.cameraAnimation.setGeometry(cameraGeom);
    if (coasterGeom) {
      const material = new MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
      if (diff) {
        const tex = new Texture(diff);
        tex.colorSpace = SRGBColorSpace;
        tex.flipY = false;
        tex.needsUpdate = true;
        material.map = tex;
      }
      this.coaster = new Mesh(coasterGeom, material);
      this.coasterAnimation.setTarget(this.coaster);
      if (coasterAnimGeom) this.coasterAnimation.setGeometry(coasterAnimGeom);
      this.scene.add(this.coaster);
    }
    // Placeholder lighting until the SH/env material system lands (M2.5).
    this.scene.add(new AmbientLight(0xffffff, 1.1));
    const dir = new DirectionalLight(0xffffff, 1.4);
    dir.position.set(0.2, 1, 0.5);
    this.scene.add(dir);

    this.aiSection = document.getElementById('ai');
    this.resize();
  }

  resize(): void {
    if (!this.renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(dpr);
    this.camera.aspect = w / h;
    this.cameraAnimation.viewPixelWidth = w;
    this.cameraAnimation.viewPixelHeight = h;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    if (!this.renderer) return;
    // Source: handScene.animationRatio = fit(aiRange.showScreenOffset, 0, 5.5, 0, 1)
    let ratio = 0;
    if (this.aiSection) {
      const range = scrollManager.getDomRange(this.aiSection);
      ratio = fit(range.showScreenOffset, 0, 5.5, 0, 1);
    }
    this.cameraAnimation.applyTransformByRatio(ratio);
    this.coasterAnimation.applyTransformByRatio(ratio);
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
}

export const webglApp = new WebGLApp();
export { properties };
