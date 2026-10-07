import {
  FONT_FILES,
  type FontBook,
  fontBook,
  type FontFamily,
  type LogoFamily,
  logoFamily,
} from '@pauseai-es/merch-core';

import bebasUrl from '../../../brand/fonts/files/BebasNeue-Regular.ttf?url';
import sairaUrl from '../../../brand/fonts/files/SairaCondensed-Bold.ttf?url';

/**
 * Everything the generator prints comes straight from the repo: design
 * sources and metadata from designs/, logos and fonts from brand/, tee photos
 * from mockups/. Nothing is copied into this package.
 */

export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['es', 'en'];

export const REPO_URL = 'https://github.com/pauseai-en-espanol/merchandise';

// --- Logo families ---------------------------------------------------------

const logoFiles = import.meta.glob<string>('../../../brand/logos/*.svg', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const logo = (name: string): string => {
  const svg = logoFiles[`../../../brand/logos/${name}.svg`];
  if (!svg) throw new Error(`Missing brand/logos/${name}.svg`);
  return svg;
};

const family = (prefix: string, meta: { id: string; name: string; url: string }) =>
  logoFamily(meta, {
    dark: logo(`${prefix}-on-dark`),
    light: logo(`${prefix}-on-light`),
    mark: logo(`${prefix}-mark`),
    mono: logo(`${prefix}-mono-ink`),
    orange: logo(`${prefix}-on-orange`),
  });

export const FAMILIES: LogoFamily[] = [
  family('pauseai-es', { id: 'es', name: 'PauseAI en Español', url: 'https://pauseai.es' }),
  family('pauseai-global', { id: 'global', name: 'PauseAI', url: 'https://pauseai.info' }),
];

export const familyById = (id: string): LogoFamily =>
  FAMILIES.find((f) => f.id === id) ?? (FAMILIES[0] as LogoFamily);

/** The family each design language is authored with. */
export const NATIVE_FAMILY: Record<Lang, string> = { en: 'global', es: 'es' };

// --- Designs ---------------------------------------------------------------

export interface DesignMeta {
  lane: 'A' | 'B';
  /** Quotes real people or cites data: translations must stay faithful. */
  sourced: boolean;
  title: Record<Lang, string>;
  utmSource: string;
}

export interface Design extends DesignMeta {
  langs: Lang[];
  slug: string;
}

const metas = import.meta.glob<DesignMeta>('../../../designs/*/design.json', {
  eager: true,
  import: 'default',
});

const fronts = import.meta.glob<string>('../../../designs/*/*.orange.front.svg', {
  import: 'default',
  query: '?raw',
});

const frontPath = (slug: string, lang: Lang) => `../../../designs/${slug}/${lang}.orange.front.svg`;

export const DESIGNS: Design[] = Object.entries(metas)
  .map(([path, meta]) => {
    const slug = path.split('/').at(-2) ?? '';
    return { ...meta, langs: LANGS.filter((lang) => frontPath(slug, lang) in fronts), slug };
  })
  .filter((d) => !d.slug.startsWith('_') && d.langs.length > 0)
  .toSorted((a, b) => a.title.es.localeCompare(b.title.es, 'es'));

export const designBySlug = (slug: string): Design =>
  DESIGNS.find((d) => d.slug === slug) ?? (DESIGNS[0] as Design);

const frontCache = new Map<string, Promise<string>>();

/** The hand-authored orange-tee front of a design, as SVG source. */
export const loadFront = (slug: string, lang: Lang): Promise<string> => {
  const key = frontPath(slug, lang);
  let cached = frontCache.get(key);
  if (!cached) {
    const load = fronts[key];
    if (!load) return Promise.reject(new Error(`No ${lang} version of ${slug}`));
    cached = load();
    frontCache.set(key, cached);
  }
  return cached;
};

export const designNotesUrl = (slug: string) => `${REPO_URL}/tree/main/designs/${slug}`;

// --- Fonts -----------------------------------------------------------------

const FONT_URLS: Record<FontFamily, string> = {
  'Bebas Neue': bebasUrl,
  'Saira Condensed': sairaUrl,
};

/**
 * Load the design fonts once: parsed for measuring and outlining, and
 * registered with the page so live-text thumbnails render in the right face.
 */
export const loadFonts = async (): Promise<FontBook> => {
  const entries = await Promise.all(
    (Object.keys(FONT_FILES) as FontFamily[]).map(async (name) => {
      const buffer = await (await fetch(FONT_URLS[name])).arrayBuffer();
      const face = new FontFace(name, buffer.slice(0), {
        weight: name === 'Saira Condensed' ? '700' : '400',
      });
      document.fonts.add(await face.load());
      return [name, buffer] as const;
    }),
  );
  return fontBook(Object.fromEntries(entries) as Record<FontFamily, ArrayBuffer>);
};

// --- Tee photos ------------------------------------------------------------

export type PhotoColour = 'black' | 'orange' | 'white';
export type Side = 'back' | 'front';

const photos = import.meta.glob<string>('../../../mockups/tshirt-*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
});

export const photoUrl = (colour: PhotoColour, side: Side): string => {
  const url = photos[`../../../mockups/tshirt-${colour}-${side}.jpg`];
  if (!url) throw new Error(`Missing mockups/tshirt-${colour}-${side}.jpg`);
  return url;
};

export const markUrl = (): string => {
  const svg = logo('pauseai-es-mark');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
