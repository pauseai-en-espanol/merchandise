import type { Rendered, Tee } from '@pauseai-es/merch-core';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { Side } from '../assets';
import type { Strings } from '../i18n';

import { drawMockup, PHOTO } from '../raster';

export type View = 'mockup' | 'print';

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const STEP = 1.5;
/** Mockup canvas resolution in the zoom view (photo pixels × this). */
const MOCKUP_SCALE = 2;
const PADDING = 24;

const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

interface Props {
  onClose: () => void;
  open: boolean;
  rendered: Rendered;
  setSide: (side: Side) => void;
  setView: (view: View) => void;
  side: Side;
  t: Strings;
  tee: Tee;
  view: View;
}

/**
 * Full-screen preview. Zoom 1 fits the view to the screen; buttons, double
 * click, ⌘/Ctrl + wheel and +/−/0 zoom around a point, dragging pans.
 */
export const ZoomDialog = ({
  onClose,
  open,
  rendered,
  setSide,
  setView,
  side,
  t,
  tee,
  view,
}: Props) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(0);
  const anchor = useRef<{ rx: number; ry: number; x: number; y: number } | null>(null);
  const drag = useRef<{ left: number; top: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const svg = side === 'front' ? rendered.front : rendered.back;
  const aspect = view === 'mockup' ? PHOTO.width / PHOTO.height : side === 'front' ? 1 : 200 / 220;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Fit the view to the stage, and keep it fitted when the window resizes.
  useEffect(() => {
    const el = stage.current;
    if (!open || !el) return;
    const measure = () => {
      const w = el.clientWidth - PADDING * 2;
      const h = el.clientHeight - PADDING * 2;
      setFitWidth(Math.max(100, Math.min(w, h * aspect)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, aspect]);

  useEffect(() => {
    if (!open || view !== 'mockup' || !canvas.current) return;
    void drawMockup(canvas.current, tee, side, svg, MOCKUP_SCALE).catch((error: unknown) =>
      console.error(error),
    );
  }, [open, view, side, svg, tee]);

  /** Zoom, keeping the content point under (x, y) — stage client coords — in place. */
  const zoomTo = useCallback((next: number, at?: { x: number; y: number }) => {
    const st = stage.current;
    const ct = content.current;
    if (!st || !ct) return;
    const s = st.getBoundingClientRect();
    const c = ct.getBoundingClientRect();
    const x = at?.x ?? s.left + s.width / 2;
    const y = at?.y ?? s.top + s.height / 2;
    anchor.current = {
      rx: (x - c.left) / c.width,
      ry: (y - c.top) / c.height,
      x: x - s.left,
      y: y - s.top,
    };
    setZoom(clamp(next));
  }, []);

  useLayoutEffect(() => {
    const st = stage.current;
    const ct = content.current;
    const a = anchor.current;
    if (!st || !ct || !a) return;
    anchor.current = null;
    st.scrollLeft = ct.offsetLeft + a.rx * ct.offsetWidth - a.x;
    st.scrollTop = ct.offsetTop + a.ry * ct.offsetHeight - a.y;
  }, [zoom]);

  // Each opening, side or view starts fitted.
  const viewKey = `${open}/${side}/${view}`;
  const [fittedFor, setFittedFor] = useState(viewKey);
  if (fittedFor !== viewKey) {
    setFittedFor(viewKey);
    setZoom(1);
  }

  // ⌘/Ctrl + wheel zooms at the pointer. Native listener: React's wheel
  // handlers are passive and could not stop the page from zooming.
  const zoomRef = useRef(zoom);
  useLayoutEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    const el = stage.current;
    if (!open || !el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomTo(zoomRef.current * Math.exp(-e.deltaY / 300), { x: e.clientX, y: e.clientY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open, zoomTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') zoomTo(zoom * STEP);
    else if (e.key === '-') zoomTo(zoom / STEP);
    else if (e.key === '0') zoomTo(1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const st = stage.current;
    if (!st || e.button !== 0) return;
    drag.current = { left: st.scrollLeft, top: st.scrollTop, x: e.clientX, y: e.clientY };
    st.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = stage.current;
    const d = drag.current;
    if (!st || !d) return;
    st.scrollLeft = d.left - (e.clientX - d.x);
    st.scrollTop = d.top - (e.clientY - d.y);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    // The dialog handles Escape itself; the keys below only zoom.
    <dialog
      ref={dialog}
      className="zoom-dialog"
      aria-label={t.preview.expand}
      onClose={onClose}
      onKeyDown={onKeyDown}
    >
      <div className="zoom-bar">
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
        <div className="zoom-controls">
          <button
            type="button"
            className="chip small"
            aria-label={t.preview.zoomOut}
            disabled={zoom <= MIN_ZOOM}
            onClick={() => zoomTo(zoom / STEP)}
          >
            −
          </button>
          <span className="zoom-level" aria-live="polite">
            {Math.round(zoom * 100)} %
          </span>
          <button
            type="button"
            className="chip small"
            aria-label={t.preview.zoomIn}
            disabled={zoom >= MAX_ZOOM}
            onClick={() => zoomTo(zoom * STEP)}
          >
            +
          </button>
          <button
            type="button"
            className="chip small"
            disabled={zoom === 1}
            onClick={() => zoomTo(1)}
          >
            {t.preview.fit}
          </button>
          <button type="button" className="chip small" onClick={() => dialog.current?.close()}>
            {t.preview.close}
          </button>
        </div>
      </div>

      <div
        ref={stage}
        className={`zoom-stage${dragging ? ' dragging' : ''}`}
        onDoubleClick={(e) => zoomTo(zoom > 1 ? 1 : 3, { x: e.clientX, y: e.clientY })}
        onPointerCancel={endDrag}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
      >
        <div className="zoom-inner" style={{ padding: PADDING }}>
          <div ref={content} className="zoom-content" style={{ width: fitWidth * zoom }}>
            {view === 'mockup' ? (
              <canvas ref={canvas} className="mockup" />
            ) : (
              <div
                className={`print ${side}`}
                style={{ background: tee.hex }}
                // Generated from repo SVGs; user text is escaped by the XML serialiser.
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
          </div>
        </div>
      </div>
      <p className="zoom-hint">{t.preview.zoomHint}</p>
    </dialog>
  );
};
