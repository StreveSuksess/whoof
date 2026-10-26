import { FrameMotion } from './FrameMotion';
import { LocalVideoSource, SequenceSource, type FrameSource } from './FrameSource';

export class FramePlayer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private motion = new FrameMotion();
  private source?: FrameSource;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private events = new AbortController();
  private observer: ResizeObserver;
  private inView = true;
  private intersection: IntersectionObserver;
  private raf = 0;
  private previous = 0;
  private desired = -1;
  private drawn = -1;
  private busy = false;
  private generation = 0;
  private loading = 0;
  private forceRedraw = false;
  private closed = false;
  private slider: HTMLInputElement;
  private output: HTMLOutputElement;
  private status: HTMLElement;

  constructor(private root: HTMLElement) {
    this.canvas = root.querySelector('canvas')!;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas недоступен.');
    this.context = context;
    this.slider = root.querySelector('[data-position]')!;
    this.output = root.querySelector('output')!;
    this.status = root.querySelector('[data-status]')!;
    const signal = this.events.signal;
    root.querySelector<HTMLElement>('[data-stage]')!.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || this.reduced.matches || !this.source) return;
      const box = this.canvas.getBoundingClientRect();
      this.motion.setTarget((e.clientX - box.left) / box.width); this.wake();
    }, { passive: true, signal });
    root.querySelector<HTMLElement>('[data-stage]')!.addEventListener('pointerleave', () => {
      this.motion.leave(); this.wake();
    }, { signal });
    this.slider.addEventListener('input', () => { this.motion.setTarget(+this.slider.value); this.wake(); }, { signal });
    root.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(button => {
      button.addEventListener('click', () => {
        this.motion.setTarget(button.dataset.pose === 'neutral' ? this.motion.neutral : +button.dataset.pose!);
        this.wake();
      }, { signal });
    });
    root.querySelector<HTMLInputElement>('[data-file]')!.addEventListener('change', async e => {
      const input = e.currentTarget as HTMLInputElement;
      const file = input.files?.[0]; if (!file) return;
      await this.load(() => LocalVideoSource.open(file), 'Локальное видео · двигайте курсор по кадру');
      input.value = '';
    }, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(this.raf); this.raf = 0; }
      else this.wake();
    }, { signal });
    this.reduced.addEventListener('change', () => { this.controls(); this.motion.leave(); this.wake(); }, { signal });
    addEventListener('pagehide', () => this.dispose(), { once: true, signal });
    this.observer = new ResizeObserver(() => { this.forceRedraw = true; this.wake(); });
    this.observer.observe(this.canvas);
    this.intersection = new IntersectionObserver(entries => {
      this.inView = entries[0].isIntersecting;
      if (this.inView) this.wake(); else { cancelAnimationFrame(this.raf); this.raf = 0; }
    });
    this.intersection.observe(this.canvas);
    if (root.dataset.manifest) void this.load(() => SequenceSource.open(root.dataset.manifest!), 'Двигайте курсор по кадру');
  }

  private async load(open: () => Promise<FrameSource>, label: string) {
    const token = ++this.loading;
    this.status.textContent = 'Подготовка кадров…';
    try {
      const next = await open();
      if (token !== this.loading || this.closed) { next.dispose(); return; }
      ++this.generation; this.source?.dispose(); this.source = next;
      this.drawn = this.desired = -1; this.forceRedraw = true;
      this.motion.reset(next.neutral); this.root.dataset.ready = 'false';
      this.status.textContent = label; this.controls(); this.wake();
    } catch (error) {
      if (token === this.loading && !this.closed) this.status.textContent = error instanceof Error ? error.message : 'Не удалось открыть ролик.';
    }
  }
  private controls() {
    const disabled = !this.source || this.reduced.matches;
    this.slider.disabled = disabled;
    this.root.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(b => b.disabled = disabled);
    if (this.reduced.matches && this.source) this.status.textContent = 'Уменьшение движения включено · нейтральный кадр';
  }
  private wake() {
    if (this.raf || !this.source || this.closed || document.hidden || !this.inView) return;
    this.previous = performance.now(); this.raf = requestAnimationFrame(this.tick);
  }
  private tick = (now: number) => {
    this.raf = 0;
    if (!this.source || this.closed || document.hidden || !this.inView) return;
    const value = this.motion.update((now - this.previous) / 1000, this.reduced.matches);
    this.previous = now;
    this.slider.value = String(value);
    this.desired = Math.round(value * (this.source.count - 1));
    void this.drawLatest();
    if (Math.abs(this.motion.target - value) > .00001 || this.desired !== this.drawn || this.busy)
      this.raf = requestAnimationFrame(this.tick);
  };
  private async drawLatest() {
    if (this.busy || !this.source || (this.desired === this.drawn && !this.forceRedraw)) return;
    this.busy = true;
    const source = this.source, generation = this.generation, index = this.desired;
    try {
      const frame = await source.frame(index);
      // Accept progress toward the latest target, but never an obsolete source,
      // a reversal in the wrong direction, or an overshoot. No unbounded seek queue.
      if (this.closed || source !== this.source || generation !== this.generation) return;
      if (this.drawn >= 0 && ((index - this.drawn) * (this.desired - this.drawn) < 0 ||
          Math.abs(index - this.drawn) > Math.abs(this.desired - this.drawn) + 1)) return;
      const rect = this.canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
      const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      const fw = frame instanceof HTMLVideoElement ? frame.videoWidth : (frame as ImageBitmap).width;
      const fh = frame instanceof HTMLVideoElement ? frame.videoHeight : (frame as ImageBitmap).height;
      const scale = Math.max(w / fw, h / fh);
      const offset = rect.width / rect.height < 1 ? .71 : .5;
      this.context.drawImage(frame, (w - fw * scale) * offset, (h - fh * scale) * .5, fw * scale, fh * scale);
      this.drawn = index; this.forceRedraw = false;
      this.root.dataset.ready = 'true';
      this.output.value = `${String(index + 1).padStart(3, '0')} / ${source.count}`;
      source.warm?.(this.desired);
    } catch (error) {
      if (source === this.source && !this.closed) {
        this.status.textContent = error instanceof Error ? error.message : 'Кадр недоступен.';
        source.dispose(); this.source = undefined; this.root.dataset.ready = 'false'; this.controls();
      }
    } finally { this.busy = false; this.wake(); }
  }
  dispose() {
    this.closed = true; ++this.loading; ++this.generation;
    cancelAnimationFrame(this.raf); this.events.abort(); this.observer.disconnect(); this.intersection.disconnect();
    this.source?.dispose();
  }
}
