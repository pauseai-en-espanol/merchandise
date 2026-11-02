import {
  normaliseHex,
  PORTRAIT_STYLES,
  type PortraitStyle,
  PRESET_TEES,
  type PresetTee,
  render,
  ruleFor,
  type RuleKey,
  type ShareLink,
  type Tee,
  wordmarkFor,
} from '@pauseai-es/merch-core';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';

import { type Design, type Lang, NATIVE_FAMILY, type Repo, type TeePhoto } from './repo';

/** Link preview size: the 1.91:1 that Open Graph and X cards show uncropped. */
export const PREVIEW = { height: 630, width: 1200 } as const;

/**
 * The tee photos' framing (1242 × 1560, as in packages/web/src/raster.ts and
 * scripts/build-mockups.py): the chest print box, and where the preview's
 * top-left corner falls on the photo, so the print sits centred with a little
 * of the collar above it.
 */
const CHEST = { w: 500, x: 370, y: 380 } as const;
const CROP = { x: 21, y: 315 } as const;

/** A share link checked against the designs: everything the front depends on. */
export interface TeeState {
  design: Design;
  edits: Record<number, string>;
  familyId: string;
  finish: PortraitStyle;
  lang: Lang;
  plain: boolean;
  short: boolean;
  tee: Tee;
}

const teeOf = (value?: string): Tee => {
  if (value && Object.hasOwn(PRESET_TEES, value)) {
    const preset = value as PresetTee;
    return { hex: PRESET_TEES[preset].hex, preset };
  }
  const hex = value ? normaliseHex(value) : null;
  return hex ? { hex, preset: null } : { hex: PRESET_TEES.orange.hex, preset: 'orange' };
};

/** What a share link prints, or null for a design that doesn't exist. Anything else invalid falls back to the default. */
export const resolveLink = (repo: Repo, link: ShareLink): null | TeeState => {
  const design = repo.designs.get(link.slug);
  const first = design?.langs[0];
  if (!design || !first) return null;
  const lang = link.lang && design.langs.includes(link.lang) ? link.lang : first;
  const finish =
    design.portrait && PORTRAIT_STYLES.includes(link.finish as PortraitStyle)
      ? (link.finish as PortraitStyle)
      : 'lines';
  return {
    design,
    edits: link.edits,
    familyId: repo.families.some((f) => f.id === link.logo)
      ? (link.logo as string)
      : NATIVE_FAMILY[lang],
    finish,
    lang,
    plain: link.plain,
    short: link.short && design.shortLangs.includes(lang),
    tee: teeOf(link.tee),
  };
};

/** The preset tee that previews a custom colour: the one printed with the same inks (as share.ts in the web). */
const PREVIEW_TEE: Record<RuleKey, PresetTee> = {
  dark: 'black',
  ink: 'white',
  light: 'white',
  mid: 'orange',
};

/** The path segment of a share link for this tee: `<lang>-<tee>[-short]`. */
export const previewKey = (s: TeeState): string =>
  `${s.lang}-${s.tee.preset ?? PREVIEW_TEE[ruleFor(s.tee).key]}${s.short ? '-short' : ''}`;

/** Everything that changes the picture, as one string (for the cache). */
export const stateKey = (s: TeeState): string =>
  JSON.stringify([
    s.design.slug,
    s.lang,
    s.short,
    s.tee.hex,
    s.tee.preset,
    s.plain,
    s.finish,
    s.familyId,
    Object.entries(s.edits).toSorted(([a], [b]) => Number(a) - Number(b)),
  ]);

/** The print-ready front this tee prints (outlined SVG, 240 × 240 mm). */
export const frontPrint = (repo: Repo, s: TeeState): string => {
  const family = repo.families.find((f) => f.id === s.familyId) ?? repo.families[0];
  if (!family) throw new Error('No logo families');
  const person = s.design.portrait?.person;
  const input = {
    canonical: repo.front(s.design.slug, s.lang, s.short),
    edits: s.edits,
    families: repo.families,
    family,
    fonts: repo.fonts,
    plain: s.plain,
    portrait: person && s.finish !== 'lines' ? repo.portrait(person, s.finish) : undefined,
    tee: s.tee,
    tracking: false as const,
    url: family.url,
    wordmark: wordmarkFor(family.url),
  };
  try {
    return render(input).front;
  } catch {
    // Text a link can't print (the editor would have flagged it): show the design as drawn.
    return render({ ...input, edits: {} }).front;
  }
};

const PIXELS = PREVIEW.width * PREVIEW.height * 4;

/** Each tee photo's crop, decoded once (RGBA). */
const crops = new Map<TeePhoto, Uint8Array>();

const cropOf = (repo: Repo, tee: TeePhoto): Uint8Array => {
  let hit = crops.get(tee);
  if (!hit) {
    const photo = jpeg.decode(repo.photo(tee), { formatAsRGBA: true, useTArray: true });
    const out = new Uint8Array(PIXELS);
    const row = PREVIEW.width * 4;
    for (let y = 0; y < PREVIEW.height; y += 1) {
      const from = ((CROP.y + y) * photo.width + CROP.x) * 4;
      out.set(photo.data.subarray(from, from + row), y * row);
    }
    crops.set(tee, out);
    hit = out;
  }
  return hit;
};

/**
 * The tee in any colour, as the web's mockups draw it (raster.ts): a preset
 * tee is its own photo; any other colour multiplies the white tee by that
 * colour, through the silhouette of the black tee (dark there, so darkness is
 * how much of the colour applies).
 */
const teePixels = (repo: Repo, tee: Tee): Uint8Array => {
  if (tee.preset) return new Uint8Array(cropOf(repo, tee.preset));
  const white = cropOf(repo, 'white');
  const black = cropOf(repo, 'black');
  const tint = [1, 3, 5].map((i) => Number.parseInt(tee.hex.slice(i, i + 2), 16) / 255);
  const out = new Uint8Array(PIXELS);
  for (let i = 0; i < PIXELS; i += 4) {
    const lum =
      0.2126 * (black[i] ?? 0) + 0.7152 * (black[i + 1] ?? 0) + 0.0722 * (black[i + 2] ?? 0);
    const a = Math.max(0, Math.min(255, ((235 - lum) * 255) / 175)) / 255;
    for (let c = 0; c < 3; c += 1) {
      out[i + c] = (white[i + c] ?? 0) * (1 - a + a * (tint[c] ?? 1));
    }
    out[i + 3] = 255;
  }
  return out;
};

/** The link preview: the tee photo around the chest, the print on it. JPEG, PREVIEW size. */
export const previewJpeg = (repo: Repo, s: TeeState, quality = 82): Buffer => {
  const out = teePixels(repo, s.tee);
  const print = new Resvg(frontPrint(repo, s), {
    fitTo: { mode: 'width', value: CHEST.w },
    font: { loadSystemFonts: false },
  }).render();
  // resvg's pixels are premultiplied: over = print + tee × (1 − alpha).
  const px = print.pixels;
  const left = CHEST.x - CROP.x;
  const top = CHEST.y - CROP.y;
  for (let y = 0; y < print.height; y += 1) {
    const ty = top + y;
    if (ty < 0 || ty >= PREVIEW.height) continue;
    for (let x = 0; x < print.width; x += 1) {
      const tx = left + x;
      if (tx < 0 || tx >= PREVIEW.width) continue;
      const from = (y * print.width + x) * 4;
      const alpha = (px[from + 3] ?? 0) / 255;
      if (alpha === 0) continue;
      const to = (ty * PREVIEW.width + tx) * 4;
      for (let c = 0; c < 3; c += 1) {
        out[to + c] = (px[from + c] ?? 0) + (out[to + c] ?? 0) * (1 - alpha);
      }
    }
  }
  return jpeg.encode({ data: out, height: PREVIEW.height, width: PREVIEW.width }, quality).data;
};
