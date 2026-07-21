// WebGL layer, M2.3 vertical slice: renderer on #canvas, hero coaster mesh,
// scroll-driven hero camera + coaster animation (the source's HandScene
// choreography: AI-section showScreenOffset -> fit(0..5.5) -> animationRatio).
// Materials are placeholder-level for now; the full material system is M2.5.

import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
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

// Hero view constants from the source bundle (pretty line 20737-20745).
const HERO_FOCAL = 50;
const HERO_APERTURE = 41.4;
const HERO_VIEW_W = 2240;
const HERO_VIEW_H = 1260;
const HERO_PLANE_W = 3296; // expandedViewPixelWidth = BASE.webp size
const HERO_PLANE_H = 1460;
const HERO_CAM_Y = 1.22526;
const TABLE_Y = 0.7471; // u_screenTableNDCDepth reference height
const HERO_FOV =
  2 * Math.atan(((HERO_VIEW_H * HERO_APERTURE) / HERO_VIEW_W) / 2 / HERO_FOCAL) * (180 / Math.PI);

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
    loader.add(settings.TEXTURE_PATH + 'hero/BASE.webp', { autoMobile: true });
  }

  private makeTexture(bitmap: ImageBitmap): Texture {
    const tex = new Texture(bitmap);
    tex.colorSpace = SRGBColorSpace;
    tex.flipY = false;
    tex.needsUpdate = true;
    return tex;
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
      if (diff) material.map = this.makeTexture(diff);
      this.coaster = new Mesh(coasterGeom, material);
      this.coasterAnimation.setTarget(this.coaster);
      if (coasterAnimGeom) this.coasterAnimation.setGeometry(coasterAnimGeom);
      this.scene.add(this.coaster);
    }

    // Cutting-mat backdrop: BASE.webp projected onto the table plane, sized so
    // 1 texture pixel matches the source's screen-to-world mapping at the
    // hero camera height.
    const base = loader.get(settings.TEXTURE_PATH + 'hero/BASE.webp', {
      autoMobile: true,
    }) as ImageBitmap | null;
    if (base) {
      const fovYRad = (HERO_FOV * Math.PI) / 180;
      const worldPerPixel = (2 * (HERO_CAM_Y - TABLE_Y) * Math.tan(fovYRad / 2)) / HERO_VIEW_H;
      const mat = new MeshBasicMaterial({ map: this.makeTexture(base) });
      const plane = new Mesh(
        new PlaneGeometry(HERO_PLANE_W * worldPerPixel, HERO_PLANE_H * worldPerPixel),
        mat,
      );
      plane.rotation.x = -Math.PI / 2;
      // flipY=false on the texture flips the image; compensate with plane scale.
      plane.scale.y = -1;
      plane.position.set(-0.0105761, TABLE_Y, -0.0485146);
      this.scene.add(plane);
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
    // Source: handScene.animationRatio = fit(aiRange.showScreenOffset, 0, 5.5, 0, 1);
    // hand fades out over r 8..9 and the hero 3D content hides past that.
    let ratio = 0;
    let offset = 0;
    if (this.aiSection) {
      const range = scrollManager.getDomRange(this.aiSection);
      offset = range.showScreenOffset;
      ratio = fit(offset, 0, 5.5, 0, 1);
    }
    this.scene.visible = offset < 9;
    this.cameraAnimation.applyTransformByRatio(ratio);
    this.coasterAnimation.applyTransformByRatio(ratio);
    // Source HandScene overrides the focal track with the hero fov constant.
    this.camera.fov = HERO_FOV;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
}

export const webglApp = new WebGLApp();
export { properties };
