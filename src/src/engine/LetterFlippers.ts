// 1:1 port of the source LetterFlippers (pretty 30291-30343): hover-flip
// text effect for .is-flipper elements. Each char gets a duplicate stacked
// below inside the SplitText char mask; hover flips both up by 100% with a
// per-char backOut stagger whose direction follows the pointer's x delta.

import { SplitText } from 'gsap/SplitText';
import { ease } from './core/ease';
import { input } from './core/input';
import { fit, saturate } from './core/math';

type FlipperTarget = HTMLElement & {
  __splitText: SplitText;
  __extraChar?: HTMLElement;
};

type FlipperElement = HTMLElement & {
  __isFlipper: boolean;
  __isFlipped: boolean;
  __flipRatio: number;
  __speed: number;
  __dir: number;
  __targets: FlipperTarget[];
};

const _domList: FlipperElement[] = [];
let _hoverDom: FlipperElement | null = null;

export class LetterFlippers {
  add(dom: HTMLElement, targets?: HTMLElement[] | HTMLElement): void {
    const flipper = dom as FlipperElement;
    if (flipper.__isFlipper) return;
    flipper.__isFlipper = true;
    flipper.__isFlipped = false;
    flipper.__flipRatio = 0;
    flipper.__speed = 1;
    flipper.__dir = 1;
    targets = targets || dom;
    flipper.__targets = (Array.isArray(targets) ? targets : [targets]) as FlipperTarget[];
    _domList.push(flipper);
    let maxChars = 1;
    for (let i = 0, count = flipper.__targets.length; i < count; i++) {
      const target = flipper.__targets[i];
      target.__splitText = SplitText.create(target, {
        type: 'chars',
        autoSplit: false,
        mask: 'chars',
      });
      maxChars = Math.max(maxChars, target.__splitText.chars.length);
      const chars = target.__splitText.chars;
      for (let c = 0, charCount = chars.length; c < charCount; c++) {
        const char = chars[c] as HTMLElement;
        const extra = (target.__extraChar = document.createElement('div'));
        extra.style.position = 'absolute';
        extra.style.top = '100%';
        extra.style.left = '0';
        extra.textContent = char.textContent;
        char.appendChild(extra);
      }
    }
    flipper.__speed = 2 + 4 / maxChars;
  }

  update(dt: number): void {
    let hovered: FlipperElement | undefined;
    const throughElems = input.currThroughElems;
    for (let i = 0, count = throughElems.length; i < count; i++) {
      const elem = throughElems[i] as FlipperElement;
      if (elem.__isFlipper) {
        hovered = elem;
        break;
      }
    }
    if (_hoverDom && _hoverDom !== hovered) {
      _hoverDom.__isFlipped = false;
      _hoverDom = null;
    }
    if (hovered && hovered !== _hoverDom) {
      _hoverDom = hovered;
      _hoverDom.__isFlipped = true;
      _hoverDom.__dir = input.deltaXY.x > 0 ? 1 : -1;
    }
    for (let i = 0, count = _domList.length; i < count; i++) {
      const flipper = _domList[i];
      const ratio = saturate(
        flipper.__flipRatio + (flipper.__isFlipped ? 1 : -1) * flipper.__speed * dt,
      );
      if (flipper.__flipRatio !== ratio) {
        flipper.__flipRatio = ratio;
        for (let t = 0, targetCount = flipper.__targets.length; t < targetCount; t++) {
          const chars = flipper.__targets[t].__splitText.chars;
          for (let c = 0, charCount = chars.length; c < charCount; c++) {
            let charRatio = c / (charCount - 1);
            if (flipper.__dir < 0) charRatio = 1 - charRatio;
            const flip = fit(ratio, charRatio * 0.4, charRatio * 0.4 + 0.6, 0, 1, ease.backOut);
            (chars[c] as HTMLElement).style.transform = `translate3d(0,${flip * -100}%, 0)`;
          }
        }
      }
    }
  }
}

export const letterFlippers = new LetterFlippers();
