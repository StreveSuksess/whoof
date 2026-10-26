import { Data3DTexture, EquirectangularReflectionMapping, Group, HalfFloatType, InstancedMesh, LinearFilter, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator, RGBAFormat, WebGLRenderer } from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

/** Radiance captured from the very same four area lights and table as hero-v15.
 * This stays fixed in world space: scroll changes the object, never the lights.
 */
export async function openingEnvironment(renderer: WebGLRenderer) {
  const source = await new RGBELoader().loadAsync('/whoof/lighting/hero.hdr');
  source.mapping = EquirectangularReflectionMapping;
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(source);
  source.dispose();
  pmrem.dispose();
  return target;
}

/** Same AgX Medium High Contrast display transform as the offline Cycles frame.
 * Sampling before Three's output transfer avoids an extra full-screen pass.
 */
export async function openingColorLook() {
  const response = await fetch('/whoof/lighting/hero-look.bin');
  if (!response.ok) throw new Error('Whoof color transform unavailable');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== 33 ** 3 * 8) throw new Error('Invalid Whoof color transform');
  const texture = new Data3DTexture(new Uint16Array(buffer), 33, 33, 33);
  texture.type = HalfFloatType;
  texture.format = RGBAFormat;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Match render.py's linear material values without affecting the /model page. */
export function matchOpeningMaterials(group: Group, colorLook: Data3DTexture) {
  const configured = new Set<MeshStandardMaterial>();
  group.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const material = object.material as MeshStandardMaterial;
    // The offline assembly has no artificial per-loop albedo stripes.
    if (object instanceof InstancedMesh) object.instanceColor = null;
    if (configured.has(material)) return;
    configured.add(material);
    material.vertexColors = false;
    if (object.name.includes('yarn')) {
      material.color.setRGB(.0035, .0035, .0035);
      material.roughness = .48;
      material.bumpScale = .00018;
      const physical = material as MeshPhysicalMaterial;
      physical.sheen = .22;
      physical.sheenColor.setRGB(1, 1, 1);
      physical.sheenRoughness = .5;
      physical.specularIntensity = 1;
    } else if (object.name === 'Woven band') {
      material.color.setRGB(.008, .008, .008);
      material.map = null;
      material.bumpScale = .00018;
      material.roughness = .87;
      (material as MeshPhysicalMaterial).sheen = 0;
    } else if (material instanceof MeshPhysicalMaterial) {
      material.color.setRGB(.0056, .0056, .0056);
      material.roughness = .43;
      material.ior = 1.46;
      // Blender's .30 Specular IOR Level scales the default F0 by .6.
      material.specularIntensity = .6;
    } else {
      material.color.setRGB(.004, .004, .004);
      material.roughness = .7;
    }
    applyOpeningColorLook(material, colorLook);
  });
}


/** Shared display response, without changing a model’s authored albedo. */
export function applyOpeningColorLook(material: MeshStandardMaterial, colorLook: Data3DTexture) {
  const contactShading = material.onBeforeCompile.bind(material);
  const contactCacheKey = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    contactShading(shader, renderer);
    shader.uniforms.whoofColorLook = { value: colorLook };
    shader.fragmentShader = 'uniform highp sampler3D whoofColorLook;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <tonemapping_fragment>', `
    vec3 lookPosition = (log2(max(gl_FragColor.rgb * toneMappingExposure, vec3(0.00017578))) + 12.47393) / 16.5;
    lookPosition = clamp(lookPosition, 0.0, 1.0) * (32.0 / 33.0) + .5 / 33.0;
    vec3 displayColor = texture(whoofColorLook, lookPosition).rgb;
    gl_FragColor.rgb = sRGBTransferEOTF(vec4(displayColor, 1.0)).rgb;
    `);
  };
  material.customProgramCacheKey = () => contactCacheKey + '-hero-ocio-v1';
  material.needsUpdate = true;
}
