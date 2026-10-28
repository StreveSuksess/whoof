import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://oryzo.ai',
  compressHTML: true,
  devToolbar: { enabled: false },
  // A build alongside the preview must not replace the live dev server's
  // optimized lazy dependencies (otherwise existing URLs start returning 504).
  integrations: [{
    name: 'whoof-isolated-vite-cache',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => updateConfig({
        vite: { cacheDir: fileURLToPath(new URL(`./node_modules/.vite-whoof/${command}/`, import.meta.url)) },
      }),
    },
  }],
});
