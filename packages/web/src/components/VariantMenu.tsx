import {
  type ColourRule,
  PORTRAIT_STYLES,
  portraitPreview,
  type PortraitStyle,
  toneFor,
} from '@pauseai-es/merch-core';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { loadPortrait } from '../assets';
import { fill, type Strings } from '../i18n';

/** The menu shows the face up close (this fraction of the drawing's width), where the finishes differ. */
const FACE_DETAIL = 0.5;

/** A stroke, the way a line drawing reads at swatch size. */
const STROKE = 'M3 14c3-6 6-6 9 0s6 6 9 0';

/** Dots that grow toward the bottom left, the way a halftone shades. */
const DOTS = [
  [1.1, 0.8, 0.5],
  [1.7, 1.3, 0.9],
  [2.3, 1.8, 1.3],
].flatMap((row, y) => row.map((r, x) => ({ cx: 6 + 6 * x, cy: 6 + 6 * y, r })));

/** Each finish as a tiny glyph, in the colours it prints in on this tee. */
const FinishGlyph = ({ ink, style, tone }: { ink: string; style: PortraitStyle; tone: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {style === 'halftone' ? (
      DOTS.map((d) => <circle key={`${d.cx},${d.cy}`} {...d} fill={ink} />)
    ) : (
      <>
        {style === 'tone' && <circle cx="12" cy="12" r="8" fill={tone} />}
        <path d={STROKE} fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      </>
    )}
  </svg>
);

const Check = () => (
  <svg className="variant-check" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** What the card shows while the pointer or focus is on an option. */
export interface VariantPreview {
  slug?: string;
  style?: PortraitStyle;
}

export interface QuoteVariant {
  /** The design's front, recoloured for the tee (thumbnail). */
  art: string;
  /** The start of the quote. */
  excerpt: string;
  slug: string;
  title: string;
}

interface Props {
  by: string;
  onPickQuote: (slug: string) => void;
  onPickStyle: (style: PortraitStyle) => void;
  onPreview: (preview: VariantPreview | null) => void;
  person: string;
  /** Every design of this person; the Quote section shows when there is more than one. */
  quotes: QuoteVariant[];
  rule: ColourRule;
  /** The variant the card shows. */
  slug: string;
  /** The finish portrait designs print with. */
  style: PortraitStyle;
  t: Strings;
  teeHex: string;
}

/**
 * The variants of a portrait card, from one control: a fanned stack of the
 * finish swatches (the chosen one in front) opens a menu with the person's
 * quotes and the face in each finish. Moving through it previews the option
 * on the card; choosing one picks it.
 */
export const VariantMenu = ({
  by,
  onPickQuote,
  onPickStyle,
  onPreview,
  person,
  quotes,
  rule,
  slug,
  style,
  t,
  teeHex,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<{ person: string; svgs: string[] } | null>(null);
  const [shift, setShift] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const tone = toneFor(rule, teeHex);
  const styleName = (s: PortraitStyle) => t.tee.styles[s].name;
  const several = quotes.length > 1;
  const tip = several
    ? fill(t.tee.variantsTip, { n: quotes.length, finish: styleName(style) })
    : `${t.tee.finish}: ${styleName(style)}`;

  useEffect(() => {
    if (!open || sources?.person === person) return;
    let alive = true;
    void Promise.all(PORTRAIT_STYLES.map((s) => loadPortrait(person, s))).then((svgs) => {
      if (alive) setSources({ person, svgs });
    });
    return () => {
      alive = false;
    };
  }, [open, person, sources?.person]);

  const faces = useMemo(
    () =>
      sources?.person === person
        ? sources.svgs.map((svg) => portraitPreview(svg, rule, teeHex, FACE_DETAIL))
        : null,
    [sources, person, rule, teeHex],
  );

  const close = (refocus: boolean) => {
    setOpen(false);
    onPreview(null);
    if (refocus) trigger.current?.focus();
  };

  // Close on a click or tap anywhere else.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        onPreview(null);
      }
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open, onPreview]);

  // Keep the menu inside the viewport, and start on the checked option.
  useLayoutEffect(() => {
    if (!open || !menu.current) return;
    const r = menu.current.getBoundingClientRect();
    const overflow = r.right - (document.documentElement.clientWidth - 8);
    if (overflow > 0) setShift(-overflow);
    menu.current
      .querySelector<HTMLElement>('[aria-checked="true"]')
      ?.focus({ preventScroll: true });
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    const at = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      list.at((at + (e.key === 'ArrowDown' ? 1 : -1)) % list.length)?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      (e.key === 'Home' ? list[0] : list.at(-1))?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  // The chosen finish sits in front of the stack.
  const stack = [...PORTRAIT_STYLES.filter((s) => s !== style), style];

  return (
    <div ref={root} className="variants">
      <button
        ref={trigger}
        type="button"
        className="tool variant-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={tip}
        data-tip={open ? undefined : tip}
        onClick={() => (open ? close(false) : (setShift(0), setOpen(true)))}
      >
        {stack.map((s) => (
          <span key={s} className="coin" style={{ background: teeHex }}>
            <FinishGlyph ink={rule.body} style={s} tone={tone} />
          </span>
        ))}
        {several && <span className="variant-count">{quotes.length}</span>}
      </button>
      {open && (
        <div
          ref={menu}
          className="variant-menu"
          role="menu"
          tabIndex={-1}
          aria-label={tip}
          style={{ transform: shift ? `translateX(${shift}px)` : undefined }}
          onKeyDown={onKeyDown}
          onMouseLeave={() => onPreview(null)}
        >
          {several && (
            <div role="group" aria-label={t.tee.quote} className="variant-group">
              <p className="variant-heading">{t.tee.quote}</p>
              {quotes.map((q) => (
                <button
                  key={q.slug}
                  type="button"
                  role="menuitemradio"
                  aria-checked={q.slug === slug}
                  className="variant-option"
                  tabIndex={-1}
                  onMouseEnter={() => onPreview({ slug: q.slug })}
                  onFocus={() => onPreview({ slug: q.slug })}
                  onClick={() => {
                    onPickQuote(q.slug);
                    close(true);
                  }}
                >
                  <span
                    className="variant-art quote-art"
                    style={{ background: teeHex }}
                    // Design SVGs come from this repo (no scripts, see CLAUDE.md).
                    dangerouslySetInnerHTML={{ __html: q.art }}
                  />
                  <span className="variant-text">
                    <span className="variant-name">{q.title}</span>
                    <span className="variant-note">{q.excerpt}</span>
                  </span>
                  <Check />
                </button>
              ))}
            </div>
          )}
          <div role="group" aria-label={t.tee.finish} className="variant-group">
            <p className="variant-heading">
              {t.tee.finish}
              <span> · {fill(t.tee.portraitBy, { by })}</span>
            </p>
            {PORTRAIT_STYLES.map((s, i) => (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={s === style}
                className="variant-option"
                tabIndex={-1}
                onMouseEnter={() => onPreview({ slug, style: s })}
                onFocus={() => onPreview({ slug, style: s })}
                onClick={() => {
                  onPickStyle(s);
                  close(true);
                }}
              >
                <span
                  className="variant-art face-art"
                  style={{ background: teeHex }}
                  // Portraits come from this repo's traced drawings (paths only).
                  dangerouslySetInnerHTML={{ __html: faces?.[i] ?? '' }}
                />
                <span className="variant-text">
                  <span className="variant-name">{styleName(s)}</span>
                  <span className="variant-note">
                    {t.tee.styles[s].note}
                    {s === 'tone' && <strong> · {t.tee.extraInk}</strong>}
                  </span>
                </span>
                <Check />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
