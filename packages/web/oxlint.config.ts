import preset from '@slango.configs/oxlint/typescript-react.js';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [preset],
  ignorePatterns: ['dist/**'],
});
