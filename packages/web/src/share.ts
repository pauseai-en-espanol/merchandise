import { PRESET_TEES, type PresetTee, wordmarkFor } from '@pauseai-es/merch-core';

import { designBySlug, familyById, type Lang, LANGS, NATIVE_FAMILY } from './assets';
import { LANG_PATH } from './i18n';
import { isShort, type Settings } from './settings';

/**
 * Share links: the exact tee someone is designing, in a URL.
 *
 * The design goes in the path, /d/<slug>/ (/d/<slug>/short/ for its short
 * variant; under /en/ on the English page), because link previews are read
 * from the page's HTML without running it: the build writes one page per
 * design with its own title and tee render as the preview image (see
 * scripts/share-pages.ts). Everything else goes in the query, only where it
 * differs from what the design starts with:
 *
 *   lang      text language (always)
 *   tee       orange, white or black, or a custom colour as six hex digits
 *   finish    portrait finish (halftone, tone)
 *   logo      logo family, when it isn't the text language's own
 *   url       the address the QR opens, when it isn't the logo family's site
 *   wordmark  the text under the QR, when edited by hand
 *   utm=0     no campaign tracking in the QR
 *   t<n>      edited text line n (the editor's markup)
 *
 * Opening a link applies it (checked like stored settings) and moves the
 * address back to the plain page.
 */

const SHARE_PATH = /^(?:\/en)?\/d\/([a-z0-9-]+)\/(short\/)?$/;

const EDIT_PARAM = /^t(\d+)$/;

export const shareUrl = (s: Settings, ui: Lang, origin: string): string => {
  const q = new URLSearchParams({ lang: s.lang });
  q.set('tee', s.teeChoice === 'custom' ? s.customHex.slice(1).toLowerCase() : s.teeChoice);
  if (designBySlug(s.slug).portrait && s.portraitStyle !== 'lines')
    q.set('finish', s.portraitStyle);
  if (s.familyId !== NATIVE_FAMILY[s.lang]) q.set('logo', s.familyId);
  if (s.url !== familyById(s.familyId).url) q.set('url', s.url);
  if (s.wordmarkEdited) q.set('wordmark', s.wordmark);
  if (!s.tracking) q.set('utm', '0');
  for (const [index, markup] of Object.entries(s.edits).toSorted(
    ([a], [b]) => Number(a) - Number(b),
  )) {
    q.set(`t${index}`, markup);
  }
  return `${origin}${LANG_PATH[ui]}d/${s.slug}/${isShort(s) ? 'short/' : ''}?${q}`;
};

/** Whether this address is a share link. */
export const isShareLink = (pathname: string): boolean => SHARE_PATH.test(pathname);

/**
 * The settings a share link describes, unchecked (pass them to
 * restoreSettings), or null if the address isn't one.
 */
export const readShareLink = (pathname: string, search: string): null | Record<string, unknown> => {
  const m = SHARE_PATH.exec(pathname);
  if (!m) return null;
  const q = new URLSearchParams(search);
  const lang = LANGS.find((l) => l === q.get('lang'));
  const tee = q.get('tee') ?? 'orange';
  const preset = Object.hasOwn(PRESET_TEES, tee);
  const familyId = q.get('logo') ?? NATIVE_FAMILY[lang ?? 'es'];
  const url = q.get('url') ?? familyById(familyId).url;
  const wordmark = q.get('wordmark');
  const edits: Record<number, string> = {};
  for (const [key, value] of q) {
    const index = EDIT_PARAM.exec(key)?.[1];
    if (index !== undefined) edits[Number(index)] = value;
  }
  return {
    customHex: preset ? undefined : `#${tee}`,
    edits,
    familyId,
    lang,
    portraitStyle: q.get('finish') ?? 'lines',
    short: m[2] !== undefined,
    slug: m[1],
    teeChoice: preset ? (tee as PresetTee) : 'custom',
    tracking: q.get('utm') !== '0',
    url,
    wordmark: wordmark ?? wordmarkFor(url),
    wordmarkEdited: wordmark !== null,
  };
};
