// 1:1 port of the source BlueNoise (pretty line 13371-13402).
// LDR_RGB1_0.png is the 128px blue-noise texture.

import { LinearFilter, NearestFilter, RepeatWrapping, Texture, Vector2 } from 'three';
import { loader } from './Loader';
import { shaderHelper } from './shaderHelper';
import * as settings from './settings';
import { getBlueNoise as getBlueNoiseShader } from '../glsl';

class BlueNoise {
  sharedUniforms = {
    u_blueNoiseTexture: { value: null as Texture | null },
    u_blueNoiseLinearTexture: { value: null as Texture | null },
    u_blueNoiseTexelSize: { value: null as Vector2 | null },
    u_blueNoiseCoordOffset: { value: new Vector2() },
  };
  TEXTURE_SIZE = 128;

  preInit(): void {
    const linear = new Texture();
    linear.generateMipmaps = false;
    linear.minFilter = linear.magFilter = LinearFilter;
    linear.wrapS = linear.wrapT = RepeatWrapping;
    const nearest = new Texture();
    loader.add(settings.TEXTURE_PATH + 'LDR_RGB1_0.png', {
      weight: 55,
      onLoad: (content: unknown) => {
        nearest.image = content as ImageBitmap;
        linear.image = content as ImageBitmap;
        nearest.needsUpdate = true;
        linear.needsUpdate = true;
      },
    });
    nearest.generateMipmaps = false;
    nearest.minFilter = nearest.magFilter = NearestFilter;
    nearest.wrapS = nearest.wrapT = RepeatWrapping;
    this.sharedUniforms.u_blueNoiseTexture.value = nearest;
    this.sharedUniforms.u_blueNoiseLinearTexture.value = linear;
    this.sharedUniforms.u_blueNoiseTexelSize.value = new Vector2(
      1 / this.TEXTURE_SIZE,
      1 / this.TEXTURE_SIZE,
    );
    shaderHelper.addChunk('getBlueNoise', getBlueNoiseShader);
  }

  update(): void {
    this.sharedUniforms.u_blueNoiseCoordOffset.value.set(Math.random(), Math.random());
  }
}

export const blueNoise = new BlueNoise();
