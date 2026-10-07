import { qrPart, type Rendered, ruleFor, wordmarkFor } from '@pauseai-es/merch-core';
import { useMemo } from 'react';

import type { Update } from '../App';

import { FAMILIES, familyById } from '../assets';
import { fill, type Strings } from '../i18n';
import { isValidUrl, type Settings, teeOf } from '../settings';

/**
 * Version 10 (57 modules) and up: under 1.4 mm per module at 80 mm. The chapter's
 * own tracked pauseai.es URLs are version 7 and scan fine.
 */
const DENSE_QR_MODULES = 57;

interface Props {
  rendered: Rendered | null;
  settings: Settings;
  t: Strings;
  update: Update;
}

export const ChapterStep = ({ rendered, settings, t, update }: Props) => {
  const tee = teeOf(settings);
  const rule = ruleFor(tee);
  const family = familyById(settings.familyId);
  const urlOk = isValidUrl(settings.url);

  const modules = useMemo(
    () =>
      rendered ? qrPart({ fg: '#000000', mark: family.mark, url: rendered.qrUrl }).modules : 0,
    [rendered, family],
  );

  const chooseFamily = (id: string) => {
    const next = familyById(id);
    // Follow the family's site unless the user typed their own.
    const ownUrl = !FAMILIES.some((f) => f.url === settings.url);
    update({ familyId: id, ...(ownUrl ? {} : { url: next.url }) });
  };

  return (
    <div className="step">
      <fieldset className="group">
        <legend>{t.chapter.logo}</legend>
        <p className="hint">{t.chapter.logoHint}</p>
        <div className="families">
          {FAMILIES.map((f) => {
            const part = f.variants[rule.logo];
            return (
              <button
                key={f.id}
                type="button"
                className="family"
                aria-pressed={f.id === settings.familyId}
                onClick={() => chooseFamily(f.id)}
              >
                <span className="logo-tile" style={{ background: tee.hex }}>
                  <svg
                    viewBox={part.viewBox}
                    role="img"
                    aria-label={f.name}
                    dangerouslySetInnerHTML={{ __html: part.inner }}
                  />
                </span>
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="group">
        <legend>{t.chapter.url}</legend>
        <label className="field">
          <span className="hint">{t.chapter.urlHint}</span>
          <input
            type="url"
            inputMode="url"
            value={settings.url}
            aria-invalid={!urlOk}
            spellCheck={false}
            onChange={(e) => update({ url: e.target.value.trim() })}
          />
        </label>
        {!urlOk && <p className="warning">{t.chapter.urlInvalid}</p>}
        {urlOk && modules >= DENSE_QR_MODULES && <p className="warning">{t.chapter.longUrl}</p>}

        <label className="check">
          <input
            type="checkbox"
            checked={settings.tracking}
            onChange={(e) => update({ tracking: e.target.checked })}
          />
          <span>
            {t.chapter.tracking}
            <span className="hint block">{t.chapter.trackingHint}</span>
          </span>
        </label>

        <label className="field">
          <span>{t.chapter.wordmark}</span>
          <span className="row">
            <input
              type="text"
              value={settings.wordmark}
              spellCheck={false}
              onChange={(e) => update({ wordmark: e.target.value, wordmarkEdited: true })}
            />
            {settings.wordmarkEdited && (
              <button
                type="button"
                className="button secondary small"
                aria-label={t.chapter.wordmarkReset}
                title={t.chapter.wordmarkReset}
                onClick={() =>
                  update({ wordmark: wordmarkFor(settings.url), wordmarkEdited: false })
                }
              >
                ↺
              </button>
            )}
          </span>
        </label>
        {rendered && rendered.wordmarkScale < 1 && (
          <p className="hint">
            {fill(t.chapter.wordmarkShrunk, { pct: Math.round(rendered.wordmarkScale * 100) })}
          </p>
        )}
        {rendered && <p className="qr-target">{rendered.qrUrl}</p>}
      </fieldset>
    </div>
  );
};
