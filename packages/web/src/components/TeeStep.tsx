import {
  type FontBook,
  normaliseHex,
  PRESET_TEES,
  recolourFront,
  ruleFor,
} from '@pauseai-es/merch-core';
import { useEffect, useMemo, useState } from 'react';

import type { Update } from '../App';
import type { Strings } from '../i18n';

import { DESIGNS, FAMILIES, familyById, type Lang, loadFront } from '../assets';
import { type Settings, teeOf } from '../settings';

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
  const ordered = useMemo(
    () => DESIGNS.toSorted((a, b) => a.title[ui].localeCompare(b.title[ui], ui)),
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
          {ordered.map((d) => (
            <button
              key={d.slug}
              type="button"
              className="thumb"
              aria-pressed={d.slug === settings.slug}
              onClick={() => chooseDesign(d.slug, settings.lang)}
            >
              <span
                className="art"
                style={{ background: tee.hex }}
                // Design SVGs come from this repo (no scripts, see CLAUDE.md).
                dangerouslySetInnerHTML={{ __html: thumbs[d.slug] ?? '' }}
              />
              <span className="thumb-title">{d.title[ui]}</span>
              {d.sourced && <span className="badge">{t.tee.sourced}</span>}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
};
