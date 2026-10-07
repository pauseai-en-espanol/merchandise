import type { LogoVariant } from './colours';

/** An SVG reduced to what an inline `<svg viewBox>` slot needs. */
export interface SvgPart {
  inner: string;
  viewBox: string;
}

/**
 * A logo family: every variant of one lockup plus its mark (used in the QR
 * centre). Families come from `brand/logos/` and are never edited here.
 */
export interface LogoFamily {
  id: string;
  /** Mark only, for the centre of the back QR. */
  mark: SvgPart;
  name: string;
  /** Default site for this family (QR target and back wordmark). */
  url: string;
  variants: Record<LogoVariant, SvgPart>;
}

/** Split an SVG file into the root `viewBox` and its inner markup. */
export const svgPart = (svg: string): SvgPart => {
  const m = /<svg\b[^>]*?\sviewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>\s*$/.exec(svg);
  if (!m?.[1] || m[2] === undefined) throw new Error('SVG without a root viewBox');
  return { inner: m[2].trim(), viewBox: m[1] };
};

/** Raw `brand/logos/*.svg` sources for one family. */
export interface LogoFamilySources {
  dark: string;
  light: string;
  mark: string;
  mono: string;
  orange: string;
}

export const logoFamily = (
  meta: { id: string; name: string; url: string },
  sources: LogoFamilySources,
): LogoFamily => ({
  ...meta,
  mark: svgPart(sources.mark),
  variants: {
    dark: svgPart(sources.dark),
    light: svgPart(sources.light),
    mono: svgPart(sources.mono),
    orange: svgPart(sources.orange),
  },
});
