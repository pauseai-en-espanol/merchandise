import {
  type ColourRule,
  type LogoFamily,
  paintTone,
  type PortraitStyle,
  recolourFront,
  swapPortrait,
} from '@pauseai-es/merch-core';
import { useEffect, useState } from 'react';

import { FAMILIES, type Lang, loadFront, loadPortrait } from './assets';

/**
 * Thumbnails: design fronts as they print on the chosen tee (colour rule,
 * logo family, portrait finish), for the gallery and the option cards.
 */

/** A front to show: a design in a language, full or its short variant. */
export interface FrontRef {
  lang: Lang;
  short: boolean;
  slug: string;
}

export const frontKey = ({ lang, short, slug }: FrontRef) =>
  `${slug}/${lang}${short ? '/short' : ''}`;

/** These fronts' sources, keyed by frontKey: each loads once and stays. */
export const useFronts = (refs: FrontRef[]): Record<string, string> => {
  const [loaded, setLoaded] = useState<Record<string, string>>({});
  const wanted = refs.map(frontKey).toSorted().join('|');
  useEffect(() => {
    let alive = true;
    const missing = refs.filter((r) => !(frontKey(r) in loaded));
    if (missing.length === 0) return;
    void Promise.all(
      missing.map(async (r) => [frontKey(r), await loadFront(r.slug, r.lang, r.short)] as const),
    ).then((entries) => {
      if (alive) setLoaded((had) => ({ ...had, ...Object.fromEntries(entries) }));
    });
    return () => {
      alive = false;
    };
    // `wanted` names the refs; `loaded` only grows.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);
  return loaded;
};

/** A person's drawing in these finishes (the authored one is already in every front). */
export const usePortraits = (
  persons: string[],
  styles: readonly PortraitStyle[],
): Record<string, string> => {
  const [loaded, setLoaded] = useState<Record<string, string>>({});
  const wanted = persons
    .flatMap((p) => styles.map((s) => `${p}/${s}`))
    .toSorted()
    .join('|');
  useEffect(() => {
    let alive = true;
    const missing = wanted ? wanted.split('|').filter((key) => !(key in loaded)) : [];
    if (missing.length === 0) return;
    void Promise.all(
      missing.map(async (key) => {
        const [person, style] = key.split('/') as [string, PortraitStyle];
        return [key, await loadPortrait(person, style)] as const;
      }),
    ).then((entries) => {
      if (alive) setLoaded((had) => ({ ...had, ...Object.fromEntries(entries) }));
    });
    return () => {
      alive = false;
    };
    // `wanted` names the drawings; `loaded` only grows.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);
  return loaded;
};

/** A front as it prints on this tee, with the portrait in `finish` when given. */
export const thumbnail = (
  svg: string,
  look: { family: LogoFamily; rule: ColourRule; teeHex: string },
  finish?: string,
): string => {
  const front = recolourFront(finish ? swapPortrait(svg, finish) : svg, look.rule, {
    known: FAMILIES,
    use: look.family,
  });
  return finish ? paintTone(front, look.rule, look.teeHex) : front;
};

/** Thumbnails kept: enough for every option card and a few looks back. */
const KEPT = 48;
const kept = new Map<string, string>();

/**
 * make(), remembered under `key` (least recently used goes first). Recolouring
 * a front is the costly part of a thumbnail; `key` must name everything that
 * changes the result.
 */
export const remembered = (key: string, make: () => string): string => {
  const hit = kept.get(key);
  if (hit !== undefined) {
    kept.delete(key);
    kept.set(key, hit);
    return hit;
  }
  const value = make();
  kept.set(key, value);
  if (kept.size > KEPT) kept.delete(kept.keys().next().value ?? key);
  return value;
};
