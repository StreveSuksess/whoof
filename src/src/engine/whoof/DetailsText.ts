import { SplitText } from 'gsap/SplitText';
import { ease } from '../core/ease';
import { fit } from '../core/math';

export const DETAIL_STOPS = [1.18, 2.24, 3.32];
const SHOW = [.68, 1.78, 2.88];
const HIDE = [1.48, 2.58, 3.56];
const valueOptions = { type: 'lines,chars', mask: 'chars', autoSplit: false } as const;
const captionOptions = { type: 'lines', mask: 'lines', autoSplit: false } as const;

/** FeaturesSection._updateItem's masked glyph and line choreography, mapped to
 * the current three product poses. Each fact stays anchored while type reveals.
 */
export class DetailsText {
  private items = [...document.querySelectorAll<HTMLElement>('.detail-fact')].map(element => ({
    element,
    value: SplitText.create(element.querySelector('.detail-value')!, valueOptions),
    caption: SplitText.create(element.querySelector('.detail-caption')!, captionOptions),
  }));

  resize() {
    for (const item of this.items) {
      item.value.split(valueOptions);
      item.caption.split(captionOptions);
    }
  }

  render(scroll: number, reduced: boolean) {
    this.items.forEach((item, index) => {
      const show = fit(scroll, SHOW[index], SHOW[index] + .42, 0, 1);
      const hide = fit(scroll, HIDE[index], HIDE[index] + .32, 0, 1);
      const visible = show > 0 && hide < 1;
      item.element.style.visibility = visible ? 'visible' : 'hidden';
      item.element.setAttribute('aria-hidden', String(!visible));
      if (!visible) return;
      // Safe for a single character/line. The original stagger spans .4 of the reveal.
      const animate = (elements: Element[], entrance: number, isCaption: boolean) => {
        elements.forEach((element, i) => {
          const ratio = i / Math.max(1, elements.length - 1);
          const enter = fit(entrance, ratio * .4, ratio * .4 + .6, 0, 1, ease.cubicOut);
          const exit = fit(hide, ratio * .4, ratio * .4 + .6, 0, 1, ease.cubicIn);
          const node = element as HTMLElement;
          node.style.transform = reduced ? 'none' : `translate3d(0,${(1 - enter) - exit * (isCaption ? 1 : .7)}em,0)`;
          node.style.opacity = reduced ? '1' : String(enter * (1 - exit));
        });
      };
      animate(item.value.chars, show, false);
      animate(item.caption.lines, fit(show, .16, 1, 0, 1), true);
    });
  }
}
