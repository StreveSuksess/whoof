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

// source detects avif support asynchronously with a probe image
const avifProbe = new Image();
avifProbe.onload = () => {
  browser.isSupportAvif = true;
};
avifProbe.src =
  'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
