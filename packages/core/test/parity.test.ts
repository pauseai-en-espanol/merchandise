import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { recolourFront, RULES } from '../src/index';
import { designSlugs, FAMILIES, read, ROOT } from './repo';

/**
 * The generator must print the preset tees exactly as the Python pipeline
 * does: recolouring each canonical front for the white and black tees has to
 * reproduce the committed `{lang}.{white,black}.front.svg`. Comments, titles
 * and whitespace are ignored (altman-end-of-the-world's own builder words them
 * per tee); every element, attribute and colour must match.
 */
const normalise = (svg: string) =>
  svg
    .replaceAll(/<!--[\s\S]*?-->/g, '')
    .replaceAll(/<title>[\s\S]*?<\/title>/g, '')
    .replaceAll(/>\s+</g, '><')
    .replaceAll(/\s+/g, ' ')
    .trim();
const cases = designSlugs().flatMap((slug) =>
  (['es', 'en'] as const).flatMap((lang) =>
    (['white', 'black'] as const)
      .filter((tee) => existsSync(join(ROOT, `designs/${slug}/${lang}.${tee}.front.svg`)))
      .map((tee) => ({ lang, slug, tee })),
  ),
);

describe('preset tees match the Python pipeline', () => {
  it.each(cases)('$slug $lang $tee', ({ lang, slug, tee }) => {
    const canonical = read(`designs/${slug}/${lang}.orange.front.svg`);
    const family = lang === 'es' ? FAMILIES.es : FAMILIES.global;
    const out = recolourFront(canonical, tee === 'white' ? RULES.light : RULES.dark, {
      known: Object.values(FAMILIES),
      use: family,
    });
    expect(normalise(out)).toBe(normalise(read(`designs/${slug}/${lang}.${tee}.front.svg`)));
  });

  it('leaves the orange tee untouched', () => {
    const canonical = read('designs/ask-me/es.orange.front.svg');
    expect(
      recolourFront(canonical, RULES.mid, { known: Object.values(FAMILIES), use: FAMILIES.es }),
    ).toBe(canonical);
  });
});
