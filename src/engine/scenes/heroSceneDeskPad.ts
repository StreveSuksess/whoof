// 1:1 port of the source HeroSceneDeskPad (pretty line 15324-15355):
// offscreen canvas drawing concentric circles, sampled by baseFrag.

import { properties } from '../core/properties';
import * as settings from '../core/settings';

class HeroSceneDeskPad {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  scale = 1;
  rotation = 0;
  antialias = true;

  preInit(): void {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = !!this.antialias;
  }

  init(): void {}

  resize(): void {
    const width = Math.ceil(properties.viewportWidth * settings.DPR);
    const height = Math.ceil(properties.viewportHeight * settings.DPR);
    this.canvas!.width = width;
    this.canvas!.height = height;
  }

  update(): void {
    const ctx = this.ctx!;
    const width = properties.viewportWidth;
    const height = properties.viewportHeight;
    ctx.save();
    ctx.scale(settings.DPR, settings.DPR);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.translate(-width / 2, -height / 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    const circleCount = 40;
    for (let i = 0; i < circleCount; i++) {
      const cx = 0.5 * width;
      const cy = 0.5 * height;
      const radius = Math.pow(i, 2) * 1 + 100;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  }
}

export const heroSceneDeskPad = new HeroSceneDeskPad();
