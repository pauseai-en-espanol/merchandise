import { type ColourRule, INK } from './colours';
import { recolourTags } from './variant';

/**
 * The commissioned portraits (illustrations/portraits/<person>/) come as
 * versions of the same drawing, traced from one raster by
 * scripts/trace-portraits.py, so they share a viewBox and swap in place:
 *
 * - lines     one ink: the line work only;
 * - halftone  one ink: line work + the shading as a dot screen;
 * - tone      two inks: line work + the shading as one flat tone.
 *
 * A design prints one in a `<g id="portrait" transform="…">` (authored with
 * lines.svg, see scripts/draw-portrait-quotes.py). Line work and dots are
 * body ink and follow the tee rule like any other body element. The tone is
 * the body colour faded TONE_FADE of the way toward the tee: on the preset
 * white and black tees that is exactly brand/tokens.json's portraitToneInk
 * and portraitToneWhite, the colours of tone.svg and tone.white.svg.
 */

export type PortraitStyle = 'halftone' | 'lines' | 'tone';

export const PORTRAIT_STYLES: readonly PortraitStyle[] = ['lines', 'halftone', 'tone'];

/** The style designs are authored with: printing it needs no swap. */
export const AUTHORED_STYLE: PortraitStyle = 'lines';

/** How far the tone is faded from the line colour toward the tee. */
export const TONE_FADE = 0.58;

const rgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

/** `from` moved `amount` (0–1) of the way toward `to`, both `#RRGGBB`. */
export const fade = (from: string, to: string, amount: number): string => {
  const [a, b] = [rgb(from), rgb(to)];
  return `#${a
    .map((c, i) => Math.round(c + amount * ((b[i] ?? c) - c)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
};

/** The tone a two-ink portrait prints with on this tee. */
export const toneFor = (rule: ColourRule, teeHex: string): string =>
  fade(rule.body, teeHex, TONE_FADE);

const SLOT = /(<g\b[^>]*\sid="portrait"[^>]*>)[\s\S]*?(<\/g>)/;

/** A version's paths; any that isn't ink is the shading tone, marked `class="tone"`. */
const portraitPaths = (source: string): string[] =>
  (source.match(/<path\b[\s\S]*?\/>/g) ?? []).map((path) =>
    path.includes(`fill="${INK}"`) ? path : path.replace('<path', '<path class="tone"'),
  );

export const hasPortrait = (svg: string): boolean => SLOT.test(svg);

/** Print another version of the same drawing in a design's portrait slot. */
export const swapPortrait = (svg: string, source: string): string => {
  const paths = portraitPaths(source);
  if (paths.length === 0) throw new Error('No paths in the portrait source');
  if (!hasPortrait(svg)) throw new Error('The design has no <g id="portrait"> slot');
  return svg.replace(SLOT, (_, open: string, close: string) =>
    [open, ...paths.map((p) => `    ${p}`), `  ${close}`].join('\n'),
  );
};

/** Paint every `class="tone"` element with the tone for this tee. */
export const paintTone = (svg: string, rule: ColourRule, teeHex: string): string => {
  const tone = toneFor(rule, teeHex);
  return svg.replaceAll(/<[^>]*\sclass="tone"[^>]*>/g, (tag) =>
    tag.replace(/\sfill="#[0-9A-Fa-f]{6}"/, ` fill="${tone}"`),
  );
};

/**
 * A version on its own, coloured for a tee, cropped to a square of `detail`
 * (0–1) of the drawing's width around the face, where the finishes differ
 * (for the finish menu: at that size the whole drawing looks the same in all
 * three).
 */
export const portraitPreview = (
  source: string,
  rule: ColourRule,
  teeHex: string,
  detail = 1,
): string => {
  const [x = 0, y = 0, w = 1, h = 1] = (/viewBox="([^"]+)"/.exec(source)?.[1] ?? '0 0 1 1')
    .split(/\s+/)
    .map(Number);
  const box = [x + (w * (1 - detail)) / 2, y + h * 0.3, w * detail, w * detail];
  const art = recolourTags(portraitPaths(source).join('\n'), rule);
  return paintTone(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map((v) => Math.round(v)).join(' ')}" preserveAspectRatio="xMidYMid slice">\n${art}\n</svg>`,
    rule,
    teeHex,
  );
};
