import {
  AUTHORED_STYLE,
  type FontBook,
  normaliseHex,
  paintTone,
  PORTRAIT_STYLES,
  type PortraitStyle,
  PRESET_TEES,
  recolourFront,
  ruleFor,
  swapPortrait,
} from '@pauseai-es/merch-core';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Update } from '../App';
import type { Strings } from '../i18n';

import {
  CARDS,
  designNotesUrl,
  DESIGNS,
  FAMILIES,
  familyById,
  type Lang,
  loadFront,
  loadPortrait,
} from '../assets';
import { type Settings, teeOf } from '../settings';
import { VariantMenu, type VariantPreview } from './VariantMenu';

/**
 * Suggestions inside "Custom". The main choices are orange (the brand colour,
 * default) and white; black is offered last among the suggestions: a gentle
 * nudge towards cheerful shirts for anyone without a strong preference.
 */
const SUGGESTED: { hex: string; name: Record<Lang, string> }[] = [
  { hex: '#9CC3E6', name: { en: 'Light blue', es: 'Celeste' } },
  { hex: '#FFD100', name: { en: 'Yellow', es: 'Amarillo' } },
  { hex: '#1E8C3A', name: { en: 'Green', es: 'Verde' } },
  { hex: '#C8102E', name: { en: 'Red', es: 'Rojo' } },
  { hex: '#F4A6C0', name: { en: 'Pink', es: 'Rosa' } },
  { hex: '#4B2A7B', name: { en: 'Purple', es: 'Morado' } },
  { hex: '#1F2A44', name: { en: 'Navy', es: 'Azul marino' } },
  { hex: '#9E9E9E', name: { en: 'Grey', es: 'Gris' } },
];

/** The start of a design's quote, from its front's <title> ("quote — speaker"). */
const excerptOf = (svg: string | undefined, max = 70): string => {
  const title =
    /<title>([^<]*)<\/title>/
      .exec(svg ?? '')?.[1]
      ?.split(' — ')[0]
      ?.trim() ?? '';
  if (title.length <= max) return title;
  return `${title.slice(0, title.lastIndexOf(' ', max))}…`;
};

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
  update: Update;
}

export const TeeStep = ({ chooseDesign, fonts, settings, t, ui, update }: Props) => {
  const tee = teeOf(settings);
  const rule = ruleFor(tee);
  const [hexDraft, setHexDraft] = useState(settings.customHex);
  const [draftFor, setDraftFor] = useState(settings.customHex);
  const [sources, setSources] = useState<Record<string, string>>({});

  // The picker and the examples also set the colour: show it in the hex box.
  if (draftFor !== settings.customHex) {
    setDraftFor(settings.customHex);
    setHexDraft(settings.customHex);
  }

  useEffect(() => {
    let alive = true;
    void Promise.all(
      DESIGNS.map(async (d) => {
        const lang = d.langs.includes(settings.lang)
          ? settings.lang
          : (d.langs[0] ?? settings.lang);
        return [d.slug, await loadFront(d.slug, lang)] as const;
      }),
    ).then((entries) => {
      if (alive) setSources(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
  }, [settings.lang]);

  const family = familyById(settings.familyId);
  const thumbs = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(sources).map(([slug, svg]) => [
          slug,
          recolourFront(svg, rule, { known: FAMILIES, use: family }),
        ]),
      ),
    [sources, rule, family],
  );

  // Portrait finishes other than the authored one, loaded the first time a
  // card shows them (the chosen finish, or a preview), keyed `person/style`.
  const [finishSources, setFinishSources] = useState<Record<string, string>>({});
  const wantFinish = useCallback((person: string, style: PortraitStyle) => {
    if (style === AUTHORED_STYLE) return;
    const key = `${person}/${style}`;
    void loadPortrait(person, style).then((svg) =>
      setFinishSources((loaded) => (key in loaded ? loaded : { ...loaded, [key]: svg })),
    );
  }, []);
  useEffect(() => {
    for (const d of DESIGNS) if (d.portrait) wantFinish(d.portrait.person, settings.portraitStyle);
  }, [settings.portraitStyle, wantFinish]);

  /** Each portrait design's thumbnail in every finish loaded so far. */
  const finishThumbs = useMemo(() => {
    const out: Record<string, Partial<Record<PortraitStyle, string>>> = {};
    for (const d of DESIGNS) {
      const svg = sources[d.slug];
      if (!d.portrait || !svg) continue;
      for (const style of PORTRAIT_STYLES) {
        const finish = finishSources[`${d.portrait.person}/${style}`];
        if (!finish) continue;
        const front = recolourFront(swapPortrait(svg, finish), rule, {
          known: FAMILIES,
          use: family,
        });
        (out[d.slug] ??= {})[style] = paintTone(front, rule, tee.hex);
      }
    }
    return out;
  }, [sources, finishSources, rule, family, tee.hex]);

  // What a card's variant menu is previewing on it.
  const [preview, setPreview] = useState<(VariantPreview & { card: string }) | null>(null);

  const setCustom = (hex: string) => update({ customHex: hex, teeChoice: 'custom' });
  const customOpen = settings.teeChoice === 'custom' || settings.teeChoice === 'black';
  const preset = (choice: 'orange' | 'white') => (
    <button
      key={choice}
      type="button"
      className="chip"
      aria-pressed={settings.teeChoice === choice}
      onClick={() => update({ teeChoice: choice })}
    >
      <span className="swatch" style={{ background: PRESET_TEES[choice].hex }} />
      {t.tee.presets[choice]}
      {choice === 'orange' && <small>{t.tee.default}</small>}
    </button>
  );
  const design = DESIGNS.find((d) => d.slug === settings.slug);
  const cards = useMemo(
    () =>
      CARDS.toSorted((a, b) =>
        (a.designs[0]?.title[ui] ?? '').localeCompare(b.designs[0]?.title[ui] ?? '', ui),
      ),
    [ui],
  );

  return (
    <div className="step">
      <fieldset className="group">
        <legend>{t.tee.heading}</legend>
        <div className="chips">
          {preset('orange')}
          {preset('white')}
          <button
            type="button"
            className="chip"
            aria-pressed={customOpen}
            onClick={() => update({ teeChoice: 'custom' })}
          >
            <span className="swatch rainbow" />
            {t.tee.custom}
          </button>
        </div>

        {customOpen && (
          <div className="custom">
            <div className="row">
              <input
                type="color"
                aria-label={t.tee.customLabel}
                value={settings.customHex.toLowerCase()}
                onChange={(e) => setCustom(e.target.value.toUpperCase())}
              />
              <input
                type="text"
                className="hex"
                aria-label={t.tee.hexLabel}
                value={hexDraft}
                maxLength={7}
                spellCheck={false}
                onChange={(e) => {
                  setHexDraft(e.target.value);
                  const hex = normaliseHex(e.target.value);
                  if (hex && e.target.value.replace('#', '').length === 6) setCustom(hex);
                }}
              />
            </div>
            <div className="examples" aria-label={t.tee.examples}>
              {SUGGESTED.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className="example"
                  aria-pressed={settings.teeChoice === 'custom' && settings.customHex === c.hex}
                  title={`${c.name[ui]} ${c.hex}`}
                  onClick={() => setCustom(c.hex)}
                >
                  <span className="swatch large" style={{ background: c.hex }} />
                  {c.name[ui]}
                </button>
              ))}
              {/* Black is the chapter's own black tee (real photo, exact print rule). */}
              <button
                type="button"
                className="example"
                aria-pressed={settings.teeChoice === 'black'}
                title={`${t.tee.presets.black} ${PRESET_TEES.black.hex}`}
                onClick={() => update({ teeChoice: 'black' })}
              >
                <span className="swatch large" style={{ background: PRESET_TEES.black.hex }} />
                {t.tee.presets.black}
              </button>
            </div>
          </div>
        )}
        {rule.key === 'ink' && <p className="rule-note">{t.tee.paleNote}</p>}
        {rule.key === 'dark' && design?.portrait && (
          <p className="rule-note">{t.tee.portraitDark}</p>
        )}
      </fieldset>

      <fieldset className="group">
        <legend>{t.tee.design}</legend>
        {design && design.langs.length > 1 && (
          <div className="chips" role="group" aria-label={t.tee.textLanguage}>
            <span className="label">{t.tee.textLanguage}</span>
            {design.langs.map((lang) => (
              <button
                key={lang}
                type="button"
                className="chip small"
                aria-pressed={settings.lang === lang}
                onClick={() => chooseDesign(settings.slug, lang)}
              >
                {lang === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        )}
        <div className={`gallery${fonts ? '' : ' loading'}`}>
          {cards.map((card) => {
            const chosenHere = card.designs.find((d) => d.slug === settings.slug);
            const mine = preview?.card === card.key ? preview : null;
            const d =
              card.designs.find((v) => v.slug === mine?.slug) ?? chosenHere ?? card.designs[0];
            if (!d) return null;
            const style = d.portrait ? (mine?.style ?? settings.portraitStyle) : null;
            const finishes = finishThumbs[d.slug] ?? {};
            return (
              <div key={card.key} className="card" data-selected={!!chosenHere}>
                <span
                  className="art"
                  data-zoom={!!mine?.style}
                  style={{ background: tee.hex }}
                  aria-hidden="true"
                >
                  <span className="zoom">
                    {card.designs.map((v) => (
                      <span
                        key={v.slug}
                        className="layer"
                        data-shown={v.slug === d.slug}
                        // Design SVGs come from this repo (no scripts, see CLAUDE.md).
                        dangerouslySetInnerHTML={{ __html: thumbs[v.slug] ?? '' }}
                      />
                    ))}
                    {PORTRAIT_STYLES.map(
                      (s) =>
                        finishes[s] && (
                          <span
                            key={`${d.slug}/${s}`}
                            className="layer finish"
                            data-shown={style === s}
                            dangerouslySetInnerHTML={{ __html: finishes[s] }}
                          />
                        ),
                    )}
                  </span>
                </span>
                <div className="card-foot">
                  {(d.sourced || d.portrait) && (
                    <span className="card-tools">
                      {d.sourced && (
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
                      )}
                      {d.portrait && (
                        <VariantMenu
                          by={d.portrait.by}
                          person={d.portrait.person}
                          quotes={card.designs.map((v) => ({
                            art: thumbs[v.slug] ?? '',
                            excerpt: excerptOf(sources[v.slug]),
                            slug: v.slug,
                            title: v.title[ui],
                          }))}
                          rule={rule}
                          slug={d.slug}
                          style={settings.portraitStyle}
                          t={t}
                          teeHex={tee.hex}
                          onPreview={(p) => {
                            if (p?.style && d.portrait) wantFinish(d.portrait.person, p.style);
                            setPreview(p ? { ...p, card: card.key } : null);
                          }}
                          onPickQuote={(slug) => chooseDesign(slug, settings.lang)}
                          onPickStyle={(s) => {
                            if (d.slug !== settings.slug) chooseDesign(d.slug, settings.lang);
                            update({ portraitStyle: s });
                          }}
                        />
                      )}
                    </span>
                  )}
                  <button
                    type="button"
                    className="thumb"
                    aria-pressed={!!chosenHere}
                    onClick={() => chooseDesign(d.slug, settings.lang)}
                  >
                    <span className="thumb-title">{d.title[ui]}</span>
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
