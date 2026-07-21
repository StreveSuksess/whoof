// Port of the source WearableSection.update (pretty 21430-21508), covering
// every target ported so far: wearableScene animation chain (incl. the
// gallery index math), wearableText rect choreography, frame/scene clip
// rects, section canvas and the split-char title. The gallery item DOM
// transforms, wearableMagazine, tableScene handoff and siteFooter scroll
// land with their clusters.

import { SplitText } from 'gsap/SplitText';
import { gsap } from 'gsap';
import { ease } from '../core/ease';
import { fit, unClampedFit } from '../core/math';
import { properties } from '../core/properties';
import { scrollManager } from '../core/ScrollPane';
import { handScene } from '../scenes/handScene';
import { wearableFrame } from '../scenes/wearableFrame';
import { wearableScene } from '../scenes/wearableScene';
import { wearableText } from '../scenes/wearableText';
import { wearableSectionCanvas } from './wearableSectionCanvas';

gsap.registerPlugin(SplitText);

let _domContainer: HTMLElement;
let _domInner: Element;
let _domCopyDecs: Element;
let _domCopyTitleWrapper: Element;
let _domCopyTitle1: HTMLElement;
let _domCopyTitle1SplitText: SplitText;
let _domCopyTitle2: HTMLElement;
let _domMain: Element;
let _galleryItemCount = 0;

export class WearableSection {
  preInit(root: Element): void {
    _domContainer = root.querySelector('#wearable') as HTMLElement;
    _domInner = _domContainer.querySelector('.section__inner') as Element;
    _domCopyDecs = _domContainer.querySelector('#wearable-title-2-dummy') as Element;
    _domCopyTitleWrapper = _domContainer.querySelector('#wearable-title') as Element;
    _domCopyTitle1 = _domContainer.querySelector('#wearable-title span:first-child') as HTMLElement;
    _domCopyTitle1SplitText = SplitText.create(_domCopyTitle1, {
      type: 'chars',
      autoSplit: false,
      mask: 'chars',
    });
    _domCopyTitle2 = _domContainer.querySelector('#wearable-title span:last-child') as HTMLElement;
    _domMain = _domContainer.querySelector('#wearable-main') as Element;
    _galleryItemCount = _domContainer.querySelectorAll('.wearable-gallery-item').length;
    wearableSectionCanvas.preInit(root);
  }

  init(): void {
    wearableSectionCanvas.init();
  }

  resize(): void {
    _domCopyTitle1SplitText.split({ type: 'chars', autoSplit: false, mask: 'chars' });
    wearableSectionCanvas.resize();
  }

  update(dt: number): void {
    const useMobileLayout = properties.useMobileLayout;
    const containerRange = scrollManager.getDomRange(_domContainer);
    const r = containerRange.showScreenOffset;
    const isActive = containerRange.isActive;
    const showRatio = fit(r, 0.5, 1, 0, 1);
    const hideRatio = fit(r, 12.25, 13.25, 0, 1);
    _domContainer.style.visibility = showRatio > 0 && hideRatio < 1 ? 'visible' : 'hidden';
    // tableScene.animation handoff (pretty 21453) lands with the table cluster.
    const innerRange = scrollManager.getDomRange(_domInner);
    const copyDecsRange = scrollManager.getDomRange(_domCopyDecs);
    const titleWrapperRange = scrollManager.getDomRange(_domCopyTitleWrapper);
    const title2Range = scrollManager.getDomRange(_domCopyTitle2);
    const mainRange = scrollManager.getDomRange(_domMain);
    // WearableGallery index math (pretty 21459) — item DOM animation joins
    // with the gallery port; the index itself drives the scene animation.
    const rawIndex = unClampedFit(r, 5.5, 10.75, 0, 7);
    const galleryIndex = Math.floor(rawIndex) + fit(rawIndex % 1, 0.1, 0.9, 0, 1, ease.sineInOut);
    const b = mainRange.width;
    const S = mainRange.height;
    const A = -Math.max(0, galleryIndex) * b;
    const M = mainRange.screenY - innerRange.screenY;
    const T = mainRange.screenX;
    const D = (M + S / 2 - properties.viewportHeight / 2) / properties.viewportHeight;
    if (isActive) {
      const N = fit(r, 3.25, 4.75, 0, 1);
      const U = titleWrapperRange.screenY + titleWrapperRange.height - innerRange.screenY;
      // Source subtracts wearableGallery.thumbItemHeight / 2 here; the thumb
      // strip DOM is created by the gallery port (pending).
      const k = properties.viewportHeight / 2 - title2Range.height / 6;
      const G = fit(N, 0, 1, 0, -Math.max(0, U - k));
      const L =
        innerRange.height / 2
        - (titleWrapperRange.screenY - innerRange.screenY)
        - title2Range.height / 2;
      let F = fit(r, 1, 1.75, 0, 1);
      let titleShift = 0;
      if (useMobileLayout) {
        F = fit(r, 1.75, 2.25, 0, 1);
        const mobileL =
          L + D * properties.viewportHeight - b / 2 - properties.viewportWidth * 0.06;
        titleShift = fit(r, 2.5, 3, mobileL, G, ease.cubicInOut);
      } else {
        titleShift = fit(F, 0, 1, L, G, ease.cubicInOut);
      }
      const chars = _domCopyTitle1SplitText.chars;
      for (let c = 0, count = chars.length; c < count; c++) {
        const charRatio = c / (count - 1);
        const char = chars[c] as HTMLElement;
        const charShift = fit(r, 0.5 + charRatio * 0.1, charRatio * 0.1 + 0.9, 1.5, 0, ease.expoOut);
        char.style.transform = `translate3d(0,${charShift}em, 0)`;
      }
      const q = fit(hideRatio, 0, 0.85, 0, 1);
      const Q = fit(hideRatio, 0.15, 1, 0, 1);
      _domCopyTitle1.style.transform = `translate3d(0, ${titleShift}px, 0)`;
      _domCopyTitle2.style.opacity = String(
        fit(r, 3.25, 4.75, 0, useMobileLayout ? 1 : 0) * (1 - Q),
      );
      _domCopyTitle1.style.opacity = String(1 - q);
      const textAspect = wearableText.size.x / wearableText.size.y;
      const pad = title2Range.height * 0.03;
      const textWidth = title2Range.width - pad * 2;
      const textHeight = textWidth / textAspect;
      let offscreenX = fit(
        r,
        1,
        2,
        properties.viewportWidth,
        0,
        useMobileLayout ? ease.cubicOut : undefined,
      );
      const toY = G;
      let fromY = copyDecsRange.screenY - innerRange.screenY;
      const rectToY = title2Range.screenY - innerRange.screenY + toY;
      if (useMobileLayout) {
        fromY = (0.55 + D) * properties.viewportHeight + b / 2;
        offscreenX += fit(r, 2, 3, 0, -properties.viewportWidth, ease.cubicIn);
      }
      wearableText.rectFrom.set(
        copyDecsRange.screenX + offscreenX,
        fromY,
        copyDecsRange.width,
        copyDecsRange.height,
      );
      wearableText.rectTo.set(
        title2Range.screenX + offscreenX + pad,
        rectToY,
        textWidth + 1,
        textHeight + 1,
      );
      wearableText.shrinkRatio = N;
      wearableText.opacity = 1 - Q;
      if (useMobileLayout) wearableText.rectTo.copy(wearableText.rectFrom);
      // siteFooter.setScroll (pretty 21494) lands with the site footer port.
    }
    const itemCount = _galleryItemCount;
    if (galleryIndex > itemCount - 2) {
      // tableScene from-view-offset handoff (pretty 21497-21504) lands with
      // the table cluster; the offsets/scissor consume only tableScene state.
    }
    let E = fit(r, 0.5, 1.5, 0, 1);
    E = fit(r, 1.5, 3, E, 2);
    E = fit(r, 3, 5.25, E, 3);
    E = fit(galleryIndex, 0, 1, E, 4);
    E = fit(galleryIndex - itemCount + 1, -1, 0, E, 5);
    E = fit(galleryIndex - itemCount + 1, 0, 3.2, E, 6);
    wearableScene.animation = E;
    if (E > 2 && E < 4) {
      wearableScene.clipScissor.set(T, properties.viewportHeight - (M + S), b + A, S);
      wearableFrame.rect.set(T + A, M, b, S);
    }
    handScene.viewOffsetY = D;
    wearableScene.frameZoom = S / (properties.viewportHeight * 0.8);
    wearableSectionCanvas.showRatio = fit(r, 0, 1, 0, 1);
    wearableSectionCanvas.hideRatio = hideRatio;
    wearableSectionCanvas.scaleRatio = fit(r, 2.2, 3.4, 0, 1, ease.cubicInOut);
    wearableSectionCanvas.scaleRatio2 = fit(r, 2.3, 3.5, 0, 1, ease.cubicInOut);
    wearableSectionCanvas.update(dt);
  }
}

export const wearableSection = new WearableSection();
