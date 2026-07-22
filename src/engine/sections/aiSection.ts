// 1:1 port of the source AiSection (pretty 21261-21371): the pre-text
// slide-through, six-finger title char reveal (last char back-out pop),
// tagline masked chars, hover-instruction wandering icon, desc masked
// lines, disclaimer dashline, and the handScene ratio driving that the
// webgl.ts stand-in previously covered.

import { SplitText } from 'gsap/SplitText';
import { ease } from '../core/ease';
import { fit } from '../core/math';
import { properties } from '../core/properties';
import { scrollManager } from '../core/ScrollPane';
import { handScene } from '../scenes/handScene';
import { postprocessing } from '../post/postprocessing';
import { Section } from './Section';

let _domContainer: HTMLElement;
let _domPre: HTMLElement;
let _domPreText1: HTMLElement;
let _domPreText2: HTMLElement;
let _domPreText1SplitText: SplitText;
let _domPreText2SplitText: SplitText;
let _domHeader: HTMLElement;
let _domTitle: HTMLElement;
let _domTitleSplitText: SplitText;
let _domTagline: HTMLElement;
let _domTaglineSplitText: SplitText;
let _domInstruction: HTMLElement;
let _domInstructionIcon: SVGElement;
let _domInstructionDashline: HTMLElement;
let _domInstructionText: HTMLElement;
let _domInstructionTextSplitText: SplitText;
let _domDesc: HTMLElement;
let _domDescSplitText: SplitText;
let _domDisclaimerWrapper: HTMLElement;
let _domDisclaimer: HTMLElement;
let _domDisclaimerDashline: HTMLElement;

export class AiSection extends Section {
  preInit(root: Element): void {
    super.preInit(root, 'ai');
    _domContainer = this.domContainer;
    _domContainer.querySelector('.section__inner');
    _domPre = _domContainer.querySelector('#ai-pre') as HTMLElement;
    _domPreText1 = _domPre.querySelector('h2') as HTMLElement;
    _domPreText2 = _domPre.querySelector('.body1') as HTMLElement;
    _domPreText1SplitText = SplitText.create(_domPreText1, {
      type: 'lines,chars',
      autoSplit: false,
    });
    _domPreText2SplitText = SplitText.create(_domPreText2, {
      type: 'lines,chars',
      autoSplit: false,
    });
    _domHeader = _domContainer.querySelector('#ai-header') as HTMLElement;
    _domTitle = _domContainer.querySelector('#ai-title') as HTMLElement;
    _domTitleSplitText = SplitText.create(_domTitle, { type: 'lines,chars', autoSplit: false });
    _domTagline = _domContainer.querySelector('#ai-tagline') as HTMLElement;
    _domTaglineSplitText = SplitText.create(_domTagline, {
      type: 'chars',
      autoSplit: false,
      mask: 'chars',
    });
    _domInstruction = _domContainer.querySelector('#ai-instruction') as HTMLElement;
    _domInstructionIcon = _domInstruction.querySelector('svg') as SVGElement;
    _domInstructionDashline = _domInstruction.querySelector('.o-dashline') as HTMLElement;
    _domInstructionText = _domContainer.querySelector('#ai-instruction-text') as HTMLElement;
    _domInstructionTextSplitText = SplitText.create(_domInstructionText, {
      type: 'chars',
      autoSplit: false,
      mask: 'chars',
    });
    _domDesc = _domContainer.querySelector('#ai-desc') as HTMLElement;
    _domDescSplitText = SplitText.create(_domDesc, {
      type: 'lines',
      autoSplit: false,
      mask: 'lines',
    });
    _domDisclaimerWrapper = _domContainer.querySelector('#ai-disclaimer-wrapper') as HTMLElement;
    _domDisclaimer = _domDisclaimerWrapper.querySelector('#ai-disclaimer') as HTMLElement;
    _domDisclaimerDashline = _domDisclaimerWrapper.querySelector('.o-dashline') as HTMLElement;
  }

  init(): void {
    super.init();
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    _domPreText1SplitText.split({});
    _domPreText2SplitText.split({});
    _domTitleSplitText.split({});
    _domTaglineSplitText.split({});
    _domInstructionTextSplitText.split({});
    _domDescSplitText.split({});
  }

  update(dt: number): void {
    super.update(dt);
    const useMobileLayout = properties.useMobileLayout;
    const r = scrollManager.getDomRange(_domContainer).showScreenOffset;
    const active = r > 0.5 && r < 9;
    this.domContainer.style.visibility = active ? 'visible' : 'hidden';
    const preIn = fit(r, 0.5, 1.25, 0, 1);
    const preOut = fit(r, 2.75, 3.5, 0, 1);
    const preShow = preIn * (1 - preOut);
    _domPre.style.visibility = preShow > 0 ? 'visible' : 'hidden';
    if (active) {
      for (let i = 0, count = _domPreText1SplitText.chars.length; i < count; i++) {
        const inv = 1 - i / (count - 1);
        const char = _domPreText1SplitText.chars[i] as HTMLElement;
        char.style.opacity = String(
          fit(preIn, inv * 0.3, inv * 0.3 + 0.6, 0, 1) * fit(preOut, inv * 0.3, inv * 0.3 + 0.6, 1, 0),
        );
      }
      for (let i = 0, count = _domPreText2SplitText.chars.length; i < count; i++) {
        const ratio = i / (count - 1);
        const char = _domPreText2SplitText.chars[i] as HTMLElement;
        char.style.opacity = String(
          fit(preIn, ratio * 0.3, ratio * 0.3 + 0.6, 0, 1)
            * fit(preOut, ratio * 0.3, ratio * 0.3 + 0.6, 1, 0),
        );
      }
      const preSlide = fit(r, 0.5, 2, -1, 0, ease.cubicOut) + fit(r, 2, 3.5, 0, 1, ease.cubicIn);
      if (useMobileLayout) {
        _domPreText1.style.transform = `translate3d(${preSlide * -1}em, 0, 0)`;
        _domPreText2.style.transform = `translate3d(${preSlide * 1}em, 0, 0)`;
      } else {
        _domPreText1.style.transform = `translate3d(0, ${preSlide * 1}em, 0)`;
        _domPreText2.style.transform = `translate3d(0, ${preSlide * -1}em, 0)`;
      }
    }
    const titleIn = fit(r, 3.5, 5, 0, 1);
    const titleOut = fit(r, 7.5, 8, 0, 1);
    const titleShow = titleIn * (1 - titleOut);
    _domHeader.style.visibility = titleShow > 0 ? 'visible' : 'hidden';
    if (active) {
      for (let i = 0, count = _domTitleSplitText.chars.length; i < count; i++) {
        const ratio = i / (count - 1);
        const char = _domTitleSplitText.chars[i] as HTMLElement;
        if (i === count - 1) {
          const pop = fit(titleIn, 0.6, 1, 0, 1, ease.backOut);
          char.style.transform = `scale(${pop})`;
        } else {
          const slide = fit(titleIn, ratio * 0.3, ratio * 0.3 + 0.6, 0.25, 0, ease.expoOut);
          char.style.transform = `translate3d(${slide}ex, 0, 0)`;
        }
        char.style.opacity = String(
          fit(titleIn, ratio * 0.3, ratio * 0.3 + 0.4, 0, 1, ease.expoOut)
            * fit(titleOut, ratio * 0.2, ratio * 0.2 + 0.8, 1, 0),
        );
        char.style.filter = useMobileLayout
          ? 'none'
          : `blur(${fit(titleIn, ratio * 0.3, ratio * 0.3 + 0.4, 0.1, 0, ease.expoOut)}em)`;
      }
      for (let i = 0, count = _domTaglineSplitText.chars.length; i < count; i++) {
        const ratio = i / (count - 1);
        const char = _domTaglineSplitText.chars[i] as HTMLElement;
        const drop = fit(titleIn, ratio * 0.2 + 0.1, ratio * 0.2 + 0.7, 1, 0, ease.expoOut);
        char.style.transform = `translate3d(0,${drop}em, 0)`;
      }
    }
    const instrIn = fit(r, 5.5, 6, 0, 1);
    const instrOut = fit(r, 7.5, 8, 0, 1);
    const instrShow = instrIn * (1 - instrOut);
    _domInstruction.style.visibility = instrShow > 0 ? 'visible' : 'hidden';
    if (active) {
      const wander = properties.time * 3;
      _domInstructionIcon.style.transform =
        `translate3d(${Math.sin(wander) * 50}%,${Math.cos(wander * 2 + Math.PI * 0.5) * 5}%, 0) rotate(${Math.cos(wander) * -6}deg)`;
      _domInstructionIcon.style.opacity = String(instrShow);
      _domInstructionDashline.style.width =
        fit(instrIn * (1 - instrOut), 0, 0.75, 0, 100, ease.cubicOut) + '%';
      for (let i = 0, count = _domInstructionTextSplitText.chars.length; i < count; i++) {
        const ratio = i / (count - 1);
        const char = _domInstructionTextSplitText.chars[i] as HTMLElement;
        const drop = fit(instrIn, ratio * 0.4, ratio * 0.4 + 0.6, 1, 0, ease.expoOut);
        char.style.transform = `translate3d(0,${drop}em, 0)`;
      }
      _domInstructionText.style.opacity = String(1 - instrOut);
      _domInstructionText.style.transform =
        `translate3d(${fit(instrOut, 0, 1, 0, -3.3, ease.cubicOut)}em,0, 0)`;
    }
    const descIn = fit(r, 4.5, 5.5, 0, 1);
    const descOut = fit(r, 7.5, 8.5, 0, 1);
    const descShow = descIn * (1 - descOut);
    _domDesc.style.visibility = descShow > 0 ? 'visible' : 'hidden';
    if (active) {
      for (let i = 0, count = _domDescSplitText.lines.length; i < count; i++) {
        const ratio = i / (count - 1);
        const inv = 1 - ratio;
        const line = _domDescSplitText.lines[i] as HTMLElement;
        const slideOut = fit(descOut, inv * 0.2, inv * 0.2 + 0.8, 0, useMobileLayout ? -100 : 80, ease.sineOut);
        const drop = fit(descIn, ratio * 0.2, ratio * 0.2 + 0.8, 1, 0, ease.expoOut);
        line.style.transform = `translate3d(${slideOut}%,${drop}em, 0)`;
      }
    }
    const discIn = fit(r, 1, 2, 0, 1);
    const discOut = fit(r, 8, 9, 0, 1);
    const discShow = discIn * (1 - discOut);
    _domDisclaimerWrapper.style.visibility = discShow > 0 ? 'visible' : 'hidden';
    if (active) {
      _domDisclaimerDashline.style.width =
        fit(discIn * (1 - discOut), 0, 0.75, 0, 100, ease.cubicOut) + '%';
      _domDisclaimer.style.opacity = String(discShow);
    }
    handScene.animationRatio = fit(r, 0, 5.5, 0, 1);
    handScene.fingersActiveRatio = fit(r, 5.5, 6, 0, 1) * fit(r, 7.5, 8, 1, 0);
    handScene.handOpacity = fit(r, 8, 9, 1, 0);
    handScene.isActive =
      this.isActive || handScene.animationRatio === 0 || handScene.handOpacity > 0;
    handScene.highlightRatio = postprocessing.appleEfx.amount =
      fit(r, 5.5, 6, 0, 1) * fit(r, 7.5, 8, 1, 0);
  }
}

export const aiSection = new AiSection();
