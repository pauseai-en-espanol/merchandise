import { strToU8, zipSync } from 'fflate';

import { REPO_URL } from './assets';
import { fill, type Strings } from './i18n';
import { LOGO_PNG_PX, logoPng } from './raster';

/**
 * The logos page: every lockup and mark of both families, straight from
 * brand/logos/, for anyone to download. Only the logos page imports this
 * module, so the files it adds load with that page, not with the generator.
 */

const files = import.meta.glob<string>('../../../brand/logos/*.svg', {
  eager: true,
  import: 'default',
  query: '?raw',
});

export type BrandVariant =
  'colour' | 'ink' | 'onDark' | 'onLight' | 'onOrange' | 'orange' | 'white';

export interface BrandLogo {
  /** File name of the download, without extension. */
  name: string;
  /** `data:` URL of the SVG, for the preview. */
  preview: string;
  /** Preview background: the kind of surface this version is made for. */
  surface: string;
  /** The SVG as downloaded. */
  svg: string;
  variant: BrandVariant;
}

export interface BrandFamily {
  id: 'es' | 'global';
  lockups: BrandLogo[];
  marks: BrandLogo[];
  name: string;
  prefix: string;
}

const SURFACE: Record<BrandVariant, string> = {
  colour: '#FFFFFF',
  ink: '#E9EAEC',
  onDark: '#111111',
  onLight: '#FFFFFF',
  onOrange: '#FF9416',
  // On black, so the cut-outs show: on white an orange mark looks like the full-colour one.
  orange: '#111111',
  white: '#1F3A5F',
};

/**
 * The committed file without its build notes, and with a size taken from its
 * viewBox when it has none (some apps place a size-less SVG at 100 × 100).
 * The artwork is untouched.
 */
const forDownload = (svg: string): string =>
  svg.replaceAll(/<!--[\s\S]*?-->\s*/g, '').replace(/<svg\b[^>]*>/, (root) => {
    if (/\swidth="/.test(root)) return root;
    const [, , w, h] = /viewBox="([^"]+)"/.exec(root)?.[1]?.split(/[\s,]+/) ?? [];
    return w && h ? root.replace('<svg', `<svg width="${w}" height="${h}"`) : root;
  });

const entry = (name: string, variant: BrandVariant): BrandLogo => {
  const raw = files[`../../../brand/logos/${name}.svg`];
  if (!raw) throw new Error(`Missing brand/logos/${name}.svg`);
  const svg = forDownload(raw);
  return {
    name,
    preview: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    surface: SURFACE[variant],
    svg,
    variant,
  };
};

const SINGLE_INKS = ['ink', 'white', 'orange'] as const;

const family = (id: BrandFamily['id'], name: string, prefix: string): BrandFamily => ({
  id,
  lockups: [
    entry(`${prefix}-on-light`, 'onLight'),
    entry(`${prefix}-on-orange`, 'onOrange'),
    entry(`${prefix}-on-dark`, 'onDark'),
    ...SINGLE_INKS.map((c) => entry(`${prefix}-mono-${c}`, c)),
  ],
  marks: [
    entry(`${prefix}-mark`, 'colour'),
    ...SINGLE_INKS.map((c) => entry(`${prefix}-mark-mono-${c}`, c)),
  ],
  name,
  prefix,
});

export const BRAND_FAMILIES: BrandFamily[] = [
  family('es', 'PauseAI en Español', 'pauseai-es'),
  family('global', 'PauseAI', 'pauseai-global'),
];

/** The text file that travels in the ZIP: formats, versions and how to use them. */
const readme = (f: BrandFamily, t: Strings['logos']): string => {
  const all = [...f.lockups, ...f.marks];
  const width = Math.max(...all.map((l) => l.name.length)) + 2;
  return [
    `${f.name} · ${t.title}`,
    `${t.readme.source}: ${REPO_URL}/tree/main/brand/logos`,
    '',
    t.readme.formats,
    `  svg/  ${t.readme.svg}`,
    `  png/  ${fill(t.readme.png, { px: LOGO_PNG_PX })}`,
    '',
    t.readme.versions,
    ...all.map((l) => {
      const v = t.variants[l.variant];
      return `  ${l.name.padEnd(width)}${v.name}. ${v.use}`;
    }),
    '',
    t.readme.rules,
    ...t.rules.map((rule) => `  - ${rule}`),
    '',
  ].join('\n');
};

/** One family's logos, SVG and PNG, with the readme. */
export const familyZip = async (f: BrandFamily, t: Strings['logos']): Promise<Blob> => {
  const all = [...f.lockups, ...f.marks];
  const pngs = await Promise.all(
    all.map(async (l) => new Uint8Array(await (await logoPng(l.svg)).arrayBuffer())),
  );
  const folder = `${f.prefix}-logos`;
  const zipped = zipSync({
    [`${folder}/${t.readme.file}`]: strToU8(readme(f, t)),
    ...Object.fromEntries(all.map((l) => [`${folder}/svg/${l.name}.svg`, strToU8(l.svg)])),
    // PNG is already compressed: store it as-is.
    ...Object.fromEntries(
      all.map((l, i) => [`${folder}/png/${l.name}.png`, [pngs[i] as Uint8Array, { level: 0 }]]),
    ),
  });
  return new Blob([zipped], { type: 'application/zip' });
};
