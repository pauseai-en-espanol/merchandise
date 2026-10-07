/**
 * Tee colour → print colours.
 *
 * The chapter's three tees each have a colour rule (see CLAUDE.md, "Multi-color
 * tee variants"). For any other tee colour the generator picks the rule whose
 * printed colours stand out best against it. When even the best rule is weak
 * (pale tees: yellow, pastels, light greys), everything prints in ink with the
 * single-ink logo. PauseAI orange is never swapped for another hue.
 */

export const ORANGE = '#FF9416';
export const WHITE = '#FFFFFF';
export const INK = '#111111';

/** Below this contrast a rule's colour counts as unreadable on the tee. */
export const WEAK_CONTRAST = 2;

export type RuleKey = 'dark' | 'ink' | 'light' | 'mid';

/** Which file of a logo family a rule prints (`pauseai-*-on-<variant>.svg`, `-mono-ink`). */
export type LogoVariant = 'dark' | 'light' | 'mono' | 'orange';

export interface ColourRule {
  /** Highlighted words, ticks, accent strokes (`class="accent"`, authored white). */
  accent: string;
  /** Text and borders (authored `#111111`). */
  body: string;
  key: RuleKey;
  logo: LogoVariant;
  /** Back QR and web address. */
  qr: string;
}

export const RULES: Record<RuleKey, ColourRule> = {
  // Today's orange tee: orange would vanish, so highlights and the logo mark go white.
  mid: { accent: WHITE, body: INK, key: 'mid', logo: 'orange', qr: INK },
  // Today's white tee.
  light: { accent: ORANGE, body: INK, key: 'light', logo: 'light', qr: INK },
  // Today's black tee.
  dark: { accent: ORANGE, body: WHITE, key: 'dark', logo: 'dark', qr: WHITE },
  // Pale tees, where neither orange nor white reads.
  ink: { accent: INK, body: INK, key: 'ink', logo: 'mono', qr: INK },
};

export const PRESET_TEES = {
  orange: { hex: ORANGE, rule: 'mid' },
  white: { hex: WHITE, rule: 'light' },
  black: { hex: '#1A1A1A', rule: 'dark' },
} as const satisfies Record<string, { hex: string; rule: RuleKey }>;

export type PresetTee = keyof typeof PRESET_TEES;

export type Tee = { hex: string; preset: null } | { hex: string; preset: PresetTee };

export const normaliseHex = (value: string): null | string => {
  const v = value.trim().replace(/^#?/, '#').toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(v)) return v;
  if (/^#[0-9A-F]{3}$/.test(v)) return `#${v.slice(1).replaceAll(/./g, '$&$&')}`;
  return null;
};

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.040_45 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance of a `#RRGGBB` colour. */
export const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};

/** WCAG contrast ratio between two `#RRGGBB` colours (1 to 21). */
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** Worst contrast of any colour a rule prints directly on the tee. */
export const ruleScore = (teeHex: string, key: RuleKey): number => {
  const { accent, body } = RULES[key];
  return Math.min(contrast(teeHex, body), contrast(teeHex, accent));
};

const CANDIDATES: RuleKey[] = ['light', 'mid', 'dark'];

/** Best of the three tee rules for a colour, ignoring the pale-tee fallback. */
export const bestTeeRule = (teeHex: string): RuleKey =>
  CANDIDATES.reduce((best, key) => (ruleScore(teeHex, key) > ruleScore(teeHex, best) ? key : best));

/** The rule the generator prints with. Preset tees keep today's rule exactly. */
export const ruleFor = (tee: Tee): ColourRule => {
  if (tee.preset) return RULES[PRESET_TEES[tee.preset].rule];
  const best = bestTeeRule(tee.hex);
  return RULES[ruleScore(tee.hex, best) < WEAK_CONTRAST ? 'ink' : best];
};

/** Distinct ink colours a front + back print needs on this tee (for the print sheet). */
export const inksFor = (rule: ColourRule, extra: string[] = []): string[] => [
  ...new Set([rule.body, rule.accent, rule.qr, ...extra].map((c) => c.toUpperCase())),
];
