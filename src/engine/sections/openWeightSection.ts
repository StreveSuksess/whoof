// 1:1 port of the source OpenWeightSection (pretty 28523-28539): anchors the
// blurBox behind the bibtex block while it is on screen.

import { scrollManager } from '../core/ScrollPane';
import { blurBox } from '../post/BlurBox';
import { Section } from './Section';

let _domContainer: HTMLElement;
let _domBibtex: HTMLElement;

export class OpenWeightSection extends Section {
  preInit(root: Element): void {
    super.preInit(root, 'open-weight');
    _domContainer = this.domContainer;
    _domBibtex = _domContainer.querySelector('#open-weight-bibtex') as HTMLElement;
  }

  init(): void {
    super.init();
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
  }

  update(dt: number): void {
    super.update(dt);
    const range = scrollManager.getDomRange(_domBibtex);
    if (range.isActive) {
      blurBox.anchor(range);
      blurBox.color.setStyle('#ffedd7');
      blurBox.posB.y = range.height;
      blurBox.colorAlphaA = 0.02;
      blurBox.colorAlphaB = 0.02;
      blurBox.blurRadiusA = 0.05;
      blurBox.blurRadiusB = 0;
    }
  }
}

export const openWeightSection = new OpenWeightSection();
