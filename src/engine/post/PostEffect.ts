// 1:1 port of the source PostEffect base (pretty line 13280-13298).

import type { RawShaderMaterial } from 'three';
import { fboHelper } from '../core/fboHelper';
import type { Postprocessing } from './postprocessing';

export class PostEffect {
  sharedUniforms: Record<string, { value: unknown }> = {};
  enabled = true;
  material: RawShaderMaterial | null = null;
  renderOrder = 0;
  private _hasShownWarning = false;

  init(options?: Record<string, unknown>): void {
    Object.assign(this, options);
  }

  needsRender(): boolean {
    return true;
  }

  warn(message: string): void {
    if (!this._hasShownWarning) {
      console.warn(message);
      this._hasShownWarning = true;
    }
  }

  render(post: Postprocessing, toScreen = false): void {
    if (this.material!.uniforms.u_texture) {
      this.material!.uniforms.u_texture.value = post.fromTexture;
    }
    fboHelper.render(this.material!, toScreen ? null : post.toRenderTarget);
    post.swap();
  }
}
