// 1:1 port of the source Section base class (pretty 13046-13061).

import { scrollManager } from '../core/ScrollPane';

export class Section {
  domContainer!: HTMLElement;
  isActive = false;

  preInit(root: Element, id: string): void {
    this.domContainer = root.querySelector('#' + id) as HTMLElement;
  }

  init(): void {}

  resize(_width: number, _height: number): void {}

  testVisibility(): void {
    const range = scrollManager.getDomRange(this.domContainer);
    this.isActive = range.isActive;
  }

  update(_dt: number): void {
    this.testVisibility();
    this.domContainer.style.visibility = this.isActive ? 'visible' : 'hidden';
  }
}
