import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Served from the root of its own subdomain. The designs, logos, fonts and tee
// photos are read straight from the repo (../../designs, ../../brand,
// ../../mockups), so the site always ships exactly what is committed.
// Public address of the site: social preview tags need absolute URLs.
// Override at build time, e.g. VITE_SITE_URL=https://merch.example.org pnpm build
// (the Dockerfile passes it through as a build arg).
process.env.VITE_SITE_URL ??= 'https://merchandise.pauseai.es';

export default defineConfig({
  // React, opentype.js and xmldom in one ~200 kB (gzip) chunk is fine for a tool page.
  // One page per language (/ and /en/), each with its own title, description
  // and social preview image; the same app runs on both.
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        en: resolve(import.meta.dirname, 'en/index.html'),
        es: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
  plugins: [react()],
});
