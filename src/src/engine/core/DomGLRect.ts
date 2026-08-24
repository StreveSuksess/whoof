// 1:1 port of the source DomGLRect (pretty 18626-18633): a Vector4 rect in
// GL-oriented viewport pixels (y measured from the bottom).

import { Vector4 } from 'three';
import { properties } from './properties';

export class DomGLRect extends Vector4 {
  set(x: number, y: number, width: number, height: number): this {
    return super.set(x, properties.viewportHeight - (y + height), width, height);
  }

  copy(rect: { x: number; y: number; width: number; height: number } & Partial<Vector4>): this {
    return this.set(rect.x, rect.y, rect.width as number, rect.height as number);
  }
}
