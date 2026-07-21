// Preload queue — reduced port of the source bundle's `properties.loader`.
// All assets are queued during preInit and downloaded up front; progress
// drives the preloader UI. Parsers are registered per file extension.

import { properties } from './properties';

export interface LoadOptions {
  autoMobile?: boolean;
  weight?: number;
}

interface QueueItem {
  url: string;
  options: LoadOptions;
  weight: number;
  loaded: number;
  done: boolean;
  content: unknown;
}

type Parser = (response: ArrayBuffer, url: string) => unknown | Promise<unknown>;

const CONCURRENCY = 8;

export class Loader {
  private queue: QueueItem[] = [];
  private byUrl = new Map<string, QueueItem>();
  private parsers = new Map<string, Parser>();
  onProgress: ((ratio: number) => void) | null = null;

  registerParser(extension: string, parser: Parser): void {
    this.parsers.set(extension, parser);
  }

  add(url: string, options: LoadOptions = {}): void {
    if (options.autoMobile && properties.isMobile) {
      url = properties.getMobileUrl(url);
    }
    if (this.byUrl.has(url)) return;
    const item: QueueItem = {
      url,
      options,
      weight: options.weight ?? 1,
      loaded: 0,
      done: false,
      content: null,
    };
    this.byUrl.set(url, item);
    this.queue.push(item);
  }

  get(url: string, options: LoadOptions = {}): unknown {
    if (options.autoMobile && properties.isMobile) {
      url = properties.getMobileUrl(url);
    }
    return this.byUrl.get(url)?.content ?? null;
  }

  async start(): Promise<void> {
    const pending = [...this.queue];
    const workers: Promise<void>[] = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(
        (async () => {
          for (;;) {
            const item = pending.shift();
            if (!item) return;
            await this._loadItem(item);
            this._reportProgress();
          }
        })(),
      );
    }
    await Promise.all(workers);
  }

  private _reportProgress(): void {
    let total = 0;
    let done = 0;
    for (const item of this.queue) {
      total += item.weight;
      done += item.done ? item.weight : item.weight * item.loaded;
    }
    this.onProgress?.(total > 0 ? done / total : 1);
  }

  private async _loadItem(item: QueueItem): Promise<void> {
    const url = item.url;
    const ext = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
    try {
      const buffer = await this._fetchWithProgress(item);
      const parser = this.parsers.get(ext);
      if (parser) {
        item.content = await parser(buffer, url);
      } else if (['webp', 'png', 'jpg', 'avif'].includes(ext)) {
        item.content = await createImageBitmap(new Blob([buffer]));
      } else {
        item.content = buffer;
      }
    } catch (err) {
      console.error('[loader]', url, err);
      item.content = null;
    }
    item.done = true;
  }

  private _fetchWithProgress(item: QueueItem): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', item.url);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          item.loaded = e.loaded / e.total;
          this._reportProgress();
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as ArrayBuffer);
        else reject(new Error(`HTTP ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('network error'));
      xhr.send();
    });
  }
}

export const loader = new Loader();
