import { describe, expect, it } from 'vitest';

import { parseShareLink } from '../src/index';

describe('parseShareLink', () => {
  it('reads the design, text language, tee and length from the path', () => {
    expect(parseShareLink('/en/d/coxon-kill-us-all/es-white-short/', '')).toMatchObject({
      lang: 'es',
      short: true,
      slug: 'coxon-kill-us-all',
      tee: 'white',
      ui: 'en',
    });
  });

  it('reads the rest from the query', () => {
    const link = parseShareLink(
      '/d/hinton-tiger-cub/es-black/',
      '?tee=1f2a44&finish=tone&plain=1&logo=global&utm=0&t2=HOLA%20*MUNDO*&wordmark=X',
    );
    expect(link).toMatchObject({
      edits: { 2: 'HOLA *MUNDO*' },
      finish: 'tone',
      logo: 'global',
      plain: true,
      tee: '#1F2A44',
      tracking: false,
      wordmark: 'X',
    });
  });

  it('still reads the first links (lang and tee in the query)', () => {
    expect(parseShareLink('/d/coxon-kill-us-all/short/', '?lang=es&tee=white')).toMatchObject({
      lang: 'es',
      short: true,
      tee: 'white',
    });
  });

  it('caps what a link can carry', () => {
    const many = Array.from({ length: 100 }, (_, i) => `t${i}=${'x'.repeat(900)}`).join('&');
    const link = parseShareLink('/d/ask-me/es-orange/', `?${many}`);
    expect(Object.keys(link?.edits ?? {})).toHaveLength(60);
    expect(link?.edits[0]).toHaveLength(500);
  });

  it('is null for anything else', () => {
    expect(parseShareLink('/', '')).toBeNull();
    expect(parseShareLink('/d/../etc/passwd/', '')).toBeNull();
    expect(parseShareLink('/d/ask-me/xx-orange/', '')).toBeNull();
  });
});
