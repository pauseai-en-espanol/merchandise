import { BACK_MM, FRONT_MM, readTextSlots, type Rendered } from '@pauseai-es/merch-core';
import { strToU8, zipSync } from 'fflate';

import { type Design, designNotesUrl, familyById, type Lang, REPO_URL } from './assets';
import { mockupJpeg, printPng } from './raster';
import { type Settings, teeOf } from './settings';

const SHEET = {
  en: {
    created: 'Created with the PauseAI T-shirt generator',
    credits: 'CREDITS AND LICENCE',
    creditsBody: (title: string, notes: string) =>
      [
        `Design "${title}" by PauseAI en Español, licensed CC BY-SA 4.0.`,
        `Design notes, sources for every quote and figure, and the original files:`,
        `  ${notes}`,
      ].join('\n'),
    custom: 'custom colour',
    files: 'PRINT FILES',
    filesBody: [
      'front.svg / back.svg  Vector, text converted to outlines: no fonts needed.',
      '                      Best for print shops and screen printing.',
      'front.png / back.png  Transparent PNG at 300 dpi, for print-on-demand services.',
      'mockup-*.jpg          How the tee should look. Not for printing.',
    ],
    front: (w: number, h: number) =>
      `Front (chest): ${w / 10} × ${h / 10} cm, centred. Position as in mockup-front.jpg.`,
    back: (w: number, h: number) =>
      `Back: ${w / 10} × ${h / 10} cm, centred on the upper back. Position as in mockup-back.jpg.`,
    inks: 'INKS',
    inksBody: (n: number) =>
      `${n} ${n === 1 ? 'colour' : 'colours'}, flat (no gradients). Match the hex values; no Pantone is specified.`,
    placement: 'SIZE AND PLACEMENT',
    qr: 'QR CODE (back)',
    qrBody: (url: string) => [`Opens: ${url}`, 'Scan the proof with a phone before the full run.'],
    tee: 'TEE',
    text: 'EDITED TEXT',
    title: 'Print instructions',
  },
  es: {
    created: 'Generado con el generador de camisetas de PauseAI',
    credits: 'CRÉDITOS Y LICENCIA',
    creditsBody: (title: string, notes: string) =>
      [
        `Diseño «${title}» de PauseAI en Español, con licencia CC BY-SA 4.0.`,
        'Notas del diseño, fuentes de cada cita y dato, y los archivos originales:',
        `  ${notes}`,
      ].join('\n'),
    custom: 'color personalizado',
    files: 'ARCHIVOS',
    filesBody: [
      'front.svg / back.svg  Vectoriales, con el texto convertido en trazos: no hacen falta fuentes.',
      '                      Lo mejor para imprentas y serigrafía.',
      'front.png / back.png  PNG transparente a 300 ppp, para servicios de impresión bajo demanda.',
      'mockup-*.jpg          Cómo debería quedar la camiseta. No son para imprimir.',
    ],
    front: (w: number, h: number) =>
      `Pecho: ${w / 10} × ${h / 10} cm, centrado. Colocación como en mockup-front.jpg.`,
    back: (w: number, h: number) =>
      `Espalda: ${w / 10} × ${h / 10} cm, centrado en la parte alta. Colocación como en mockup-back.jpg.`,
    inks: 'TINTAS',
    inksBody: (n: number) =>
      `${n} ${n === 1 ? 'color' : 'colores'} planos (sin degradados). Igualar los valores hexadecimales; no se especifica Pantone.`,
    placement: 'TAMAÑO Y COLOCACIÓN',
    qr: 'CÓDIGO QR (espalda)',
    qrBody: (url: string) => [
      `Abre: ${url}`,
      'Escanear la prueba con un móvil antes de la tirada completa.',
    ],
    tee: 'CAMISETA',
    text: 'TEXTO MODIFICADO',
    title: 'Instrucciones de impresión',
  },
} as const;

const PRESET_NAMES: Record<Lang, Record<string, string>> = {
  en: { black: 'Black', orange: 'Orange', white: 'White' },
  es: { black: 'Negra', orange: 'Naranja', white: 'Blanca' },
};

/** The plain-text sheet that travels with the files to the print shop. */
export const printSheet = (
  settings: Settings,
  design: Design,
  rendered: Rendered,
  canonical: string,
  ui: Lang,
): string => {
  const t = SHEET[ui];
  const tee = teeOf(settings);
  const teeName = tee.preset
    ? `${PRESET_NAMES[ui][tee.preset]} (${tee.hex})`
    : `${tee.hex} (${t.custom})`;
  const original = readTextSlots(canonical);
  const edited = Object.entries(settings.edits)
    .map(([i, markup]) => ({ markup, original: original[Number(i)]?.markup ?? '' }))
    .filter((e) => e.markup.trim() !== e.original);

  const lines = [
    `PauseAI · ${design.title[ui]} · ${t.title}`,
    `${t.created}: ${REPO_URL}`,
    '',
    t.tee,
    `  ${teeName}`,
    `  Logo: ${familyById(settings.familyId).name}`,
    '',
    t.files,
    ...t.filesBody.map((l) => `  ${l}`),
    '',
    t.placement,
    `  ${t.front(FRONT_MM.width, FRONT_MM.height)}`,
    `  ${t.back(BACK_MM.width, BACK_MM.height)}`,
    '',
    t.inks,
    `  ${t.inksBody(rendered.inks.length)}`,
    ...rendered.inks.map((ink) => `  · ${ink}`),
    '',
    t.qr,
    ...t.qrBody(rendered.qrUrl).map((l) => `  ${l}`),
    ...(edited.length > 0
      ? ['', t.text, ...edited.flatMap((e) => [`  - ${e.original}`, `  + ${e.markup}`])]
      : []),
    '',
    t.credits,
    t.creditsBody(design.title[ui], designNotesUrl(design.slug)),
    '',
  ];
  return lines.join('\n');
};

const bytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

export const zipName = (settings: Settings): string => {
  const tee = teeOf(settings);
  return `pauseai-${settings.slug}-${settings.lang}-${tee.preset ?? tee.hex.slice(1).toLowerCase()}`;
};

/** Build the ZIP with print files, PNGs, mockups and the print sheet. */
export const buildZip = async (
  settings: Settings,
  design: Design,
  rendered: Rendered,
  canonical: string,
  ui: Lang,
): Promise<Blob> => {
  const tee = teeOf(settings);
  const [frontPng, backPng, mockFront, mockBack] = await Promise.all([
    printPng(rendered.front, 'front'),
    printPng(rendered.back, 'back'),
    mockupJpeg(tee, 'front', rendered.front),
    mockupJpeg(tee, 'back', rendered.back),
  ]);
  const folder = zipName(settings);
  const sheetName = ui === 'es' ? 'IMPRIMIR.txt' : 'PRINT.txt';
  const files = {
    [`${folder}/${sheetName}`]: strToU8(printSheet(settings, design, rendered, canonical, ui)),
    [`${folder}/back.png`]: await bytes(backPng),
    [`${folder}/back.svg`]: strToU8(rendered.back),
    [`${folder}/front.png`]: await bytes(frontPng),
    [`${folder}/front.svg`]: strToU8(rendered.front),
    [`${folder}/mockup-back.jpg`]: await bytes(mockBack),
    [`${folder}/mockup-front.jpg`]: await bytes(mockFront),
    [`${folder}/settings.json`]: strToU8(
      `${JSON.stringify({ ...settings, qrUrl: rendered.qrUrl }, null, 2)}\n`,
    ),
  };
  // PNG and JPEG are already compressed: store them as-is.
  const zipped = zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, data]) => [
        name,
        [data, { level: /\.(?:png|jpg)$/.test(name) ? 0 : 6 }],
      ]),
    ),
  );
  return new Blob([zipped], { type: 'application/zip' });
};

export const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
