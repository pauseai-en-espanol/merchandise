import { readTextSlots, type Rendered, SHRINK_WARNING } from '@pauseai-es/merch-core';
import { useMemo } from 'react';

import type { Update } from '../App';

import { type Design, designNotesUrl, hasShort } from '../assets';
import { fill, type Strings } from '../i18n';
import { isShort, type Settings } from '../settings';

interface Props {
  canonical: string;
  design: Design;
  rendered: Rendered | null;
  settings: Settings;
  t: Strings;
  update: Update;
}

export const TextStep = ({ canonical, design, rendered, settings, t, update }: Props) => {
  const slots = useMemo(() => readTextSlots(canonical), [canonical]);
  const edited = Object.keys(settings.edits).length > 0;
  // Lines emptied to make the quote shorter: the others keep their size, so
  // a design with a short version points there instead.
  const emptied = Object.values(settings.edits).some((markup) => markup.trim() === '');
  const offerShort = hasShort(design, settings.lang) && !isShort(settings);

  const setSlot = (index: number, markup: string) => {
    const edits = { ...settings.edits, [index]: markup };
    if (markup === slots[index]?.markup) delete edits[index];
    update({ edits });
  };

  return (
    <div className="step">
      <p className="hint">{t.text.help}</p>
      {design.sourced && (
        <p className="notice">
          {t.text.sourced} <a href={designNotesUrl(design.slug)}>{t.text.notes}</a>
        </p>
      )}

      {offerShort ? (
        <div className={emptied ? 'warning short-offer' : 'notice short-offer'}>
          <p>{emptied ? t.text.shortEmptied : t.text.shortHint}</p>
          <button
            type="button"
            className="button secondary small"
            onClick={() => update({ edits: {}, short: true })}
          >
            {t.text.useShort}
          </button>
        </div>
      ) : (
        emptied && <p className="warning">{t.text.emptied}</p>
      )}

      <ol className="slots">
        {slots.map((slot) => {
          const report = rendered?.slots[slot.index];
          const pct = report ? Math.round(report.scale * 100) : 100;
          const id = `slot-${slot.index}`;
          return (
            <li key={`${canonical.length}-${slot.index}`} className="slot">
              <label htmlFor={id}>{fill(t.text.line, { n: slot.index + 1 })}</label>
              <input
                id={id}
                type="text"
                value={settings.edits[slot.index] ?? slot.markup}
                spellCheck
                onChange={(e) => setSlot(slot.index, e.target.value)}
              />
              {report && report.missing.length > 0 && (
                <p className="warning">
                  {fill(t.text.missing, { chars: report.missing.join(' ') })}
                </p>
              )}
              {report && report.scale < 1 && (
                <p className={report.scale < SHRINK_WARNING ? 'warning' : 'hint'}>
                  {fill(report.scale < SHRINK_WARNING ? t.text.tooSmall : t.text.shrunk, { pct })}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {edited && (
        <button type="button" className="button secondary" onClick={() => update({ edits: {} })}>
          {t.text.reset}
        </button>
      )}
    </div>
  );
};
