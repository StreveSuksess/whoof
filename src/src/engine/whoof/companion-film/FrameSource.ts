export interface FrameSource {
  count: number;
  neutral: number;
  frame(index: number): Promise<CanvasImageSource>;
  warm?(index: number): void;
  dispose(): void;
}

interface Manifest { version: 1; width: number; height: number; neutral: number; frames: string[]; poster: string }

/** Bounded decoded cache; no full-resolution movie kept in GPU memory. */
export class SequenceSource implements FrameSource {
  count: number;
  neutral: number;
  private cache = new Map<number, ImageBitmap>();
  private pending = new Map<number, Promise<ImageBitmap>>();
  private abort = new AbortController();
  private closed = false;
  private limit: number;

  static async open(url: string) {
    const absolute = new URL(url, location.href);
    const response = await fetch(absolute);
    if (!response.ok) throw new Error('Последовательность кадров недоступна.');
    const m: Manifest = await response.json();
    if (m.version !== 1 || !Array.isArray(m.frames) || m.frames.length < 2 || m.frames.length > 240 ||
        !m.frames.every(x => typeof x === 'string') || !Number.isFinite(m.width) || !Number.isFinite(m.height) ||
        m.width < 1 || m.height < 1 || m.width * m.height > 2_100_000 ||
        !Number.isInteger(m.neutral) || m.neutral < 0 || m.neutral >= m.frames.length)
      throw new Error('Неверный формат последовательности кадров.');
    m.frames = m.frames.map(x => new URL(x, absolute).href);
    if (m.frames.some(x => new URL(x).origin !== location.origin))
      throw new Error('Кадры должны храниться на этом же сайте.');
    return new SequenceSource(m);
  }
  private constructor(private manifest: Manifest) {
    this.count = manifest.frames.length;
    this.neutral = manifest.neutral / (this.count - 1);
    this.limit = Math.max(2, Math.min(matchMedia('(pointer: coarse)').matches ? 12 : 24,
      Math.floor(48 * 1024 * 1024 / (manifest.width * manifest.height * 4))));
  }
  async frame(index: number): Promise<ImageBitmap> {
    if (this.closed) throw new Error('Источник закрыт.');
    index = Math.max(0, Math.min(this.count - 1, Math.round(index)));
    const hit = this.cache.get(index);
    if (hit) { this.cache.delete(index); this.cache.set(index, hit); return hit; }
    const pending = this.pending.get(index);
    if (pending) return pending;
    const job = (async () => {
      const response = await fetch(this.manifest.frames[index], { signal: this.abort.signal });
      if (!response.ok) throw new Error(`Не удалось загрузить кадр ${index + 1}.`);
      const bitmap = await createImageBitmap(await response.blob());
      if (this.closed) { bitmap.close(); throw new Error('Источник закрыт.'); }
      if (bitmap.width * bitmap.height > 2_100_000) {
        bitmap.close(); throw new Error('Кадр превышает допустимое разрешение.');
      }
      this.cache.set(index, bitmap);
      while (this.cache.size > this.limit) {
        const oldest = this.cache.keys().next().value!;
        this.cache.get(oldest)!.close(); this.cache.delete(oldest);
      }
      return bitmap;
    })();
    this.pending.set(index, job);
    try { return await job; } finally { this.pending.delete(index); }
  }
  warm(index: number) {
    for (const delta of [-1, 1, -2, 2]) {
      const next = index + delta;
      if (this.closed || this.pending.size >= 4) break;
      if (next >= 0 && next < this.count && !this.cache.has(next)) void this.frame(next).catch(() => {});
    }
  }
  dispose() {
    this.closed = true; this.abort.abort();
    for (const frame of this.cache.values()) frame.close();
    this.cache.clear(); this.pending.clear();
  }
}

/** Review-only MP4 path. Serialized seeking is intentionally distinct from the optimized sequence. */
export class LocalVideoSource implements FrameSource {
  count = 121;
  neutral = .5;
  private url: string;
  private disposed = false;
  private cancelSeek?: () => void;
  private constructor(private video: HTMLVideoElement, url: string) { this.url = url; }

  static async open(file: File) {
    if (file.size > 200 * 1024 * 1024) throw new Error('Для проверки выбери ролик меньше 200 МБ.');
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    const url = URL.createObjectURL(file);
    const source = new LocalVideoSource(video, url);
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => finish(new Error('Видео не загрузилось за 15 секунд.')), 15000);
        const finish = (error?: Error) => {
          clearTimeout(timer); video.removeEventListener('loadeddata', ready); video.removeEventListener('error', fail);
          error ? reject(error) : resolve();
        };
        const ready = () => finish();
        const fail = () => finish(new Error('Браузер не может открыть этот формат видео.'));
        video.addEventListener('loadeddata', ready, { once: true });
        video.addEventListener('error', fail, { once: true });
        video.src = url; video.load();
      });
      if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 30)
        throw new Error('Нужен короткий ролик длительностью до 30 секунд.');
      source.count = Math.min(240, Math.max(2, Math.round(video.duration * 30)));
      return source;
    } catch (error) { source.dispose(); throw error; }
  }
  async frame(index: number): Promise<HTMLVideoElement> {
    if (this.disposed) throw new Error('Источник закрыт.');
    const time = Math.min(this.video.duration - 1 / 60, index / (this.count - 1) * this.video.duration);
    if (Math.abs(this.video.currentTime - time) < 1 / 120 && this.video.readyState >= 2) return this.video;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('Перемотка задержалась. Попробуй более короткий ролик.')), 5000);
      const finish = (error?: Error) => {
        clearTimeout(timer); this.video.removeEventListener('seeked', seeked); this.cancelSeek = undefined;
        error ? reject(error) : resolve();
      };
      const seeked = () => finish();
      this.cancelSeek = () => finish(new Error('Источник закрыт.'));
      this.video.addEventListener('seeked', seeked, { once: true });
      this.video.currentTime = time;
    });
    if (this.disposed) throw new Error('Источник закрыт.');
    return this.video;
  }
  dispose() {
    this.disposed = true; this.cancelSeek?.(); this.video.pause();
    this.video.removeAttribute('src'); this.video.load(); URL.revokeObjectURL(this.url);
  }
}
