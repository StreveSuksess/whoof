import { Box3, BufferGeometry, CanvasTexture, Color, ExtrudeGeometry, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Path, Quaternion, RepeatWrapping, Shape, SRGBColorSpace, Vector2, Vector3 } from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

// Dimensionless reconstruction. Match the visible band/front-plate proportions;
// the curved rear housing can extend beyond the strap, as in the source film.
// Keep the original STL uniformly scaled; these are not verified millimetres.
export const COLLAR = Object.freeze({ radiusX: .94, radiusZ: .86, width: .35, thickness: .028, frontWidth: .349, frontHeight: .152, housingWidth: .806 });
const { radiusX: RX, radiusZ: RZ, width: WIDTH, thickness: THICK } = COLLAR;
const TAU = Math.PI * 2;
const KEEPERS = [Math.PI / 2 - .80, Math.PI / 2 + .80, 4.63];

// Static assembly occlusion: environmental light cannot freely reach the inner
// band or the narrow gaps underneath the bezel and keepers. Direct light/shadows
// remain separate, so reducing ambient light does not erase the yarn highlights.
function contactShading(material: MeshPhysicalMaterial, innerOcclusion: number) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vCollarPoint;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec4 collarPoint = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        collarPoint = instanceMatrix * collarPoint;
      #endif
      vCollarPoint = collarPoint.xyz;
    `);
    shader.fragmentShader = 'varying vec3 vCollarPoint;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <aomap_fragment>', `
      #include <aomap_fragment>
      vec2 ring = vCollarPoint.xz / vec2(${RX}, ${RZ});
      float collarAngle = atan(ring.y, ring.x);
      float innerBand = 1.0 - smoothstep(.984, 1.005, length(ring));
      float contactAO = mix(1.0, ${innerOcclusion.toFixed(3)}, innerBand);
      ${KEEPERS.map(a => `{
        float distanceToKeeper = abs(atan(sin(collarAngle - ${a}), cos(collarAngle - ${a}))) * .90;
        contactAO *= mix(.22, 1.0, smoothstep(.058, .098, distanceToKeeper));
      }`).join('\n')}
      vec2 frontPoint = vec2(vCollarPoint.x, vCollarPoint.y);
      float frontDistance = length(vec2(max(abs(frontPoint.x) - .0985, 0.0), frontPoint.y)) - .076;
      float inFront = smoothstep(.73, .83, vCollarPoint.z);
      contactAO *= mix(1.0, mix(.28, 1.0, smoothstep(.001, .035, frontDistance)), inFront * (1.0 - innerBand));
      reflectedLight.indirectDiffuse *= contactAO;
      reflectedLight.indirectSpecular *= contactAO;
      #ifdef USE_SHEEN
        sheenSpecularIndirect *= contactAO;
      #endif
    `);
  };
  material.customProgramCacheKey = () => `whoof-contact-v2-${innerOcclusion}`;
}

export function bandPoint(a: number, y = 0, offset = 0) {
  return new Vector3((RX + offset) * Math.cos(a), y, (RZ + offset) * Math.sin(a));
}
function bandRotation(a: number) {
  return new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.atan2(RZ * Math.cos(a), RX * Math.sin(a)));
}

export function makeWebbing() {
  const vertices: number[] = [], uv: number[] = [], index: number[] = [];
  const profile: Vector2[] = [], radius = .012;
  for (let c = 0; c < 4; c++) {
    const cx = (c === 0 || c === 3 ? 1 : -1) * (THICK / 2 - radius), cy = (c < 2 ? 1 : -1) * (WIDTH / 2 - radius);
    for (let k = 0; k <= 5; k++) {
      const a = (c + k / 5) * Math.PI / 2;
      profile.push(new Vector2(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius));
    }
  }
  // Arc-length UVs keep the weave square on both faces; corner indices are not distances.
  const lengths = [0];
  for (let i = 1; i <= profile.length; i++) lengths.push(lengths[i - 1] + profile[i % profile.length].distanceTo(profile[i - 1]));
  const segments = 384, n = profile.length;
  let arc = 0;
  for (let i = 0; i <= segments; i++) {
    const a = i / segments * TAU;
    if (i) arc += bandPoint(a).distanceTo(bandPoint((i - 1) / segments * TAU));
    for (let j = 0; j <= n; j++) {
      const p = profile[j % n], v = bandPoint(a, p.y, p.x);
      vertices.push(v.x, v.y, v.z); uv.push(arc / .07, lengths[j] / .07);
      if (i < segments && j < n) { const v = i * (n + 1) + j; index.push(v, v + 1, v + n + 1, v + 1, v + n + 2, v + n + 1); }
    }
  }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(vertices, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setIndex(index); g.computeVertexNormals(); return g;
}

function fiberTexture(yarn = false) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!, im = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const fibers = yarn ? Math.pow(.5 + .5 * Math.cos(TAU * (y / 128 * 7 - x / 128 * 13)), .6) : .5 + .5 * Math.sin(y * Math.PI / 2);
    const v = 65 + Math.round(100 * fibers + 10 * (grain - Math.floor(grain)));
    const i = (y * 128 + x) * 4; im.data.set([v, v, v, 255], i);
  }
  ctx.putImageData(im, 0, 0);
  const t = new CanvasTexture(canvas); t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 8; t.colorSpace = SRGBColorSpace; return t;
}

// A continuous yarn loop, with an over/under crossing, rather than rows of beads.
// Reused by two instanced meshes; visible volume survives macro camera views.
function yarnLoop(detail: boolean) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [], colors: number[] = [];
  const steps = detail ? 40 : 16, sides = detail ? 9 : 5, tube = .0043;
  const center = (a: number) => new Vector3(.0101 * Math.cos(a), .0071 * Math.sin(a), .003 * Math.sin(2 * a));
  for (let i = 0; i <= steps; i++) {
    const a = i / steps * TAU, p = center(a), tangent = center(a + .001).sub(p).normalize();
    const radial = new Vector3(Math.cos(a), Math.sin(a), 0).normalize(), binormal = new Vector3().crossVectors(tangent, radial).normalize();
    for (let j = 0; j <= sides; j++) {
      const b = j / sides * TAU, rope = tube * (1 + .19 * Math.cos(b * 3 - a * 6));
      const v = p.clone().addScaledVector(radial, Math.cos(b) * rope).addScaledVector(binormal, Math.sin(b) * rope);
      positions.push(v.x, v.y, v.z); uvs.push(i / steps, j / sides);
      const occlusion = .42 + .58 * (.5 + .5 * Math.sin(a * 2)); colors.push(occlusion, occlusion, occlusion);
      if (i < steps && j < sides) { const k = i * (sides + 1) + j; indices.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1); }
    }
  }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new Float32BufferAttribute(uvs, 2)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

function roundPath(p: Shape | Path, w: number, h: number, r: number) {
  const x = -w / 2, y = -h / 2; r = Math.min(r, w / 2 - .0001, h / 2 - .0001);
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
}
function smoothSurface(geometry: BufferGeometry) {
  // Three's helper hashes positions in .01-unit cells. At collar scale that
  // merges separate bevel vertices. Work at 1000× scale for .00001 precision.
  const scaled = geometry.clone().scale(1000, 1000, 1000);
  const result = toCreasedNormals(scaled, Math.PI / 3);
  if (result !== scaled) scaled.dispose();
  return result.scale(.001, .001, .001);
}
function pill(w: number, h: number, d: number, mat: MeshStandardMaterial, bevel = .003) {
  const s = new Shape(), radius = h / 2 - bevel, end = (w - h) / 2;
  s.moveTo(-end, -radius); s.lineTo(end, -radius); s.absarc(end, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-end, radius); s.absarc(-end, 0, radius, Math.PI / 2, Math.PI * 1.5, false);
  const g = new ExtrudeGeometry(s, { depth: d - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 20 });
  g.translate(0, 0, -d / 2 + bevel); const smooth = smoothSurface(g); g.dispose();
  // Keep the cap planar; averaging its perimeter into the bevel creates a false dent.
  const p = smooth.attributes.position, n = smooth.attributes.normal;
  for (let i = 0; i < p.count; i++) if (Math.abs(Math.abs(p.getZ(i)) - d / 2) < .000001) n.setXYZ(i, 0, 0, Math.sign(p.getZ(i)));
  return new Mesh(smooth, mat);
}
function keeper(mat: MeshStandardMaterial) {
  // Extruded in the strap direction, opening in YZ, so the band passes through it.
  const s = new Shape(); roundPath(s, .083, WIDTH + .059, .031);
  const hole = new Path(); roundPath(hole, THICK + .011, WIDTH + .013, .014); s.holes.push(hole);
  const g = new ExtrudeGeometry(s, { depth: .10, bevelEnabled: true, bevelSize: .010, bevelThickness: .010, bevelSegments: 5, curveSegments: 18 });
  g.translate(0, 0, -.05); g.rotateY(Math.PI / 2); const smooth = smoothSurface(g); g.dispose(); return new Mesh(smooth, mat);
}

export async function createProductCollar(detail = false, innerOcclusion = .46) {
  const group = new Group(); group.name = 'Whoof full collar';
  const texture = fiberTexture();
  const textile = new MeshPhysicalMaterial({ color: '#292c2d', map: texture, bumpMap: texture, bumpScale: .0014, roughness: .84, sheen: .6, sheenColor: '#565956', sheenRoughness: .65 });
  const yarnMaterial = new MeshPhysicalMaterial({ color: '#0b0b0b', vertexColors: true, bumpMap: fiberTexture(true), bumpScale: .0008, roughness: .42, sheen: .15, sheenColor: '#242424', sheenRoughness: .55, specularIntensity: .6 });
  contactShading(textile, innerOcclusion); contactShading(yarnMaterial, innerOcclusion);
  // The housing, side button and oval insert are the same black plastic.
  // Their separation comes from the recessed seam and curved edge reflections.
  const plastic = new MeshPhysicalMaterial({ color: '#111111', roughness: .43, metalness: 0, clearcoat: 0, specularIntensity: .5 });
  const rubber = new MeshStandardMaterial({ color: '#060707', roughness: .78 });
  const webbing = new Mesh(makeWebbing(), textile); webbing.name = 'Woven band'; group.add(webbing);

  const rows = 16, cols = 180, total = rows * cols, geometry = yarnLoop(detail);
  const matrix = new Matrix4(), scale = new Vector3(1.4, 1.4, 1.4), color = new Color();
  for (const side of [1, -1]) {
    const yarn = new InstancedMesh(geometry, yarnMaterial, total); yarn.name = side > 0 ? 'Outer interlocked yarn' : 'Inner interlocked yarn';
    for (let col = 0; col < cols; col++) for (let row = 0; row < rows; row++) {
      const a = (col + (row % 2) * .15) / cols * TAU, y = (row / (rows - 1) - .5) * (WIDTH - .024);
      matrix.compose(bandPoint(a, y, side * (THICK / 2 + .0049)), bandRotation(a), scale); yarn.setMatrixAt(col * rows + row, matrix);
      const shade = .81 + .19 * ((Math.sin(col * 13.3 + row * 7.7) + 1) / 2); color.setRGB(shade, shade, shade); yarn.setColorAt(col * rows + row, color);
    }
    yarn.instanceMatrix.needsUpdate = true; yarn.computeBoundingSphere(); group.add(yarn);
  }

  const tracker = new Group(); tracker.name = 'Tracker assembly';
  const response = await fetch('/whoof/device.stl', { signal: AbortSignal.timeout(12000) }); if (!response.ok) throw new Error('Whoof housing unavailable');
  const raw = new STLLoader().parse(await response.arrayBuffer()); raw.center();
  const factor = COLLAR.housingWidth / 42.7; raw.scale(factor, factor, factor);
  // Negative-Y side button faces up. Preserve the original curved XZ section.
  raw.rotateZ(Math.PI);
  const shellGeometry = smoothSurface(raw);
  const shell = new Mesh(shellGeometry, plastic); raw.dispose(); shell.name = 'Original curved housing'; shell.position.z = -.103; tracker.add(shell);
  const bezel = pill(COLLAR.frontWidth, COLLAR.frontHeight, .026, plastic, .004); bezel.position.z = .033; tracker.add(bezel);
  const recess = pill(.290, .101, .006, rubber, .001); recess.position.z = .046; tracker.add(recess);
  const face = pill(.280, .091, .006, plastic, .002); face.position.z = .049; tracker.add(face);
  tracker.position.copy(bandPoint(Math.PI / 2)); group.add(tracker);

  // Three loops are visible in the film. Do not invent a large rear snap buckle.
  for (const a of KEEPERS) {
    const loop = keeper(plastic); loop.name = 'Strap keeper'; loop.position.copy(bandPoint(a)); loop.quaternion.copy(bandRotation(a)); group.add(loop);
  }
  group.traverse(o => { if (o instanceof Mesh) { o.castShadow = detail || !(o instanceof InstancedMesh); o.receiveShadow = true; } });
  const bounds = new Box3().setFromObject(group); if (!Number.isFinite(bounds.max.length())) throw new Error('Invalid collar geometry');
  return { group, tracker };
}
