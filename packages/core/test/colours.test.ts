import { describe, expect, it } from 'vitest';

import { contrast, normaliseHex, ORANGE, ruleFor, WHITE } from '../src/index';

const custom = (hex: string) => ruleFor({ hex, preset: null }).key;

describe('tee colour rules', () => {
  it('keeps the three preset tees on their own rule', () => {
    expect(ruleFor({ hex: ORANGE, preset: 'orange' }).key).toBe('mid');
    expect(ruleFor({ hex: WHITE, preset: 'white' }).key).toBe('light');
    expect(ruleFor({ hex: '#1A1A1A', preset: 'black' }).key).toBe('dark');
  });

  it('picks the same rules for the preset colours chosen as custom', () => {
    expect(custom(ORANGE)).toBe('mid');
    expect(custom(WHITE)).toBe('light');
    expect(custom('#1A1A1A')).toBe('dark');
  });

  it.each([
    ['#1F2A44', 'dark'], // navy
    ['#0B4F2C', 'dark'], // bottle green
    ['#4B2A7B', 'dark'], // purple
    ['#C8102E', 'mid'], // red
    ['#9E9E9E', 'mid'], // heather grey
    ['#1E8C3A', 'mid'], // kelly green
    ['#FFD100', 'ink'], // yellow
    ['#F4A6C0', 'ink'], // pink
    ['#9CC3E6', 'ink'], // light blue
  ])('%s → %s', (hex, key) => {
    expect(custom(hex)).toBe(key);
  });

  it('measures orange on white at the 2.2:1 the white tee already accepts', () => {
    expect(contrast(ORANGE, WHITE)).toBeCloseTo(2.2, 1);
  });

  it('normalises hex input', () => {
    expect(normaliseHex('ff9416')).toBe('#FF9416');
    expect(normaliseHex('#abc')).toBe('#AABBCC');
    expect(normaliseHex('orange')).toBeNull();
  });
});
