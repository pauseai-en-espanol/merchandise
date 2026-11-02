import {
  FONT_FILES,
  fontBook,
  type FontBook,
  type FontFamily,
  type LogoFamily,
  logoFamily,
  type PortraitStyle,
} from '@pauseai-es/merch-core';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * What the previews are drawn from: the same repo files the web generator
 * reads at build time (packages/web/src/assets.ts), read from disk. In the
 * image they're copied under REPO_ROOT (see the Dockerfile).
 */

export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['es', 'en'];

export interface DesignMeta {
  portrait?: { by: string; order?: number; person: string };
  title: Record<Lang, string>;
}

export interface Design extends DesignMeta {
  langs: Lang[];
  shortLangs: Lang[];
  slug: string;
}

/** Logo families, as in packages/web/src/assets.ts. */
const FAMILY_META = [
  { id: 'es', name: 'PauseAI en Español', prefix: 'pauseai-es', url: 'https://pauseai.es' },
  { id: 'global', name: 'PauseAI', prefix: 'pauseai-global', url: 'https://pauseai.info' },
] as const;

/** The family each design language is authored with. */
export const NATIVE_FAMILY: Record<Lang, string> = { en: 'global', es: 'es' };

export type TeePhoto = 'black' | 'orange' | 'white';

export interface Repo {
  designs: Map<string, Design>;
  families: LogoFamily[];
  fonts: FontBook;
  /** A design's canonical front, full or short. */
  front: (slug: string, lang: Lang, short: boolean) => string;
  /** A tee photo (JPEG), front side. */
  photo: (tee: TeePhoto) => Buffer;
  /** A version of a commissioned portrait. */
  portrait: (person: string, style: PortraitStyle) => string;
}

export const loadRepo = (root: string): Repo => {
  const read = (path: string) => readFileSync(join(root, path), 'utf8');
  const frontPath = (slug: string, lang: Lang, short: boolean) =>
    `designs/${slug}/${lang}.orange.front${short ? '.short' : ''}.svg`;

  const designs = new Map<string, Design>();
  for (const entry of readdirSync(join(root, 'designs'), { withFileTypes: true })) {
    const slug = entry.name;
    if (!entry.isDirectory() || slug.startsWith('_')) continue;
    if (!existsSync(join(root, 'designs', slug, 'design.json'))) continue;
    const meta = JSON.parse(read(`designs/${slug}/design.json`)) as DesignMeta;
    const langs = LANGS.filter((l) => existsSync(join(root, frontPath(slug, l, false))));
    if (langs.length === 0) continue;
    const shortLangs = LANGS.filter((l) => existsSync(join(root, frontPath(slug, l, true))));
    designs.set(slug, { ...meta, langs, shortLangs, slug });
  }

  const families = FAMILY_META.map(({ prefix, ...meta }) =>
    logoFamily(meta, {
      dark: read(`brand/logos/${prefix}-on-dark.svg`),
      light: read(`brand/logos/${prefix}-on-light.svg`),
      mark: read(`brand/logos/${prefix}-mark-mono-ink.svg`),
      mono: read(`brand/logos/${prefix}-mono-ink.svg`),
      orange: read(`brand/logos/${prefix}-on-orange.svg`),
    }),
  );

  const fonts = fontBook(
    Object.fromEntries(
      Object.entries(FONT_FILES).map(([name, file]) => {
        const buf = readFileSync(join(root, 'brand/fonts/files', file));
        return [name, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)];
      }),
    ) as Record<FontFamily, ArrayBuffer>,
  );

  // Files read on demand are kept: they're few and small next to the renders.
  const kept = new Map<string, Buffer | string>();
  const keep = <T extends Buffer | string>(path: string, load: () => T): T => {
    let hit = kept.get(path) as T | undefined;
    if (hit === undefined) {
      hit = load();
      kept.set(path, hit);
    }
    return hit;
  };

  return {
    designs,
    families,
    fonts,
    front: (slug, lang, short) => {
      const path = frontPath(slug, lang, short);
      return keep(path, () => read(path));
    },
    photo: (tee) => {
      const path = `mockups/tshirt-${tee}-front.jpg`;
      return keep(path, () => readFileSync(join(root, path)));
    },
    portrait: (person, style) => {
      const path = `illustrations/portraits/${person}/${style}.svg`;
      return keep(path, () => read(path));
    },
  };
};
