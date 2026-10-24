import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  AUTHORED_STYLE,
  fade,
  hasPortrait,
  INK,
  ORANGE,
  PORTRAIT_STYLES,
  portraitPreview,
  PRESET_TEES,
  render,
  RULES,
  swapPortrait,
  toneFor,
  WHITE,
} from '../src/index';
import { designSlugs, FAMILIES, fonts, read, ROOT } from './repo';

const tokens = JSON.parse(read('brand/tokens.json')) as {
  illustrationColors: Record<string, { hex: string }>;
};
const token = (name: string) => tokens.illustrationColors[name]?.hex;

/** Designs whose design.json names a portrait. */
const portraitDesigns = designSlugs()
  .map((slug) => ({
    portrait: (JSON.parse(read(`designs/${slug}/design.json`)) as { portrait?: { person: string } })
      .portrait,
    slug,
  }))
  .filter((d): d is { portrait: { person: string }; slug: string } => d.portrait !== undefined);

const base = {
  edits: {},
  families: Object.values(FAMILIES),
  fonts,
  tracking: false as const,
  url: 'https://pauseai.es',
  wordmark: 'PAUSEAI.ES',
};

describe('portrait tone', () => {
  it('is the brand token on each preset tee', () => {
    expect(toneFor(RULES.light, PRESET_TEES.white.hex)).toBe(token('portraitToneInk'));
    expect(toneFor(RULES.dark, PRESET_TEES.black.hex)).toBe(token('portraitToneWhite'));
    expect(toneFor(RULES.mid, PRESET_TEES.orange.hex)).toBe(token('portraitToneInkOnOrange'));
    expect(fade(ORANGE, PRESET_TEES.black.hex, 0.58)).toBe(token('portraitToneOrange'));
  });
});

describe('portrait designs', () => {
  it('exist, with a portrait slot in every canonical front', () => {
    expect(portraitDesigns.length).toBeGreaterThan(0);
    for (const { slug } of portraitDesigns) {
      for (const lang of ['es', 'en']) {
        expect(hasPortrait(read(`designs/${slug}/${lang}.orange.front.svg`))).toBe(true);
      }
    }
  });

  it.each(portraitDesigns)('$slug is authored with the $portrait.person lines', (d) => {
    // The generator skips loading the authored style, so it must be what the front holds.
    const paths = (svg: string) => svg.match(/<path\b[\s\S]*?\/>/g);
    const authored = read(`illustrations/portraits/${d.portrait.person}/${AUTHORED_STYLE}.svg`);
    for (const lang of ['es', 'en']) {
      const front = read(`designs/${d.slug}/${lang}.orange.front.svg`);
      expect(paths(swapPortrait(front, authored))).toEqual(paths(front));
    }
  });

  it.each(portraitDesigns)('$slug has every style of its portrait', ({ portrait }) => {
    for (const style of PORTRAIT_STYLES) {
      expect(
        existsSync(join(ROOT, `illustrations/portraits/${portrait.person}/${style}.svg`)),
      ).toBe(true);
    }
  });
});

describe('swapPortrait', () => {
  const { portrait, slug } = portraitDesigns[0] ?? { portrait: { person: '' }, slug: '' };
  const canonical = read(`designs/${slug}/es.orange.front.svg`);
  const source = (style: string) => read(`illustrations/portraits/${portrait.person}/${style}.svg`);
  const group = (svg: string) => /<g\b[^>]*\sid="portrait"[^>]*>/.exec(svg)?.[0];
  const outsidePortrait = (svg: string) => svg.replace(/<g\b[^>]*\sid="portrait"[\s\S]*?<\/g>/, '');

  it('keeps the placement and everything outside the portrait', () => {
    for (const style of PORTRAIT_STYLES) {
      const out = swapPortrait(canonical, source(style));
      expect(group(out)).toBe(group(canonical));
      expect(outsidePortrait(out)).toBe(outsidePortrait(canonical));
    }
  });

  it('prints the tone as a second ink, faded toward the tee', () => {
    for (const [tee, rule] of [
      ['orange', RULES.mid],
      ['white', RULES.light],
      ['black', RULES.dark],
    ] as const) {
      const out = render({
        ...base,
        canonical,
        family: FAMILIES.es,
        portrait: source('tone'),
        tee: { hex: PRESET_TEES[tee].hex, preset: tee },
      });
      const tone = toneFor(rule, PRESET_TEES[tee].hex);
      expect(out.inks).toContain(tone);
      // The authored grey only survives where it is the right tone (the white tee).
      if (tone !== '#9B9B9B') expect(out.front).not.toContain('#9B9B9B');
    }
  });

  it('prints the halftone in one ink, like the lines', () => {
    const out = render({
      ...base,
      canonical,
      family: FAMILIES.es,
      portrait: source('halftone'),
      tee: { hex: PRESET_TEES.black.hex, preset: 'black' },
    });
    expect(out.inks.toSorted()).toEqual([ORANGE, WHITE]);
    expect(out.front).not.toContain(INK);
  });
});

describe('portraitPreview', () => {
  const source = read('illustrations/portraits/hinton/tone.svg');

  it('crops a square around the face and paints the tone for the tee', () => {
    const out = portraitPreview(source, RULES.mid, PRESET_TEES.orange.hex, 0.5);
    const [, , w, h] = (/viewBox="([^"]+)"/.exec(out)?.[1] ?? '').split(' ').map(Number);
    expect(w).toBe(h);
    expect(out).toContain(`fill="${toneFor(RULES.mid, PRESET_TEES.orange.hex)}"`);
    expect(out).not.toContain('#9B9B9B');
  });

  it('draws the lines in the body colour of the rule', () => {
    const out = portraitPreview(source, RULES.dark, PRESET_TEES.black.hex);
    expect(out).toContain(`fill="${WHITE}"`);
    expect(out).not.toContain(`fill="${INK}"`);
  });
});
