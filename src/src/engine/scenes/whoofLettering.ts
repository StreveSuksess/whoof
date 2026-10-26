import { BufferGeometry, Float32BufferAttribute, ShapeGeometry } from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json';

/** Geometry matching the source's filled-letter and animated-stroke shaders. */
export function createWhoofLettering() {
  const shapes = new FontLoader().parse(fontData).generateShapes('WHOOF', 1);
  const fill = new ShapeGeometry(shapes, 16);
  fill.computeBoundingBox();
  const box = fill.boundingBox!;
  const width = box.max.x - box.min.x;
  const height = box.max.y - box.min.y;
  const cx = (box.max.x + box.min.x) / 2;
  const cy = (box.max.y + box.min.y) / 2;
  const sx = 1 / width;
  const sy = .150907 / height;
  fill.translate(-cx, -cy, 0).scale(sx, sy, 1);
  const position: number[] = [], origins: number[] = [], radii: number[] = [], ids: number[] = [];
  let id = 0;
  for (const shape of shapes) {
    for (const contour of [shape, ...shape.holes]) {
      const points = contour.getPoints(32).map(p => p.set((p.x - cx) * sx, (p.y - cy) * sy));
      const distances = [0];
      for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + points[i].distanceTo(points[i - 1]));
      const length = distances[distances.length - 1] || 1;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        const dx = b.x - a.x, dy = b.y - a.y;
        const norm = Math.hypot(dx, dy) || 1;
        const nx = -dy / norm * .0008, ny = dx / norm * .0008;
        for (const [end, side] of [[0,-1],[1,-1],[1,1],[0,-1],[1,1],[0,1]]) {
          const p = end ? b : a;
          position.push(p.x + nx * side, p.y + ny * side, distances[i - 1 + end] / length);
          origins.push(p.x, p.y, length);
          radii.push(0); ids.push(id);
        }
      }
      id++;
    }
  }
  const outline = new BufferGeometry();
  outline.setAttribute('position', new Float32BufferAttribute(position, 3));
  outline.setAttribute('OP', new Float32BufferAttribute(origins, 3));
  outline.setAttribute('radius', new Float32BufferAttribute(radii, 1));
  outline.setAttribute('id', new Float32BufferAttribute(ids, 1));
  return { fill, outline };
}
