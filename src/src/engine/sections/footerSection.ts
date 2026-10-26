import { fit } from '../core/math';
import { scrollManager } from '../core/ScrollPane';
import { footerScene } from '../scenes/footerScene';
import { siteHeader } from '../SiteHeader';
import { Section } from './Section';

let _domLoveButton: HTMLButtonElement | null = null;
let _domLoveButtonChildren: HTMLCollection | never[] = [];
let _domLoveCopiedSpan: HTMLSpanElement | null = null;

export class FooterSection extends Section {
  domInner!: Element;

  preInit(root: Element): void {
    super.preInit(root, 'footer');
    this.domInner = this.domContainer.querySelector('.section__inner') as Element;
    _domLoveButton = document.querySelector('#footer-love button');
    if (_domLoveButton) {
      _domLoveButton.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText('https://whoof.ru/'); } catch { return; }
        for (let i = 0; i < _domLoveButtonChildren.length; i++) {
          (_domLoveButtonChildren[i] as HTMLElement).style.display = 'none';
        }
        _domLoveCopiedSpan!.style.display = 'block';
        _domLoveButton!.classList.add('copied');
        setTimeout(() => {
          _domLoveButton!.classList.remove('copied');
        }, 500);
        setTimeout(() => {
          for (let i = 0; i < _domLoveButtonChildren.length; i++) {
            (_domLoveButtonChildren[i] as HTMLElement).style.display = 'inline-block';
          }
          _domLoveCopiedSpan!.style.display = 'none';
        }, 2000);
      });
    }
  }

  init(): void {
    super.init();
    _domLoveButtonChildren = _domLoveButton!.children;
    _domLoveCopiedSpan = document.createElement('span');
    _domLoveCopiedSpan.textContent = 'СКОПИРОВАНО';
    _domLoveCopiedSpan.style.display = 'none';
    _domLoveButton!.appendChild(_domLoveCopiedSpan);
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
  }

  update(_dt: number): void {
    const range = scrollManager.getDomRange(this.domContainer);
    const hide = range.hideScreenOffset;
    footerScene.activeRatio = fit(hide, -2, -1, 0, 1);
    if (range.showScreenOffset > 0) siteHeader.changeNav('footer');
  }
}

export const footerSection = new FooterSection();
