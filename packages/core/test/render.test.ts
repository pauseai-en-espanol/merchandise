import { describe, expect, it } from 'vitest';

import { INK, ORANGE, render } from '../src/index';
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
});
