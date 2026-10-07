import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Served from the root of its own subdomain. The designs, logos, fonts and tee
// photos are read straight from the repo (../../designs, ../../brand,
// ../../mockups), so the site always ships exactly what is committed.
export default defineConfig({
  // React, opentype.js and xmldom in one ~200 kB (gzip) chunk is fine for a tool page.
  build: { chunkSizeWarningLimit: 800 },
  plugins: [react()],
});
