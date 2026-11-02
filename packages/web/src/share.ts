import {
  PRESET_TEES,
  type PresetTee,
  ruleFor,
  type RuleKey,
  wordmarkFor,
} from '@pauseai-es/merch-core';

import { designBySlug, familyById, type Lang, LANGS, NATIVE_FAMILY } from './assets';
import { LANG_PATH } from './i18n';
import { isShort, type Settings, teeOf } from './settings';

/**
 * Share links: the exact tee someone is designing, in a URL.
 *
 *   /d/<slug>/<lang>-<tee>[-short]/?<the rest>     (under /en/ on the English page)
 *
 * Link previews are read from the page's HTML without running it, so what a
 * preview can show goes in the path: the design, its text language, the tee
 * colour and whether it's the short variant. The build writes a page for each
 * of those, with the matching tee render as its preview image
 * (scripts/share-pages.ts). A custom colour has no render, so the path names
 * the preset tee printed with the same inks (see PREVIEW_TEE) and the colour
 * itself goes in the query. So does everything else, only where it differs
 * from what the design starts with:
 *
 *   tee       a custom colour, as six hex digits
 *   finish    portrait finish (halftone, tone)
 *   logo      logo family, when it isn't the text language's own
 *   url       the address the QR opens, when it isn't the logo family's site
 *   wordmark  the text under the QR, when edited by hand
 *   utm=0     no campaign tracking in the QR
 *   t<n>      edited text line n (the editor's markup)
 *
 * The address bar follows the tee as it's designed (App), so it always is
 * this link; opening one applies it (checked like stored settings). Links
 * from before the colour moved into the path (/d/<slug>/[short/]?lang=…&tee=…)
 * still open; their preview is the orange tee.
 */

const SHARE_PATH =
  /^(?:\/en)?\/d\/([a-z0-9-]+)\/(?:(short)\/|(es|en)-(orange|white|black)(-short)?\/)?$/;

const EDIT_PARAM = /^t(\d+)$/;

/** The preset tee that previews a custom colour: the one printed with the same inks. */
const PREVIEW_TEE: Record<RuleKey, PresetTee> = {
  dark: 'black',
  // Pale tees print all in ink: no preset does, white is the nearest.
  ink: 'white',
  light: 'white',
  mid: 'orange',
};

/** The tee a share link's preview shows. */
export const previewTee = (s: Settings): PresetTee =>
  s.teeChoice === 'custom' ? PREVIEW_TEE[ruleFor(teeOf(s)).key] : s.teeChoice;

/** The share link's path and query, on the page of interface language `ui`. */
export const sharePath = (s: Settings, ui: Lang): string => {
  const q = new URLSearchParams();
  if (s.teeChoice === 'custom') q.set('tee', s.customHex.slice(1).toLowerCase());
  if (designBySlug(s.slug).portrait && s.portraitStyle !== 'lines') {
    q.set('finish', s.portraitStyle);
  }
  if (s.familyId !== NATIVE_FAMILY[s.lang]) q.set('logo', s.familyId);
  if (s.url !== familyById(s.familyId).url) q.set('url', s.url);
  if (s.wordmarkEdited) q.set('wordmark', s.wordmark);
  if (!s.tracking) q.set('utm', '0');
  for (const [index, markup] of Object.entries(s.edits).toSorted(
    ([a], [b]) => Number(a) - Number(b),
  )) {
    q.set(`t${index}`, markup);
  }
  const preview = `${s.lang}-${previewTee(s)}${isShort(s) ? '-short' : ''}`;
  const query = q.toString();
  return `${LANG_PATH[ui]}d/${s.slug}/${preview}/${query ? `?${query}` : ''}`;
};

export const shareUrl = (s: Settings, ui: Lang, origin: string): string =>
  origin + sharePath(s, ui);

/**
 * The settings a share link describes, unchecked (pass them to
 * restoreSettings), or null if the address isn't one.
 */
export const readShareLink = (pathname: string, search: string): null | Record<string, unknown> => {
  const m = SHARE_PATH.exec(pathname);
  if (!m) return null;
  const [, slug, oldShort, pathLang, pathTee, pathShort] = m;
  const q = new URLSearchParams(search);
  const lang = LANGS.find((l) => l === (pathLang ?? q.get('lang')));
  const tee = q.get('tee') ?? pathTee ?? 'orange';
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
    short: oldShort !== undefined || pathShort !== undefined,
    slug,
    teeChoice: preset ? (tee as PresetTee) : 'custom',
    tracking: q.get('utm') !== '0',
    url,
    wordmark: wordmark ?? wordmarkFor(url),
    wordmarkEdited: wordmark !== null,
  };
};
