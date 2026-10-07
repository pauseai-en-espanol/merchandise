import preset from '@slango.configs/oxlint/javascript-node.js';
import { defineConfig } from 'oxlint';

// Root tooling files only; each package under packages/ has its own config.
export default defineConfig({
  extends: [preset],
  ignorePatterns: ['packages/**'],
});
