import { useState } from 'react';

import { BRAND_FAMILIES, type BrandFamily, type BrandLogo, familyZip } from '../brandLogos';
import { saveBlob } from '../download';
import { fill, type Strings } from '../i18n';
import { logoPng } from '../raster';

interface Props {
  onBack: () => void;
  t: Strings;
}

/** Every brand logo, both families, as SVG and PNG, one by one or per family in a ZIP. */
export const LogosPage = ({ onBack, t }: Props) => {
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<null | string>(null);

  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await task();
    } catch (error_) {
      setError(
        fill(t.logos.failed, { error: error_ instanceof Error ? error_.message : String(error_) }),
      );
    } finally {
      setBusy(null);
    }
  };

  const downloadSvg = (logo: BrandLogo) =>
    saveBlob(new Blob([logo.svg], { type: 'image/svg+xml' }), `${logo.name}.svg`);

  const downloadPng = (logo: BrandLogo) =>
    run(`${logo.name}.png`, async () => saveBlob(await logoPng(logo.svg), `${logo.name}.png`));

  const downloadZip = (family: BrandFamily) =>
    run(family.id, async () =>
      saveBlob(await familyZip(family, t.logos), `${family.prefix}-logos.zip`),
    );

  const card = (family: BrandFamily, logo: BrandLogo) => {
    const v = t.logos.variants[logo.variant];
    const label = `${family.name}, ${v.name}`;
    return (
      <li key={logo.name} className="logo-card">
        <span className="logo-art" style={{ background: logo.surface }}>
          <img src={logo.preview} alt={label} />
        </span>
        <span className="logo-caption">
          <strong>{v.name}</strong>
          <span className="hint">{v.use}</span>
        </span>
        <span className="row">
          <button
            type="button"
            className="button secondary small"
            aria-label={fill(t.logos.downloadAs, { format: 'SVG', name: label })}
            onClick={() => downloadSvg(logo)}
          >
            SVG
          </button>
          <button
            type="button"
            className="button secondary small"
            aria-label={fill(t.logos.downloadAs, { format: 'PNG', name: label })}
            disabled={busy !== null}
            onClick={() => void downloadPng(logo)}
          >
            {busy === `${logo.name}.png` ? '…' : 'PNG'}
          </button>
        </span>
      </li>
    );
  };

  return (
    <main id="logos" className="logos-page">
      <button type="button" className="link back-link" onClick={onBack}>
        ← {t.logos.back}
      </button>

      <section className="logos-intro">
        <h2>{t.logos.title}</h2>
        <p className="intro">{t.logos.intro}</p>
        <h3>{t.logos.rulesHeading}</h3>
        <ul className="files">
          {t.logos.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      {error && <p className="warning">{error}</p>}

      {BRAND_FAMILIES.map((family) => (
        <section key={family.id} className="logo-family" aria-labelledby={`logos-${family.id}`}>
          <div className="logo-family-head">
            <h2 id={`logos-${family.id}`}>{family.name}</h2>
            <button
              type="button"
              className="button small"
              disabled={busy !== null}
              onClick={() => void downloadZip(family)}
            >
              {busy === family.id ? t.logos.busy : t.logos.zip}
            </button>
          </div>
          <h3>{t.logos.lockups}</h3>
          <ul className="logo-grid">{family.lockups.map((logo) => card(family, logo))}</ul>
          <h3>{t.logos.marks}</h3>
          <ul className="logo-grid marks">{family.marks.map((logo) => card(family, logo))}</ul>
        </section>
      ))}
    </main>
  );
};
