// 1:1 port of the source Sketches (pretty 21624-21727): the floating pencil
// sketch cards orbiting during the features curve segment, masked by the
// screen paint and channel-packed sketch atlases.

import {
  AdditiveBlending,
  Color,
  GLSL3,
  Matrix4,
  Mesh,
  Object3D,
  OrthographicCamera,
  Vector3,
} from 'three';
import type { RawShaderMaterial, Texture } from 'three';
import { blueNoise } from '../core/blueNoise';
import { fboHelper } from '../core/fboHelper';
import { loader } from '../core/Loader';
import { properties } from '../core/properties';
import * as settings from '../core/settings';
import { textureHelper } from '../core/textureHelper';
import { sketchesFrag, sketchesVert } from '../glsl';
import { screenPaint } from '../post/ScreenPaint';

interface SketchData {
  scale: number;
  aspect: number;
}

type SketchMesh = Mesh & {
  localMatrix: Matrix4;
  opacity: number;
  blur: number;
};

const _dataList: SketchData[] = [
  { scale: 0.75, aspect: 1685 / 1035 },
  { scale: 1, aspect: 1239 / 1281 },
  { scale: 1, aspect: 1780 / 1473 },
  { scale: 0.75, aspect: 1602 / 864 },
  { scale: 0.75, aspect: 1557 / 848 },
  { scale: 1, aspect: 1133 / 1500 },
];
const _vp = new Matrix4();
const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 3);
const list: SketchMesh[] = [];

export class Sketches {
  container = new Object3D();
  activeRatio = 1;
  camera = camera;
  offsetX = 0;
  offsetY = 0;
  isActive = false;
  sharedUniforms = {
    u_activeRatio: { value: 0 },
  };
  list = list;

  preInit(): void {
    this.camera.position.z = 2;
    for (let i = 0; i < _dataList.length; i++) {
      const mesh = (list[i] = new Mesh(
        fboHelper.quadGeom,
        fboHelper.createRawShaderMaterial({
          uniforms: Object.assign(
            {
              u_texture: { value: textureHelper.blackTexture },
              u_mixer: {
                value: new Vector3(i % 3 === 0 ? 1 : 0, i % 3 === 1 ? 1 : 0, i % 3 === 2 ? 1 : 0),
              },
              u_screenPaintTexture: screenPaint.sharedUniforms.u_currPaintTexture,
              u_resolution: properties.sharedUniforms.u_resolution,
              u_mvp: { value: new Matrix4() },
              u_color: { value: new Color(16740645) },
              u_opacity: { value: 1 },
              u_blur: { value: 1 },
            },
            this.sharedUniforms,
            blueNoise.sharedUniforms,
          ),
          defines: { BLUR_SAMPLE: 3 },
          vertexShader: sketchesVert,
          fragmentShader: sketchesFrag,
          blending: AdditiveBlending,
          depthTest: false,
          depthWrite: false,
          derivatives: true,
          glslVersion: GLSL3,
        }),
      ) as SketchMesh);
      const scale = _dataList[i].scale;
      mesh.userData = _dataList[i] as unknown as Record<string, unknown>;
      mesh.localMatrix = new Matrix4().makeScale(_dataList[i].aspect * scale, scale, 1);
      mesh.renderOrder = 10;
      mesh.frustumCulled = false;
      mesh.matrixAutoUpdate = false;
      mesh.opacity = 1;
      mesh.blur = 0;
      this.container.add(mesh);
    }
  }

  init(): void {
    const atlasA = loader.load(settings.TEXTURE_PATH + 'sketches/sketches_a.png', {
      type: 'texture',
    }).content as Texture;
    const atlasB = loader.load(settings.TEXTURE_PATH + 'sketches/sketches_b.png', {
      type: 'texture',
    }).content as Texture;
    for (let i = 0; i < list.length; i++) {
      (list[i].material as RawShaderMaterial).uniforms.u_texture.value = i < 3 ? atlasA : atlasB;
    }
  }

  resize(): void {}

  preUpdate(_dt: number): void {}

  update(_dt: number): void {
    this.container.visible = this.isActive;
    if (this.isActive) {
      const width = properties.viewportWidth;
      const height = properties.viewportHeight;
      const offsetX = this.offsetX;
      const offsetY = this.offsetY;
      this.sharedUniforms.u_activeRatio.value = this.activeRatio;
      camera.left = ((-1 + offsetX) * width) / height;
      camera.right = ((1 + offsetX) * width) / height;
      camera.bottom = -1 + offsetY;
      camera.top = 1 + offsetY;
      camera.updateProjectionMatrix();
      camera.updateMatrix();
      camera.updateMatrixWorld();
      _vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      for (let i = 0; i < list.length; i++) {
        const mesh = list[i];
        const material = mesh.material as RawShaderMaterial;
        material.uniforms.u_opacity.value = mesh.opacity;
        material.uniforms.u_blur.value = mesh.blur;
        mesh.visible = mesh.opacity > 0;
        const mvp = material.uniforms.u_mvp.value as Matrix4;
        mesh.updateMatrix();
        mesh.updateMatrixWorld();
        mvp.multiplyMatrices(_vp, mesh.matrixWorld);
        mvp.multiply(mesh.localMatrix);
      }
    }
  }
}

export const sketches = new Sketches();
