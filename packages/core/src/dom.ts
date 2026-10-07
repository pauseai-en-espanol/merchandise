import { DOMParser, type Element, type Node, XMLSerializer } from '@xmldom/xmldom';

export type { Element, Node };

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;

export const parseSvg = (svg: string): Element => {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root) throw new Error('Not an SVG document');
  return root;
};

export const serialise = (node: Node): string => new XMLSerializer().serializeToString(node);

/** The document an element belongs to (always set for parsed elements). */
export const docOf = (el: Element) => {
  const doc = el.ownerDocument;
  if (!doc) throw new Error('Element without a document');
  return doc;
};

export const elementChildren = (el: Element): Element[] => {
  const out: Element[] = [];
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === ELEMENT_NODE) out.push(n as Element);
  }
  return out;
};

export const localName = (el: Element): string => el.localName ?? el.nodeName;

/** All `<text>` elements in document order. */
export const textElements = (root: Element): Element[] => {
  const out: Element[] = [];
  const walk = (el: Element) => {
    for (const child of elementChildren(el)) {
      if (localName(child) === 'text') out.push(child);
      else walk(child);
    }
  };
  walk(root);
  return out;
};

/** Presentation attributes that inherit down the tree and matter for text. */
export const INHERITED = [
  'dominant-baseline',
  'fill',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'text-anchor',
] as const;

export type Inherited = Partial<Record<(typeof INHERITED)[number], string>>;

/** Resolve an inheritable attribute on an element or its nearest ancestor. */
export const resolve = (el: Element, name: (typeof INHERITED)[number]): string | undefined => {
  for (
    let n: Element | null = el;
    n && n.nodeType === ELEMENT_NODE;
    n = n.parentNode as Element | null
  ) {
    const v = n.getAttribute(name);
    if (v !== null && v !== '') return v;
  }
  return undefined;
};

export const numberAttr = (value: string | undefined, fallback: number): number => {
  const m = value ? /-?[\d.]+/.exec(value) : null;
  return m ? Number(m[0]) : fallback;
};
