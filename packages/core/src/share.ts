/**
 * Share links: the address of one exact tee, read by the web generator (which
 * also writes them, packages/web/src/share.ts) and by the preview server that
 * draws their link previews (packages/preview).
 *
 *   /d/<slug>/<lang>-<tee>[-short]/?<query>      (under /en/ on the English page)
 *
 * <lang> is the text language, <tee> orange, white or black (for a custom
 * colour, the preset printed with the same inks), -short the design's short
 * variant. The query carries the rest, only where it differs from what the
 * design starts with:
 *
 *   tee       a custom colour, as six hex digits
 *   finish    portrait finish (halftone, tone)
 *   plain=1   all the text in one colour (no highlights)
 *   logo      logo family, when it isn't the text language's own
 *   url       the address the QR opens, when it isn't the logo family's site
 *   wordmark  the text under the QR, when edited by hand
 *   utm=0     no campaign tracking in the QR
 *   t<n>      edited text line n (the editor's markup)
 *
 * Links from before the colour moved into the path (/d/<slug>/[short/] with
 * lang= and tee= in the query) still read.
 */

const SHARE_PATH =
  /^(\/en)?\/d\/([a-z0-9-]+)\/(?:(short)\/|(es|en)-(orange|white|black)(-short)?\/)?$/;

const EDIT_PARAM = /^t(\d+)$/;

/** Longest edited line a link may carry (the editor's lines are far shorter). */
const MAX_EDIT = 500;
/** Most edited lines a link may carry. */
const MAX_EDITS = 60;

export type ShareLang = 'en' | 'es';

/** A share link as written: unchecked against the designs (the reader does that). */
export interface ShareLink {
  /** Edited text lines (markup by slot index). */
  edits: Record<number, string>;
  /** Portrait finish, if given. */
  finish?: string;
  /** Text language, if given. */
  lang?: ShareLang;
  /** Logo family id, if given. */
  logo?: string;
  plain: boolean;
  short: boolean;
  slug: string;
  /** A preset name (orange, white, black) or a custom colour as #RRGGBB, if given. */
  tee?: string;
  tracking: boolean;
  /** The page's interface language: /en/… is English. */
  ui: ShareLang;
  url?: string;
  wordmark?: string;
}

const isLang = (v: null | string | undefined): v is ShareLang => v === 'es' || v === 'en';

/** Read a share link, or null if the path isn't one. */
export const parseShareLink = (pathname: string, search: string): null | ShareLink => {
  const m = SHARE_PATH.exec(pathname);
  if (!m) return null;
  const [, en, slug = '', oldShort, pathLang, pathTee, pathShort] = m;
  const q = new URLSearchParams(search);
  const lang = pathLang ?? q.get('lang');
  const tee = q.get('tee') ?? pathTee;
  const edits: Record<number, string> = {};
  let count = 0;
  for (const [key, value] of q) {
    const index = EDIT_PARAM.exec(key)?.[1];
    if (index === undefined || count >= MAX_EDITS) continue;
    edits[Number(index)] = value.slice(0, MAX_EDIT);
    count += 1;
  }
  return {
    edits,
    finish: q.get('finish') ?? undefined,
    lang: isLang(lang) ? lang : undefined,
    logo: q.get('logo') ?? undefined,
    plain: q.get('plain') === '1',
    short: oldShort !== undefined || pathShort !== undefined,
    slug,
    tee: tee && /^[0-9a-f]{6}$/i.test(tee) ? `#${tee.toUpperCase()}` : (tee ?? undefined),
    tracking: q.get('utm') !== '0',
    ui: en ? 'en' : 'es',
    url: q.get('url') ?? undefined,
    wordmark: q.get('wordmark') ?? undefined,
  };
};
