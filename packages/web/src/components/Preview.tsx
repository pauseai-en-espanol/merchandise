import type { Rendered } from '@pauseai-es/merch-core';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Side } from '../assets';
import type { Strings } from '../i18n';

import { drawMockup } from '../raster';
import { type Settings, teeOf } from '../settings';

type View = 'mockup' | 'print';

/** Magnification of the inline zoom. */
const ZOOM = 2.5;
/** The mockup is drawn at twice the photo resolution so it stays sharp when zoomed. */
const MOCKUP_SCALE = 2;

interface Props {
  rendered: Rendered;
  settings: Settings;
  t: Strings;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Live preview with inline zoom, like product photos in a shop: with a mouse,
 * hovering magnifies the spot under the pointer; on touch screens a tap zooms
 * in at that spot, dragging moves around and another tap zooms back out.
 */
export const Preview = ({ rendered, settings, t }: Props) => {
  const [side, setSide] = useState<Side>('front');
  const [view, setView] = useState<View>('mockup');
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLButtonElement>(null);
  const pointer = useRef<string>('mouse');
  const [touch] = useState(() => globalThis.matchMedia?.('(pointer: coarse)').matches ?? false);
  const tee = useMemo(() => teeOf(settings), [settings]);
  const svg = side === 'front' ? rendered.front : rendered.back;

  useEffect(() => {
    if (view !== 'mockup' || !canvas.current) return;
    void drawMockup(canvas.current, tee, side, svg, MOCKUP_SCALE).catch((error: unknown) =>
      console.error(error),
    );
  }, [view, side, svg, tee]);

  const aim = (clientX: number, clientY: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setOrigin({
      x: clamp(((clientX - r.left) / r.width) * 100),
      y: clamp(((clientY - r.top) / r.height) * 100),
    });
  };

  const switchTo = (fn: () => void) => {
    setZoomed(false);
    fn();
  };

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
              onClick={() => switchTo(() => setSide(s))}
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
              onClick={() => switchTo(() => setView(v))}
            >
              {t.preview[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="preview-open">
        <button
          ref={frame}
          type="button"
          className={`zoom-frame${zoomed ? ' zoomed' : ''}`}
          aria-label={t.preview.zoom}
          aria-pressed={zoomed}
          onPointerDown={(e) => {
            pointer.current = e.pointerType;
          }}
          onPointerEnter={(e) => {
            if (e.pointerType !== 'mouse') return;
            aim(e.clientX, e.clientY);
            setZoomed(true);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse' || zoomed) aim(e.clientX, e.clientY);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setZoomed(false);
          }}
          onClick={(e) => {
            // Mouse zoom follows hover; taps and the keyboard toggle it.
            if (pointer.current === 'mouse' && e.detail > 0) return;
            if (e.detail > 0) aim(e.clientX, e.clientY);
            else setOrigin({ x: 50, y: 50 });
            setZoomed(!zoomed);
          }}
        >
          <span
            className="zoom-target"
            style={{
              transform: zoomed ? `scale(${ZOOM})` : undefined,
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
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
          </span>
        </button>
        {!zoomed && (
          <span className="zoom-badge" aria-hidden="true">
            {touch ? t.preview.zoomHintTouch : t.preview.zoomHint}
          </span>
        )}
      </div>
    </div>
  );
};
