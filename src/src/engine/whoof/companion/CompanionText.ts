import { SplitText } from 'gsap/SplitText';
import { ease } from '../../core/ease';
import { fit } from '../../core/math';

export const COMPANION_STOP = 5.05;
const options = { type: 'lines,chars', mask: 'chars', autoSplit: false } as const;

/** One statement, choreographed from scroll with the same masked typography
 * used in the Oryzo source. Hidden until the actual companion asset is ready.
 */
export class CompanionText {
  private split: SplitText;
  private link: HTMLElement;
  constructor(private root: HTMLElement) {
    this.split = SplitText.create(root.querySelector('h2')!, options);
    this.link = root.querySelector('.companion-order')!;
  }
  resize() { this.split.split(options); }
  render(scroll: number, ready: boolean, reduced: boolean) {
    const show = ready ? fit(scroll, 4.32, 4.98, 0, 1) : 0;
    const hide = fit(scroll, 5.68, 6.3, 0, 1);
    const visible = show > 0 && hide < 1;
    this.root.style.opacity=String(1-hide);
    this.root.style.visibility = visible ? 'visible' : 'hidden';
    this.root.setAttribute('aria-hidden', String(!visible));
    this.link.tabIndex = show > .95 && hide < .05 ? 0 : -1;
    this.link.style.pointerEvents = show > .95 && hide < .05 ? 'auto' : 'none';
    if (!visible) return;
    this.split.chars.forEach((char, i) => {
      const ratio = i / Math.max(1, this.split.chars.length - 1);
      const enter = reduced ? 1 : fit(show, ratio * .4, ratio * .4 + .6, 0, 1, ease.cubicOut);
      const element = char as HTMLElement;
      element.style.transform = `translate3d(0,${1 - enter}em,0)`;
      element.style.opacity = String(enter);
    });
    const linkShow = reduced ? 1 : fit(show, .65, 1, 0, 1, ease.cubicOut);
    this.link.style.opacity = String(linkShow);
    this.link.style.transform = `translate3d(0,${(1 - linkShow) * 10}px,0)`;
  }
  dispose() { this.split.revert(); }
}
