// Math helpers matching the source bundle's `math` singleton semantics.

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function saturate(v: number): number {
  return clamp(v, 0, 1);
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Remap v from [fromMin, fromMax] to [toMin, toMax], clamped, with optional ease. */
export function fit(
  v: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
  ease?: (t: number) => number,
): number {
  let t = fromMax === fromMin ? 0 : (v - fromMin) / (fromMax - fromMin);
  t = saturate(t);
  if (ease) t = ease(t);
  return mix(toMin, toMax, t);
}

/** Same as fit but without clamping. */
export function unClampedFit(
  v: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  const t = fromMax === fromMin ? 0 : (v - fromMin) / (fromMax - fromMin);
  return mix(toMin, toMax, t);
}
