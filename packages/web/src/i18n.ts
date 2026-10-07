import type { RuleKey } from '@pauseai-es/merch-core';

import type { Lang } from './assets';

const es = {
  app: {
    footer: 'Diseños CC BY-SA 4.0 · Código MIT',
    intro:
      'Elige un diseño y el color de la camiseta, pon el logo y la web de tu grupo, ajusta el texto y descarga archivos listos para cualquier imprenta.',
    loading: 'Cargando…',
    reset: 'Empezar de nuevo',
    resetConfirm: '¿Borrar todas tus elecciones y textos y empezar de nuevo?',
    source: 'Código y diseños en GitHub',
    title: 'Camisetas PauseAI',
    uiLanguage: 'Idioma',
  },
  nav: { back: 'Atrás', next: 'Siguiente' },
  steps: ['Diseño y color', 'Logo y web', 'Texto', 'Descargar'],
  tee: {
    custom: 'Personalizado',
    customHint: 'Cualquier color vale: el diseño se adapta solo.',
    customLabel: 'Color personalizado',
    default: 'por defecto',
    design: 'Diseño',
    examples: 'Prueba:',
    heading: 'Color de la camiseta',
    hexLabel: 'Código hexadecimal',
    presets: { black: 'Negra', orange: 'Naranja', white: 'Blanca' },
    rules: {
      dark: 'Color oscuro: el texto va en blanco y los resaltados en naranja PauseAI.',
      ink: 'Color claro: ni el naranja ni el blanco destacarían, así que todo va en negro, con el logo a una tinta.',
      light: 'Color claro: el texto va en negro y los resaltados en naranja PauseAI.',
      mid: 'El naranja PauseAI no destacaría sobre este color, así que los resaltados y el logo van en blanco.',
    } satisfies Record<RuleKey, string>,
    sourced: 'Cita fuentes',
    textLanguage: 'Idioma del texto',
  },
  chapter: {
    logo: 'Logo',
    logoHint: 'Se imprime en el pecho y, en pequeño, en el centro del QR.',
    longUrl: 'Dirección larga: el QR sale más denso. Una URL corta se escanea mejor.',
    tracking: 'Añadir seguimiento de campaña al QR',
    trackingHint:
      'Añade utm_campaign=tshirt y el nombre del diseño, para saber cuánta gente llega desde las camisetas. No se ve en la camiseta.',
    url: 'Web',
    urlHint: 'El QR de la espalda abre esta dirección.',
    urlInvalid: 'Escribe una dirección completa, por ejemplo https://pauseai.es',
    wordmark: 'Texto bajo el QR',
    wordmarkReset: 'Usar la dirección de la web',
    wordmarkShrunk: 'Reducido al {pct} % para que quepa.',
  },
  text: {
    help: 'Traduce o adapta cada línea. Los *asteriscos* marcan las palabras resaltadas y los _guiones bajos_, el texto pequeño en cursiva.',
    line: 'Línea {n}',
    missing: 'La tipografía no tiene estos caracteres: {chars}',
    notes: 'Notas y fuentes del diseño',
    reset: 'Restaurar el original',
    shrunk: 'Reducido al {pct} % para que quepa en el mismo ancho.',
    sourced:
      'Este diseño cita a personas reales o datos. Traduce con fidelidad: sin parafrasear y sin cambiar ninguna cifra.',
    tooSmall: 'Reducido al {pct} %: puede leerse mal. Prueba un texto más corto.',
  },
  download: {
    blocked: 'Hay caracteres que la tipografía no puede imprimir. Corrígelos en el paso Texto.',
    button: 'Descargar ZIP',
    busy: 'Generando…',
    failed: 'No se pudo generar el ZIP: {error}',
    files: 'Qué incluye',
    fileList: [
      'front.svg y back.svg: archivos vectoriales con el texto convertido en trazos (imprenta, serigrafía)',
      'front.png y back.png: PNG transparentes a 300 ppp (impresión bajo demanda)',
      'Maquetas de la camiseta por delante y por detrás',
      'IMPRIMIR.txt: tamaños, colocación, tintas y créditos para la imprenta',
    ],
    heading: 'Archivos listos para imprimir',
    inks: 'Tintas',
    qr: 'El QR abre',
    tee: 'Camiseta',
  },
  preview: {
    back: 'Espalda',
    close: 'Cerrar',
    expand: 'Ampliar',
    fit: 'Ajustar',
    front: 'Pecho',
    mockup: 'En la camiseta',
    print: 'Archivo de impresión',
    zoomHint:
      'Doble clic, ⌘/Ctrl + rueda o las teclas + y − para hacer zoom. Arrastra para moverte.',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
  },
};

type Strings = typeof es;

const en: Strings = {
  app: {
    footer: 'Designs CC BY-SA 4.0 · Code MIT',
    intro:
      "Pick a design and a tee colour, add your group's logo and website, adjust the text, and download print-ready files for any print shop.",
    loading: 'Loading…',
    reset: 'Start over',
    resetConfirm: 'Clear all your choices and text and start over?',
    source: 'Code and designs on GitHub',
    title: 'PauseAI T-shirts',
    uiLanguage: 'Language',
  },
  nav: { back: 'Back', next: 'Next' },
  steps: ['Design and colour', 'Logo and website', 'Text', 'Download'],
  tee: {
    custom: 'Custom',
    customHint: 'Any colour works: the design adapts automatically.',
    customLabel: 'Custom colour',
    default: 'default',
    design: 'Design',
    examples: 'Try:',
    heading: 'Tee colour',
    hexLabel: 'Hex code',
    presets: { black: 'Black', orange: 'Orange', white: 'White' },
    rules: {
      dark: 'Dark colour: text prints white and highlights in PauseAI orange.',
      ink: 'Pale colour: neither orange nor white would stand out, so everything prints black, with the single-ink logo.',
      light: 'Light colour: text prints black and highlights in PauseAI orange.',
      mid: "PauseAI orange wouldn't stand out on this colour, so highlights and the logo print white.",
    },
    sourced: 'Cites sources',
    textLanguage: 'Text language',
  },
  chapter: {
    logo: 'Logo',
    logoHint: 'Printed on the chest and, small, in the centre of the QR.',
    longUrl: 'Long address: the QR gets denser. A short URL scans more reliably.',
    tracking: 'Add campaign tracking to the QR',
    trackingHint:
      "Adds utm_campaign=tshirt and the design's name, so you can see how many people arrive from the shirts. It isn't printed.",
    url: 'Website',
    urlHint: 'The QR on the back opens this address.',
    urlInvalid: 'Enter a full address, for example https://pauseai.info',
    wordmark: 'Text under the QR',
    wordmarkReset: "Use the website's address",
    wordmarkShrunk: 'Shrunk to {pct}% to fit.',
  },
  text: {
    help: 'Translate or adapt each line. *Asterisks* mark highlighted words and _underscores_ the small italic text.',
    line: 'Line {n}',
    missing: "The font can't print these characters: {chars}",
    notes: 'Design notes and sources',
    reset: 'Restore the original',
    shrunk: 'Shrunk to {pct}% to fit the same width.',
    sourced:
      'This design quotes real people or cites data. Translate faithfully: no paraphrasing, and keep every number.',
    tooSmall: 'Shrunk to {pct}%: it may be hard to read. Try shorter text.',
  },
  download: {
    blocked: "Some characters can't be printed with the font. Fix them in the Text step.",
    button: 'Download ZIP',
    busy: 'Generating…',
    failed: "Couldn't generate the ZIP: {error}",
    files: "What's included",
    fileList: [
      'front.svg and back.svg: vector files with text converted to outlines (print shops, screen printing)',
      'front.png and back.png: transparent 300 dpi PNGs (print-on-demand)',
      'Tee mockups, front and back',
      'PRINT.txt: sizes, placement, inks and credits for the printer',
    ],
    heading: 'Print-ready files',
    inks: 'Inks',
    qr: 'The QR opens',
    tee: 'Tee',
  },
  preview: {
    back: 'Back',
    close: 'Close',
    expand: 'Expand',
    fit: 'Fit',
    front: 'Front',
    mockup: 'On the tee',
    print: 'Print file',
    zoomHint: 'Double-click, ⌘/Ctrl + scroll or the + and − keys to zoom. Drag to move around.',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
  },
};

export const STRINGS: Record<Lang, Strings> = { en, es };

export type { Strings };

/** Fill `{name}` placeholders. */
export const fill = (template: string, values: Record<string, number | string>): string =>
  template.replaceAll(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export const initialUiLang = (): Lang =>
  navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
