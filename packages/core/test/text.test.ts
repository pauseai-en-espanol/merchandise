import { describe, expect, it } from 'vitest';

import { applyTextEdits, parseMarkup, readTextSlots } from '../src/index';
import { fonts, read } from './repo';

const askMe = read('designs/ask-me/es.orange.front.svg');

describe('text slots', () => {
  it('reads highlights as *markup*', () => {
    expect(readTextSlots(askMe).map((s) => s.markup)).toEqual([
      'Si te preocupa la *IA*',
      'y quieres hablar,',
      '*AQUÍ* ME TIENES.',
    ]);
  });

  it('reads plain tspans and small italic runs', () => {
    const slots = readTextSlots(read('designs/shoggoth-friendly-face/es.orange.front.svg'));
    expect(slots.map((s) => s.markup)).toContain('¿QUÉ HAY *TRAS*');
    const growth = readTextSlots(read('designs/exponential-growth/es.orange.front.svg'));
    expect(growth.some((s) => s.markup.includes('_(×5,1 al año'))).toBe(true);
  });

  it('parses markup into runs', () => {
    expect(parseMarkup('Si l’*IA* vous _inquiète_')).toEqual([
      { kind: 'plain', text: 'Si l’' },
      { kind: 'accent', text: 'IA' },
      { kind: 'plain', text: ' vous ' },
      { kind: 'secondary', text: 'inquiète' },
    ]);
  });

  it('returns the source untouched when nothing changed', () => {
    const { svg } = applyTextEdits(askMe, { 0: 'Si te preocupa la *IA*' }, fonts);
    expect(svg).toBe(askMe);
  });

  it('moves highlights and keeps the accent tspan', () => {
    const { reports, svg } = applyTextEdits(askMe, { 0: 'Si l’*IA* vous inquiète' }, fonts);
    expect(svg).toContain('Si l’<tspan class="accent" fill="#FFFFFF">IA</tspan> vous inquiète');
    expect(readTextSlots(svg)[0]?.markup).toBe('Si l’*IA* vous inquiète');
    expect(reports[0]?.scale).toBeGreaterThan(0.9);
  });

  it('shrinks text that would grow wider than the original', () => {
    const { reports, svg } = applyTextEdits(
      askMe,
      { 2: '*JE SUIS LÀ* POUR EN PARLER AVEC TOI, VRAIMENT.' },
      fonts,
    );
    expect(reports[2]?.scale).toBeLessThan(1);
    expect(svg).toMatch(/id="payoff"[^>]*font-size="[\d.]+"/);
  });

  it('reports characters the font cannot draw', () => {
    const { reports } = applyTextEdits(askMe, { 1: 'и хочешь поговорить' }, fonts);
    expect(reports[1]?.missing.length).toBeGreaterThan(0);
  });
});
