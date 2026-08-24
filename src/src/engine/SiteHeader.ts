// 1:1 port of the source SiteHeader (pretty 13642-13725): logo transform
// handoff (hero <-> header), nav underline easing between items, staggered
// nav item drop-in against startTime, mobile menu toggle and light/dark
// theme class.

import { ease } from './core/ease';
import { fit, mix, saturate } from './core/math';
import { properties } from './core/properties';
import { scrollManager } from './core/ScrollPane';

let _domContainer: HTMLElement;
let _domLogo: HTMLElement;
let _domLogoSvg: HTMLElement;
let _domNav: HTMLElement;
let _domNavLine: HTMLElement;
let _domNavItemList: NodeListOf<HTMLElement>;
let _domBlocker: HTMLElement;
let _domMobileMenuBtn: HTMLElement;
const _navOffsetXList: number[] = [];
const _navWidthList: number[] = [];
const _navItemIdIndexMap: Record<string, number> = {};
let _navLeft = 0;
let _navLeftTarget = 0;
let _navRight = 0;
let _navRightTarget = 0;
let _mobileNavItemList: NodeListOf<HTMLElement>;
let _prevNavIndex = -1;
let _theme = 'dark';

export class SiteHeader {
  isActive = true;
  isLogoVisible = false;
  isMenuActive = false;
  navIndex = 0;

  preInit(): void {
    _domContainer = document.getElementById('site-header') as HTMLElement;
    _domLogo = _domContainer.querySelector('#site-header-logo') as HTMLElement;
    _domLogoSvg = _domLogo.querySelector('div') as HTMLElement;
    _domNav = _domContainer.querySelector('#site-header-nav') as HTMLElement;
    _domNavLine = _domContainer.querySelector('#site-header-line') as HTMLElement;
    _domNavItemList = _domNav.querySelectorAll('li');
    _domBlocker = _domContainer.querySelector('#site-header-blocker') as HTMLElement;
    _domBlocker.addEventListener('click', () => {
      this.setMobileMenu(false);
    });
    _domMobileMenuBtn = _domContainer.querySelector('#site-header-mobile-btn') as HTMLElement;
    _mobileNavItemList = _domContainer.querySelectorAll('#site-header-mobile-menu ul a');
    for (let i = 0; i < _domNavItemList.length; i++) {
      _navItemIdIndexMap[_domNavItemList[i].dataset.id!] = i;
    }
    for (let i = 0; i < _mobileNavItemList.length; i++) {
      _mobileNavItemList[i].addEventListener('click', () => {
        this.setMobileMenu(false);
      });
    }
    _domMobileMenuBtn.addEventListener('click', () => {
      this.setMobileMenu(!this.isMenuActive);
    });
  }

  setMobileMenu(active: boolean): void {
    _domContainer.classList.toggle('is-menu-active', active);
    this.isMenuActive = active;
  }

  init(): void {}

  setTheme(theme: string): void {
    _theme = theme;
  }

  resize(_width?: number, _height?: number): void {
    const navLeft = _domNav.getBoundingClientRect().left;
    for (let i = 0; i < _domNavItemList.length; i++) {
      const rect = _domNavItemList[i].getBoundingClientRect();
      _navOffsetXList[i] = rect.left - navLeft;
      _navWidthList[i] = rect.width;
    }
    _navLeft = _navLeftTarget = _navOffsetXList[this.navIndex];
    _navRight = _navRightTarget = _navOffsetXList[this.navIndex] + _navWidthList[this.navIndex];
    this.syncNavLine();
  }

  setLogoTransform(
    scale: number,
    x: number,
    y: number,
    opacity: number,
    width: number,
    height: number,
  ): void {
    _domLogoSvg.style.width = width + 'px';
    _domLogoSvg.style.height = height + 'px';
    _domLogo.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    _domLogo.style.opacity = String(opacity);
  }

  getLogoDataWidth(): number {
    return parseFloat(_domLogo.dataset.width!);
  }

  changeNav(id: string): void {
    this.navIndex = _navItemIdIndexMap[id];
  }

  syncNavLine(): void {
    _domNavLine.style.transform = `translateX(${_navLeft}px)`;
    _domNavLine.style.width = `${_navRight - _navLeft}px`;
  }

  update(dt: number): void {
    if (_prevNavIndex !== this.navIndex) {
      _prevNavIndex = this.navIndex;
      _navLeftTarget = _navOffsetXList[this.navIndex];
      _navRightTarget = _navOffsetXList[this.navIndex] + _navWidthList[this.navIndex];
      for (let i = 0; i < _domNavItemList.length; i++) {
        if (i === this.navIndex) _domNavItemList[i].classList.add('is-active');
        else _domNavItemList[i].classList.remove('is-active');
      }
    }
    if (_navLeft !== _navLeftTarget || _navRight !== _navRightTarget) {
      const t = 1 - Math.exp(-dt * 10);
      _navLeft = mix(_navLeft, _navLeftTarget, t);
      _navRight = mix(_navRight, _navRightTarget, t);
      if (Math.abs(_navLeft - _navLeftTarget) < 0.05) _navLeft = _navLeftTarget;
      if (Math.abs(_navRight - _navRightTarget) < 0.05) _navRight = _navRightTarget;
      this.syncNavLine();
    }
    if (this.isMenuActive) {
      for (let i = 0; i < _mobileNavItemList.length; i++) {
        _mobileNavItemList[i].classList.toggle('is-active', i === this.navIndex);
      }
    }
    const startTime = properties.startTime;
    if (properties.useMobileLayout) {
      _domMobileMenuBtn.style.visibility = properties.startTime > 0.5 ? 'visible' : 'hidden';
      _domMobileMenuBtn.style.opacity = String(saturate(properties.startTime));
    } else {
      _domMobileMenuBtn.style.visibility = 'visible';
      _domMobileMenuBtn.style.opacity = '1';
      const paddingX = properties.paddingX;
      const btnWidth = fit(scrollManager.btnRatio, 0, 1, 14, 60);
      const gap = paddingX * 0.2;
      const navShift = paddingX - Math.max(paddingX, btnWidth + gap);
      _domNav.style.transform = `translate3d(${navShift}px,0,0)`;
      for (let i = 0, count = _domNavItemList.length; i < count; i++) {
        const ratio = i / (count - 1);
        const drop = fit(startTime - 0.5, ratio * 0.3, ratio * 0.3 + 0.6, 1, 0, ease.cubicOut);
        _domNavItemList[i].style.transform =
          `translate3d(0,${-drop * properties.paddingX}px,0) translate3d(0,${drop * -100}%,0)`;
      }
      _domNavLine.style.opacity = String(fit(startTime - 0.7, 0, 0.3, 0, 1));
    }
    _domContainer.classList.toggle('is-light', _theme === 'light');
  }
}

export const siteHeader = new SiteHeader();
