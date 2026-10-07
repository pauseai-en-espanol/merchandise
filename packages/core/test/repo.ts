import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FONT_FILES, fontBook, type FontFamily, logoFamily } from '../src/index';

/** Repo root (packages/core/test → ../../..). */
export const ROOT = join(import.meta.dirname, '..', '..', '..');

export const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

const family = (prefix: string, meta: { id: string; name: string; url: string }) =>
  logoFamily(meta, {
    dark: read(`brand/logos/${prefix}-on-dark.svg`),
    light: read(`brand/logos/${prefix}-on-light.svg`),
    mark: read(`brand/logos/${prefix}-mark.svg`),
    mono: read(`brand/logos/${prefix}-mono-ink.svg`),
    orange: read(`brand/logos/${prefix}-on-orange.svg`),
  });

export const FAMILIES = {
  es: family('pauseai-es', { id: 'es', name: 'PauseAI en Español', url: 'https://pauseai.es' }),
  global: family('pauseai-global', { id: 'global', name: 'PauseAI', url: 'https://pauseai.info' }),
};

export const fonts = fontBook(
  Object.fromEntries(
    Object.entries(FONT_FILES).map(([name, file]) => {
      const buf = readFileSync(join(ROOT, 'brand/fonts/files', file));
      return [name, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)];
    }),
  ) as Record<FontFamily, ArrayBuffer>,
);

export const designSlugs = (): string[] =>
  readdirSync(join(ROOT, 'designs'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .toSorted();
