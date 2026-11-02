import { parseShareLink } from '@pauseai-es/merch-core';
import jpeg from 'jpeg-js';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { imagePath, sharePage } from '../src/page';
import { PREVIEW, previewJpeg, resolveLink, type TeeState } from '../src/preview';
import { loadRepo } from '../src/repo';

const repo = loadRepo(join(import.meta.dirname, '..', '..', '..'));

const state = (path: string, search = ''): TeeState => {
  const link = parseShareLink(path, search);
  const resolved = link && resolveLink(repo, link);
  if (!resolved) throw new Error(`No tee for ${path}`);
  return resolved;
};

const pixel = (img: { data: Uint8Array; width: number }, x: number, y: number) => [
  ...img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 3),
];

describe('resolveLink', () => {
  it('falls back to what the design has', () => {
    // Not a short line in English for a design without one; an unknown finish; a bad colour.
    const s = state('/d/ask-me/en-orange-short/', '?finish=gold&tee=zzz&logo=nope');
    expect(s).toMatchObject({ familyId: 'global', finish: 'lines', lang: 'en', short: false });
    expect(s.tee.preset).toBe('orange');
  });

  it('is null for a design that does not exist', () => {
    const link = parseShareLink('/d/no-such-design/es-orange/', '');
    expect(link && resolveLink(repo, link)).toBeNull();
  });
});

describe('previewJpeg', () => {
  it('draws the tee as a 1200 × 630 JPEG', () => {
    const img = jpeg.decode(previewJpeg(repo, state('/d/coxon-kill-us-all/es-white-short/')), {
      useTArray: true,
    });
    expect([img.width, img.height]).toEqual([PREVIEW.width, PREVIEW.height]);
  });

  it('shows every option: the one-colour text changes the picture', () => {
    const highlighted = previewJpeg(repo, state('/d/coxon-kill-us-all/es-white-short/'));
    const plain = previewJpeg(repo, state('/d/coxon-kill-us-all/es-white-short/', '?plain=1'));
    expect(plain.equals(highlighted)).toBe(false);
  });

  it('tints the tee for a custom colour', () => {
    const img = jpeg.decode(previewJpeg(repo, state('/d/not-a-robot/es-black/', '?tee=1f8c3a')), {
      useTArray: true,
    });
    // The tee's body, left of the print: green dominates.
    const [r = 0, g = 0, b = 0] = pixel(img, 300, 300);
    expect(g).toBeGreaterThan(r + 40);
    expect(g).toBeGreaterThan(b + 40);
  });
});

describe('sharePage', () => {
  const base = `<html><head><title>Merchandising PauseAI</title>
    <meta name="description" content="x" />
    <link rel="icon" href="/i.svg" />
    <meta property="og:url" content="https://merch.example/" />
    <meta property="og:title" content="x" />
    <meta property="og:description" content="x" />
    <meta property="og:image" content="x" />
    <meta property="og:image:width" content="1" />
    <meta property="og:image:height" content="1" />
    <meta property="og:image:alt" content="x" />
    <meta name="twitter:title" content="x" />
    <meta name="twitter:description" content="x" />
    <meta name="twitter:image" content="x" /></head></html>`;

  it("names the tee and points at this tee's preview", () => {
    const search = '?plain=1&t0=%3Cb%3E"';
    const link = parseShareLink('/d/coxon-kill-us-all/es-white-short/', search);
    const s = state('/d/coxon-kill-us-all/es-white-short/', search);
    const html = sharePage(base, repo, s, link!, '/d/coxon-kill-us-all/es-white-short/', search);
    expect(imagePath(s, search)).toBe(`/preview/coxon-kill-us-all/es-white-short.jpg${search}`);
    expect(html).toContain(
      '<meta property="og:image" content="https://merch.example/preview/coxon-kill-us-all/es-white-short.jpg?plain=1&amp;t0=%3Cb%3E&quot;"',
    );
    expect(html).toContain(
      '<title>Coxon: matarnos a todos (frase corta) · Merchandising PauseAI</title>',
    );
    expect(html).toContain(
      'content="Coxon: matarnos a todos (frase corta), en una camiseta blanca."',
    );
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta name="robots" content="noindex" />');
  });
});
