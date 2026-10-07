import { BACK_MM, FRONT_MM, type Tee } from '@pauseai-es/merch-core';

import { photoUrl, type Side } from './assets';

/** JHK TSRA 170 catalogue photos, 1242 × 1560 px; all six share the same framing. */
export const PHOTO = { height: 1560, width: 1242 } as const;

/** Print boxes in photo pixels (same as scripts/build-mockups.py). */
const PRINT_BOX: Record<Side, { w: number; x: number; y: number }> = {
  back: { w: 500, x: 370, y: 340 },
  front: { w: 500, x: 370, y: 380 },
};

const PRINT_MM: Record<Side, { height: number; width: number }> = {
  back: BACK_MM,
  front: FRONT_MM,
};

const images = new Map<string, Promise<HTMLImageElement>>();

const loadImage = (src: string): Promise<HTMLImageElement> => {
  let cached = images.get(src);
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
    images.set(src, cached);
  }
  return cached;
};

/**
 * Decode an SVG as an image at a given pixel size. The root width/height are
 * rewritten to that size first: some browsers rasterise an SVG image at its
 * intrinsic size (240 mm ≈ 907 px) and then scale it, which blurs large draws.
 */
const svgImage = async (svg: string, width: number, height: number): Promise<HTMLImageElement> => {
  const end = svg.indexOf('>', svg.indexOf('<svg'));
  const root = svg
    .slice(0, end)
    .replace(/\swidth="[^"]*"/, ` width="${width}"`)
    .replace(/\sheight="[^"]*"/, ` height="${height}"`);
  const sized = root + svg.slice(end);
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // Decoded images keep their pixels after the URL is revoked.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
};

const canvas2d = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  return { canvas, ctx };
};

const masks = new Map<Side, Promise<HTMLCanvasElement>>();

/**
 * Tee silhouette for custom colours, taken from the black-tee photo: the tee
 * is near-black on a white background, so darkness becomes opacity.
 */
const teeMask = (side: Side): Promise<HTMLCanvasElement> => {
  let cached = masks.get(side);
  if (!cached) {
    cached = loadImage(photoUrl('black', side)).then((img) => {
      const { canvas, ctx } = canvas2d(PHOTO.width, PHOTO.height);
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, PHOTO.width, PHOTO.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = 0.2126 * (px[i] ?? 0) + 0.7152 * (px[i + 1] ?? 0) + 0.0722 * (px[i + 2] ?? 0);
        px[i + 3] = Math.max(0, Math.min(255, ((235 - lum) * 255) / 175));
      }
      ctx.putImageData(data, 0, 0);
      return canvas;
    });
    masks.set(side, cached);
  }
  return cached;
};

/** Draw a tee photo in any colour: preset tees use their own photo, others tint the white one. */
const drawTee = async (ctx: CanvasRenderingContext2D, tee: Tee, side: Side) => {
  if (tee.preset) {
    ctx.drawImage(await loadImage(photoUrl(tee.preset, side)), 0, 0);
    return;
  }
  const [white, mask] = await Promise.all([loadImage(photoUrl('white', side)), teeMask(side)]);
  ctx.drawImage(white, 0, 0);
  const tint = canvas2d(PHOTO.width, PHOTO.height);
  tint.ctx.fillStyle = tee.hex;
  tint.ctx.fillRect(0, 0, PHOTO.width, PHOTO.height);
  tint.ctx.globalCompositeOperation = 'destination-in';
  tint.ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(tint.canvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
};

/**
 * Compose a print onto the tee photo. `scale` > 1 draws a larger canvas for
 * zooming: the photo is upscaled, the print stays sharp (it is vector).
 */
export const drawMockup = async (
  target: HTMLCanvasElement,
  tee: Tee,
  side: Side,
  printSvg: string,
  scale = 1,
) => {
  const box = PRINT_BOX[side];
  const mm = PRINT_MM[side];
  const printW = Math.round(box.w * scale);
  const printH = Math.round(((box.w * mm.height) / mm.width) * scale);
  const print = await svgImage(printSvg, printW, printH);

  const { canvas, ctx } = canvas2d(
    Math.round(PHOTO.width * scale),
    Math.round(PHOTO.height * scale),
  );
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);
  await drawTee(ctx, tee, side);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(print, Math.round(box.x * scale), Math.round(box.y * scale), printW, printH);

  target.width = canvas.width;
  target.height = canvas.height;
  target.getContext('2d')?.drawImage(canvas, 0, 0);
};

const DPI = 300;

/** Transparent PNG of a print file at 300 dpi, for print-on-demand shops. */
export const printPng = async (printSvg: string, side: Side): Promise<Blob> => {
  const mm = PRINT_MM[side];
  const px = (v: number) => Math.round((v / 25.4) * DPI);
  const { canvas, ctx } = canvas2d(px(mm.width), px(mm.height));
  ctx.drawImage(
    await svgImage(printSvg, canvas.width, canvas.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvasBlob(canvas);
};

export const canvasBlob = (
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      type,
      quality,
    );
  });

/** A fresh off-screen mockup for the download (JPEG: the photo compresses far better). */
export const mockupJpeg = async (tee: Tee, side: Side, printSvg: string): Promise<Blob> => {
  const { canvas } = canvas2d(PHOTO.width, PHOTO.height);
  await drawMockup(canvas, tee, side, printSvg);
  return canvasBlob(canvas, 'image/jpeg', 0.85);
};
