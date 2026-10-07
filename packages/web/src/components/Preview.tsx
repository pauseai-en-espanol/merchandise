import type { Rendered } from '@pauseai-es/merch-core';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Side } from '../assets';
import type { Strings } from '../i18n';

import { drawMockup } from '../raster';
import { type Settings, teeOf } from '../settings';
import { type View, ZoomDialog } from './ZoomDialog';

interface Props {
  rendered: Rendered;
  settings: Settings;
  t: Strings;
}

export const Preview = ({ rendered, settings, t }: Props) => {
  const [side, setSide] = useState<Side>('front');
  const [view, setView] = useState<View>('mockup');
  const [expanded, setExpanded] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tee = useMemo(() => teeOf(settings), [settings]);
  const svg = side === 'front' ? rendered.front : rendered.back;

  useEffect(() => {
    if (view !== 'mockup' || !canvas.current) return;
    void drawMockup(canvas.current, tee, side, svg).catch((error: unknown) => console.error(error));
  }, [view, side, svg, tee]);

  return (
    <div className="preview-inner">
      <div className="tabs">
        <div className="chips" role="group">
          {(['front', 'back'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className="chip small"
              aria-pressed={side === s}
              onClick={() => setSide(s)}
            >
              {t.preview[s]}
            </button>
          ))}
        </div>
        <div className="chips" role="group">
          {(['mockup', 'print'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="chip small"
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {t.preview[v]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="preview-open"
        aria-label={t.preview.expand}
        onClick={() => setExpanded(true)}
      >
        {view === 'mockup' ? (
          <canvas ref={canvas} className="mockup" />
        ) : (
          <span
            className={`print ${side}`}
            style={{ background: tee.hex }}
            // Generated from repo SVGs; user text is escaped by the XML serialiser.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
        <span className="expand-badge" aria-hidden="true">
          ⤢ {t.preview.expand}
        </span>
      </button>

      <ZoomDialog
        open={expanded}
        rendered={rendered}
        setSide={setSide}
        setView={setView}
        side={side}
        t={t}
        tee={tee}
        view={view}
        onClose={() => setExpanded(false)}
      />
    </div>
  );
};
