// 1:1 port of the source Bg (pretty line 15112-15174).

import {
  AddEquation,
  Color,
  CustomBlending,
  Mesh,
  Object3D,
  OneFactor,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  SrcAlphaFactor,
  Vector2,
  ZeroFactor,
} from 'three';
import { blueNoise } from '../core/blueNoise';
import { cameraControls } from '../core/cameraControls';
import { fboHelper } from '../core/fboHelper';
import { properties } from '../core/properties';
import { shaderHelper } from '../core/shaderHelper';
import { bgFrag, bgVert, getBgColor } from '../glsl';

class Bg {
  container = new Object3D();
  bgColor = new Color('#4c3e37');
  color0 = new Color('#0f0804');
  color1 = new Color('#6d3916');
  offset = new Vector2();
  size = new Vector2();
  clearColorRatio = 0;
  renderOrder = -10;
  opacity = 1;
  mesh!: Mesh;
  sharedUniforms = {
    u_bgColor0: { value: this.color0 },
    u_bgColor1: { value: this.color1 },
    u_bgOffset: { value: this.offset },
    u_bgSize: { value: this.size },
    u_clearColorRatio: { value: 0 },
    u_clearColor: { value: this.bgColor },
  };

  preInit(): void {
    shaderHelper.addChunk('getBgColor', getBgColor);
    this.mesh = new Mesh(
      fboHelper.quadGeom,
      new ShaderMaterial({
        vertexShader: bgVert,
        fragmentShader: bgFrag,
        uniforms: Object.assign(
          {
            u_resolution: properties.sharedUniforms.u_resolution,
            u_opacity: { value: 0 },
          },
          blueNoise.sharedUniforms,
          this.sharedUniforms,
        ),
        blending: CustomBlending,
        blendEquation: AddEquation,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        blendEquationAlpha: AddEquation,
        blendDstAlpha: OneFactor,
        blendSrcAlpha: ZeroFactor,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.mesh.frustumCulled = false;
    this.container.add(this.mesh);
    cameraControls.initClippingMesh(this.mesh);
  }

  init(): void {}

  resize(): void {}

  preUpdate(): void {
    this.renderOrder = -10;
    this.opacity = 1;
    this.offset.set(0, 0);
    this.size.set(1, 1);
    this.clearColorRatio = 0;
    this.bgColor.set(properties.bgColorHex).convertSRGBToLinear();
  }

  update(): void {
    const mesh = this.mesh;
    mesh.renderOrder = this.renderOrder;
    (mesh.material as ShaderMaterial).uniforms.u_opacity.value = this.opacity;
    this.sharedUniforms.u_clearColorRatio.value = this.clearColorRatio;
    mesh.visible = this.opacity > 0;
  }
}

export const bg = new Bg();
