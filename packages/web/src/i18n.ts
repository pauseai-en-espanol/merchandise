import type { Lang } from './assets';

const es = {
  app: {
    footer: 'Diseños CC BY-SA 4.0 · Código MIT',
    intro: 'Crea tu camiseta de PauseAI y descarga los archivos para imprimirla.',
    loading: 'Cargando…',
    reset: 'Empezar de nuevo',
    theme: 'Tema',
    themes: { auto: 'Automático', dark: 'Oscuro', light: 'Claro' },
    resetConfirm: '¿Borrar todas tus elecciones y textos y empezar de nuevo?',
    source: 'Código y diseños en GitHub',
    title: 'Merchandising PauseAI',
    uiLanguage: 'Idioma',
  },
  nav: { back: 'Atrás', next: 'Siguiente' },
  steps: ['Diseño y color', 'Logo y web', 'Texto', 'Descargar'],
  tee: {
    custom: 'Personalizado',
    customLabel: 'Color personalizado',
    default: 'por defecto',
    design: 'Diseño',
    examples: 'Prueba:',
    heading: 'Color de la camiseta',
    hexLabel: 'Código hexadecimal',
    presets: { black: 'Negra', orange: 'Naranja', white: 'Blanca' },
    paleNote:
      'En un color tan claro ni el naranja ni el blanco destacarían, así que todo se imprime en negro.',
    extraInk: '+1 tinta',
    finish: 'Acabado del retrato',
    portraitBy: 'dibujo de {by}',
    portraitDark:
      'En una camiseta oscura el retrato se imprime en negativo: las líneas salen claras y las sombras se leen como luces.',
    quote: 'Frase',
    sourced: 'Cita fuentes',
    sourcedLink: 'Cita fuentes: abre las notas y fuentes del diseño en una pestaña nueva',
    styles: {
      halftone: { name: 'Trama de puntos', note: 'Sombras con puntos' },
      lines: { name: 'Líneas', note: 'Solo el trazo' },
      tone: { name: 'Sombreado', note: 'Sombras en un tono' },
    },
    variantsTip: '{n} frases · {finish}',
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
  logos: {
    back: 'Volver al generador de camisetas',
    busy: 'Preparando…',
    downloadAs: 'Descargar {format}: {name}',
    failed: 'No se pudo preparar la descarga: {error}',
    intro:
      'Para webs, carteles, presentaciones y redes sociales. El SVG se amplía sin perder calidad y es el que suelen pedir las imprentas; el PNG, con fondo transparente, sirve para casi todo lo demás.',
    link: 'Logos',
    lockups: 'Logo completo',
    marks: 'Solo el símbolo',
    readme: {
      file: 'LEEME.txt',
      formats: 'FORMATOS',
      png: 'Fondo transparente, {px} px por el lado largo. Para webs, documentos y redes.',
      rules: 'CÓMO USARLOS',
      source: 'Originales',
      svg: 'Vectorial: se amplía sin perder calidad. Para imprentas, rótulos y diseño.',
      versions: 'VERSIONES',
    },
    rules: [
      'No los modifiques: ni colores, ni proporciones, ni letras.',
      'Deja alrededor un margen libre de al menos la altura de la P.',
      'Elige la versión según el fondo, para que el logo destaque.',
      'Impreso, que no mida menos de 2 cm de ancho.',
    ],
    rulesHeading: 'Cómo usarlos',
    title: 'Logos de PauseAI',
    variants: {
      colour: { name: 'A color', use: 'Avatares, iconos, pegatinas.' },
      ink: { name: 'Negro', use: 'Una sola tinta, sobre fondos pálidos.' },
      onDark: { name: 'Fondo oscuro', use: 'Sobre negro o colores oscuros.' },
      onLight: { name: 'Fondo claro', use: 'Sobre blanco o colores claros.' },
      onOrange: { name: 'Fondo naranja', use: 'Sobre el naranja de PauseAI.' },
      orange: { name: 'Naranja', use: 'Una sola tinta, en el naranja de PauseAI.' },
      white: { name: 'Blanco', use: 'Una sola tinta, sobre fondos oscuros, de color o fotos.' },
    },
    zip: 'Descargar todo (ZIP)',
  },
  preview: {
    back: 'Espalda',
    front: 'Pecho',
    mockup: 'En la camiseta',
    print: 'Archivo de impresión',
    zoom: 'Ampliar la vista previa',
    zoomHint: 'Pasa el ratón para ampliar',
    zoomHintTouch: 'Pellizca o toca dos veces para ampliar',
  },
};

type Strings = typeof es;

const en: Strings = {
  app: {
    footer: 'Designs CC BY-SA 4.0 · Code MIT',
    intro: 'Make your PauseAI t-shirt and download the files to print it.',
    loading: 'Loading…',
    reset: 'Start over',
    theme: 'Theme',
    themes: { auto: 'Automatic', dark: 'Dark', light: 'Light' },
    resetConfirm: 'Clear all your choices and text and start over?',
    source: 'Code and designs on GitHub',
    title: 'PauseAI Merchandise',
    uiLanguage: 'Language',
  },
  nav: { back: 'Back', next: 'Next' },
  steps: ['Design and colour', 'Logo and website', 'Text', 'Download'],
  tee: {
    custom: 'Custom',
    customLabel: 'Custom colour',
    default: 'default',
    design: 'Design',
    examples: 'Try:',
    heading: 'Tee colour',
    hexLabel: 'Hex code',
    presets: { black: 'Black', orange: 'Orange', white: 'White' },
    paleNote:
      'On a colour this pale neither orange nor white would stand out, so everything prints black.',
    extraInk: '+1 ink',
    finish: 'Portrait finish',
    portraitBy: 'drawn by {by}',
    portraitDark:
      'On a dark tee the portrait prints as a negative: the lines come out light and the shadows read as highlights.',
    quote: 'Quote',
    sourced: 'Cites sources',
    sourcedLink: 'Cites sources: opens the design notes and sources in a new tab',
    styles: {
      halftone: { name: 'Halftone', note: 'Shading as dots' },
      lines: { name: 'Lines', note: 'Line work only' },
      tone: { name: 'Tone', note: 'Shading in one tone' },
    },
    variantsTip: '{n} quotes · {finish}',
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
  logos: {
    back: 'Back to the t-shirt generator',
    busy: 'Preparing…',
    downloadAs: 'Download {format}: {name}',
    failed: "Couldn't prepare the download: {error}",
    intro:
      'For websites, posters, slides and social media. SVG scales without losing quality and is what print shops usually ask for; PNG, with a transparent background, covers almost everything else.',
    link: 'Logos',
    lockups: 'Full logo',
    marks: 'Symbol only',
    readme: {
      file: 'README.txt',
      formats: 'FORMATS',
      png: 'Transparent background, {px} px on the long side. For websites, documents and social media.',
      rules: 'HOW TO USE THEM',
      source: 'Originals',
      svg: 'Vector: scales without losing quality. For print shops, signs and design work.',
      versions: 'VERSIONS',
    },
    rules: [
      "Don't modify them: no new colours, proportions or lettering.",
      'Leave clear space around the logo of at least the height of the P.',
      'Pick the version that suits the background, so the logo stands out.',
      'In print, keep it at least 2 cm wide.',
    ],
    rulesHeading: 'How to use them',
    title: 'PauseAI logos',
    variants: {
      colour: { name: 'Full colour', use: 'Avatars, icons, stickers.' },
      ink: { name: 'Black', use: 'One ink, on pale backgrounds.' },
      onDark: { name: 'Dark background', use: 'On black or dark colours.' },
      onLight: { name: 'Light background', use: 'On white or light colours.' },
      onOrange: { name: 'Orange background', use: 'On PauseAI orange.' },
      orange: { name: 'Orange', use: 'One ink, in PauseAI orange.' },
      white: { name: 'White', use: 'One ink, on dark or coloured backgrounds and photos.' },
    },
    zip: 'Download all (ZIP)',
  },
  preview: {
    back: 'Back',
    front: 'Front',
    mockup: 'On the tee',
    print: 'Print file',
    zoom: 'Zoom the preview',
    zoomHint: 'Hover to zoom',
    zoomHintTouch: 'Pinch or double-tap to zoom',
  },
};

export const STRINGS: Record<Lang, Strings> = { en, es };

export type { Strings };

/** Fill `{name}` placeholders. */
export const fill = (template: string, values: Record<string, number | string>): string =>
  template.replaceAll(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export const browserLang = (): Lang =>
  navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';

/**
 * Each language has its own page: Spanish at /, English at /en/ (so shared
 * links preview in the right language). The page decides the interface
 * language.
 */
export const LANG_PATH: Record<Lang, string> = { en: '/en/', es: '/' };

export const pathLang = (): Lang => (/^\/en(?:\/|$)/.test(location.pathname) ? 'en' : 'es');

/**
 * Interface language on load. /en/ is always English. At /, a visitor who
 * chose English before, or a first-time visitor whose browser isn't in
 * Spanish, is moved to /en/ (without a reload).
 */
export const initialUiLang = (savedUi: unknown): Lang => {
  if (pathLang() === 'en') return 'en';
  const preferred = savedUi === 'en' || savedUi === 'es' ? savedUi : browserLang();
  if (preferred === 'en') history.replaceState(null, '', LANG_PATH.en + location.hash);
  return preferred;
};
