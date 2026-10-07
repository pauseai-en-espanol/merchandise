import type { Rendered } from '@pauseai-es/merch-core';

import { useState } from 'react';

import type { Design, Lang } from '../assets';

import { buildZip, saveBlob, zipName } from '../download';
import { fill, type Strings } from '../i18n';
import { isValidUrl, type Settings, teeOf } from '../settings';

interface Props {
  canonical: string;
  design: Design;
  rendered: Rendered | null;
  settings: Settings;
  t: Strings;
  ui: Lang;
}

export const DownloadStep = ({ canonical, design, rendered, settings, t, ui }: Props) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const tee = teeOf(settings);
  const blocked = !rendered || rendered.missing.length > 0 || !isValidUrl(settings.url);

  const download = async () => {
    if (!rendered) return;
    setBusy(true);
    setError(null);
    try {
      saveBlob(
        await buildZip(settings, design, rendered, canonical, ui),
        `${zipName(settings)}.zip`,
      );
    } catch (error_) {
      setError(
        fill(t.download.failed, {
          error: error_ instanceof Error ? error_.message : String(error_),
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="step">
      <h2>{t.download.heading}</h2>
      {rendered && (
        <dl className="summary">
          <dt>{t.download.tee}</dt>
          <dd>
            <span className="swatch" style={{ background: tee.hex }} /> {tee.hex}
          </dd>
          <dt>{t.download.inks}</dt>
          <dd className="inks">
            {rendered.inks.map((ink) => (
              <span key={ink} className="ink">
                <span className="swatch" style={{ background: ink }} />
                {ink}
              </span>
            ))}
          </dd>
          <dt>{t.download.qr}</dt>
          <dd className="qr-target">{rendered.qrUrl}</dd>
        </dl>
      )}

      <h3>{t.download.files}</h3>
      <ul className="files">
        {t.download.fileList.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {rendered && rendered.missing.length > 0 && <p className="warning">{t.download.blocked}</p>}
      {error && <p className="warning">{error}</p>}

      <button
        type="button"
        className="button big"
        disabled={blocked || busy}
        onClick={() => void download()}
      >
        {busy ? t.download.busy : t.download.button}
      </button>
    </div>
  );
};
