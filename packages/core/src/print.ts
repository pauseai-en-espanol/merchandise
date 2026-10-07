import type { FontBook } from './fonts';

import { docOf, type Element, elementChildren, parseSvg, serialise, SVG_NS } from './dom';
import { outlineInPlace } from './outline';

/** Chest print agreed with the printer: 24 × 24 cm. */
export const FRONT_MM = { height: 240, width: 240 } as const;
/** Upper-back print: 20 × 22 cm, the 200 mm back design at the top. */
export const BACK_MM = { height: 220, width: 200 } as const;

export interface PrintFile {
  /** Characters no font could draw (export should be blocked). */
  missing: string[];
  svg: string;
}

const setCanvas = (root: Element, size: { height: number; width: number }) => {
  root.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
  root.setAttribute('width', `${size.width}mm`);
  root.setAttribute('height', `${size.height}mm`);
};

/** Outlined front at 240 × 240 mm (200 mm designs scale by 1.2, as print-export.py does). */
export const printFront = (svg: string, fonts: FontBook): PrintFile => {
  const root = parseSvg(svg);
  const missing = outlineInPlace(root, fonts);
  const [, , width = 200] = (root.getAttribute('viewBox') ?? '0 0 200 200')
    .split(/\s+/)
    .map(Number);
  const scale = FRONT_MM.width / width;
  if (Math.abs(scale - 1) > 1e-4) {
    const group = docOf(root).createElementNS(SVG_NS, 'g');
    group.setAttribute('transform', `scale(${Math.round(scale * 1e4) / 1e4})`);
    for (const child of elementChildren(root)) {
      if ((child.localName ?? child.nodeName) === 'title') continue;
      group.appendChild(child);
    }
    root.appendChild(group);
  }
  setCanvas(root, FRONT_MM);
  return { missing, svg: serialise(root) };
};

/** Outlined back on a 200 × 220 mm canvas (content stays in the top 200 mm). */
export const printBack = (svg: string, fonts: FontBook): PrintFile => {
  const root = parseSvg(svg);
  const missing = outlineInPlace(root, fonts);
  setCanvas(root, BACK_MM);
  return { missing, svg: serialise(root) };
};

/** Every paint colour an SVG prints, upper-cased hex (masks excluded: they never print). */
export const paintColours = (svg: string): string[] => {
  const named: Record<string, string> = { black: '#000000', white: '#FFFFFF' };
  const out = new Set<string>();
  const printed = svg.replaceAll(/<mask\b[\s\S]*?<\/mask>/g, '');
  for (const m of printed.matchAll(/(?:fill|stroke|stop-color)="([^"]+)"/g)) {
    const v = (m[1] ?? '').trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(v)) out.add(v.toUpperCase());
    else if (named[v]) out.add(named[v]);
  }
  return [...out];
};
