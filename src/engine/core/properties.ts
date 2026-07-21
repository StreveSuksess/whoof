// Global state matching the source bundle's `properties` singleton (subset,
// grows as milestones land).

export const properties = {
  time: 0,
  deltaTime: 0,
  startTime: 0,
  width: 0,
  height: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  isMobile: false,
  useMobileLayout: false,
  hasInitialized: false,
  hasStarted: false,

  /** Insert _MOBILE before the extension, as the source's getMobileUrl does. */
  getMobileUrl(url: string): string {
    const dot = url.lastIndexOf('.');
    return dot === -1 ? url : `${url.slice(0, dot)}_MOBILE${url.slice(dot)}`;
  },
};
