// Generic per-section visibility, ported from the source Section base class:
// each .section toggles style.visibility from its ScrollDomRange.isActive.
// Section-specific choreography (split text etc.) layers on top later.

import { scrollManager } from './core/ScrollPane';

const SECTION_IDS = [
  'hero', 'ai', 'wearable', 'features', 'encryption', 'grip',
  'sustainability', 'testimonies', 'social-content', 'product',
  'open-weight', 'footer',
];

interface SectionState {
  dom: HTMLElement;
  isActive: boolean | null; // null = not yet applied to the DOM
}

const sections: SectionState[] = [];

export function initSections(): void {
  for (const id of SECTION_IDS) {
    const dom = document.getElementById(id);
    if (dom) sections.push({ dom, isActive: null });
  }
}

export function updateSections(): void {
  for (const section of sections) {
    const range = scrollManager.getDomRange(section.dom);
    if (range.isActive !== section.isActive) {
      section.isActive = range.isActive;
      section.dom.style.visibility = section.isActive ? 'visible' : 'hidden';
    }
  }
}
