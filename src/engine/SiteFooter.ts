// 1:1 port of the source SiteFooter (pretty 21116-21155): the fixed
// scroll-indicator strip (spinning wheel icon, cycling arrows, staggered
// char reveal) positioned left/center/right by the active section, plus the
// light/dark theme class.

import { SplitText } from 'gsap/SplitText';
import { ease } from './core/ease';
import { fit } from './core/math';
import { properties } from './core/properties';
import { scrollManager } from './core/ScrollPane';

let _domContainer: HTMLElement;
let _domScroll: HTMLElement;
let _domScrollSplitText: SplitText;
let _domScrollWheel: SVGElement;
let _domScrollArrowWrapper: HTMLElement;
let _domScrollArrowList: NodeListOf<SVGElement>;
let _scrollSide: string | false = false;
let _scrollOffset = 0;
let _scrollRatio = 0;
let _theme = 'dark';

export class SiteFooter {
  preInit(): void {
    _domContainer = document.getElementById('site-footer') as HTMLElement;
    _domScroll = _domContainer.querySelector('#site-footer-scroll') as HTMLElement;
    _domScrollSplitText = SplitText.create(
      _domScroll.querySelector('#site-footer-scroll-text') as HTMLElement,
      { type: 'chars', autoSplit: false },
    );
    _domScrollWheel = _domScroll.querySelector('#site-footer-scroll-icon > svg') as SVGElement;
    _domScrollArrowWrapper = _domScroll.querySelector('#site-footer-scroll-arrow') as HTMLElement;
    _domScrollArrowList = _domScrollArrowWrapper.querySelectorAll('svg');
  }

  init(): void {}

  resize(_width?: number, _height?: number): void {
    _domScrollSplitText.split({});
  }

  setTheme(theme: string): void {
    _theme = theme;
  }

  setScroll(side: string, offset: number, ratio: number): void {
    _scrollSide = side;
    _scrollOffset = offset;
    _scrollRatio = ratio;
  }

  update(_dt: number): void {
    const range = scrollManager.getDomRange(_domScroll);
    const visible = _scrollRatio > 0;
    _domScroll.style.visibility = visible ? 'visible' : 'hidden';
    if (visible) {
      const r = _scrollRatio * fit(properties.startTime, 0.5, 1.5, 0, 1);
      let offset = _scrollOffset;
      if (_scrollSide === 'center') {
        offset += (properties.viewportWidth - properties.paddingX * 2 - range.width) / 2;
      } else if (_scrollSide === 'right') {
        offset += properties.viewportWidth - properties.paddingX * 2 - range.width;
      }
      _domScroll.style.transform = `translate3d(${offset}px, 0, 0)`;
      const arrowCycle = fit(properties.time % 1.75, 0, 1, 0, 1, ease.expoInOut);
      _domScrollWheel.style.transform = `rotate(${properties.time}rad) scale(${fit(r, 0, 1, 0.5, 1, ease.backOut)})`;
      _domScrollWheel.style.opacity = String(fit(r, 0, 0.5, 0, 0.6));
      _domScrollArrowWrapper.style.transform = `translate3d(0, ${arrowCycle * 0.5}em, 0)`;
      _domScrollArrowList[0].style.opacity = String(arrowCycle * r);
      _domScrollArrowList[1].style.opacity = String((1 - arrowCycle) * r);
      for (let i = 0, count = _domScrollSplitText.chars.length; i < count; i++) {
        const ratio = i / (count - 1);
        const char = _domScrollSplitText.chars[i] as HTMLElement;
        char.style.opacity = String(fit(r, ratio * 0.3, 0.7 + ratio * 0.3, 0, 1));
      }
    }
    _domContainer.classList.toggle('is-light', _theme === 'light');
  }
}

export const siteFooter = new SiteFooter();
