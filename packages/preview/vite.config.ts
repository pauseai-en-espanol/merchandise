import { defineConfig } from 'vite';

// One file for Node (dist/server.mjs), with the render engine and its
// dependencies inside. Only resvg stays out: it's a native module, copied next
// to the bundle by the Dockerfile.
export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['@resvg/resvg-js'],
      output: { entryFileNames: 'server.mjs' },
    },
    ssr: 'src/server.ts',
    target: 'node22',
  },
  ssr: { external: ['@resvg/resvg-js'], noExternal: true },
});
