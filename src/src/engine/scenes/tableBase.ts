// 1:1 port of the source TableBase (pretty 19158-19273): desk/pinboard/wall
// meshes with bicubic textures, SDF soft shadows from the coffee/coaster,
// tray-cover shadow overlay and the splat reflection RT.

import {
  AddEquation,
  CustomBlending,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  Mesh,
  Object3D,
  OneFactor,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  SrcAlphaFactor,
  SRGBColorSpace,
  Vector2,
  Vector3,
  ZeroFactor,
} from 'three';
import type { BufferGeometry, IUniform, Texture, WebGLRenderTarget } from 'three';
import { blueNoise } from '../core/blueNoise';
import { browser } from '../core/browser';
import { cameraControls } from '../core/cameraControls';
import { fboHelper } from '../core/fboHelper';
import { loader } from '../core/Loader';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { tableFrag, tableShadowFrag, tableShadowVert, tableVert } from '../glsl';
import { Splats } from '../Splats';
import { TAAMesh } from '../post/TAAMesh';
import { coaster } from './coaster';
import { gobo } from './gobo';
import { tableCoffee } from './tableCoffee';
import { thermodynamicOverlay } from './thermodynamicOverlay';

let _reflectionRT: WebGLRenderTarget;
let _reflectionSplats: Splats | null = null;

export class TableBase {
  container = new Object3D();
  lightPosition = new Vector3(0, 0, 0);
  coffeeInvMatrix = new Matrix4();
  coasterInvMatrix = new Matrix4();
  hdTextureShift = 0;
  sharedUniforms = {
    u_hdTextureShift: { value: 1 },
  };
  meshes = new Map<string, TAAMesh>();

  preInit(): void {
    _reflectionRT = fboHelper.createRenderTarget(1, 1);
    loader.add(settings.MODEL_PATH + 'table/TRAY_COVERS.buf', {
      onLoad: (content) => {
        const mesh = new TAAMesh(
          content as BufferGeometry,
          new ShaderMaterial({
            uniforms: Object.assign(
              { u_thermalRatio: thermodynamicOverlay.sharedUniforms.u_thermalRatio },
              blueNoise.sharedUniforms,
              gobo.sharedUniforms,
            ),
            vertexShader: tableShadowVert,
            fragmentShader: tableShadowFrag,
            blending: CustomBlending,
            blendEquation: AddEquation,
            blendSrc: SrcAlphaFactor,
            blendDst: OneMinusSrcAlphaFactor,
            blendEquationAlpha: AddEquation,
            blendSrcAlpha: ZeroFactor,
            blendDstAlpha: OneFactor,
            defines: { BLUR_SAMPLE: 6 },
          }),
        );
        // Source quirk: TRAY_COVERS is assigned as a property on the Map
        // (`this.meshes.TRAY_COVERS = ...`), not via set().
        (this.meshes as unknown as Record<string, TAAMesh>).TRAY_COVERS = mesh;
        this.container.add(mesh);
        cameraControls.initClippingMesh(mesh);
        mesh.renderOrder = -1.5;
        mesh.frustumCulled = false;
      },
    });
  }

  private _loadModel(name: 'DESK' | 'PINBOARD' | 'WALL', width: number, height: number): void {
    if (browser.isMobile) {
      width /= 2;
      height /= 2;
    }
    const texture = loader.load(settings.TEXTURE_PATH + `table/${name}.webp`, {
      type: 'texture',
      colorSpace: SRGBColorSpace,
      autoMobile: true,
    }).content as Texture;
    let hdTexture: Texture | undefined;
    if (name === 'DESK') {
      hdTexture = loader.load(settings.TEXTURE_PATH + `table/${name}_HD.webp`, {
        type: 'texture',
        colorSpace: SRGBColorSpace,
        autoMobile: true,
      }).content as Texture;
    }
    loader.load(settings.MODEL_PATH + `table/${name}.buf`, {
      onLoad: (content) => {
        this._onModelLoaded(content as BufferGeometry, name, texture, width, height, hdTexture);
      },
    });
  }

  private _onModelLoaded(
    geometry: BufferGeometry,
    name: 'DESK' | 'PINBOARD' | 'WALL',
    texture: Texture,
    width: number,
    height: number,
    hdTexture?: Texture,
  ): void {
    if (name === 'PINBOARD') {
      const src = geometry;
      geometry = new InstancedBufferGeometry();
      for (const attrName in src.attributes) {
        geometry.setAttribute(attrName, src.attributes[attrName]);
      }
      geometry.setIndex(src.index);
      geometry.setAttribute(
        'instanceId',
        new InstancedBufferAttribute(new Uint8Array([0, 1]), 1),
      );
    }
    const uniforms: Record<string, IUniform> = Object.assign(
      {
        u_texture: { value: texture },
        u_textureSize: { value: new Vector2(width, height) },
        u_lightPosition: { value: this.lightPosition },
        u_coffeeInvMatrix: { value: this.coffeeInvMatrix },
        u_coasterInvMatrix: { value: this.coasterInvMatrix },
        u_thermalRatio: thermodynamicOverlay.sharedUniforms.u_thermalRatio,
      },
      blueNoise.sharedUniforms,
      gobo.sharedUniforms,
    );
    const mesh = new TAAMesh(
      geometry,
      new ShaderMaterial({
        vertexShader: tableVert,
        fragmentShader: tableFrag,
        uniforms,
        defines: { BLUR_SAMPLE: 6 },
      }),
    );
    mesh.renderOrder = -3;
    if (name === 'DESK') {
      uniforms.u_hdTexture = { value: hdTexture };
      uniforms.u_hdTextureShift = this.sharedUniforms.u_hdTextureShift;
      uniforms.u_reflectionTexture = { value: _reflectionRT.texture };
      uniforms.u_resolution = properties.sharedUniforms.u_resolution;
    }
    ((mesh.material as ShaderMaterial).defines as Record<string, unknown>)[
      `IS_${name.toUpperCase()}`
    ] = 1;
    this.meshes.set(name, mesh);
    this.container.add(mesh);
    cameraControls.initClippingMesh(mesh);
  }

  init(): void {
    _reflectionSplats = new Splats('/splats/table_reflection.sog', {
      preload: false,
      onLoad: () => {
        _reflectionSplats!.opacity = 0.5;
        _reflectionSplats!.colorMultiplier = 0.5;
      },
    });
    this._loadModel('DESK', 2048, 2048);
    this._loadModel('PINBOARD', 1024, 1024);
    this._loadModel('WALL', 512, 256);
  }

  resize(width: number, height: number): void {
    _reflectionRT.setSize(width, height);
  }

  preUpdate(_dt: number): void {}

  update(dt: number): void {
    this.container.updateMatrixWorld(true);
    if (_reflectionSplats && _reflectionSplats.mesh) {
      _reflectionSplats.updateMatrixWorld(true);
      _reflectionSplats.update(dt);
      const colorState = fboHelper.getColorState();
      fboHelper.renderer.autoClear = true;
      fboHelper.renderMesh(_reflectionSplats.mesh, _reflectionRT, properties.camera);
      fboHelper.setColorState(colorState);
    }
  }

  postUpdate(_dt: number): void {
    this.lightPosition.copy(coaster.lightPosition);
    this.coffeeInvMatrix.copy(tableCoffee.container.matrixWorld).invert();
    this.coasterInvMatrix.copy(coaster.innerContainer.matrixWorld).invert();
    this.sharedUniforms.u_hdTextureShift.value = this.hdTextureShift;
  }
}

export const tableBase = new TableBase();
