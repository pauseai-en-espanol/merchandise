/**
 * Share pages: link previews for share links (src/share.ts).
 *
 * Link previews are read from a page's HTML without running it, so a share
 * link carries the design in its path, and the build writes a copy of each
 * language's page per design: d/<slug>/index.html, plus d/<slug>/short/ for a
 * design with a short variant (en/d/… for the English page). Each copy names
 * the design and shows its orange-tee render (renders/<slug>/<lang>.orange.
 * front[.short].jpg, copied to og/) instead of the site's own preview. The app
 * in them is the same; it reads the design from the address and the rest of
 * the tee from the query, which a preview can't show (custom colours, edited
 * text, the portrait finish).
 *
 * A design without a render keeps the site's preview image.
 */
import type { Plugin, ResolvedConfig } from 'vite';

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..');

type Lang = 'en' | 'es';

/** The built page each language's share pages copy, and what they add to its title. */
const PAGES: Record<Lang, { alt: string; html: string; prefix: string; short: string }> = {
  en: {
    alt: '{title}, on an orange tee.',
    html: 'en/index.html',
    prefix: 'en/',
    short: 'short line',
  },
  es: {
    alt: '{title}, en una camiseta naranja.',
    html: 'index.html',
    prefix: '',
    short: 'frase corta',
  },
};

interface DesignMeta {
  title: Record<Lang, string>;
}

const escape = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/** Set the content of `<meta {attr}="{key}" content="…">` (the tag may span lines). */
const setMeta = (html: string, attr: 'name' | 'property', key: string, value: string) => {
  const tag = new RegExp(String.raw`(<meta\s+${attr}="${key}"\s+content=")[^"]*(")`);
  if (!tag.test(html)) throw new Error(`share-pages: no <meta ${attr}="${key}"> in the built page`);
  return html.replace(tag, `$1${escape(value)}$2`);
};

/** Width and height of a JPEG, from its first frame header. */
const jpegSize = (buf: Buffer): null | { height: number; width: number } => {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1] ?? 0;
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
};

/** The quote (or slogan) a front prints, from its <title>. */
const frontTitle = (svg: string) =>
  /<title>([^<]*)<\/title>/.exec(svg)?.[1]?.replaceAll('&amp;', '&').trim() ?? '';

export const sharePages = (siteUrl: string): Plugin => {
  let outDir = '';
  return {
    apply: 'build',
    configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const slugs = readdirSync(join(ROOT, 'designs'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
        .map((d) => d.name)
        .filter((slug) => existsSync(join(ROOT, 'designs', slug, 'design.json')));
      let pages = 0;
      for (const lang of Object.keys(PAGES) as Lang[]) {
        const page = PAGES[lang];
        const base = readFileSync(join(outDir, page.html), 'utf8');
        const siteTitle = /<title>([^<]*)<\/title>/.exec(base)?.[1] ?? '';
        for (const slug of slugs) {
          const dir = join(ROOT, 'designs', slug);
          const meta = JSON.parse(readFileSync(join(dir, 'design.json'), 'utf8')) as DesignMeta;
          // The design's text in the page's language, or in the one it has.
          const textLang = ([lang, lang === 'es' ? 'en' : 'es'] as const).find((l) =>
            existsSync(join(dir, `${l}.orange.front.svg`)),
          );
          if (!textLang) continue;
          for (const short of [false, true]) {
            const variant = `${textLang}.orange.front${short ? '.short' : ''}`;
            const front = join(dir, `${variant}.svg`);
            if (!existsSync(front)) continue;
            const name = short ? `${meta.title[lang]} (${page.short})` : meta.title[lang];
            const title = `${name} · ${siteTitle}`;
            const path = `/${page.prefix}d/${slug}/${short ? 'short/' : ''}`;
            const quote = frontTitle(readFileSync(front, 'utf8'));
            let html = base
              .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
              .replace(/(<link\s+rel="icon")/, `<meta name="robots" content="noindex" />\n    $1`);
            html = setMeta(html, 'property', 'og:url', `${siteUrl}${path}`);
            for (const [attr, key] of [
              ['property', 'og:title'],
              ['name', 'twitter:title'],
            ] as const) {
              html = setMeta(html, attr, key, title);
            }
            if (quote) {
              for (const [attr, key] of [
                ['name', 'description'],
                ['property', 'og:description'],
                ['name', 'twitter:description'],
              ] as const) {
                html = setMeta(html, attr, key, quote);
              }
            }
            const render = join(ROOT, 'renders', slug, `${variant}.jpg`);
            if (existsSync(render)) {
              const jpeg = readFileSync(render);
              const size = jpegSize(jpeg);
              const file = `og/${slug}.${variant}.jpg`;
              mkdirSync(join(outDir, 'og'), { recursive: true });
              if (!existsSync(join(outDir, file))) copyFileSync(render, join(outDir, file));
              html = setMeta(html, 'property', 'og:image', `${siteUrl}/${file}`);
              html = setMeta(html, 'name', 'twitter:image', `${siteUrl}/${file}`);
              html = setMeta(html, 'property', 'og:image:alt', page.alt.replace('{title}', name));
              if (size) {
                html = setMeta(html, 'property', 'og:image:width', String(size.width));
                html = setMeta(html, 'property', 'og:image:height', String(size.height));
              }
            }
            mkdirSync(join(outDir, path), { recursive: true });
            writeFileSync(join(outDir, path, 'index.html'), html);
            pages += 1;
          }
        }
      }
      console.log(`share-pages: wrote ${pages} design pages`);
    },
    name: 'share-pages',
  };
};
