/**
 * Share pages: link previews for share links (src/share.ts).
 *
 * Link previews are read from a page's HTML without running it, so a share
 * link carries in its path what a preview can show, and the build writes a
 * copy of each language's page for every combination:
 *
 *   d/<slug>/<lang>-<tee>[-short]/index.html     (en/d/… for the English page)
 *
 * <lang> is the tee's text language, <tee> orange, white or black, -short its
 * short variant. Each copy names the design, quotes it, and shows the matching
 * render (renders/<slug>/<lang>.<tee>.front[.short].jpg, copied to og/)
 * instead of the site's own preview. The app in them is the same: it reads the
 * tee from the address. What a render can't show (a custom colour, edited
 * text, the portrait finish) only shows once the page opens.
 *
 * Also d/<slug>/ (the page's language, orange) and, for the first share links,
 * d/<slug>/short/. A combination without a render keeps the site's preview.
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
type Tee = 'black' | 'orange' | 'white';

const LANGS: Lang[] = ['es', 'en'];
const TEES: Tee[] = ['orange', 'white', 'black'];

/** The built page each language's share pages copy, and the words they add. */
const PAGES: Record<
  Lang,
  { alt: string; html: string; prefix: string; short: string; tees: Record<Tee, string> }
> = {
  en: {
    alt: '{title}, on {tee}.',
    html: 'en/index.html',
    prefix: 'en/',
    short: 'short line',
    tees: { black: 'a black tee', orange: 'an orange tee', white: 'a white tee' },
  },
  es: {
    alt: '{title}, en {tee}.',
    html: 'index.html',
    prefix: '',
    short: 'frase corta',
    tees: {
      black: 'una camiseta negra',
      orange: 'una camiseta naranja',
      white: 'una camiseta blanca',
    },
  },
};

interface DesignMeta {
  title: Record<Lang, string>;
}

/** One share page: the design as one tee (text language, colour, length). */
interface Preview {
  short: boolean;
  slug: string;
  tee: Tee;
  textLang: Lang;
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

const variantOf = (p: Preview) => `${p.textLang}.${p.tee}.front${p.short ? '.short' : ''}`;

export const sharePages = (siteUrl: string): Plugin => {
  let outDir = '';

  /** A copy of a built page whose title, description and preview image are this tee's. */
  const page = (base: string, lang: Lang, meta: DesignMeta, p: Preview, path: string) => {
    const words = PAGES[lang];
    const siteTitle = /<title>([^<]*)<\/title>/.exec(base)?.[1] ?? '';
    const name = p.short ? `${meta.title[lang]} (${words.short})` : meta.title[lang];
    const title = `${name} · ${siteTitle}`;
    const variant = variantOf(p);
    const quote = frontTitle(readFileSync(join(ROOT, 'designs', p.slug, `${variant}.svg`), 'utf8'));
    let html = base
      .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
      .replace(/(<link\s+rel="icon")/, `<meta name="robots" content="noindex" />\n    $1`);
    html = setMeta(html, 'property', 'og:url', `${siteUrl}/${path}`);
    html = setMeta(html, 'property', 'og:title', title);
    html = setMeta(html, 'name', 'twitter:title', title);
    if (quote) {
      html = setMeta(html, 'name', 'description', quote);
      html = setMeta(html, 'property', 'og:description', quote);
      html = setMeta(html, 'name', 'twitter:description', quote);
    }
    const render = join(ROOT, 'renders', p.slug, `${variant}.jpg`);
    if (existsSync(render)) {
      const file = `og/${p.slug}.${variant}.jpg`;
      if (!existsSync(join(outDir, file))) copyFileSync(render, join(outDir, file));
      const size = jpegSize(readFileSync(render));
      html = setMeta(html, 'property', 'og:image', `${siteUrl}/${file}`);
      html = setMeta(html, 'name', 'twitter:image', `${siteUrl}/${file}`);
      html = setMeta(
        html,
        'property',
        'og:image:alt',
        words.alt.replace('{title}', name).replace('{tee}', words.tees[p.tee]),
      );
      if (size) {
        html = setMeta(html, 'property', 'og:image:width', String(size.width));
        html = setMeta(html, 'property', 'og:image:height', String(size.height));
      }
    }
    mkdirSync(join(outDir, path), { recursive: true });
    writeFileSync(join(outDir, path, 'index.html'), html);
  };

  return {
    apply: 'build',
    closeBundle() {
      mkdirSync(join(outDir, 'og'), { recursive: true });
      const slugs = readdirSync(join(ROOT, 'designs'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
        .map((d) => d.name)
        .filter((slug) => existsSync(join(ROOT, 'designs', slug, 'design.json')));
      let pages = 0;
      for (const lang of LANGS) {
        const base = readFileSync(join(outDir, PAGES[lang].html), 'utf8');
        const prefix = `${PAGES[lang].prefix}d/`;
        for (const slug of slugs) {
          const exists = (p: Preview) =>
            existsSync(join(ROOT, 'designs', slug, `${variantOf(p)}.svg`));
          const meta = JSON.parse(
            readFileSync(join(ROOT, 'designs', slug, 'design.json'), 'utf8'),
          ) as DesignMeta;
          for (const textLang of LANGS) {
            for (const tee of TEES) {
              for (const short of [false, true]) {
                const p = { short, slug, tee, textLang };
                if (!exists(p)) continue;
                const key = `${textLang}-${tee}${short ? '-short' : ''}`;
                page(base, lang, meta, p, `${prefix}${slug}/${key}/`);
                pages += 1;
              }
            }
          }
          // The design's own page, in the page's language on the orange tee
          // (and the first share links' short/).
          const textLang = [lang, ...LANGS].find((l) =>
            exists({ short: false, slug, tee: 'orange', textLang: l }),
          );
          if (!textLang) continue;
          page(
            base,
            lang,
            meta,
            { short: false, slug, tee: 'orange', textLang },
            `${prefix}${slug}/`,
          );
          pages += 1;
          const short: Preview = { short: true, slug, tee: 'orange', textLang };
          if (exists(short)) {
            page(base, lang, meta, short, `${prefix}${slug}/short/`);
            pages += 1;
          }
        }
      }
      console.log(`share-pages: wrote ${pages} design pages`);
    },
    configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
    },
    name: 'share-pages',
  };
};
