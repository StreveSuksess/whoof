// Preload queue — port of the source bundle's loader semantics used so far:
// items queue during preInit and download up front; `add` returns a live item
// whose `content` for type:"texture" is a THREE.Texture created immediately
// (image filled on load), matching how the source's scene preInits consume
// `loader.add(...).content` synchronously. Per-extension parsers cover .buf.

import { LinearFilter, LinearMipMapLinearFilter, Texture } from 'three';
import type { MagnificationTextureFilter, MinificationTextureFilter, Wrapping } from 'three';
import { properties } from './properties';

export interface LoadOptions {
  autoMobile?: boolean;
  weight?: number;
  type?: 'texture';
  minFilter?: MinificationTextureFilter;
  magFilter?: MagnificationTextureFilter;
  wrapS?: Wrapping;
  wrapT?: Wrapping;
  colorSpace?: string;
  onLoad?: (content: unknown) => void;
}

export interface LoaderItem {
  url: string;
  options: LoadOptions;
  weight: number;
  loaded: number;
  done: boolean;
  content: unknown;
}

type Parser = (response: ArrayBuffer, url: string) => unknown | Promise<unknown>;

const CONCURRENCY = 8;
const MIPMAP_FILTERS: number[] = [LinearMipMapLinearFilter];

export class Loader {
  private queue: LoaderItem[] = [];
  private byUrl = new Map<string, LoaderItem>();
  private parsers = new Map<string, Parser>();
  onProgress: ((ratio: number) => void) | null = null;

  registerParser(extension: string, parser: Parser): void {
    this.parsers.set(extension, parser);
  }

  add(url: string, options: LoadOptions = {}): LoaderItem {
    if (options.autoMobile && properties.isMobile) {
      url = properties.getMobileUrl(url);
    }
    const existing = this.byUrl.get(url);
    if (existing) return existing;
    const item: LoaderItem = {
      url,
      options,
      weight: options.weight ?? 1,
      loaded: 0,
      done: false,
      content: null,
    };
    if (options.type === 'texture') {
      const tex = new Texture();
      if (options.minFilter) tex.minFilter = options.minFilter;
      if (options.magFilter) tex.magFilter = options.magFilter;
      if (options.wrapS) tex.wrapS = options.wrapS;
      if (options.wrapT) tex.wrapT = options.wrapT;
      tex.generateMipmaps = MIPMAP_FILTERS.includes(tex.minFilter as number);
      item.content = tex;
    }
    this.byUrl.set(url, item);
    this.queue.push(item);
    return item;
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

  private async _loadItem(item: LoaderItem): Promise<void> {
    const url = item.url;
    const ext = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
    try {
      const buffer = await this._fetchWithProgress(item);
      const parser = this.parsers.get(ext);
      if (item.options.type === 'texture') {
        // The source loader feeds <img> elements to THREE.Texture, which
        // applies the default flipY=true on upload. WebGL ignores flipY for
        // ImageBitmap sources, so bake the flip in here to match.
        const bitmap = await createImageBitmap(new Blob([buffer]), {
          imageOrientation: 'flipY',
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        });
        const tex = item.content as Texture;
        tex.image = bitmap;
        tex.needsUpdate = true;
      } else if (parser) {
        item.content = await parser(buffer, url);
      } else if (['webp', 'png', 'jpg', 'avif'].includes(ext)) {
        // Same flip rationale as the texture branch: these bitmaps end up in
        // THREE.Texture.image (e.g. blueNoise), where the source used <img>.
        item.content = await createImageBitmap(new Blob([buffer]), {
          imageOrientation: 'flipY',
        });
      } else {
        item.content = buffer;
      }
      item.options.onLoad?.(item.content);
    } catch (err) {
      console.error('[loader]', url, err);
      item.content = item.options.type === 'texture' ? item.content : null;
    }
    item.done = true;
  }

  private _fetchWithProgress(item: LoaderItem): Promise<ArrayBuffer> {
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
