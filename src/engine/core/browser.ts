// Port of the source bundle's `browser` singleton (subset used by the engine).

const userAgent = navigator.userAgent.toLowerCase();

export const browser = {
  isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    || (navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent) === false && /mobile|tablet/.test(userAgent)),
  isIOS: /iphone|ipad|ipod/.test(userAgent),
  devicePixelRatio: window.devicePixelRatio || 1,
  // source: isSupportMSAA = !userAgent.match("version/15.4 ")  (Safari 15.4 MSAA bug)
  isSupportMSAA: !userAgent.match('version/15.4 '),
  isSupportAvif: false,
};

// Source Browser.testSupport (pretty 12529-12551): the avif probe runs as a
// loader item in the FIRST load round (preRun), which completes before run()
// calls app.preInit — so texture URLs are only computed after the probe
// resolves. Mirrored here as a promise the boot sequence awaits.
export function testSupport(): Promise<void> {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => {
      browser.isSupportAvif = true;
      resolve();
    };
    probe.onerror = () => resolve();
    probe.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}
