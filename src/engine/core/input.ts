// Pointer/wheel input singleton — reduced port of the source bundle's `input`.
// Covers what ScrollPane consumes: normalized wheel deltas accumulated per
// frame, pointer drag state, and per-frame reset.

import { clamp } from './math';

const PIXEL_STEP = 10;
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;

/** Facebook-style normalizeWheel, as in the source bundle. */
function normalizeWheel(event: WheelEvent): { pixelX: number; pixelY: number } {
  let sX = 0;
  let sY = 0;
  const legacy = event as unknown as Record<string, number>;
  if ('detail' in event) sY = legacy.detail;
  if ('wheelDelta' in legacy) sY = -legacy.wheelDelta / 120;
  if ('wheelDeltaY' in legacy) sY = -legacy.wheelDeltaY / 120;
  if ('wheelDeltaX' in legacy) sX = -legacy.wheelDeltaX / 120;
  let pX = sX * PIXEL_STEP;
  let pY = sY * PIXEL_STEP;
  if ('deltaY' in event) pY = event.deltaY;
  if ('deltaX' in event) pX = event.deltaX;
  if ((pX || pY) && event.deltaMode) {
    if (event.deltaMode === 1) {
      pX *= LINE_HEIGHT;
      pY *= LINE_HEIGHT;
    } else {
      pX *= PAGE_HEIGHT;
      pY *= PAGE_HEIGHT;
    }
  }
  return { pixelX: pX, pixelY: pY };
}

class Input {
  isDown = false;
  wasDown = false;
  isWheelScrolling = false;
  isDragScrollingX = false;
  isDragScrollingY = false;
  deltaWheel = 0;
  deltaScrollX = 0;
  deltaScrollY = 0;
  deltaDragScrollX = 0;
  deltaDragScrollY = 0;
  deltaPixelXY = { x: 0, y: 0 };
  downPixelXY = { x: 0, y: 0 };
  prevMovePixelXY = { x: 0, y: 0 };

  private downTarget: EventTarget | null = null;

  init(): void {
    window.addEventListener('wheel', this._onWheel.bind(this), { passive: true });
    window.addEventListener('pointerdown', this._onDown.bind(this));
    window.addEventListener('pointermove', this._onMove.bind(this));
    window.addEventListener('pointerup', this._onUp.bind(this));
    window.addEventListener('pointercancel', this._onUp.bind(this));
  }

  /** Called at the END of each engine frame, as the source does. */
  postUpdate(): void {
    this.deltaWheel = 0;
    this.deltaDragScrollX = 0;
    this.deltaDragScrollY = 0;
    this.deltaScrollX = 0;
    this.deltaScrollY = 0;
    this.deltaPixelXY.x = 0;
    this.deltaPixelXY.y = 0;
    this.wasDown = this.isDown;
    this.isWheelScrolling = false;
  }

  hasThroughElem(elem: Element | Window, _phase: string): boolean {
    if (elem === window) return true;
    const t = this.downTarget;
    return t instanceof Node && elem instanceof Element && elem.contains(t);
  }

  private _onWheel(e: WheelEvent): void {
    let { pixelY } = normalizeWheel(e);
    pixelY = clamp(pixelY, -200, 200);
    this.deltaWheel += pixelY;
    this.deltaScrollX = this.deltaDragScrollX + this.deltaWheel;
    this.deltaScrollY = this.deltaDragScrollY + this.deltaWheel;
    this.isWheelScrolling = true;
  }

  private _onDown(e: PointerEvent): void {
    this.isDown = true;
    this.downTarget = e.target;
    this.downPixelXY.x = this.prevMovePixelXY.x = e.clientX;
    this.downPixelXY.y = this.prevMovePixelXY.y = e.clientY;
    this.isDragScrollingX = false;
    this.isDragScrollingY = false;
  }

  private _onMove(e: PointerEvent): void {
    if (!this.isDown) return;
    const dx = e.clientX - this.prevMovePixelXY.x;
    const dy = e.clientY - this.prevMovePixelXY.y;
    this.prevMovePixelXY.x = e.clientX;
    this.prevMovePixelXY.y = e.clientY;
    this.deltaPixelXY.x += dx;
    this.deltaPixelXY.y += dy;
    // Touch drag scrolls the page (only touch, matching site behavior where
    // mouse drag does not scroll).
    if (e.pointerType === 'touch') {
      if (!this.isDragScrollingX && !this.isDragScrollingY) {
        const totalX = Math.abs(e.clientX - this.downPixelXY.x);
        const totalY = Math.abs(e.clientY - this.downPixelXY.y);
        if (totalX > 4 || totalY > 4) {
          if (totalY >= totalX) this.isDragScrollingY = true;
          else this.isDragScrollingX = true;
        }
      }
      if (this.isDragScrollingY) this.deltaDragScrollY -= dy;
      if (this.isDragScrollingX) this.deltaDragScrollX -= dx;
      this.deltaScrollX = this.deltaDragScrollX + this.deltaWheel;
      this.deltaScrollY = this.deltaDragScrollY + this.deltaWheel;
    }
  }

  private _onUp(): void {
    this.isDown = false;
    this.isDragScrollingX = false;
    this.isDragScrollingY = false;
  }
}

export const input = new Input();
