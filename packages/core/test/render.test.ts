import { describe, expect, it } from 'vitest';

import { INK, type LogoFamily, ORANGE, recolourFront, render, RULES, WHITE } from '../src/index';
import { FAMILIES, fonts, read } from './repo';

const base = {
  canonical: read('designs/not-a-robot/es.orange.front.svg'),
  edits: {},
  family: FAMILIES.es,
  families: Object.values(FAMILIES),
  fonts,
  tracking: false as const,
  url: 'https://pauseai.es',
  wordmark: 'PAUSEAI.ES',
};

describe('render', () => {
  it('produces outlined print files at print size', () => {
    const out = render({ ...base, tee: { hex: ORANGE, preset: 'orange' } });
    expect(out.front).not.toContain('<text');
    expect(out.back).not.toContain('<text');
    expect(out.front).toContain('viewBox="0 0 240 240"');
    expect(out.back).toContain('viewBox="0 0 200 220"');
    expect(out.missing).toEqual([]);
  });

  it('prints pale tees all in ink with the single-ink logo', () => {
    const out = render({ ...base, tee: { hex: '#FFD100', preset: null } });
    expect(out.rule.key).toBe('ink');
    expect(out.inks).toEqual([INK]);
  });

  it('prints the QR mark in the back ink, cut-outs and all, without a mask', () => {
    for (const family of Object.values(FAMILIES)) {
      const out = render({ ...base, family, tee: { hex: '#1A1A1A', preset: 'black' } });
      const mark =
        /<svg x="[\d.]+" y="[\d.]+" width="\d+" height="\d+" viewBox="0 0 \d+ \d+">.*?<\/svg>/s.exec(
          out.back,
        )?.[0];
      expect(mark).toBeDefined();
      expect(out.back).not.toContain('<mask');
      expect(new Set(mark?.match(/fill="[^"]+"/g))).toEqual(new Set([`fill="${WHITE}"`]));
    }
  });

  it('lets a dark custom tee show through the global mark', () => {
    const out = render({ ...base, family: FAMILIES.global, tee: { hex: '#1F3A5F', preset: null } });
    expect(out.rule.key).toBe('dark');
    expect(out.inks.toSorted()).toEqual([ORANGE, WHITE]);
  });

  it('adds tracking to the QR only', () => {
    const out = render({
      ...base,
      tee: { hex: ORANGE, preset: 'orange' },
      tracking: { source: 'tee-no-soy-un-robot' },
    });
    expect(out.qrUrl).toBe(
      'https://pauseai.es/?utm_campaign=tshirt&utm_source=tee-no-soy-un-robot',
    );
  });

  it('shrinks a long web address to fit the back', () => {
    const out = render({
      ...base,
      tee: { hex: ORANGE, preset: 'orange' },
      wordmark: 'PAUSEAI-SOMEWHERE-WITH-A-VERY-LONG-NAME.ORG/CAMISETAS',
    });
    expect(out.wordmarkScale).toBeLessThan(1);
  });

  it('can print a design with the other logo family', () => {
    const out = render({
      ...base,
      family: FAMILIES.global,
      tee: { hex: ORANGE, preset: 'orange' },
    });
    expect(out.front).toContain('viewBox="33 0 1214 449"');
  });

  it('keeps the logo width when printing the other family', () => {
    const swap = (lang: 'en' | 'es', use: LogoFamily) =>
      /<svg x="25" y="([\d.]+)" width="150" height="([\d.]+)" viewBox="(?:0 0 3400 929|33 0 1214 449)">/.exec(
        recolourFront(read(`designs/not-a-robot/${lang}.orange.front.svg`), RULES.mid, {
          known: Object.values(FAMILIES),
          use,
        }),
      );
    // The global lockup grows to the en layout's box (y=8 h=55.48), centred on
    // the chapter's line, instead of shrinking into es's 150 × 41.
    expect(swap('es', FAMILIES.global)?.slice(1)).toEqual(['7.76', '55.48']);
    expect(swap('en', FAMILIES.es)?.slice(1)).toEqual(['15.25', '40.99']);
  });
});
