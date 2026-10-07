import {
  docOf,
  type Element,
  ELEMENT_NODE,
  elementChildren,
  localName,
  type Node,
  numberAttr,
  parseSvg,
  resolve,
  serialise,
  TEXT_NODE,
  textElements,
} from './dom';
import { advance, type FontBook, missingGlyphs } from './fonts';

/**
 * Editable text. Every `<text>` in a design becomes one slot whose content is
 * written as a single line of markup:
 *
 *   plain words  *highlighted words*  _small italic words_
 *
 * `*…*` maps to the design's accent `<tspan class="accent">` and `_…_` to its
 * secondary (italic / smaller) tspan, so a translation can move or add
 * highlights without breaking the colour rules. A slot never grows wider than
 * the original: longer text shrinks to the original width.
 */

export type RunKind = 'accent' | 'plain' | 'secondary';

const MARKERS: Record<Exclude<RunKind, 'plain'>, string> = { accent: '*', secondary: '_' };

/** Below this shrink factor the UI warns that the text is too long to read well. */
export const SHRINK_WARNING = 0.75;

export interface TextSlot {
  /** Position among the design's `<text>` elements. */
  index: number;
  /** Run kinds this slot can express (for the editor's hints). */
  kinds: RunKind[];
  markup: string;
}

export interface SlotReport {
  index: number;
  /** Characters the font cannot draw. */
  missing: string[];
  /** 1 when the text fits; < 1 when it was shrunk to the original width. */
  scale: number;
}

interface Run {
  kind: RunKind;
  node: Node;
  text: string;
}

const hasAccent = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/).includes('accent');

const tspanKind = (el: Element): RunKind => {
  if (hasAccent(el)) return 'accent';
  if (el.getAttribute('font-style') || el.getAttribute('font-size')) return 'secondary';
  return 'plain';
};

const readRuns = (textEl: Element): Run[] => {
  const runs: Run[] = [];
  for (let n = textEl.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === TEXT_NODE) runs.push({ kind: 'plain', node: n, text: n.nodeValue ?? '' });
    else if (n.nodeType === ELEMENT_NODE && localName(n as Element) === 'tspan') {
      runs.push({ kind: tspanKind(n as Element), node: n, text: n.textContent ?? '' });
    }
  }
  return runs;
};

const collapse = (s: string) => s.replaceAll(/\s+/g, ' ');

const toMarkup = (runs: Run[]): string =>
  collapse(
    runs
      .map(({ kind, text }) =>
        kind === 'plain' ? text : `${MARKERS[kind]}${text}${MARKERS[kind]}`,
      )
      .join(''),
  ).trim();

/** Split markup into runs. Unclosed markers run to the end of the line. */
export const parseMarkup = (markup: string): { kind: RunKind; text: string }[] => {
  const out: { kind: RunKind; text: string }[] = [];
  let kind: RunKind = 'plain';
  let buf = '';
  const flush = () => {
    if (buf) out.push({ kind, text: buf });
    buf = '';
  };
  for (const ch of markup) {
    const toggles = (Object.entries(MARKERS) as [RunKind, string][]).find(([, m]) => m === ch)?.[0];
    if (toggles && (kind === 'plain' || kind === toggles)) {
      flush();
      kind = kind === toggles ? 'plain' : toggles;
    } else buf += ch;
  }
  flush();
  return out;
};

/** Read every text slot of a design. */
export const readTextSlots = (svg: string): TextSlot[] =>
  textElements(parseSvg(svg)).map((el, index) => {
    const runs = readRuns(el);
    const kinds = new Set<RunKind>(['plain', 'accent', ...runs.map((r) => r.kind)]);
    return { index, kinds: [...kinds], markup: toMarkup(runs) };
  });

const runElement = (run: Run, textEl: Element): Element =>
  run.node.nodeType === ELEMENT_NODE ? (run.node as Element) : textEl;

const runsWidth = (textEl: Element, fonts: FontBook): number =>
  readRuns(textEl).reduce((sum, run) => {
    const el = runElement(run, textEl);
    const size = numberAttr(resolve(el, 'font-size'), 12);
    return sum + advance(fonts.font(resolve(el, 'font-family')), collapse(run.text), size);
  }, 0);

const scaleFontSizes = (textEl: Element, factor: number) => {
  const round = (v: number) => String(Math.round(v * 100) / 100);
  textEl.setAttribute('font-size', round(numberAttr(resolve(textEl, 'font-size'), 12) * factor));
  for (const child of elementChildren(textEl)) {
    const size = child.getAttribute('font-size');
    if (size) child.setAttribute('font-size', round(numberAttr(size, 12) * factor));
  }
};

const rebuild = (textEl: Element, markup: string) => {
  const runs = readRuns(textEl);
  const template = (kind: RunKind) =>
    runs.find((r) => r.kind === kind && r.node.nodeType === ELEMENT_NODE)?.node as
      Element | undefined;
  const doc = docOf(textEl);
  const plain = template('plain');
  const made: Record<Exclude<RunKind, 'plain'>, () => Element> = {
    accent: () => {
      const t = doc.createElementNS(textEl.namespaceURI, 'tspan');
      t.setAttribute('class', 'accent');
      t.setAttribute('fill', '#FFFFFF');
      return t;
    },
    secondary: () => {
      const t = doc.createElementNS(textEl.namespaceURI, 'tspan');
      t.setAttribute('font-style', 'italic');
      t.setAttribute('font-size', String(numberAttr(resolve(textEl, 'font-size'), 12) * 0.78));
      return t;
    },
  };

  while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
  for (const seg of parseMarkup(markup)) {
    if (seg.kind === 'plain' && !plain) {
      textEl.appendChild(doc.createTextNode(seg.text));
      continue;
    }
    const proto = template(seg.kind);
    const tspan =
      seg.kind === 'plain'
        ? (plain?.cloneNode(false) as Element)
        : ((proto?.cloneNode(false) as Element | undefined) ?? made[seg.kind]());
    tspan.appendChild(doc.createTextNode(seg.text));
    textEl.appendChild(tspan);
  }
};

/**
 * Apply edited markup to a design's text slots. Slots whose markup is
 * unchanged are left byte-for-byte alone (the whole document is still
 * re-serialised). Longer text is shrunk to the original width.
 */
export const applyTextEdits = (
  svg: string,
  edits: Record<number, string>,
  fonts: FontBook,
): { reports: SlotReport[]; svg: string } => {
  const root = parseSvg(svg);
  const reports: SlotReport[] = [];
  let changed = false;
  textElements(root).forEach((el, index) => {
    const edit = edits[index];
    let scale = 1;
    if (edit !== undefined && collapse(edit).trim() !== toMarkup(readRuns(el))) {
      changed = true;
      const before = runsWidth(el, fonts);
      rebuild(el, collapse(edit).trim());
      const after = runsWidth(el, fonts);
      if (after > before * 1.001 && after > 0) {
        scale = before / after;
        scaleFontSizes(el, scale);
      }
    }
    const missing = readRuns(el).flatMap((run) =>
      missingGlyphs(fonts.font(resolve(runElement(run, el), 'font-family')), run.text),
    );
    reports.push({ index, missing: [...new Set(missing)], scale });
  });
  return { reports, svg: changed ? serialise(root) : svg };
};
