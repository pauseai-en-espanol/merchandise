import {
  parseShareLink,
  PRESET_TEES,
  type PresetTee,
  ruleFor,
  type RuleKey,
  wordmarkFor,
} from '@pauseai-es/merch-core';

import { designBySlug, familyById, type Lang, NATIVE_FAMILY } from './assets';
import { LANG_PATH } from './i18n';
import { isShort, type Settings, teeOf } from './settings';

/**
 * Share links: the exact tee someone is designing, in a URL. The format is in
 * @pauseai-es/merch-core (share.ts), which reads them for this app and for the
 * preview server (packages/preview); this module writes them and turns one
 * into settings.
 *
 * The address bar follows the tee as it's designed (App), so it always is
 * this link; opening one applies it (checked like stored settings). Link
 * previews show the exact tee, drawn by the preview server; if it's down,
 * nginx serves the build's static share pages (scripts/share-pages.ts), with
 * the design's render on the tee named in the path.
 */

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
  if (s.plain) q.set('plain', '1');
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
  const link = parseShareLink(pathname, search);
  if (!link) return null;
  const tee = link.tee ?? 'orange';
  const preset = Object.hasOwn(PRESET_TEES, tee);
  const familyId = link.logo ?? NATIVE_FAMILY[link.lang ?? 'es'];
  const url = link.url ?? familyById(familyId).url;
  return {
    customHex: preset ? undefined : tee,
    edits: link.edits,
    familyId,
    lang: link.lang,
    plain: link.plain,
    portraitStyle: link.finish ?? 'lines',
    short: link.short,
    slug: link.slug,
    teeChoice: preset ? (tee as PresetTee) : 'custom',
    tracking: link.tracking,
    url,
    wordmark: link.wordmark ?? wordmarkFor(url),
    wordmarkEdited: link.wordmark !== undefined,
  };
};
