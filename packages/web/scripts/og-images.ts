/**
 * Social preview images (Open Graph / Twitter cards), one per language:
 * public/og-es.png and public/og-en.png, 1200 × 630.
 *
 * Composed from repo assets: the chapter or global logo, the site name, and
 * three real tee renders from renders/. Re-run after changing the name, the
 * tagline or the featured designs:
 *
 *   pnpm --filter @pauseai-es/merch-web og
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const OUT = join(import.meta.dirname, '..', 'public');
const W = 1200;
const H = 630;

const COPY = {
  en: {
    logo: 'pauseai-global-on-orange',
    tagline: ['Design your PauseAI t-shirt', 'and download print-ready files.'],
    title: 'MERCHANDISE',
    titleSize: 96,
  },
  es: {
    logo: 'pauseai-es-on-orange',
    tagline: ['Diseña tu camiseta de PauseAI', 'y descarga los archivos', 'para imprimirla.'],
    title: 'MERCHANDISING',
    titleSize: 80,
  },
} as const;

/** Featured tees: [design, tee colour]. Orange and white, the chapter's own shirts. */
const FEATURED = [
  ['not-a-robot', 'white'],
  ['ask-me', 'orange'],
  ['regulated-like-a-sandwich', 'white'],
] as const;

const read = (path: string) => readFileSync(join(ROOT, path));

const logoPart = (name: string) => {
  const svg = read(`brand/logos/${name}.svg`).toString();
  const m = /<svg\b[^>]*?\sviewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>\s*$/.exec(svg);
  if (!m) throw new Error(`No viewBox in ${name}`);
  return { inner: m[2] ?? '', viewBox: m[1] ?? '' };
};

const jpeg = (path: string) => `data:image/jpeg;base64,${read(path).toString('base64')}`;

const svgFor = (lang: keyof typeof COPY) => {
  const copy = COPY[lang];
  const logo = logoPart(copy.logo);
  // Three cards in the right half, the middle one larger and on top.
  const slots = [
    { size: 250, x: 610, y: 210 },
    { size: 330, x: 745, y: 150 },
    { size: 250, x: 910, y: 210 },
  ];
  const tees = FEATURED.map(([slug, tee], i) => ({
    href: jpeg(`renders/${slug}/${lang}.${tee}.front.jpg`),
    ...(slots[i] as { size: number; x: number; y: number }),
    z: i === 1 ? 1 : 0,
  })).toSorted((a, b) => a.z - b.z);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#FF9416"/>
  <svg x="60" y="70" width="400" height="110" viewBox="${logo.viewBox}" preserveAspectRatio="xMinYMid meet">${logo.inner}</svg>
  <text x="58" y="320" font-family="Saira Condensed" font-weight="700" font-size="${copy.titleSize}" fill="#111111">${copy.title}</text>
  ${copy.tagline
    .map(
      (line, i) =>
        `<text x="62" y="${385 + i * 44}" font-family="Saira Condensed" font-weight="700" font-size="36" fill="#FFFFFF">${line}</text>`,
    )
    .join('\n  ')}
  ${tees
    .map(
      (t) => `<g>
    <rect x="${t.x - 2}" y="${t.y - 2}" width="${t.size + 4}" height="${t.size + 4}" rx="24" fill="#111111" fill-opacity="0.12"/>
    <clipPath id="c${t.x}"><rect x="${t.x}" y="${t.y}" width="${t.size}" height="${t.size}" rx="22"/></clipPath>
    <image href="${t.href}" x="${t.x}" y="${t.y}" width="${t.size}" height="${t.size}" clip-path="url(#c${t.x})"/>
  </g>`,
    )
    .join('\n  ')}
</svg>`;
};

for (const lang of Object.keys(COPY) as (keyof typeof COPY)[]) {
  const png = new Resvg(svgFor(lang), {
    fitTo: { mode: 'width', value: W },
    font: {
      defaultFontFamily: 'Saira Condensed',
      fontFiles: [join(ROOT, 'brand/fonts/files/SairaCondensed-Bold.ttf')],
      loadSystemFonts: false,
    },
  })
    .render()
    .asPng();
  writeFileSync(join(OUT, `og-${lang}.png`), png);
  console.log(`wrote public/og-${lang}.png (${Math.round(png.length / 1024)} kB)`);
}
