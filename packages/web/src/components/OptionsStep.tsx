import {
  AUTHORED_STYLE,
  INK,
  normaliseHex,
  ORANGE,
  plainText,
  PORTRAIT_STYLES,
  portraitPreview,
  type PortraitStyle,
  PRESET_TEES,
  ruleFor,
  type RuleKey,
  RULES,
} from '@pauseai-es/merch-core';
import { type ReactNode, useMemo, useState } from 'react';

import type { Update } from '../App';

import { CARDS, designBySlug, familyById, hasShort, type Lang } from '../assets';
import { fill, type Strings } from '../i18n';
import { isShort, type Settings, teeOf } from '../settings';
import { frontKey, type FrontRef, remembered, thumbnail, useFronts, usePortraits } from '../thumbs';

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

/** The finish cards show the face up close (this fraction of the drawing's width), where they differ. */
const FACE_DETAIL = 0.5;

/** The start of a design's quote, from its front's <title> ("quote — speaker"). */
const excerptOf = (svg: string | undefined, max = 90): string => {
  const title =
    /<title>([^<]*)<\/title>/
      .exec(svg ?? '')?.[1]
      ?.split(' — ')[0]
      ?.trim() ?? '';
  if (title.length <= max) return title;
  return `${title.slice(0, title.lastIndexOf(' ', max))}…`;
};

const Check = () => (
  <svg className="option-check" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** One choice of a group: a radio button drawn as a card, with a picture of what it prints. */
const Option = ({
  art,
  checked,
  children,
  face = false,
  name,
  onPick,
  teeHex,
}: {
  art: string;
  checked: boolean;
  children: ReactNode;
  face?: boolean;
  name: string;
  onPick: () => void;
  teeHex: string;
}) => (
  <label className="option">
    <input type="radio" name={name} checked={checked} onChange={onPick} />
    <span
      className={`option-art${face ? ' face' : ''}`}
      style={{ background: teeHex }}
      aria-hidden="true"
      // Design SVGs and portraits come from this repo (no scripts, see CLAUDE.md).
      dangerouslySetInnerHTML={{ __html: art }}
    />
    <span className="option-text">{children}</span>
    <Check />
  </label>
);

/** The portrait's finishes, each shown on the face up close, where they differ. */
const FinishOptions = ({
  by,
  drawings,
  onPick,
  person,
  ruleKey,
  style,
  t,
  teeHex,
}: {
  by: string;
  /** The person's drawing in each finish, keyed `person/style`, as loaded so far. */
  drawings: Record<string, string>;
  onPick: (style: PortraitStyle) => void;
  person: string;
  ruleKey: RuleKey;
  style: PortraitStyle;
  t: Strings;
  teeHex: string;
}) => {
  const faces = useMemo(
    () =>
      Object.fromEntries(
        PORTRAIT_STYLES.map((s) => {
          const svg = drawings[`${person}/${s}`];
          return [s, svg ? portraitPreview(svg, RULES[ruleKey], teeHex, FACE_DETAIL) : ''];
        }),
      ),
    [drawings, person, ruleKey, teeHex],
  );
  return (
    <fieldset className="group">
      <legend>{t.tee.finish}</legend>
      <p className="hint">{fill(t.tee.portraitBy, { by })}</p>
      <div className="options tiles">
        {PORTRAIT_STYLES.map((s) => (
          <Option
            key={s}
            name="finish"
            face
            art={faces[s] ?? ''}
            checked={s === style}
            teeHex={teeHex}
            onPick={() => onPick(s)}
          >
            <span className="option-name">{t.tee.styles[s].name}</span>
            <span className="option-note">
              {t.tee.styles[s].note}
              {s === 'tone' && <strong> · {t.tee.extraInk}</strong>}
            </span>
          </Option>
        ))}
      </div>
    </fieldset>
  );
};

interface Props {
  chooseDesign: (slug: string, lang: Lang) => void;
  settings: Settings;
  t: Strings;
  ui: Lang;
  update: Update;
}

/**
 * Step 2: the tee colour and the text colour (highlighted words, or all in
 * one colour), then the chosen design's own options, all in view, each group
 * only where it applies: which quote (a person with several), the short
 * version (only a quote that has one), the portrait finish, and the text
 * language. Every choice shows at once in the preview.
 */
export const OptionsStep = ({ chooseDesign, settings, t, ui, update }: Props) => {
  const tee = teeOf(settings);
  const rule = ruleFor(tee);
  const design = designBySlug(settings.slug);
  const quotes = CARDS.find((c) => c.designs.some((d) => d.slug === design.slug))?.designs ?? [
    design,
  ];
  const person = design.portrait?.person;
  const canShort = hasShort(design, settings.lang);
  const short = isShort(settings);
  const style = settings.portraitStyle;

  // Colour: the picker and the examples also set it, so the hex box follows.
  const [hexDraft, setHexDraft] = useState(settings.customHex);
  const [draftFor, setDraftFor] = useState(settings.customHex);
  if (draftFor !== settings.customHex) {
    setDraftFor(settings.customHex);
    setHexDraft(settings.customHex);
  }
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

  // Pictures: each quote of this person, and this design short.
  const lang = (slug: string) => {
    const d = designBySlug(slug);
    return d.langs.includes(settings.lang) ? settings.lang : (d.langs[0] ?? settings.lang);
  };
  const quoteRef = (slug: string): FrontRef => ({ lang: lang(slug), short: false, slug });
  const shortRef: FrontRef = { lang: settings.lang, short: true, slug: design.slug };
  const sources = useFronts([
    ...quotes.map((d) => quoteRef(d.slug)),
    ...(canShort ? [shortRef] : []),
  ]);
  const drawings = usePortraits(person ? [person] : [], PORTRAIT_STYLES);
  const finish = person && style !== AUTHORED_STYLE ? drawings[`${person}/${style}`] : undefined;
  const { familyId, plain } = settings;
  const ruleKey = rule.key;
  const teeHex = tee.hex;
  /** A front as it prints on this tee, with the text highlighted or plain. */
  const picture = (ref: FrontRef, asPlain: boolean) => {
    const svg = sources[frontKey(ref)];
    if (!svg) return '';
    const key = [
      frontKey(ref),
      familyId,
      ruleKey,
      asPlain,
      teeHex,
      finish ? style : AUTHORED_STYLE,
    ];
    return remembered(key.join('|'), () =>
      thumbnail(
        svg,
        {
          family: familyById(familyId),
          rule: asPlain ? plainText(RULES[ruleKey]) : RULES[ruleKey],
          teeHex,
        },
        finish,
      ),
    );
  };
  const art = (ref: FrontRef) => picture(ref, plain);
  // The text colour options show this tee both ways.
  const current = short ? shortRef : quoteRef(design.slug);
  const textArts = { highlight: picture(current, false), plain: picture(current, true) };
  const colourName = (hex: string) =>
    t.tee.colourNames[hex === INK ? 'ink' : hex === ORANGE ? 'orange' : 'white'];

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
        {rule.key === 'dark' && person && <p className="rule-note">{t.tee.portraitDark}</p>}
      </fieldset>

      {rule.accent !== rule.body && (
        <fieldset className="group">
          <legend>{t.tee.textColour}</legend>
          <div className="options tiles">
            {(['highlight', 'plain'] as const).map((v) => (
              <Option
                key={v}
                name="text-colour"
                art={textArts[v]}
                checked={(v === 'plain') === plain}
                teeHex={tee.hex}
                onPick={() => update({ plain: v === 'plain' })}
              >
                <span className="option-name">
                  {fill(t.tee.textColours[v].name, {
                    colour: colourName(v === 'plain' ? rule.body : rule.accent),
                  })}
                </span>
                <span className="option-note">{t.tee.textColours[v].note}</span>
              </Option>
            ))}
          </div>
        </fieldset>
      )}

      {quotes.length > 1 && (
        <fieldset className="group">
          <legend>{t.tee.quote}</legend>
          <p className="hint">{t.tee.quoteHint}</p>
          <div className="options">
            {quotes.map((d) => (
              <Option
                key={d.slug}
                name="quote"
                art={art(quoteRef(d.slug))}
                checked={d.slug === design.slug}
                teeHex={tee.hex}
                onPick={() => chooseDesign(d.slug, settings.lang)}
              >
                <span className="option-name">{d.title[ui]}</span>
                <span className="option-note">
                  {excerptOf(sources[frontKey(quoteRef(d.slug))])}
                </span>
              </Option>
            ))}
          </div>
        </fieldset>
      )}

      {canShort && (
        <fieldset className="group">
          <legend>{t.tee.length}</legend>
          <p className="hint">{t.tee.lengthHint}</p>
          <div className="options tiles">
            {(['full', 'short'] as const).map((v) => (
              <Option
                key={v}
                name="version"
                art={art(v === 'short' ? shortRef : quoteRef(design.slug))}
                checked={(v === 'short') === short}
                teeHex={tee.hex}
                // The two versions have different text lines: start the text over.
                onPick={() => update({ edits: {}, short: v === 'short' })}
              >
                <span className="option-name">{t.tee.lengths[v].name}</span>
                <span className="option-note">{t.tee.lengths[v].note}</span>
              </Option>
            ))}
          </div>
        </fieldset>
      )}

      {design.portrait && (
        <FinishOptions
          by={design.portrait.by}
          drawings={drawings}
          person={design.portrait.person}
          ruleKey={ruleKey}
          style={style}
          t={t}
          teeHex={teeHex}
          onPick={(s) => update({ portraitStyle: s })}
        />
      )}

      {design.langs.length > 1 && (
        <fieldset className="group">
          <legend>{t.tee.textLanguage}</legend>
          <div className="chips">
            {design.langs.map((l) => (
              <button
                key={l}
                type="button"
                className="chip"
                aria-pressed={settings.lang === l}
                onClick={() => chooseDesign(settings.slug, l)}
              >
                {l === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
};
