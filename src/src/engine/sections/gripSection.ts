// 1:1 port of the source GripSection (pretty 21978-22073): the microscopic
// zoom-box drag segment — split-text choreography, draggable zoom box with
// spring-back, mouse parallax into the grip micro strip, coefficient
// readout, drag instruction wiggle, tableScene animation 9..10 handoff.

import { SplitText } from 'gsap/SplitText';
import { ease } from '../core/ease';
import { clamp, fit, hash, mix } from '../core/math';
import { input } from '../core/input';
import { properties } from '../core/properties';
import { scrollManager } from '../core/ScrollPane';
import { tableGripMicro, tableGripMicroWaterBear } from '../scenes/tableGrip';
import { tableScene } from '../scenes/tableScene';

let _domContainer: HTMLElement;
let _domInner: Element;
let _domTagline: HTMLElement;
let _domTaglineSplitText: SplitText;
let _domTitle: HTMLElement;
let _domTitleSplitText: SplitText;
let _domDesc: HTMLElement;
let _domDescSplitText: SplitText;
let _domZoomBox: HTMLElement;
let _domZoomBoxInner: HTMLElement;
let _domZoomBoxImg: HTMLElement;
let _domZoomBoxContent: HTMLElement;
let _domZoomBoxContentBg: HTMLElement;
let _domZoomBoxContentLabel: HTMLElement;
let _domCoeff: HTMLElement;
let _domInstruction: HTMLElement;
let _domInstructionWheel: HTMLElement;
let _domInstructionWheelCircle: HTMLElement;
let _domInstructionIcon: HTMLElement;
let _wheelWidth = 0;
let _isDragging = false;
let _zoomBoxContentHeight = 0;
let _zoomBoxWidth = 0;
let _zoomBoxHeight = 0;
let _zoomBoxX = 0;
let _zoomBoxTargetX = 0;
let _prevZoomBoxX = 0;
let _accumulatedOffsetX = 0;
let _maxZoomBoxDragRange = 0;
let _coeffRand = -1;
let _mouseOffsetX = 0;
let _mouseOffsetY = 0;
let _mouseOffsetTargetX = 0;
let _mouseOffsetTargetY = 0;
let _mouseIsInside = false;
let _hasDragged = false;
let _instructionDraggedTime = 0;
let _zoomBoxLocalOffsetX = 0;
let _zoomBoxLocalOffsetY = 0;
let _zoomBoxImgWidth = 0;
let _zoomBoxImgHeight = 0;
let _isDraggable = false;

export class GripSection {
  preInit(root: Element): void {
    _domContainer = root.querySelector('#grip') as HTMLElement;
    _domInner = _domContainer.querySelector('.section__inner') as Element;
    _domTagline = _domContainer.querySelector('#grip-tagline') as HTMLElement;
    _domTaglineSplitText = SplitText.create(_domTagline, {
      type: 'words',
      autoSplit: false,
      mask: 'words',
    });
    _domTitle = _domContainer.querySelector('#grip-title') as HTMLElement;
    _domTitleSplitText = SplitText.create(_domTitle, {
      type: 'lines,chars',
      autoSplit: false,
    });
    _domDesc = _domContainer.querySelector('#grip-desc') as HTMLElement;
    _domDescSplitText = SplitText.create(_domDesc, {
      type: 'lines',
      autoSplit: false,
      mask: 'lines',
    });
    _domZoomBox = _domContainer.querySelector('#grip-zoom-box') as HTMLElement;
    _domZoomBoxInner = _domContainer.querySelector('#grip-zoom-box__inner') as HTMLElement;
    _domZoomBoxImg = _domContainer.querySelector('#grip-zoom-box__image') as HTMLElement;
    _domZoomBoxContent = _domContainer.querySelector('#grip-zoom-box__content') as HTMLElement;
    _domZoomBoxContentBg = _domContainer.querySelector('#grip-zoom-box__content-bg') as HTMLElement;
    _domZoomBoxContentLabel = _domContainer.querySelector(
      '#grip-zoom-box__content-label',
    ) as HTMLElement;
    _domCoeff = _domContainer.querySelector('#grip-zoom-box__content-coeff') as HTMLElement;
    _domInstruction = _domContainer.querySelector('#grip-instruction') as HTMLElement;
    _domInstructionWheel = _domInstruction.querySelector('#grip-instruction-wheel') as HTMLElement;
    _domInstructionWheelCircle = _domInstructionWheel.querySelector(
      '#grip-instruction-wheel-circle',
    ) as HTMLElement;
    _domInstructionIcon = _domInstruction.querySelector('#grip-instruction-icon') as HTMLElement;
    input.onDowned.add((e) => {
      if (input.hasThroughElem(_domZoomBoxInner, 'down')) {
        if (e.preventDefault) e.preventDefault();
        if (_isDraggable) _isDragging = true;
      }
    });
  }

  init(): void {}

  resize(): void {
    _domZoomBox.style.transform = 'translateZ(0)';
    const boxRect = _domZoomBox.getBoundingClientRect();
    const innerRect = (_domInner as HTMLElement).getBoundingClientRect();
    _zoomBoxWidth = boxRect.width;
    _zoomBoxHeight = boxRect.height;
    _maxZoomBoxDragRange = Math.min(
      properties.viewportWidth - _zoomBoxWidth - properties.paddingX * 2,
      200,
    );
    _zoomBoxContentHeight = _domZoomBoxContent.getBoundingClientRect().height;
    _domZoomBoxContentBg.style.transformOrigin = `0 ${_zoomBoxContentHeight + _zoomBoxHeight}px`;
    _domTaglineSplitText.split({ type: 'words', autoSplit: false, mask: 'words' });
    _domTitleSplitText.split({ type: 'lines,chars', autoSplit: false });
    _domDescSplitText.split({ type: 'lines', autoSplit: false, mask: 'lines' });
    _wheelWidth = _domInstructionWheel.getBoundingClientRect().width;
    _zoomBoxLocalOffsetX = boxRect.x - innerRect.x;
    _zoomBoxLocalOffsetY = boxRect.y - innerRect.y;
    const imgRect = _domZoomBoxImg.getBoundingClientRect();
    _zoomBoxImgWidth = imgRect.width;
    _zoomBoxImgHeight = imgRect.height;
  }

  update(dt: number): void {
    const useMobileLayout = properties.useMobileLayout;
    const r = scrollManager.getDomRange(_domContainer).showScreenOffset;
    const show = fit(r, 0.5, 1, 0, 1);
    const hide = fit(r, 2.5, 3, 0, 1);
    const isVisible = show * (1 - hide) > 0;
    _domContainer.style.visibility = isVisible ? 'visible' : 'hidden';
    _isDraggable = show > 0.6 && hide < 0.4;
    _domZoomBoxInner.style.pointerEvents = _isDraggable ? 'auto' : 'none';
    if (input.isDown) {
      if (_isDragging) {
        _zoomBoxTargetX += (input.deltaPixelXY.x / _maxZoomBoxDragRange) * 2;
      }
    } else {
      _isDragging = false;
      _zoomBoxTargetX = 0;
    }
    if (isVisible) {
      if (_isDragging && _mouseIsInside) _hasDragged = true;
      if (_hasDragged) _instructionDraggedTime += dt;
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
      _domZoomBoxContentBg.style.width = fit(show, 0.3, 0.6, 0, 100) + '%';
      _domZoomBoxContentBg.style.opacity = String(fit(show, 0, 0.05, 0, 1));
      _domZoomBoxContent.style.opacity = String(fit(hide, 0, 1, 1, 0));
      _domZoomBoxContentLabel.style.opacity = String(fit(show, 0.6, 1, 0, 1));
      _domCoeff.style.opacity = String(fit(show, 0.6, 1, 0, 1));
      const instructionOpacity =
        fit(show, 0.5, 1, 0, 1)
        * fit(hide, 0, 1, 1, 0)
        * fit(_instructionDraggedTime, 0, 1, 1, 0);
      _domInstruction.style.opacity = String(instructionOpacity);
      const wheelTime = properties.time * 4;
      let iconX = Math.cos(wheelTime) * _wheelWidth * 0.1;
      const iconY = (1 - Math.cos(Math.abs(Math.cos(wheelTime) * 0.2))) * _wheelWidth * -0.2;
      _domInstructionIcon.style.transform = `translate3d(${iconX}px, ${iconY}px, 0) translateX(-50%) rotate(${Math.cos(wheelTime) * 4}deg)`;
      iconX = Math.cos(wheelTime + 0.1) * _wheelWidth * 0.1;
      _domInstructionWheelCircle.style.transform = `translate3d(${(iconX * 100) / _wheelWidth}px, ${(iconY * 100) / _wheelWidth}%, 0)`;
    } else {
      _hasDragged = false;
      _instructionDraggedTime = 0;
    }
    _zoomBoxX = mix(
      _zoomBoxX,
      clamp(_zoomBoxTargetX, -1, 1),
      input.isDown ? 1 : 1 - Math.exp(dt * -10),
    );
    const dragOffsetX = (_zoomBoxX * _maxZoomBoxDragRange) / 2;
    const dragOffsetY =
      ((Math.pow(Math.abs(_zoomBoxX), 4) * _maxZoomBoxDragRange) / properties.viewportHeight) * -40;
    _domZoomBoxInner.style.transform = `translate3d(${dragOffsetX}px, ${dragOffsetY}px, 0)`;
    tableScene.animation = fit(r, -1, 0.5, tableScene.animation, 9);
    tableScene.animation = fit(r, 2, 3, tableScene.animation, 10);
    tableGripMicro.offsetX = _zoomBoxX;
    const boxX = _zoomBoxLocalOffsetX + dragOffsetX;
    const boxY = _zoomBoxLocalOffsetY + dragOffsetY;
    tableGripMicro.rect.set(boxX, boxY, _zoomBoxImgWidth, _zoomBoxImgHeight);
    _mouseOffsetTargetX = (input.mousePixelXY.x - boxX) / _zoomBoxImgWidth - 0.5;
    _mouseOffsetTargetY = (input.mousePixelXY.y - boxY) / _zoomBoxImgHeight - 0.5;
    if (
      _mouseOffsetTargetX < -0.5
      || _mouseOffsetTargetX > 0.5
      || _mouseOffsetTargetY < -0.5
      || _mouseOffsetTargetY > 0.5
    ) {
      _mouseOffsetTargetX = 0;
      _mouseOffsetTargetY = 0;
      _mouseIsInside = false;
    } else {
      _mouseIsInside = true;
    }
    _mouseOffsetX = mix(_mouseOffsetX, _mouseOffsetTargetX, 1 - Math.exp(dt * -10));
    _mouseOffsetY = mix(_mouseOffsetY, _mouseOffsetTargetY, 1 - Math.exp(dt * -10));
    tableGripMicro.mouseOffset.set(_mouseOffsetX, -_mouseOffsetY);
    tableGripMicro.mouseZoom = mix(
      tableGripMicro.mouseZoom,
      _mouseIsInside ? 1.4 : 1,
      1 - Math.exp(dt * -10),
    );
    tableGripMicro.showRatio = fit(show, 0.3, 1, 0, 1);
    tableGripMicro.hideRatio = hide;
    const coeffHash = hash(Math.floor(_zoomBoxX * 1e3 + 0.5));
    if (_coeffRand !== coeffHash) {
      _coeffRand = coeffHash;
      _domCoeff.textContent = 'WHOOF';
    }
    if (isVisible) {
      _accumulatedOffsetX += Math.abs(_zoomBoxX - _prevZoomBoxX);
      _prevZoomBoxX = _zoomBoxX;
      if (_accumulatedOffsetX > 10) tableGripMicroWaterBear.isActive = true;
    } else {
      _zoomBoxX = _prevZoomBoxX = _zoomBoxTargetX = _accumulatedOffsetX = 0;
      tableGripMicroWaterBear.isActive = false;
    }
  }
}

export const gripSection = new GripSection();
