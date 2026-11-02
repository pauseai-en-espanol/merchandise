import { type ShareLink } from '@pauseai-es/merch-core';

import { PREVIEW, previewKey, type TeeState } from './preview';
import { type Lang, type Repo } from './repo';

/**
 * A share link's page: the site's own page (the built index.html of its
 * language), with the title, description and preview image of this exact tee.
 * Link previews read these tags without running the app; the app then reads
 * the tee from the address. The build's static share pages
 * (packages/web/scripts/share-pages.ts) do the same per design, with a
 * pre-drawn render, for when this server is down.
 */

const WORDS: Record<Lang, { alt: string; short: string; tees: Record<TeeName, string> }> = {
  en: {
    alt: '{title}, on {tee}.',
    short: 'short line',
    tees: {
      black: 'a black tee',
      custom: 'a custom-colour tee',
      orange: 'an orange tee',
      white: 'a white tee',
    },
  },
  es: {
    alt: '{title}, en {tee}.',
    short: 'frase corta',
    tees: {
      black: 'una camiseta negra',
      custom: 'una camiseta de color personalizado',
      orange: 'una camiseta naranja',
      white: 'una camiseta blanca',
    },
  },
};

type TeeName = 'black' | 'custom' | 'orange' | 'white';

export const escapeHtml = (s: string): string =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/** Set the content of `<meta {attr}="{key}" content="…">` (the tag may span lines). */
const setMeta = (html: string, attr: 'name' | 'property', key: string, value: string) =>
  html.replace(
    new RegExp(String.raw`(<meta\s+${attr}="${key}"\s+content=")[^"]*(")`),
    `$1${escapeHtml(value)}$2`,
  );

/** The quote (or slogan) a front prints, from its <title>. */
const quoteOf = (svg: string) =>
  /<title>([^<]*)<\/title>/.exec(svg)?.[1]?.replaceAll('&amp;', '&').trim() ?? '';

/** The site's public address, from a built page's og:url (VITE_SITE_URL at build time). */
export const siteOf = (html: string): string =>
  (/<meta\s+property="og:url"\s+content="([^"]*)"/.exec(html)?.[1] ?? '').replace(/\/$/, '');

/** The image URL for a tee: the path names it, the query carries the rest (as the link's). */
export const imagePath = (s: TeeState, search: string): string =>
  `/preview/${s.design.slug}/${previewKey(s)}.jpg${search}`;

export const sharePage = (
  base: string,
  repo: Repo,
  s: TeeState,
  link: ShareLink,
  pathname: string,
  search: string,
): string => {
  const words = WORDS[link.ui];
  const site = siteOf(base);
  const siteTitle = /<title>([^<]*)<\/title>/.exec(base)?.[1] ?? '';
  const name = s.short ? `${s.design.title[link.ui]} (${words.short})` : s.design.title[link.ui];
  const title = `${name} · ${siteTitle}`;
  const quote = quoteOf(repo.front(s.design.slug, s.lang, s.short));
  const tee = words.tees[s.tee.preset ?? 'custom'];
  let html = base
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/(<link\s+rel="icon")/, `<meta name="robots" content="noindex" />\n    $1`);
  html = setMeta(html, 'property', 'og:url', `${site}${pathname}${search}`);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'name', 'twitter:title', title);
  if (quote) {
    html = setMeta(html, 'name', 'description', quote);
    html = setMeta(html, 'property', 'og:description', quote);
    html = setMeta(html, 'name', 'twitter:description', quote);
  }
  const image = `${site}${imagePath(s, search)}`;
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'property', 'og:image:width', String(PREVIEW.width));
  html = setMeta(html, 'property', 'og:image:height', String(PREVIEW.height));
  html = setMeta(
    html,
    'property',
    'og:image:alt',
    words.alt.replace('{title}', name).replace('{tee}', tee),
  );
  return html;
};
