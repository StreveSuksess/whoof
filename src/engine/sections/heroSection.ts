// 1:1 port of the source HeroSection (pretty 21156-21260): tagline word
// drop, copy char blur/slide reveal against startTime + scroll, card
// header/desc masked line reveals, dashline growth, video-play button,
// blurBox card anchor, hero-copy blur rect for the scene base, and the
// header logo transform handoff.

import { SplitText } from 'gsap/SplitText';
import { ease } from '../core/ease';
import { fit } from '../core/math';
import { properties } from '../core/properties';
import { scrollManager } from '../core/ScrollPane';
import { heroScene } from '../scenes/heroScene';
import { heroSceneBase } from '../scenes/heroSceneBase';
import { blurBox } from '../post/BlurBox';
import { siteFooter } from '../SiteFooter';
import { siteHeader } from '../SiteHeader';
import { videoOverlay } from '../VideoOverlay';
import { Section } from './Section';

let _domContainer: HTMLElement;
let _domInner: Element;
let _domTop: HTMLElement;
let _domTopTagline: HTMLElement;
let _domTopTaglineSplitText: SplitText;
let _domLogoRef: HTMLElement;
let _domCopy: HTMLElement;
let _copySplitText: SplitText;
let _domCard: HTMLElement;
let _domCardHeader: HTMLElement;
let _domCardHeaderSplitText: SplitText;
let _domCardDesc: HTMLElement;
let _cardDescSplitText: SplitText;
let _domVideoPlay: HTMLElement | null;
let _domDashline: HTMLElement;
let _domLogoRefOffsetX = 0;
let _domLogoRefOffsetY = 0;
let _logoActiveScale = 1;
let _logoActiveWidth = 1;
let _logoActiveHeight = 1;

export class HeroSection extends Section {
  preInit(root: Element): void {
    super.preInit(root, 'hero');
    _domContainer = this.domContainer;
    _domInner = _domContainer.querySelector('.section__inner') as Element;
    _domTop = _domContainer.querySelector('#hero-top') as HTMLElement;
    _domTopTagline = _domContainer.querySelector('#hero-top-tagline') as HTMLElement;
    _domTopTaglineSplitText = SplitText.create(_domTopTagline, {
      type: 'words',
      autoSplit: false,
      mask: 'words',
    });
    _domLogoRef = _domContainer.querySelector('#hero-logo-ref') as HTMLElement;
    _domCopy = _domContainer.querySelector('#hero-copy') as HTMLElement;
    _copySplitText = SplitText.create(_domCopy, { type: 'lines,chars', autoSplit: false });
    _domCard = _domContainer.querySelector('#hero-card') as HTMLElement;
    _domCard.querySelector('#hero-card-inner');
    _domVideoPlay = _domContainer.querySelector('#hero-video-wrapper');
    _domCardHeader = _domCard.querySelector('#hero-card-header') as HTMLElement;
    _domCardHeaderSplitText = SplitText.create(_domCardHeader, {
      type: 'lines',
      autoSplit: false,
      mask: 'lines',
    });
    _domCardDesc = _domCard.querySelector('#hero-card-desc') as HTMLElement;
    _cardDescSplitText = SplitText.create(_domCardDesc, {
      type: 'lines',
      autoSplit: false,
      mask: 'lines',
    });
    _domDashline = _domCard.querySelector('.o-dashline') as HTMLElement;
    if (_domVideoPlay) {
      _domVideoPlay.addEventListener('pointerover', () => {
        videoOverlay.prefetch();
      });
      _domVideoPlay.addEventListener('click', () => {
        videoOverlay.initAndPlayVideo();
      });
    }
  }

  init(): void {
    super.init();
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    const logoRect = _domLogoRef.getBoundingClientRect();
    _logoActiveWidth = logoRect.width;
    _logoActiveHeight = logoRect.height;
    const logoDataWidth = siteHeader.getLogoDataWidth();
    _logoActiveScale = _logoActiveWidth / logoDataWidth;
    _domLogoRefOffsetX = logoRect.left - _domTop.getBoundingClientRect().left;
    _domLogoRefOffsetY = logoRect.top - _domTop.getBoundingClientRect().top;
    _copySplitText.split({});
    for (let i = 0, count = _copySplitText.lines.length; i < count; i++) {
      (_copySplitText.lines[i] as HTMLElement).style.transform = 'translateZ(0)';
    }
    const copyRect = _domCopy.getBoundingClientRect();
    const baseUniforms = heroSceneBase.sharedUniforms;
    baseUniforms.u_blurRectRadius.value = copyRect.height * 0.75;
    baseUniforms.u_blurRect.value.set(
      copyRect.left + copyRect.width * 0.5,
      copyRect.top + copyRect.height * 0.5,
      copyRect.width,
      copyRect.height * 1.5,
    );
    _domCardHeaderSplitText.split({});
    _cardDescSplitText.split({});
  }

  update(dt: number): void {
    const useMobileLayout = properties.useMobileLayout;
    super.update(dt);
    const containerRange = scrollManager.getDomRange(_domContainer);
    const innerRange = scrollManager.getDomRange(_domInner);
    const cardRange = scrollManager.getDomRange(_domCard);
    const copyRange = scrollManager.getDomRange(_domCopy);
    const l = (heroScene.activeRatio = fit(containerRange.hideScreenOffset, -1, -0.5, 1, 0));
    heroScene.isActive = l > 0;
    const visible = l > 0;
    _domContainer.style.visibility = visible ? 'visible' : 'hidden';
    const startTime = properties.startTime;
    _domContainer.style.setProperty('--active-ratio', String(l));
    if (heroScene.isActive) {
      const cardShift = fit(startTime, 0.5, 1, -properties.paddingX * 1, 0, ease.cubicOut);
      blurBox.anchor(cardRange);
      blurBox.x += cardShift;
      blurBox.outline = 1;
      blurBox.y = cardRange.screenY - innerRange.screenY;
      blurBox.color.setStyle('#FFEDD6');
      const alphaA = fit(l * 1.5, 0, 1, 0, 1) * fit(startTime, 0.5, 1.5, 0, 1);
      const alphaB = fit(l * 1.5, 0.5, 1.5, 0, 1) * fit(startTime, 1, 2, 0, 1);
      blurBox.colorAlphaA = 0.15 * alphaA;
      blurBox.colorAlphaB = 0.15 * alphaB;
      blurBox.blurRadiusA = 0.08 * alphaA;
      blurBox.blurRadiusB = 0.08 * alphaB;
      blurBox.posB.set(cardRange.width, 0);
      const baseUniforms = heroSceneBase.sharedUniforms;
      baseUniforms.u_blurRatio.value = useMobileLayout ? 0 : l * fit(startTime, 0.5, 1, 0, 1);
      baseUniforms.u_blurColor.value.set('#546743');
      for (let i = 0, count = _domTopTaglineSplitText.words.length; i < count; i++) {
        const inv = 1 - i / (count - 1);
        const ratio = 1 - inv;
        const word = _domTopTaglineSplitText.words[i] as HTMLElement;
        const drop = fit(l, inv * 0.3, inv * 0.3 + 0.67, 1, 0, ease.cubicOut);
        word.style.transform = `translate3d(0,${drop * -1}em, 0)`;
        word.style.opacity = String(fit(startTime, 0.5 + ratio * 0.2, 0.5 + 1 + ratio * 0.2, 0, 1));
      }
      for (let i = 0, count = _copySplitText.chars.length; i < count; i++) {
        const inv = 1 - i / (count - 1);
        const ratio = 1 - inv;
        const char = _copySplitText.chars[i] as HTMLElement;
        const reveal = fit(startTime, 0.5 + ratio * 0.2, 0.5 + 1 + ratio * 0.2, 0, 1);
        const scrollHide = fit(l, inv * 0.2, inv * 0.2 + 0.8, 1, 0);
        char.style.opacity = String(reveal * (1 - scrollHide));
        char.style.filter = useMobileLayout
          ? 'none'
          : `blur(${fit(scrollHide, 0.25, 0.75, 0, 0.3).toFixed(2)}em)`;
        char.style.transform =
          `translate3d(${fit(startTime, 0.5 + ratio * 0.2, 0.5 + 1 + ratio * 0.2, 1, 0, ease.cubicOut)}em,0,0)`;
      }
      for (let i = 0, count = _copySplitText.lines.length; i < count; i++) {
        const inv = 1 - i / (count - 1);
        const line = _copySplitText.lines[i] as HTMLElement;
        const slide = fit(l, inv * 0.2, inv * 0.2 + 0.8, 1, 0, ease.cubicOut);
        if (useMobileLayout) line.style.transform = `translate3d(0,${slide * -2}em, 0)`;
        else line.style.transform = `translate3d(${slide * 2}em, 0, 0)`;
      }
      for (let i = 0, count = _domCardHeaderSplitText.lines.length; i < count; i++) {
        const ratio = i / (count - 1);
        const line = _domCardHeaderSplitText.lines[i] as HTMLElement;
        const enter = fit(startTime, 0.5 + ratio * 0.2, 0.5 + 1 + ratio * 0.2, -1, 0, ease.cubicOut);
        const exit = fit(l, ratio * 0.2, ratio * 0.2 + 0.8, 1, 0, ease.cubicOut);
        line.style.transform = `translate3d(0,${exit * 1}em, 0)`;
        (line.parentNode as HTMLElement).style.transform = `translate3d(${enter}em,0,0)`;
        (line.parentNode as HTMLElement).style.opacity = String(
          fit(startTime, 0.5 + ratio * 0.2, 0.5 + 1 + ratio * 0.2, 0, 1),
        );
      }
      for (let i = 0, count = _cardDescSplitText.lines.length; i < count; i++) {
        const ratio = i / (count - 1);
        const line = _cardDescSplitText.lines[i] as HTMLElement;
        const enter = fit(startTime, 0.5 + ratio * 0.2, 0.5 + 1 + ratio * 0.2, -1, 0, ease.cubicOut);
        const exit = fit(l, ratio * 0.2, ratio * 0.2 + 0.8, 1, 0, ease.cubicOut);
        line.style.transform = `translate3d(0,${exit * 1}em, 0)`;
        (line.parentNode as HTMLElement).style.transform = `translate3d(${enter}em,0,0)`;
        (line.parentNode as HTMLElement).style.opacity = String(
          fit(startTime, 0.5 + ratio * 0.2, 0.5 + 1 + ratio * 0.2, 0, 1),
        );
      }
      _domDashline.style.transform = `translate3d(${cardShift}px,0,0)`;
      _domDashline.style.width =
        fit(l * fit(startTime, 0.5, 1, 0, 1), 0, 1, 0, 100, ease.cubicOut) + '%';
      _domVideoPlay!.style.opacity = String(
        fit(startTime, 0.5, 1, 0, 1) * fit(l, 0, 0.5, 0, 1),
      );
      _domVideoPlay!.style.transform =
        `translate3d(${Math.max(fit(startTime, 0.5, 1, 1, 0, ease.cubicOut), fit(l, 0, 0.5, 1, 0, ease.cubicOut)) * properties.paddingX * 0.5}px,0,0)`;
      if (useMobileLayout) siteFooter.setScroll('right', 0, l);
      else siteFooter.setScroll('left', copyRange.screenX - properties.paddingX, l);
    }
    const logoShift = fit(startTime, 0.5, 1, -properties.paddingX, 0, ease.cubicOut);
    const logoOpacity = fit(startTime, 0.5, 1, 0, 1);
    siteHeader.setLogoTransform(
      fit(l, 0, 0.5, 1 / _logoActiveScale, 1, ease.cubicInOut),
      fit(l, 0, 0.5, 0, _domLogoRefOffsetX, ease.cubicInOut) + logoShift,
      fit(l, 0, 0.5, 0, _domLogoRefOffsetY, ease.cubicInOut),
      logoOpacity,
      _logoActiveWidth,
      _logoActiveHeight,
    );
    scrollManager.isBtn = l > 0.99;
  }
}

export const heroSection = new HeroSection();
