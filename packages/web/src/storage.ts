import type { Lang } from './assets';
import type { Settings } from './settings';

/**
 * Choices survive a reload: interface language, step and every setting
 * (text edits included) live in this browser's localStorage. Storage can be
 * unavailable (private mode, blocked site data), so every access is guarded
 * and the app works without it.
 */

const KEY = 'pauseai-merch';
const VERSION = 1;

export interface Saved {
  settings?: unknown;
  step?: unknown;
  theme?: unknown;
  ui?: unknown;
}

export const loadSaved = (): Saved => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as { v?: unknown } & Saved;
    return data.v === VERSION ? data : {};
  } catch {
    return {};
  }
};

export type Theme = 'auto' | 'dark' | 'light';

export const THEMES: Theme[] = ['auto', 'light', 'dark'];

export const save = (data: { settings: Settings; step: number; theme: Theme; ui: Lang }) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...data }));
  } catch {
    // Storage full or blocked: the page keeps working, it just won't remember.
  }
};

export const clearSaved = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
};
