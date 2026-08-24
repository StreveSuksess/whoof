// 1:1 port of the source ShaderHelper (pretty line 13340).

import { ShaderChunk } from 'three';

class ShaderHelper {
  glslifyStrip(code: string): string {
    return code.replace(/#define\sGLSLIFY\s./, '');
  }

  addChunk(name: string, code: string): void {
    (ShaderChunk as unknown as Record<string, string>)[name] = this.glslifyStrip(code);
  }

  private _wrapInclude(name: string): string {
    return '#include <' + name + '>';
  }

  insertBefore(shader: string, target: string, code: string, isInclude?: boolean): string {
    const t = isInclude ? this._wrapInclude(target) : target;
    return shader.replace(t, this.glslifyStrip(code) + '\n' + t);
  }

  insertAfter(shader: string, target: string, code: string, isInclude?: boolean): string {
    const t = isInclude ? this._wrapInclude(target) : target;
    return shader.replace(t, t + '\n' + this.glslifyStrip(code) + '\n');
  }

  replace(shader: string, target: string, code: string, isInclude?: boolean): string {
    const t = isInclude ? this._wrapInclude(target) : target;
    return shader.replace(t, '\n' + this.glslifyStrip(code) + '\n');
  }
}

export const shaderHelper = new ShaderHelper();
