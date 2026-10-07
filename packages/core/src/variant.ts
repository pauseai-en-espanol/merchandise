import type { LogoFamily } from './logos';

import { type ColourRule, INK, WHITE } from './colours';

/**
 * Recolour a canonical orange-tee front for another tee, the same way
 * scripts/tee_variants.py does for the white and black tees:
 *
 * - The inlined logo (a nested `<svg>` whose viewBox is a known family's) is
 *   replaced wholesale by the rule's variant, optionally from another family.
 * - Accent = elements with `class="accent"` and a white fill/stroke → rule.accent.
 * - Body = every `#111111` fill/stroke except `class="keep"` → rule.body.
 * - Everything else (spot colours, white eyes, orange details) is untouched.
 *
 * The logo is kept out of the body/accent swap, so brand files are never recoloured.
 */

const LOGO_SLOT = (viewBoxes: string[]) =>
  new RegExp(
    String.raw`<svg\b([^>]*?\s)viewBox="(${viewBoxes.map((v) => v.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)).join('|')})"([^>]*)>[\s\S]*?</svg>`,
  );

export interface LogoChoice {
  /** Every family a design may have been authored with, to find its slot. */
  known: LogoFamily[];
  /** Family to print. */
  use: LogoFamily;
}

const hasClass = (tag: string, name: string) =>
  new RegExp(String.raw`\sclass="(?:[^"]*\s)?${name}(?:\s[^"]*)?"`).test(tag);

const swapPaint = (tag: string, from: string, to: string) =>
  from === to
    ? tag
    : tag
        .replaceAll(`fill="${from}"`, `fill="${to}"`)
        .replaceAll(`stroke="${from}"`, `stroke="${to}"`);

const recolourTags = (markup: string, rule: ColourRule): string =>
  markup.replaceAll(/<[^>]+>/g, (tag) => {
    if (tag.startsWith('<!') || tag.startsWith('<?')) return tag;
    let out = tag;
    if (hasClass(out, 'accent')) out = swapPaint(out, WHITE, rule.accent);
    if (!hasClass(out, 'keep')) out = swapPaint(out, INK, rule.body);
    return out;
  });

/** Locate the inlined logo slot of a design, if any. */
export const findLogoSlot = (svg: string, known: LogoFamily[]) => {
  const viewBoxes = [...new Set(known.map((f) => f.variants.orange.viewBox))];
  const m = LOGO_SLOT(viewBoxes).exec(svg);
  if (!m) return null;
  return {
    attrs: m[1] ?? '',
    end: m.index + m[0].length,
    rest: m[3] ?? '',
    start: m.index,
    viewBox: m[2] ?? '',
  };
};

/** Apply a tee colour rule (and optionally a different logo family) to a front SVG. */
export const recolourFront = (svg: string, rule: ColourRule, logo: LogoChoice): string => {
  const slot = findLogoSlot(svg, logo.known);
  if (!slot) return recolourTags(svg, rule);

  const authored = logo.known.find((f) => f.variants.orange.viewBox === slot.viewBox);
  const unchanged = rule.logo === 'orange' && authored?.id === logo.use.id;
  const part = logo.use.variants[rule.logo];
  const logoMarkup = unchanged
    ? svg.slice(slot.start, slot.end)
    : `<svg${slot.attrs}viewBox="${part.viewBox}"${slot.rest}>\n${part.inner}\n</svg>`;

  return (
    recolourTags(svg.slice(0, slot.start), rule) +
    logoMarkup +
    recolourTags(svg.slice(slot.end), rule)
  );
};
