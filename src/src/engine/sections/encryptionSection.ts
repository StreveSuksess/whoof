// 1:1 port of the source EncryptionSection (pretty 21898-21976): the coaster
// flip/engraving segment — tagline/title/desc split-text, input field frame
// lines + blurBox, flip button wiring, tableScene animation 7..8 handoff.
// The MSDF engraving itself (tableScene.updateMsdfMessage →
// coaster.updateEncryptionText) lands with the CoasterText port.

import { SplitText } from 'gsap/SplitText';
import { ease } from '../core/ease';
import { fit } from '../core/math';
import { properties } from '../core/properties';
import { scrollManager } from '../core/ScrollPane';
import { tableScene } from '../scenes/tableScene';
import { blurBox } from '../post/BlurBox';

const DEFAULT_INPUT_VALUE = 'ORYZO';

let _domContainer: HTMLElement;
let _domInner: Element;
let _domTagline: HTMLElement;
let _domTaglineSplitText: SplitText;
let _domTitle: HTMLElement;
let _domTitleSplitText: SplitText;
let _domDesc: HTMLElement;
let _domDescSplitText: SplitText;
let _domField: HTMLElement;
let _domFieldLines: NodeListOf<HTMLElement>;
let _domFieldInput: HTMLInputElement;
let _domFlipBtn: HTMLElement;

export class EncryptionSection {
  prevShowScreenOffset = 0;
  needsInputReset = false;
  msdfMessage = '';

  preInit(root: Element): void {
    _domContainer = root.querySelector('#encryption') as HTMLElement;
    _domInner = _domContainer.querySelector('.section__inner') as Element;
    _domTagline = _domContainer.querySelector('#encryption-tagline') as HTMLElement;
    _domTaglineSplitText = SplitText.create(_domTagline, {
      type: 'words',
      autoSplit: false,
      mask: 'words',
    });
    _domTitle = _domContainer.querySelector('#encryption-title') as HTMLElement;
    _domTitleSplitText = SplitText.create(_domTitle, {
      type: 'lines,chars',
      autoSplit: false,
    });
    _domDesc = _domContainer.querySelector('#encryption-desc') as HTMLElement;
    _domDescSplitText = SplitText.create(_domDesc, {
      type: 'lines',
      autoSplit: false,
      mask: 'lines',
    });
    _domField = _domContainer.querySelector('#encryption-field') as HTMLElement;
    _domFieldLines = _domField.querySelectorAll('.encryption-field-line');
    _domFieldInput = _domContainer.querySelector('#encryption-field-input') as HTMLInputElement;
    _domFieldInput.addEventListener('input', this.handleEncryptionFieldInputChange.bind(this));
    _domFieldInput.addEventListener('focus', () => {
      if (!tableScene.isFlipped) tableScene.flipCoaster();
    });
    _domFlipBtn = _domContainer.querySelector('#encryption-field-flip-btn') as HTMLElement;
    this.msdfMessage = _domFieldInput.value;
    tableScene.onFlipped.add(() => {
      _domFlipBtn.classList.toggle('is-active', !tableScene.isFlipped);
    });
    _domFieldInput.addEventListener('focus', () => {
      _domFieldInput.select();
    });
  }

  init(): void {
    _domFlipBtn.addEventListener('click', () => {
      tableScene.flipCoaster();
    });
    this.updateMsdfMessage(this.msdfMessage);
  }

  private handleEncryptionFieldInputChange(e: Event): void {
    this.needsInputReset = true;
    this.updateMsdfMessage((e.target as HTMLInputElement).value);
  }

  updateMsdfMessage(message: string): void {
    tableScene.updateMsdfMessage((this.msdfMessage = message.toUpperCase()));
  }

  resize(): void {
    _domTaglineSplitText.split({ type: 'words', autoSplit: false, mask: 'words' });
    _domTitleSplitText.split({ type: 'lines,chars', autoSplit: false });
    _domDescSplitText.split({ type: 'lines', autoSplit: false, mask: 'lines' });
  }

  update(_dt: number): void {
    const useMobileLayout = properties.useMobileLayout;
    const containerRange = scrollManager.getDomRange(_domContainer);
    const innerRange = scrollManager.getDomRange(_domInner);
    const o = containerRange.showScreenOffset;
    const fieldRange = scrollManager.getDomRange(_domField);
    const show = fit(o, 0.5, 1, 0, 1);
    const hide = fit(o, 2, 3, 0, 1);
    const isVisible = show * (1 - hide) > 0;
    _domContainer.style.visibility = isVisible ? 'visible' : 'hidden';
    if (o < -0.25 && this.prevShowScreenOffset > o && this.needsInputReset) {
      this.needsInputReset = false;
      _domFieldInput.value = DEFAULT_INPUT_VALUE;
      this.updateMsdfMessage(DEFAULT_INPUT_VALUE);
    }
    if (isVisible) {
      for (let w = 0, count = _domTaglineSplitText.words.length; w < count; w++) {
        const ratio = w / (count - 1);
        const word = _domTaglineSplitText.words[w] as HTMLElement;
        const slide = fit(show, ratio * 0.15, 0.45 + ratio * 0.15, 1, 0, ease.cubicOut);
        word.style.transform = `translate3d(0,${slide * 1}em, 0)`;
        word.style.opacity = String(fit(hide, ratio * 0.15, ratio * 0.15 + 0.4, 1, 0));
      }
      for (let c = 0, count = _domTitleSplitText.chars.length; c < count; c++) {
        const ratio = c / (count - 1);
        const char = _domTitleSplitText.chars[c] as HTMLElement;
        char.style.filter = useMobileLayout
          ? 'none'
          : `blur(${fit(show, 0.15 + ratio * 0.3, ratio * 0.3 + 0.7, 0.3, 0).toFixed(2)}em)`;
        char.style.opacity = String(
          fit(show, ratio * 0.3, ratio * 0.3 + 0.6, 0, 1, ease.cubicOut)
            * fit(hide, ratio * 0.2, ratio * 0.2 + 0.8, 1, 0),
        );
      }
      for (let l = 0, count = _domDescSplitText.lines.length; l < count; l++) {
        const ratio = l / (count - 1);
        const line = _domDescSplitText.lines[l] as HTMLElement;
        const slide = fit(show, 0.4 + ratio * 0.3, 0.7 + ratio * 0.3, 1, 0, ease.cubicOut);
        line.style.transform = `translate3d(0,${slide * 1.2}em, 0)`;
        line.style.opacity = String(fit(hide, ratio * 0.3, ratio * 0.3 + 0.6, 1, 0));
      }
      const fieldShow = fit(show, 0.2, 1, 0, 1);
      const fieldHide = fit(hide, 0.2, 1, 0, 1);
      for (let l = 0, count = _domFieldLines.length; l < count; l++) {
        const style = _domFieldLines[l].style;
        if (l % 2) {
          style.height = fit(fieldShow, 0, 1, 0, 100, ease.cubicOut) + '%';
        } else {
          style.width = fit(fieldShow, 0, 1, 0, 100, ease.cubicOut) + '%';
        }
      }
      _domFieldInput.style.opacity = String(fit(fieldShow, 0.5, 1, 0, 1));
      _domField.style.opacity = String(1 - fieldHide);
      blurBox.anchor(fieldRange);
      blurBox.y = fieldRange.screenY - innerRange.screenY;
      blurBox.color.setStyle('#687952');
      blurBox.posB.y = fieldRange.height;
      blurBox.colorAlphaA = 0.15 * fieldShow * (1 - fieldHide);
      blurBox.colorAlphaB = 0;
      blurBox.blurRadiusA = 0.02 * fieldShow * (1 - fieldHide);
      blurBox.blurRadiusB = 0;
      _domFlipBtn.style.opacity = String(fit(show, 0.5, 1, 0, 1) * fit(hide, 0.5, 1, 1, 0));
    }
    let animation = tableScene.animation;
    animation = fit(o, -1, 0, animation, 7);
    animation = fit(o, 0, 1, animation, 8);
    tableScene.animation = animation;
    this.prevShowScreenOffset = o;
  }
}

export const encryptionSection = new EncryptionSection();
