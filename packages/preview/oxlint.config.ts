import preset from '@slango.configs/oxlint/typescript-node.js';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [preset],
  ignorePatterns: ['dist/**'],
});
