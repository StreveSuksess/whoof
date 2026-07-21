// 1:1 port of the source WearableSectionCanvas (pretty 21372-21428): the 2D
// canvas frame around the wearable gallery (dashed border, corner ticks,
// split arcs) driven by show/hide/scale ratios.

import { ease } from '../core/ease';
import { fit, mix } from '../core/math';
import * as settings from '../core/settings';

let _domContainer: HTMLElement;
let _domContainerSmall: HTMLElement;
let _canvas: HTMLCanvasElement;
let _ctx: CanvasRenderingContext2D;
let _containerWidth = 0;
let _containerHeight = 0;
let _containerInnerWidth = 0;
let _containerInnerHeight = 0;
let _canvasWidth = 0;
let _canvasHeight = 0;
let _innerBorderWidth = 0;
let _innerBorderHeight = 0;
let _outerBorderWidth = 0;
let _outerBorderHeight = 0;
const _lineDash = [3, 3];
const GAP_SIZE = 6;
const BORDER_SIZE = 1;
const SMALL_LINE_SIZE = 10;
const SMALL_LINE_OFFSET = 8;
let _prevShowRatio = 1 / 0;
let _prevHideRatio = 1 / 0;
let _prevScaleRatio = 0;
let _prevScaleRatio2 = 0;

export class WearableSectionCanvas {
  showRatio = 0;
  hideRatio = 0;
  scaleRatio = 0;
  scaleRatio2 = 0;

  preInit(root: Element): void {
    _domContainer = root.querySelector('#wearable-main') as HTMLElement;
    _domContainerSmall = root.querySelector('#wearable-main-small') as HTMLElement;
    _canvas = root.querySelector('#wearable-main-canvas') as HTMLCanvasElement;
    _ctx = _canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  init(): void {}

  resize(): void {
    const rect = _domContainer.getBoundingClientRect();
    const rectSmall = _domContainerSmall.getBoundingClientRect();
    _containerWidth = rect.width;
    _containerHeight = rect.height;
    _containerInnerWidth = rectSmall.width;
    _containerInnerHeight = rectSmall.height;
    const dpr = settings.DPR_RAW;
    _canvasWidth = _containerWidth + (BORDER_SIZE + GAP_SIZE) * 2;
    _canvasHeight = _containerHeight + (BORDER_SIZE + GAP_SIZE) * 2;
    _canvas.width = Math.ceil(_canvasWidth * dpr);
    _canvas.height = Math.ceil(_canvasHeight * dpr);
    _canvas.style.width = _canvasWidth + 'px';
    _canvas.style.height = _canvasHeight + 'px';
    _outerBorderWidth = _containerWidth + (BORDER_SIZE / 2 + GAP_SIZE) * 2;
    _outerBorderHeight = _containerHeight + (BORDER_SIZE / 2 + GAP_SIZE) * 2;
    _innerBorderWidth = _containerInnerWidth + (BORDER_SIZE / 2 + GAP_SIZE) * 2;
    _innerBorderHeight = _containerInnerHeight + (BORDER_SIZE / 2 + GAP_SIZE) * 2;
    _prevShowRatio = 1 / 0;
    _prevHideRatio = 1 / 0;
  }

  update(_dt: number): void {
    const t = this.showRatio;
    const i = this.hideRatio;
    const r = this.scaleRatio;
    const o = this.scaleRatio2;
    const alpha = 1;
    const visible = t > 0 && i < 1;
    _canvas.style.visibility = visible ? 'visible' : 'hidden';
    if (
      t !== _prevShowRatio
      || i !== _prevHideRatio
      || r !== _prevScaleRatio
      || o !== _prevScaleRatio2
    ) {
      _canvas.style.opacity = String(alpha);
      if (!visible) return;
      const dpr = settings.DPR_RAW;
      _ctx.save();
      _ctx.scale(dpr, dpr);
      _ctx.clearRect(0, 0, _canvasWidth + 1, _canvasHeight + 1);
      _ctx.lineWidth = 1;
      _ctx.translate(_canvasWidth / 2, _canvasHeight / 2);
      _ctx.strokeStyle = '#ffedd7';
      _ctx.fillStyle = '#ffedd7';
      const width = mix(_containerInnerWidth, _containerWidth, o);
      const height = mix(_containerInnerHeight, _containerHeight, o);
      const borderWidth = mix(_innerBorderWidth, _outerBorderWidth, r);
      const borderHeight = mix(_innerBorderHeight, _outerBorderHeight, r);
      let dotRadius = fit(t * (1 - i), 0, 1, 0, SMALL_LINE_SIZE / 2, ease.backOut);
      _ctx.beginPath();
      _ctx.arc(
        width / 2 - SMALL_LINE_OFFSET - SMALL_LINE_SIZE / 2,
        -height / 2 + SMALL_LINE_OFFSET + SMALL_LINE_SIZE / 2,
        dotRadius,
        0,
        Math.PI * 2,
      );
      _ctx.fill();
      _ctx.closePath();
      _ctx.save();
      _ctx.globalAlpha = fit(r, 0.5, 1, 1, 0);
      _ctx.beginPath();
      const tickOffset = o * SMALL_LINE_SIZE;
      const tickLength = fit(t * (1 - i), 0.6, 1, 0, SMALL_LINE_SIZE);
      for (let k = 0; k < 4; k++) {
        const x = _containerInnerWidth / 2 - SMALL_LINE_OFFSET - tickOffset;
        _ctx.moveTo(x - tickLength, 0);
        _ctx.lineTo(x, 0);
        _ctx.rotate(Math.PI / 2);
      }
      _ctx.stroke();
      _ctx.restore();
      _ctx.setLineDash(_lineDash);
      const borderRatio = fit(t * (1 - i), 0.5, 1, 0, 1);
      if (borderRatio > 0) {
        _ctx.globalAlpha = borderRatio;
        _ctx.beginPath();
        _ctx.moveTo(-borderWidth / 2, -borderHeight / 2);
        _ctx.lineTo(mix(-borderWidth / 2, borderWidth / 2, borderRatio), -borderHeight / 2);
        _ctx.moveTo(borderWidth / 2, -borderHeight / 2);
        _ctx.lineTo(borderWidth / 2, mix(-borderHeight / 2, borderHeight / 2, borderRatio));
        _ctx.moveTo(borderWidth / 2, borderHeight / 2);
        _ctx.lineTo(mix(borderWidth / 2, -borderWidth / 2, borderRatio), borderHeight / 2);
        _ctx.moveTo(-borderWidth / 2, borderHeight / 2);
        _ctx.lineTo(-borderWidth / 2, mix(borderHeight / 2, -borderHeight / 2, borderRatio));
        _ctx.stroke();
      }
      _ctx.save();
      _ctx.globalAlpha = fit(r, 0.1, 1, 0.3, 0);
      _ctx.beginPath();
      dotRadius = width / 2 - BORDER_SIZE / 2;
      dotRadius = fit(t, 0.5, 1, dotRadius * 0.75, dotRadius);
      const arcRatio = fit(t, 0, 0.5, 0, 1);
      _ctx.moveTo(dotRadius, 0);
      _ctx.arc(0, 0, dotRadius, 0, Math.PI * arcRatio);
      _ctx.moveTo(-dotRadius, 0);
      _ctx.arc(0, 0, dotRadius, Math.PI, Math.PI * (1 + arcRatio));
      _ctx.stroke();
      _ctx.restore();
      _ctx.restore();
      _prevShowRatio = t;
      _prevHideRatio = i;
      _prevScaleRatio = r;
      _prevScaleRatio2 = o;
    }
  }
}

export const wearableSectionCanvas = new WearableSectionCanvas();
