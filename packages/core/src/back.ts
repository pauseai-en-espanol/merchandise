import qrcode from 'qrcode-generator';

import type { SvgPart } from './logos';

/**
 * The tee back: a single-colour QR with the family's mark in the centre and the
 * web address underneath, straight on the fabric (no panel). Port of
 * scripts/build-qr.py: error correction H carries the centre mark, finders are
 * hollow rings so the dark/light/dark pattern reads against the bare tee.
 */

const escapeXml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Monochrome mark for the QR centre. The two brand marks are built
 * differently, so the cut-outs are made differently:
 * - ES chapter mark: orange `<circle>` with white decorations on top. The
 *   decorations become a mask, so they are real holes in the circle.
 * - Global mark: white backing ellipse behind a compound path that already
 *   carves its cut-outs; dropping the backing fill is enough.
 */
const monoMark = (mark: SvgPart, fg: string, maskId: string): string => {
  if (mark.inner.includes('<circle')) {
    const [, , w, h] = mark.viewBox.split(/\s+/).map(Number);
    const circle = /<circle[^/]*?fill="#FF9416"[^/]*\/>/.exec(mark.inner)?.[0];
    if (!circle) throw new Error('ES mark: expected an orange <circle>');
    const cutouts = [...mark.inner.matchAll(/<(?:path|rect)[^/]*?fill="#FFFFFF"[^/]*\/>/g)].map(
      (m) => m[0].replace('#FFFFFF', 'black'),
    );
    return (
      `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse">` +
      `<rect x="0" y="0" width="${w}" height="${h}" fill="white"/>${cutouts.join('')}</mask></defs>` +
      circle.replace('#FF9416', fg).replace('/>', ` mask="url(#${maskId})"/>`)
    );
  }
  return mark.inner
    .replaceAll('#FF9416', '__FG__')
    .replaceAll('"white"', '"none"')
    .replaceAll('__FG__', fg);
};

export interface QrOptions {
  fg: string;
  mark: SvgPart;
  /** Unique per document, for the ES mark's mask. */
  maskId?: string;
  url: string;
}

/** QR modules as an SVG part (viewBox in modules, 1-module quiet zone). */
export const qrPart = ({ fg, mark, maskId = 'qr-mark-cutouts', url }: QrOptions) => {
  const qr = qrcode(0, 'H');
  qr.addData(url);
  qr.make();
  const size = qr.getModuleCount();

  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
  let logo = Math.max(5, Math.floor(size / 5));
  if (logo % 2 === 0) logo += 1;
  const logoMin = Math.floor(size / 2) - Math.floor(logo / 2);
  const logoMax = logoMin + logo - 1;
  const inLogo = (r: number, c: number) =>
    r >= logoMin && r <= logoMax && c >= logoMin && c <= logoMax;

  const modules: string[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.isDark(r, c) && !inFinder(r, c) && !inLogo(r, c)) modules.push(`M${c} ${r}h1v1h-1z`);
    }
  }
  const finders = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ].map(
    ([r, c]) =>
      `<g transform="translate(${c} ${r})"><path fill="${fg}" fill-rule="evenodd" d="M0,0 H7 V7 H0 Z M1,1 H6 V6 H1 Z"/>` +
      `<rect x="2" y="2" width="3" height="3" fill="${fg}"/></g>`,
  );
  const centre =
    `<svg x="${logoMin + 0.5}" y="${logoMin + 0.5}" width="${logo - 1}" height="${logo - 1}" viewBox="${mark.viewBox}">` +
    `${monoMark(mark, fg, maskId)}</svg>`;

  return {
    inner: `<path fill="${fg}" d="${modules.join('')}"/>${finders.join('')}${centre}`,
    modules: size,
    viewBox: `-1 -1 ${size + 2} ${size + 2}`,
  };
};

export interface BackOptions extends QrOptions {
  /** Font size for the wordmark (mm); shrink it when the address is long. */
  wordmarkSize?: number;
  wordmark: string;
}

export const WORDMARK_SIZE = 15;
/** Widest the wordmark may run on the 200 mm back canvas (5 mm safe area + margin). */
export const WORDMARK_MAX_WIDTH = 170;

/** Back design on a 200 × 200 mm canvas: QR 80 × 80 mm, wordmark below. */
export const backSvg = (options: BackOptions): string => {
  const qr = qrPart(options);
  const { fg, url, wordmark, wordmarkSize = WORDMARK_SIZE } = options;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200mm" height="200mm" role="img" aria-label="QR to ${escapeXml(url)}">
  <title>${escapeXml(url)}</title>
  <svg id="qr" x="60" y="35" width="80" height="80" viewBox="${qr.viewBox}">${qr.inner}</svg>
  <text x="100" y="145" font-family="Saira Condensed, Impact, sans-serif" font-weight="700" font-size="${wordmarkSize}" fill="${fg}" text-anchor="middle">${escapeXml(wordmark)}</text>
</svg>
`;
};

/** Default wordmark for a URL: the host, upper-cased (https://pauseai.es → PAUSEAI.ES). */
export const wordmarkFor = (url: string): string => {
  try {
    return new URL(url).host.replace(/^www\./, '').toUpperCase();
  } catch {
    return url.toUpperCase();
  }
};

/** Add the chapter's campaign tracking to a URL (kept out of the visible wordmark). */
export const trackedUrl = (url: string, source?: string): string => {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_campaign', 'tshirt');
    if (source) u.searchParams.set('utm_source', source);
    return u.toString();
  } catch {
    return url;
  }
};
