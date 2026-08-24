// Port of the source TextureHelper (pretty line 15366-15490): GPU channel
// mixing (packs DIFF.rgb + HEIGHT into one RGBA render target) and RGBM
// decoding into float render targets.

import {
  AddEquation,
  ClampToEdgeWrapping,
  CustomBlending,
  LinearFilter,
  LinearMipMapLinearFilter,
  LinearMipMapNearestFilter,
  NearestFilter,
  NearestMipMapLinearFilter,
  NearestMipMapNearestFilter,
  OneFactor,
  RawShaderMaterial,
  RepeatWrapping,
  Vector2,
  Vector4,
} from 'three';
import type { DataTexture, Texture, WebGLRenderTarget } from 'three';
import { fboHelper } from './fboHelper';
import { loader } from './Loader';
import { properties } from './properties';
import { channelMixerFrag, rgbmFrag } from '../glsl';

interface RGBMOptions {
  isAdd?: boolean;
  minFilter?: number;
  callback?: (texture: Texture) => void;
  anisotropy?: number;
  dispose?: boolean;
  wrapS?: number;
  wrapT?: number;
  maxRange?: number;
  autoMobile?: boolean;
}

interface RGBAOptions {
  isAdd?: boolean;
  minFilter?: number;
  callback?: () => void;
  anisotropy?: number;
  dispose?: boolean;
  uvScaleX?: number;
  uvScaleY?: number;
  uvScaleXAlpha?: number;
  uvScaleYAlpha?: number;
  wrapS?: number;
  wrapT?: number;
  autoMobile?: boolean;
}

class TextureHelper {
  blackTexture!: DataTexture;
  whiteTexture!: DataTexture;
  transparentTexture!: DataTexture;
  private channelMixerMaterial: RawShaderMaterial | null = null;
  private rgbmMaterial: RawShaderMaterial | null = null;

  init(): void {
    this.blackTexture = this._createPixelTexture([0, 0, 0, 255]);
    this.whiteTexture = this._createPixelTexture([255, 255, 255, 255]);
    this.transparentTexture = this._createPixelTexture([0, 0, 0, 0]);
  }

  private _createPixelTexture(pixel: number[]): DataTexture {
    return fboHelper.createDataTexture(new Uint8Array(pixel), 1, 1, false, true);
  }

  mixChannels(
    texture: Texture,
    rt: WebGLRenderTarget,
    r = -1,
    g = -1,
    b = -1,
    a = -1,
    uvScaleX = 1,
    uvScaleY = 1,
  ): void {
    if (!this.channelMixerMaterial) {
      this.channelMixerMaterial = new RawShaderMaterial({
        uniforms: {
          u_texture: { value: null },
          u_channelMixerR: { value: new Vector4() },
          u_channelMixerG: { value: new Vector4() },
          u_channelMixerB: { value: new Vector4() },
          u_channelMixerA: { value: new Vector4() },
          u_uvScale: { value: new Vector2() },
        },
        vertexShader: fboHelper.vertexShader,
        fragmentShader: fboHelper.precisionPrefix + channelMixerFrag,
        blending: CustomBlending,
        blendEquation: AddEquation,
        blendDst: OneFactor,
        blendSrc: OneFactor,
        blendEquationAlpha: AddEquation,
        blendDstAlpha: OneFactor,
        blendSrcAlpha: OneFactor,
      });
    }
    const u = this.channelMixerMaterial.uniforms;
    u.u_texture.value = texture;
    (u.u_channelMixerR.value as Vector4)
      .set(+(r % 4 === 0), +(r % 4 === 1), +(r % 4 === 2), +(r % 4 === 3))
      .multiplyScalar(r < 0 ? 0 : 1);
    (u.u_channelMixerG.value as Vector4)
      .set(+(g % 4 === 0), +(g % 4 === 1), +(g % 4 === 2), +(g % 4 === 3))
      .multiplyScalar(g < 0 ? 0 : 1);
    (u.u_channelMixerB.value as Vector4)
      .set(+(b % 4 === 0), +(b % 4 === 1), +(b % 4 === 2), +(b % 4 === 3))
      .multiplyScalar(b < 0 ? 0 : 1);
    (u.u_channelMixerA.value as Vector4)
      .set(+(a % 4 === 0), +(a % 4 === 1), +(a % 4 === 2), +(a % 4 === 3))
      .multiplyScalar(a < 0 ? 0 : 1);
    (u.u_uvScale.value as Vector2).set(uvScaleX, uvScaleY);
    const state = fboHelper.getColorState();
    fboHelper.renderer.autoClear = false;
    fboHelper.render(this.channelMixerMaterial, rt);
    fboHelper.setColorState(state);
  }

  loadRGBMTexture(url: string, options: RGBMOptions = {}): Texture {
    const opts = Object.assign(
      {
        isAdd: true,
        minFilter: LinearFilter,
        callback: () => {},
        anisotropy: 0,
        rt: null,
        dispose: true,
        wrapS: RepeatWrapping,
        wrapT: ClampToEdgeWrapping,
        maxRange: 6,
      },
      options,
    );
    const rt = fboHelper.createRenderTarget(1, 1, false, true);
    rt.texture.minFilter = opts.minFilter as never;
    rt.texture.wrapS = opts.wrapS as never;
    rt.texture.wrapT = opts.wrapT as never;
    if (!this.rgbmMaterial) {
      this.rgbmMaterial = fboHelper.createRawShaderMaterial({
        uniforms: {
          u_texture: { value: null },
          u_maxRange: { value: 6 },
        },
        fragmentShader: rgbmFrag,
      });
    }
    loader.add(url, {
      type: 'texture',
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      autoMobile: opts.autoMobile,
      onLoad: (content) => {
        const tex = content as Texture;
        rt.setSize((tex.image as ImageBitmap).width, (tex.image as ImageBitmap).height);
        this.rgbmMaterial!.uniforms.u_texture.value = tex;
        this.rgbmMaterial!.uniforms.u_maxRange.value = opts.maxRange;
        fboHelper.render(this.rgbmMaterial!, rt);
        if (opts.dispose) tex.dispose();
        opts.callback?.(rt.texture);
      },
    });
    return rt.texture;
  }

  loadRGBATexture(rgbUrl: string, alphaUrl: string, options: RGBAOptions = {}): Texture {
    const opts = Object.assign(
      {
        isAdd: true,
        minFilter: LinearFilter,
        callback: () => {},
        anisotropy: 0,
        rt: null,
        dispose: true,
        uvScaleX: 1,
        uvScaleY: 1,
        uvScaleXAlpha: 1,
        uvScaleYAlpha: 1,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
      },
      options,
    );
    let loadedCount = 0;
    const loadedTextures: { rgb?: Texture; alpha?: Texture } = {};
    const rt = fboHelper.createRenderTarget(1, 1);
    rt.texture.minFilter = opts.minFilter as never;
    rt.texture.generateMipmaps = false;
    rt.texture.wrapS = opts.wrapS as never;
    rt.texture.wrapT = opts.wrapT as never;
    const onBothLoaded = (): void => {
      loadedCount++;
      if (loadedCount === 2) {
        const rgbImage = loadedTextures.rgb!.image as ImageBitmap;
        rt.setSize(rgbImage.width, rgbImage.height);
        fboHelper.copy(this.transparentTexture, rt);
        this.mixChannels(loadedTextures.rgb!, rt, 0, 1, 2, -1, opts.uvScaleX, opts.uvScaleY);
        switch (rt.texture.minFilter as number) {
          case NearestMipMapNearestFilter as number:
          case NearestMipMapLinearFilter as number:
          case LinearMipMapNearestFilter as number:
          case LinearMipMapLinearFilter as number:
            rt.texture.generateMipmaps = true;
            rt.texture.anisotropy =
              opts.anisotropy || properties.renderer!.capabilities.getMaxAnisotropy();
            break;
          default:
            rt.texture.generateMipmaps = false;
        }
        this.mixChannels(
          loadedTextures.alpha!,
          rt,
          -1,
          -1,
          -1,
          0,
          opts.uvScaleXAlpha,
          opts.uvScaleYAlpha,
        );
        if (opts.dispose) {
          loadedTextures.rgb!.dispose();
          loadedTextures.alpha!.dispose();
        }
        if (opts.isAdd) setTimeout(opts.callback!, 4);
        else opts.callback!();
      }
    };
    loader.add(rgbUrl, {
      type: 'texture',
      minFilter: LinearFilter,
      autoMobile: opts.autoMobile,
      onLoad: (content) => {
        loadedTextures.rgb = content as Texture;
        onBothLoaded();
      },
    });
    loader.add(alphaUrl, {
      type: 'texture',
      minFilter: LinearFilter,
      autoMobile: opts.autoMobile,
      onLoad: (content) => {
        loadedTextures.alpha = content as Texture;
        onBothLoaded();
      },
    });
    return rt.texture;
  }
}

export const textureHelper = new TextureHelper();
