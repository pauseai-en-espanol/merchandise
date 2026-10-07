import type { Font } from 'opentype.js';

import {
  docOf,
  type Element,
  ELEMENT_NODE,
  localName,
  numberAttr,
  resolve,
  SVG_NS,
  TEXT_NODE,
  textElements,
} from './dom';
import { advance, type FontBook, ITALIC_SKEW_DEG, missingGlyphs } from './fonts';

/**
 * Replace every `<text>` with outlined `<path>`s so the printer needs no fonts.
 * TypeScript port of scripts/print-export.py, plus per-`<tspan>` font-size and
 * font-style (the Python exporter only honours a tspan's fill). Whitespace
 * follows SVG rendering: runs collapse to single spaces, ends are trimmed.
 */

interface PlacedRun {
  fill: string;
  font: Font;
  italic: boolean;
  size: number;
  text: string;
}

const fmt = (v: number) => String(Math.round(v * 1000) / 1000);

const collectRuns = (textEl: Element, fonts: FontBook): PlacedRun[] => {
  const runs: PlacedRun[] = [];
  const add = (owner: Element, text: string) => {
    if (!text) return;
    runs.push({
      fill: resolve(owner, 'fill') ?? '#000000',
      font: fonts.font(resolve(owner, 'font-family')),
      italic: resolve(owner, 'font-style') === 'italic',
      size: numberAttr(resolve(owner, 'font-size'), 12),
      text,
    });
  };
  for (let n = textEl.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === TEXT_NODE) add(textEl, n.nodeValue ?? '');
    else if (n.nodeType === ELEMENT_NODE && localName(n as Element) === 'tspan') {
      add(n as Element, n.textContent ?? '');
    }
  }
  // SVG whitespace rules: collapse runs, trim the ends of the line.
  let prevSpace = true;
  for (const run of runs) {
    let out = '';
    for (const ch of run.text.replaceAll(/\s/g, ' ')) {
      if (ch === ' ' && prevSpace) continue;
      out += ch;
      prevSpace = ch === ' ';
    }
    run.text = out;
  }
  const last = runs.findLast((r) => r.text !== '');
  if (last) last.text = last.text.replace(/ $/, '');
  return runs.filter((r) => r.text !== '');
};

const capHeight = (font: Font): number => {
  const os2 = (font.tables as { os2?: { sCapHeight?: number } }).os2;
  if (os2?.sCapHeight) return os2.sCapHeight;
  return font.charToGlyph('H').yMax ?? font.unitsPerEm * 0.7;
};

/** Outline all text in place. Returns the characters no font could draw. */
export const outlineInPlace = (root: Element, fonts: FontBook): string[] => {
  const missing = new Set<string>();
  const doc = docOf(root);

  for (const textEl of textElements(root)) {
    const runs = collectRuns(textEl, fonts);
    const parent = textEl.parentNode;
    if (!parent) continue;
    if (runs.length === 0) {
      parent.removeChild(textEl);
      continue;
    }

    const x = numberAttr(textEl.getAttribute('x') ?? undefined, 0);
    const y = numberAttr(textEl.getAttribute('y') ?? undefined, 0);
    const width = runs.reduce((w, r) => w + advance(r.font, r.text, r.size), 0);
    const anchor = resolve(textEl, 'text-anchor');
    let cursor = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;

    let baseline = y;
    const dominant = resolve(textEl, 'dominant-baseline');
    const first = runs[0];
    if (first && (dominant === 'central' || dominant === 'middle')) {
      baseline = y + (capHeight(first.font) * first.size) / first.font.unitsPerEm / 2;
    }

    const group = doc.createElementNS(SVG_NS, 'g');
    const transform = textEl.getAttribute('transform');
    if (transform) group.setAttribute('transform', transform);
    const id = textEl.getAttribute('id');
    if (id) group.setAttribute('id', id);

    for (const run of runs) {
      for (const ch of missingGlyphs(run.font, run.text)) missing.add(ch);
      let d = '';
      for (const ch of run.text) {
        const glyph = run.font.charToGlyph(ch);
        d += glyph.getPath(cursor, baseline, run.size).toPathData(3);
        cursor += ((glyph.advanceWidth ?? 0) * run.size) / run.font.unitsPerEm;
      }
      if (!d) continue;
      const path = doc.createElementNS(SVG_NS, 'path');
      path.setAttribute('fill', run.fill);
      path.setAttribute('d', d);
      if (run.italic) {
        path.setAttribute(
          'transform',
          `translate(0 ${fmt(baseline)}) skewX(${-ITALIC_SKEW_DEG}) translate(0 ${fmt(-baseline)})`,
        );
      }
      group.appendChild(path);
    }
    parent.replaceChild(group, textEl);
  }
  return [...missing];
};
