import type { Rendered } from '@pauseai-es/merch-core';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Side } from '../assets';
import type { Strings } from '../i18n';

import { drawMockup } from '../raster';
import { type Settings, teeOf } from '../settings';

type View = 'mockup' | 'print';

/** Magnification of the inline zoom (hover, keyboard and double-tap). */
const ZOOM = 2.5;
/** Largest pinch. */
const MAX_PINCH = 5;
/** Two taps this close in time (ms) and space (px) are a double-tap. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;
/** A touch that moves less than this (px) is a tap. */
const TAP_SLOP = 8;
/** The mockup is drawn at twice the photo resolution so it stays sharp when zoomed. */
const MOCKUP_SCALE = 2;

interface Props {
  rendered: Rendered;
  settings: Settings;
  t: Strings;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Touch zoom: scale and offset (px) of the picture inside its frame. */
interface Pinch {
  s: number;
  x: number;
  y: number;
}
interface Point {
  x: number;
  y: number;
}

const UNZOOMED: Pinch = { s: 1, x: 0, y: 0 };

/** Keep the picture covering the frame (no gaps at the edges). */
const fit = (v: Pinch, w: number, h: number): Pinch => {
  const s = Math.min(MAX_PINCH, Math.max(1, v.s));
  if (s <= 1.001) return UNZOOMED;
  return {
    s,
    x: Math.min(0, Math.max(w - s * w, v.x)),
    y: Math.min(0, Math.max(h - s * h, v.y)),
  };
};

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Live preview with inline zoom, like product photos in a shop: with a mouse,
 * hovering magnifies the spot under the pointer. On touch screens it takes the
 * usual gestures: pinch to zoom, drag to move around once zoomed, double-tap
 * to zoom in at a spot or back out; one finger scrolls the page otherwise.
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
  const [pinch, setPinch] = useState<Pinch>(UNZOOMED);
  const [gesturing, setGesturing] = useState(false);
  const pinchRef = useRef(pinch);
  /** Gestures read the zoom from the ref (current within one event), the view from state. */
  const applyPinch = (next: Pinch) => {
    pinchRef.current = next;
    setPinch(next);
  };
  /** Touches on the frame, in frame coordinates. */
  const touches = useRef(new Map<number, Point>());
  /** Where the current gesture started: the zoom then, and its fingers' midpoint and spread. */
  const gesture = useRef<{ at: Point; from: Pinch; spread: number } | null>(null);
  const travelled = useRef(0);
  const lastTap = useRef<{ at: Point; time: number } | null>(null);
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
    applyPinch(UNZOOMED);
    fn();
  };

  const local = (e: { clientX: number; clientY: number }): Point => {
    const r = frame.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };
  const size = () => {
    const r = frame.current?.getBoundingClientRect();
    return { h: r?.height ?? 1, w: r?.width ?? 1 };
  };

  /** (Re)start a gesture from the fingers now down: one pans, two pinch. */
  const regrip = () => {
    const [a, b] = [...touches.current.values()];
    gesture.current = a
      ? { at: b ? midpoint(a, b) : a, from: pinchRef.current, spread: b ? distance(a, b) : 0 }
      : null;
  };

  const onTouchDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    touches.current.set(e.pointerId, local(e));
    if (touches.current.size === 1) travelled.current = 0;
    setGesturing(true);
    regrip();
  };

  const onTouchMove = (e: React.PointerEvent) => {
    if (!touches.current.has(e.pointerId) || !gesture.current) return;
    const before = touches.current.get(e.pointerId) as Point;
    const now = local(e);
    touches.current.set(e.pointerId, now);
    travelled.current += distance(before, now);
    const { at, from, spread } = gesture.current;
    const [a, b] = [...touches.current.values()];
    const { h, w } = size();
    if (a && b && spread > 0) {
      // Keep the spot under the fingers' starting midpoint under their midpoint now.
      const mid = midpoint(a, b);
      const s = Math.min(MAX_PINCH, Math.max(1, (from.s * distance(a, b)) / spread));
      const spot = { x: (at.x - from.x) / from.s, y: (at.y - from.y) / from.s };
      applyPinch(fit({ s, x: mid.x - s * spot.x, y: mid.y - s * spot.y }, w, h));
    } else if (a && from.s > 1) {
      applyPinch(fit({ s: from.s, x: from.x + a.x - at.x, y: from.y + a.y - at.y }, w, h));
    }
  };

  const onTouchUp = (e: React.PointerEvent, cancelled: boolean) => {
    if (!touches.current.delete(e.pointerId)) return;
    if (touches.current.size > 0) {
      regrip();
      return;
    }
    gesture.current = null;
    setGesturing(false);
    if (cancelled || travelled.current > TAP_SLOP) return;
    const at = local(e);
    const last = lastTap.current;
    const now = e.timeStamp;
    if (last && now - last.time < DOUBLE_TAP_MS && distance(last.at, at) < DOUBLE_TAP_PX) {
      lastTap.current = null;
      const { h, w } = size();
      applyPinch(
        pinchRef.current.s > 1
          ? UNZOOMED
          : fit({ s: ZOOM, x: at.x - ZOOM * at.x, y: at.y - ZOOM * at.y }, w, h),
      );
    } else {
      lastTap.current = { at, time: now };
    }
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
          className={`zoom-frame${zoomed || pinch.s > 1 ? ' zoomed' : ''}`}
          aria-label={t.preview.zoom}
          aria-pressed={zoomed || pinch.s > 1}
          onPointerDown={(e) => {
            pointer.current = e.pointerType;
            if (e.pointerType !== 'mouse') onTouchDown(e);
          }}
          onPointerUp={(e) => {
            if (e.pointerType !== 'mouse') onTouchUp(e, false);
          }}
          onPointerCancel={(e) => {
            if (e.pointerType !== 'mouse') onTouchUp(e, true);
          }}
          onPointerEnter={(e) => {
            if (e.pointerType !== 'mouse') return;
            aim(e.clientX, e.clientY);
            setZoomed(true);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse') aim(e.clientX, e.clientY);
            else onTouchMove(e);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setZoomed(false);
          }}
          onClick={(e) => {
            // Mouse zoom follows hover and touch has its gestures; the keyboard toggles it.
            if (e.detail > 0) return;
            setOrigin({ x: 50, y: 50 });
            setZoomed(!zoomed);
          }}
        >
          <span
            className={`zoom-target${gesturing ? ' gesturing' : ''}`}
            style={
              pinch.s > 1
                ? {
                    transform: `translate(${pinch.x}px, ${pinch.y}px) scale(${pinch.s})`,
                    transformOrigin: '0 0',
                  }
                : {
                    transform: zoomed ? `scale(${ZOOM})` : undefined,
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                  }
            }
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
        {!zoomed && pinch.s <= 1 && (
          <span className="zoom-badge" aria-hidden="true">
            {touch ? t.preview.zoomHintTouch : t.preview.zoomHint}
          </span>
        )}
      </div>
    </div>
  );
};
