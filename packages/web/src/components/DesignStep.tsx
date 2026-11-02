import { AUTHORED_STYLE, type FontBook, ruleFor } from '@pauseai-es/merch-core';
import { useMemo } from 'react';

import {
  CARDS,
  type Design,
  designNotesUrl,
  DESIGNS,
  familyById,
  hasShort,
  type Lang,
} from '../assets';
import { fill, type Strings } from '../i18n';
import { isShort, type Settings, teeOf } from '../settings';
import { frontKey, type FrontRef, thumbnail, useFronts, usePortraits } from '../thumbs';

/** An open book: the design cites its sources. */
const BookIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.5 5.5c2.9-1.2 5.9-1.1 8.5.6 2.6-1.7 5.6-1.8 8.5-.6v12.6c-2.9-1.2-5.9-1.1-8.5.6-2.6-1.7-5.6-1.8-8.5-.6ZM12 6.1v12.6" />
  </svg>
);

interface Props {
  chooseDesign: (slug: string, lang: Lang) => void;
  fonts: FontBook | null;
  settings: Settings;
  t: Strings;
  ui: Lang;
}

/**
 * Step 1: the catalogue. One card per design, or per person for the portrait
 * designs (their quotes are options in the next step); a card is one button
 * that picks it. Each shows the design as it prints on the chosen tee: the
 * chosen design as configured, the others as they start.
 */
export const DesignStep = ({ chooseDesign, fonts, settings, t, ui }: Props) => {
  const tee = teeOf(settings);
  const rule = ruleFor(tee);
  const family = familyById(settings.familyId);
  const style = settings.portraitStyle;
  const textLang = (d: Design) =>
    d.langs.includes(settings.lang) ? settings.lang : (d.langs[0] ?? settings.lang);

  const cards = useMemo(
    () =>
      CARDS.map((card) => ({
        ...card,
        // The chosen design where it's in this card, else the card's first.
        shown: card.designs.find((d) => d.slug === settings.slug) ?? card.designs[0],
      })).toSorted((a, b) =>
        (a.designs[0]?.title[ui] ?? '').localeCompare(b.designs[0]?.title[ui] ?? '', ui),
      ),
    [ui, settings.slug],
  );

  // What each card prints: its shown design, full, or short for the chosen one when it prints short.
  const refOf = (d: Design): FrontRef => ({
    lang: textLang(d),
    short: d.slug === settings.slug && isShort(settings),
    slug: d.slug,
  });
  const refs = cards.flatMap((c) => (c.shown ? [refOf(c.shown)] : []));
  const sources = useFronts(refs);
  const persons = [...new Set(DESIGNS.flatMap((d) => (d.portrait ? [d.portrait.person] : [])))];
  const finishes = usePortraits(style === AUTHORED_STYLE ? [] : persons, [style]);

  const look = useMemo(() => ({ family, rule, teeHex: tee.hex }), [family, rule, tee.hex]);
  const thumbs = useMemo(() => {
    const out: Record<string, string> = {};
    for (const ref of refs) {
      const key = frontKey(ref);
      const svg = sources[key];
      if (!svg) continue;
      const person = DESIGNS.find((d) => d.slug === ref.slug)?.portrait?.person;
      const finish =
        person && style !== AUTHORED_STYLE ? finishes[`${person}/${style}`] : undefined;
      out[key] = thumbnail(svg, look, finish);
    }
    return out;
    // refs is derived from these.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, finishes, look, style, refs.map(frontKey).join('|')]);

  return (
    <div className="step">
      <fieldset className="group">
        <legend>{t.tee.design}</legend>
        <p className="hint">{t.tee.designHint}</p>
        <div className={`gallery${fonts ? '' : ' loading'}`}>
          {cards.map((card) => {
            const d = card.shown;
            if (!d) return null;
            const chosen = card.designs.some((v) => v.slug === settings.slug);
            const meta = [
              card.designs.length > 1 ? fill(t.tee.quoteCount, { n: card.designs.length }) : '',
              card.designs.some((v) => hasShort(v, textLang(v))) ? t.tee.shortAvailable : '',
            ].filter(Boolean);
            return (
              <div key={card.key} className="card" data-selected={chosen}>
                <span
                  className="art"
                  style={{ background: tee.hex }}
                  aria-hidden="true"
                  // Design SVGs come from this repo (no scripts, see CLAUDE.md).
                  dangerouslySetInnerHTML={{ __html: thumbs[frontKey(refOf(d))] ?? '' }}
                />
                <div className="card-foot">
                  {d.sourced && (
                    <span className="card-tools">
                      <a
                        className="tool cite"
                        href={designNotesUrl(d.slug)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t.tee.sourcedLink}
                        data-tip={t.tee.sourced}
                      >
                        <BookIcon />
                      </a>
                    </span>
                  )}
                  <button
                    type="button"
                    className="thumb"
                    aria-pressed={chosen}
                    onClick={() => chooseDesign(d.slug, settings.lang)}
                  >
                    <span className="thumb-title">{d.title[ui]}</span>
                    {meta.length > 0 && <span className="thumb-meta">{meta.join(' · ')}</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};
