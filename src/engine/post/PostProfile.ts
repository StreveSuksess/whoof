// 1:1 port of the source PostProfile (pretty line 15912-15977).

import { Color } from 'three';
import { mix, saturate } from '../core/math';

const _c0 = new Color();
const _c1 = new Color();

export class PostProfile {
  bloomAmount = 0;
  bloomRadius = 0.25;
  bloomThreshold = 0.3;
  bloomSmoothWidth = 0.75;
  bloomLumaStrength = 0;
  bloomSelectiveStrength = 0;
  bloomSaturation = 1;
  haloWidth = 0.75;
  haloRGBShift = 0.03;
  haloLeftColorHex = '#ff0000';
  haloMidColorHex = '#00ff00';
  haloRightColorHex = '#0000ff';
  haloStrength = 0;
  haloMaskInner = 0.3;
  haloMaskOuter = 0.5;
  vignetteFrom = 2;
  vignetteTo = 3;
  vignetteColorHex = '#000000';
  saturation = 1;
  contrast = 0;
  brightness = 1;
  tintColorHex = '#0044ef';
  tintOpacity = 0;
  screenPaintDistortionAmount = 0;
  screenPaintDistortionRGBShift = 0.5;
  screenPaintDistortionColorMultiplier = 20;
  screenPaintDistortionMultiplier = 5;
  cameraMotionBlurAmount = 0;
  bokehAmount = 0;
  bokehFNumber = 0.181;
  bokehFocusDistance = 4.5;
  bokehFocalLength = 0.344;
  bokehKFilmHeight = 19.26;
  smaaThreshold = 0.05;
  upscalerSharpness = 1;

  constructor(options: Partial<PostProfile> = {}) {
    Object.assign(this, options);
  }

  blend(other: Partial<PostProfile>, t = 0): void {
    t = saturate(t);
    const self = this as unknown as Record<string, unknown>;
    for (const key in other) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        const target = (other as Record<string, unknown>)[key];
        if (target !== self[key]) {
          if (typeof self[key] === 'string') {
            self[key] = '#' + _c0.setStyle(self[key] as string).lerp(_c1.setStyle(target as string), t).getHexString();
          } else if (typeof self[key] === 'number') {
            self[key] = mix(self[key] as number, target as number, t);
          }
        }
      }
    }
  }
}
