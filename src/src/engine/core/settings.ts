// Port of the source Settings (pretty line 13300-13339).

import { HalfFloatType } from 'three';
import type { TextureDataType } from 'three';
import { browser } from './browser';

export const MODEL_PATH = '/models/';
export const IMAGE_PATH = '/images/';
export const TEXTURE_PATH = '/textures/';
export const AUDIO_PATH = '/audios/';
export const USE_WEBGL2 = true;
export const DPR_RAW = browser.devicePixelRatio;
export const DPR = Math.min(1.5, browser.devicePixelRatio);
export const USE_PIXEL_LIMIT = true;
export const MAX_PIXEL_COUNT = 2560 * 1440;
export const UP_SCALE = 1;
// Set on the WebGL2 support path in the source (pretty line 30091).
export const RENDER_TARGET_FLOAT_TYPE: TextureDataType = HalfFloatType;
export const SKIP_ANIMATION = false;
