// Port of the source Coaster (pretty line 20463-20668), materialDefault path.
// The encryption/stack materials belong to sections not yet ported
// (features/product) and land with them; TAA is not yet ported so the mesh is
// a plain Mesh on the shader's non-TAA path, matching the source's structure
// with USE_TAA undefined.

import {
  LinearMipMapLinearFilter,
  Matrix2,
  Matrix4,
  Mesh,
  Object3D,
  RepeatWrapping,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import type { BufferGeometry, IUniform, Texture, WebGLRenderTarget } from 'three';
import { blueNoise } from '../core/blueNoise';
import { cameraControls } from '../core/cameraControls';
import { fboHelper } from '../core/fboHelper';
import { loader } from '../core/Loader';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { textureHelper } from '../core/textureHelper';
import { coasterBlendFrag, coasterFrag, coasterVert } from '../glsl';
import { postprocessing } from '../post/postprocessing';
import { TAAMesh } from '../post/TAAMesh';
import { gobo } from './gobo';

const _m = new Matrix4();
const _v0 = new Vector3();
let _prevEnvBlendRatio: number | null = null;
let _prevEnvTexture1Uniform: IUniform | null = null;
let _prevEnvTexture2Uniform: IUniform | null = null;

class Coaster {
  container = new Object3D();
  innerContainer = new Object3D();
  position = new Vector3();
  lightPosition = new Vector3(0, 0, 0);
  localLightPosition = new Vector3(0, 0, 0);
  envCombineRT!: WebGLRenderTarget;
  envBlendRatio = 0;
  envTexture1Uniform: IUniform | null = null;
  envTexture2Uniform: IUniform | null = null;
  imgBasedOpacity = 0;
  imgBasedTexture: Texture | null = null;
  imgBasedMVP = new Matrix4();
  wearableBlendingRatio = 0;
  isActive = false;
  haloRatio = 0;
  extraBumpScale = 0;
  handSectionHighlightRatio = 0;
  condomSceneRatio = 0;
  coffeeShadowStrength = 0;
  // Encryption-section state written by TableScene.update (source Coaster
  // fields); the back-face material/MSDF consumption lands with the
  // encryption milestone.
  isFeatureEncryptionSectionActive = false;
  featureSectionRatio = 0;
  encryptionSectionTopToFrontRatio = 0;
  encryptionSectionZoomRatio = 0;
  coasterGeometry: BufferGeometry | null = null;
  mesh!: Mesh;
  materialDefault!: ShaderMaterial;
  private blendMaterial!: ShaderMaterial;

  sharedUniforms = {
    u_texture: { value: null as Texture | null },
    u_envTexture: { value: null as Texture | null },
    u_localLightPosition: { value: this.localLightPosition },
    u_resolution: properties.sharedUniforms.u_resolution,
    u_position: { value: this.position },
    u_imgBasedOpacity: { value: 0 },
    u_imgBasedTexture: { value: null as Texture | null },
    u_imgBasedMVP: { value: this.imgBasedMVP },
    u_coffeeShadowStrength: { value: 0 },
    u_condomSceneRatio: { value: 0 },
    u_extraBumpScale: { value: 0 },
    u_textureSize: { value: new Vector2(1024, 1024) },
    u_zoom: { value: 1 },
    u_zoomCenter: { value: new Vector2() },
    u_randomFlipRot: { value: new Matrix2() },
  };

  preInit(): void {
    this.container.add(this.innerContainer);
    this.sharedUniforms.u_texture.value = textureHelper.loadRGBATexture(
      settings.TEXTURE_PATH + 'coaster/DIFF.webp',
      settings.TEXTURE_PATH + 'coaster/HEIGHT.webp',
      {
        minFilter: LinearMipMapLinearFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
        autoMobile: true,
      },
    );
    this.envCombineRT = fboHelper.createRenderTarget(128, 64, false, true);
    this.blendMaterial = fboHelper.createRawShaderMaterial({
      uniforms: {
        u_texture1: { value: null },
        u_texture2: { value: null },
        u_blendRatio: { value: 0 },
      },
      fragmentShader: coasterBlendFrag,
    }) as unknown as ShaderMaterial;
    loader.add(settings.MODEL_PATH + 'coaster.buf', {
      onLoad: (content) => {
        this._onCoasterLoaded(content as BufferGeometry);
      },
    });
  }

  private _onCoasterLoaded(geometry: BufferGeometry): void {
    this.coasterGeometry = geometry;
    this.coasterGeometry.computeBoundingBox();
  }

  init(): void {
    // heroScene imported lazily to break the module cycle (single-scope in source).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { heroScene } = _heroSceneRef;
    this.materialDefault = new ShaderMaterial({
      vertexShader: coasterVert,
      fragmentShader: coasterFrag,
      uniforms: Object.assign(
        {
          u_heroRatio: heroScene.sharedUniforms.u_activeRatio,
          u_highlightRatio: { value: 0 },
          u_brdfLut: properties.sharedUniforms.u_brdfLut,
          u_wearableBlendingRatio: { value: 0 },
          u_lmsTexture: { value: postprocessing.appleEfx.lmsTexture },
          u_time: properties.sharedUniforms.u_time,
        },
        this.sharedUniforms,
        blueNoise.sharedUniforms,
        gobo.sharedUniforms,
      ),
      defines: {
        BLUR_SAMPLE: 6,
        USE_ZOOM: true,
      },
    });
    this.mesh = new TAAMesh(this.coasterGeometry!, this.materialDefault);
    cameraControls.initClippingMesh(this.mesh);
    this.innerContainer.add(this.mesh);
  }

  resetTransform(): void {
    this.isActive = false;
    this.container.position.set(0, 0, 0);
    this.container.quaternion.set(0, 0, 0, 1);
    this.container.scale.set(1, 1, 1);
    this.innerContainer.position.set(0, 0, 0);
    this.innerContainer.quaternion.set(0, 0, 0, 1);
    this.innerContainer.scale.set(1, 1, 1);
    if (this.mesh) {
      this.mesh.position.set(0, 0, 0);
      this.mesh.quaternion.set(0, 0, 0, 1);
    }
    this.imgBasedOpacity = 0;
    this.imgBasedTexture = textureHelper.transparentTexture;
    this.imgBasedMVP.identity();
  }

  update(): void {
    if (!properties.hasInitialized) return;
    this.sharedUniforms.u_extraBumpScale.value = this.extraBumpScale;
    this.materialDefault.uniforms.u_highlightRatio.value = this.handSectionHighlightRatio;
    this.materialDefault.uniforms.u_wearableBlendingRatio.value = this.wearableBlendingRatio;
    this.sharedUniforms.u_coffeeShadowStrength.value = this.coffeeShadowStrength;
    this.sharedUniforms.u_imgBasedOpacity.value = this.imgBasedOpacity;
    this.sharedUniforms.u_imgBasedTexture.value = this.imgBasedTexture;
    this.sharedUniforms.u_condomSceneRatio.value = this.condomSceneRatio;
    this.container.visible = this.isActive;
    const blendRatio = this.envBlendRatio;
    if (
      _prevEnvBlendRatio !== blendRatio
      || this.envTexture1Uniform !== _prevEnvTexture1Uniform
      || this.envTexture2Uniform !== _prevEnvTexture2Uniform
    ) {
      const uniforms = this.blendMaterial.uniforms as Record<string, IUniform>;
      uniforms.u_texture1 = this.envTexture1Uniform ?? { value: textureHelper.blackTexture };
      uniforms.u_texture2 = this.envTexture2Uniform ?? { value: textureHelper.blackTexture };
      uniforms.u_blendRatio.value = blendRatio;
      fboHelper.render(this.blendMaterial, this.envCombineRT);
      _prevEnvTexture1Uniform = this.envTexture1Uniform;
      _prevEnvTexture2Uniform = this.envTexture2Uniform;
      _prevEnvBlendRatio = blendRatio;
    }
    this.sharedUniforms.u_envTexture.value = this.envCombineRT.texture;
    this.container.updateMatrixWorld(true);
    this.position.setFromMatrixPosition(this.innerContainer.matrixWorld);
    _m.copy(this.innerContainer.matrixWorld).invert();
    this.localLightPosition.copy(this.lightPosition).applyMatrix4(_m);
    _v0.set(0, 0, 0).applyMatrix4(this.innerContainer.matrixWorld).project(properties.camera);
    (this.sharedUniforms.u_zoomCenter.value as Vector2).set(_v0.x, _v0.y);
  }
}

export const coaster = new Coaster();

// Late-bound heroScene reference (module cycle: coaster <-> heroScene).
const _heroSceneRef: { heroScene: { sharedUniforms: { u_activeRatio: IUniform } } } = {
  heroScene: { sharedUniforms: { u_activeRatio: { value: 0 } } },
};
export function bindHeroScene(scene: { sharedUniforms: { u_activeRatio: IUniform } }): void {
  _heroSceneRef.heroScene = scene;
}
