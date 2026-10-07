import { type Font, parse } from 'opentype.js';

/** Fonts the designs use; the TTFs live in brand/fonts/files/. */
export const FONT_FILES = {
  'Bebas Neue': 'BebasNeue-Regular.ttf',
  'Saira Condensed': 'SairaCondensed-Bold.ttf',
} as const;

export type FontFamily = keyof typeof FONT_FILES;

export const DEFAULT_FAMILY: FontFamily = 'Saira Condensed';

/** Synthetic italic angle: the chapter only ships the upright Saira Condensed Bold. */
export const ITALIC_SKEW_DEG = 10;

export interface FontBook {
  /** Resolve a `font-family` list to one of the loaded fonts. */
  font(familyAttr: string | undefined): Font;
}

export const fontBook = (buffers: Record<FontFamily, ArrayBuffer>): FontBook => {
  const fonts = Object.fromEntries(
    Object.entries(buffers).map(([family, buffer]) => [family, parse(buffer)]),
  ) as Record<FontFamily, Font>;
  return {
    font(familyAttr) {
      for (const raw of (familyAttr ?? '').split(',')) {
        const family = raw.trim().replaceAll(/^["']|["']$/g, '');
        if (family in fonts) return fonts[family as FontFamily];
      }
      return fonts[DEFAULT_FAMILY];
    },
  };
};

/** Advance width of a string in user units, without kerning (matches print-export.py). */
export const advance = (font: Font, text: string, size: number): number => {
  let units = 0;
  for (const ch of text) units += font.charToGlyph(ch).advanceWidth ?? 0;
  return (units * size) / font.unitsPerEm;
};

/** Characters the font has no glyph for. */
export const missingGlyphs = (font: Font, text: string): string[] =>
  [...new Set(text)].filter((ch) => ch.trim() !== '' && font.charToGlyph(ch).index === 0);
