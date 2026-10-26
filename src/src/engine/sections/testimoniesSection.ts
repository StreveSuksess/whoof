// 1:1 port of the source TestimoniesStars/TestimoniesTableItem/
// TestimoniesSection (pretty 28367-28442): hero title/desc masked char
// reveals, per-review table item fades with the dashed-line bookends, and the
// stack scene's 0..1 activation (viewOffsetY sweep) as the section scrolls in.

import { SplitText } from 'gsap/SplitText';
import { fit } from '../core/math';
import { properties } from '../core/properties';
import { scrollManager } from '../core/ScrollPane';
import { stackScene } from '../scenes/stackScene';
import { siteHeader } from '../SiteHeader';
import { Section } from './Section';

class TestimoniesStars {
  svg: SVGElement | null;
  list: SVGUseElement[];

  constructor(svg: SVGElement | null) {
    this.svg = svg;
    this.list = Array.from(this.svg?.querySelectorAll('use') ?? []);
  }

  update(_dt: number): void {}
}

class TestimoniesTableItem {
  index: number;
  domContainer: HTMLElement;
  domRating: HTMLElement;
  stars: TestimoniesStars;
  domTitle: HTMLElement;
  domAuthorName: HTMLElement;
  domAuthorDesc: HTMLElement;
  titleText: SplitText;
  domImageWrapper: HTMLElement;
  prevDomDashedLine: HTMLElement;
  nextDomDashedLine: HTMLElement;

  constructor(
    index: number,
    domContainer: HTMLElement,
    prevDomDashedLine: HTMLElement,
    nextDomDashedLine: HTMLElement,
  ) {
    this.index = index;
    this.domContainer = domContainer;
    this.domRating = domContainer.querySelector('.testimonies-table-rating') as HTMLElement;
    this.stars = new TestimoniesStars(this.domRating.querySelector('svg') as SVGElement);
    this.domTitle = domContainer.querySelector(
      '.testimonies-table-item-content-title',
    ) as HTMLElement;
    this.domAuthorName = domContainer.querySelector(
      '.testimonies-table-item-content-author-name',
    ) as HTMLElement;
    this.domAuthorDesc = domContainer.querySelector(
      '.testimonies-table-item-content-author-desc',
    ) as HTMLElement;
    this.titleText = new SplitText(this.domTitle, { type: 'lines,chars', autoSplit: false });
    this.domImageWrapper = domContainer.querySelector(
      '.testimonies-table-item-image-wrapper',
    ) as HTMLElement;
    this.prevDomDashedLine = prevDomDashedLine;
    this.nextDomDashedLine = nextDomDashedLine;
  }

  resize(_width: number, _height: number): void {
    this.titleText.revert();
    this.titleText.split({});
  }

  update(_dt: number): void {
    const range = scrollManager.getDomRange(this.domContainer);
    const centerOffset = range.showScreenOffset - range.height / properties.viewportHeight / 2;
    const show = fit(centerOffset, 0.15, 0.45, 0, 1);
    const charCount = this.titleText.chars.length;
    for (let i = 0; i < charCount; i++) {
      const ratio = i / (charCount - 1);
      (this.titleText.chars[i] as HTMLElement).style.opacity = String(
        fit(show, ratio * 0.5, 0.5 + ratio * 0.5, 0.2, 1),
      );
    }
    const metaOpacity = fit(show, 0, 1, 0.2, 1);
    const fadeOut = fit(centerOffset, 0.55, 0.85, 1, 0.2);
    this.domRating.style.opacity = String(metaOpacity);
    this.domAuthorName.style.opacity = String(metaOpacity);
    this.domAuthorDesc.style.opacity = String(metaOpacity);
    this.domImageWrapper.style.opacity = String(metaOpacity);
    this.domImageWrapper.style.transform = properties.useMobileLayout
      ? 'scaleZ(1)'
      : `scale(${fit(show, 0, 1, 0.8, 1)})`;
    if (centerOffset > 0.5) this.prevDomDashedLine.style.opacity = String(fadeOut);
    this.nextDomDashedLine.style.opacity = String(metaOpacity);
    this.domContainer.style.opacity = String(fadeOut);
  }
}

let _domContainer: HTMLElement;
let _domHeroTitle: HTMLElement;
let _domHeroTitleSplitText: SplitText;
let _domHeroDesc: HTMLElement;
let _domHeroDescSplitText: SplitText;
const _tableItemList: TestimoniesTableItem[] = [];

export class TestimoniesSection extends Section {
  preInit(root: Element): void {
    super.preInit(root, 'testimonies');
    _domContainer = this.domContainer;
    _domContainer.querySelector('.section__inner');
    _domHeroTitle = _domContainer.querySelector('#testimonies-hero-title') as HTMLElement;
    _domHeroDesc = _domContainer.querySelector('#testimonies-hero-desc') as HTMLElement;
    const items: NodeListOf<HTMLElement> = _domContainer.querySelectorAll(
      '.testimonies-table-item',
    );
    const dashLines: NodeListOf<HTMLElement> = _domContainer.querySelectorAll('.o-dashline');
    for (let i = 0; i < items.length; i++) {
      _tableItemList.push(new TestimoniesTableItem(i, items[i], dashLines[i], dashLines[i + 1]));
    }
    _domHeroTitleSplitText = SplitText.create(_domHeroTitle, {
      type: 'lines,chars',
      autoSplit: false,
      mask: 'chars',
    });
    _domHeroDescSplitText = SplitText.create(_domHeroDesc, {
      type: 'lines,chars',
      autoSplit: false,
      mask: 'chars',
    });
  }

  init(): void {
    super.init();
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    for (let i = 0; i < _tableItemList.length; i++) _tableItemList[i].resize(width, height);
    _domHeroTitleSplitText.split({});
    _domHeroDescSplitText.split({});
  }

  update(dt: number): void {
    super.update(dt);
    const r = scrollManager.getDomRange(_domContainer).showScreenOffset;
    if (r > 0.5) siteHeader.changeNav('testimonies');
    stackScene.animation = fit(r, 0, 1, 0, 1);
    stackScene.isActive = stackScene.animation > 0;
    stackScene.viewOffsetY = fit(r, 0, 1, 1, 0);
    if (r > 0 && r < 2) {
      const titleShow = fit(r, 0.25, 0.75, 0, 1);
      for (let i = 0, count = _domHeroTitleSplitText.chars.length; i < count; i++) {
        const ratio = i / (count - 1);
        const char = _domHeroTitleSplitText.chars[i] as HTMLElement;
        char.style.opacity = String(fit(titleShow, ratio * 0.5, ratio * 0.5 + 0.5, 0, 1));
      }
      const descShow = fit(r, 0.5, 1, 0, 1);
      for (let i = 0, count = _domHeroDescSplitText.chars.length; i < count; i++) {
        const ratio = i / (count - 1);
        const char = _domHeroDescSplitText.chars[i] as HTMLElement;
        char.style.opacity = String(fit(descShow, ratio * 0.5, ratio * 0.5 + 0.5, 0, 1));
      }
    }
    for (let i = 0; i < _tableItemList.length; i++) _tableItemList[i].update(dt);
  }
}

export const testimoniesSection = new TestimoniesSection();
