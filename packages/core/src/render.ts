import type { LogoFamily } from './logos';

import { backSvg, trackedUrl, WORDMARK_MAX_WIDTH, WORDMARK_SIZE } from './back';
import { type ColourRule, contrast, ruleFor, type Tee } from './colours';
import { advance, type FontBook } from './fonts';
import { paintColours, printBack, printFront } from './print';
import { applyTextEdits, type SlotReport } from './text';
import { recolourFront } from './variant';

export interface RenderInput {
  /** The design's hand-authored `{lang}.orange.front.svg`. */
  canonical: string;
  /** Edited text slots (markup by slot index). */
  edits: Record<number, string>;
  /** Logo family to print. */
  family: LogoFamily;
  /** All known families, to find the design's logo slot. */
  families: LogoFamily[];
  fonts: FontBook;
  /** Unique per rendered document, for SVG ids that must not collide on a page. */
  idPrefix?: string;
  tee: Tee;
  /** Add `utm_campaign=tshirt` (and `utm_source`, when given) to the QR only. */
  tracking: { source?: string } | false;
  url: string;
  wordmark: string;
}

export interface Rendered {
  /** Print-ready back, 200 × 220 mm, outlined. */
  back: string;
  /** Print-ready front, 240 × 240 mm, outlined. */
  front: string;
  /** Distinct ink colours across front and back, excluding the tee colour itself. */
  inks: string[];
  /** Characters no font could draw, anywhere. Export should be blocked. */
  missing: string[];
  /** What the QR encodes. */
  qrUrl: string;
  rule: ColourRule;
  slots: SlotReport[];
  /** < 1 when the web address was shrunk to fit the back. */
  wordmarkScale: number;
}

const WORDMARK_FAMILY = 'Saira Condensed';

export const render = (input: RenderInput): Rendered => {
  const rule = ruleFor(input.tee);
  const edited = applyTextEdits(input.canonical, input.edits, input.fonts);
  const front = printFront(
    recolourFront(edited.svg, rule, { known: input.families, use: input.family }),
    input.fonts,
  );

  const qrUrl = input.tracking ? trackedUrl(input.url, input.tracking.source) : input.url;
  const width = advance(input.fonts.font(WORDMARK_FAMILY), input.wordmark, WORDMARK_SIZE);
  const wordmarkScale = width > WORDMARK_MAX_WIDTH ? WORDMARK_MAX_WIDTH / width : 1;
  const back = printBack(
    backSvg({
      fg: rule.qr,
      mark: input.family.mark,
      maskId: `${input.idPrefix ?? 'm'}-qr-mark`,
      url: qrUrl,
      wordmark: input.wordmark,
      wordmarkSize: Math.round(WORDMARK_SIZE * wordmarkScale * 100) / 100,
    }),
    input.fonts,
  );

  return {
    back: back.svg,
    front: front.svg,
    // A colour identical to the tee needs no ink (e.g. logo counterforms on a white tee).
    inks: [...new Set([...paintColours(front.svg), ...paintColours(back.svg)])].filter(
      (ink) => contrast(ink, input.tee.hex) > 1.05,
    ),
    missing: [...new Set([...front.missing, ...back.missing])],
    qrUrl,
    rule,
    slots: edited.reports,
    wordmarkScale,
  };
};
