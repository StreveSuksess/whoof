import { Float32BufferAttribute } from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

/** Fit the supplied housing to the source product's 90 mm stage coordinates. */
export function parseWhoofHousing(buffer: ArrayBuffer) {
  const raw = new STLLoader().parse(buffer);
  raw.center();
  raw.rotateX(-Math.PI / 2);
  raw.scale(.002, .002, .002);
  raw.translate(0, .0119, 0);
  raw.deleteAttribute('normal');
  const merged = mergeVertices(raw, .000001);
  merged.computeVertexNormals();
  const geometry = toCreasedNormals(merged, Math.PI / 5);
  merged.dispose();
  raw.dispose();
  const positions = geometry.getAttribute('position');
  const uv = new Float32Array(positions.count * 2);
  const ao = new Float32Array(positions.count).fill(1);
  for (let i = 0; i < positions.count; i++) {
    uv[i * 2] = positions.getX(i) / .09 + .5;
    uv[i * 2 + 1] = positions.getZ(i) / .09 + .5;
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setAttribute('Cd', new Float32BufferAttribute(ao, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Satin black housing, compatible with the original velocity/TAA pipeline. */
export const whoofHousingFrag = `
varying vec3 v_viewNormal;
varying vec3 v_viewPosition;
varying vec3 v_modelPosition;
#include <taaJitteringFragPars>
void main() {
  vec3 n = normalize(v_viewNormal);
  vec3 v = normalize(v_viewPosition);
  vec3 key = normalize(vec3(-.45,.7,1.));
  vec3 rim = normalize(vec3(.8,.1,-.4));
  float diffuse = max(0.,dot(n,key));
  float spec = pow(max(0.,dot(n,normalize(key+v))),45.);
  float edge = pow(1.-abs(dot(n,v)),3.);
  float fill = max(0.,dot(n,rim));
  vec3 color = vec3(.07,.077,.073) + diffuse * vec3(.13,.145,.14);
  color += spec * vec3(.38,.39,.35) + edge * vec3(.19,.17,.12) + fill * .045;
  gl_FragColor = vec4(color,0.);
  #include <taaJitteringFrag>
}`;
