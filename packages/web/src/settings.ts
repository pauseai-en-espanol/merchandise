import {
  normaliseHex,
  PRESET_TEES,
  type PresetTee,
  type Tee,
  wordmarkFor,
} from '@pauseai-es/merch-core';

import { DESIGNS, FAMILIES, familyById, type Lang, LANGS, NATIVE_FAMILY } from './assets';

export type TeeChoice = 'custom' | PresetTee;

export interface Settings {
  customHex: string;
  /** Edited text slots, markup by slot index. */
  edits: Record<number, string>;
  familyId: string;
  /** Language of the design's text (the canonical it starts from). */
  lang: Lang;
  slug: string;
  teeChoice: TeeChoice;
  tracking: boolean;
  url: string;
  wordmark: string;
  /** Once edited by hand, the wordmark stops following the URL. */
  wordmarkEdited: boolean;
}

export const teeOf = (s: Settings): Tee =>
  s.teeChoice === 'custom'
    ? { hex: s.customHex, preset: null }
    : { hex: PRESET_TEES[s.teeChoice].hex, preset: s.teeChoice };

export const defaultSettings = (lang: Lang): Settings => {
  const family = familyById(NATIVE_FAMILY[lang]);
  return {
    customHex: '#1F2A44',
    edits: {},
    familyId: family.id,
    lang,
    slug: DESIGNS.find((d) => d.slug === 'ask-me')?.slug ?? DESIGNS[0]?.slug ?? '',
    teeChoice: 'orange',
    tracking: true,
    url: family.url,
    wordmark: wordmarkFor(family.url),
    wordmarkEdited: false,
  };
};

export const isValidUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

const TEE_CHOICES: TeeChoice[] = ['orange', 'white', 'black', 'custom'];

export const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

/**
 * Settings from storage, checked field by field: anything missing, stale (a
 * renamed design) or malformed falls back to the defaults.
 */
export const restoreSettings = (saved: unknown, fallback: Settings): Settings => {
  if (!saved || typeof saved !== 'object') return fallback;
  const s = saved as Record<string, unknown>;
  const design = DESIGNS.find((d) => d.slug === s.slug);
  if (!design) return fallback;
  const lang =
    isLang(s.lang) && design.langs.includes(s.lang) ? s.lang : (design.langs[0] ?? fallback.lang);
  const edits =
    s.edits &&
    typeof s.edits === 'object' &&
    Object.values(s.edits).every((v) => typeof v === 'string')
      ? (s.edits as Record<number, string>)
      : {};
  return {
    customHex: (typeof s.customHex === 'string' && normaliseHex(s.customHex)) || fallback.customHex,
    edits: lang === s.lang ? edits : {},
    familyId: FAMILIES.some((f) => f.id === s.familyId)
      ? (s.familyId as string)
      : fallback.familyId,
    lang,
    slug: design.slug,
    teeChoice: TEE_CHOICES.includes(s.teeChoice as TeeChoice)
      ? (s.teeChoice as TeeChoice)
      : fallback.teeChoice,
    tracking: typeof s.tracking === 'boolean' ? s.tracking : fallback.tracking,
    url: typeof s.url === 'string' ? s.url : fallback.url,
    wordmark: typeof s.wordmark === 'string' ? s.wordmark : fallback.wordmark,
    wordmarkEdited:
      typeof s.wordmarkEdited === 'boolean' ? s.wordmarkEdited : fallback.wordmarkEdited,
  };
};
