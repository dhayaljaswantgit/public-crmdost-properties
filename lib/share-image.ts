import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import { SHARE_IMAGE } from './seo';

/**
 * Server only (sharp, fs). Link-preview image (WhatsApp, Facebook, LinkedIn,
 * X): a photo cropped to 1200×630 on the fly, with the company logo on a small white card in the
 * corner when there is one.
 *
 * Output is JPEG: chat apps drop previews whose image is too heavy, and a
 * photo as PNG is several times the size. No text is drawn — the title and
 * description travel as meta tags beside the image, and the server image has
 * no fonts to draw them with.
 */

const FETCH_TIMEOUT_MS = 5000;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const FALLBACK_BANNER = path.join(process.cwd(), 'public', 'media', 'banner', '1.jpg');

async function fetchImage(url: string): Promise<Buffer | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: 'no-store' });
    if (!res.ok || !String(res.headers.get('content-type') || '').startsWith('image/')) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length && bytes.length <= MAX_SOURCE_BYTES ? bytes : null;
  } catch {
    return null;
  }
}

async function logoCard(logoUrl: string): Promise<{ input: Buffer; left: number; top: number } | null> {
  const bytes = await fetchImage(logoUrl);
  if (!bytes) return null;
  try {
    const pad = 18;
    const logo = await sharp(bytes).resize({ width: 220, height: 96, fit: 'inside' }).png().toBuffer();
    const { width = 0, height = 0 } = await sharp(logo).metadata();
    const cardW = width + pad * 2;
    const cardH = height + pad * 2;
    const card = await sharp({
      create: { width: cardW, height: cardH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([
        // Rounded corners: mask the white card with a rounded rectangle.
        {
          input: Buffer.from(`<svg width="${cardW}" height="${cardH}"><rect width="${cardW}" height="${cardH}" rx="16" ry="16"/></svg>`),
          blend: 'dest-in',
        },
        { input: logo, left: pad, top: pad },
      ])
      .png()
      .toBuffer();
    return { input: card, left: 40, top: SHARE_IMAGE.height - cardH - 40 };
  } catch {
    return null;
  }
}

export async function renderShareImage({ photoUrl, logoUrl }: { photoUrl?: string; logoUrl?: string }): Promise<Buffer> {
  const photo = (photoUrl && (await fetchImage(photoUrl))) || (await readFile(FALLBACK_BANNER));
  const { width, height } = SHARE_IMAGE;

  const layers: OverlayOptions[] = [
    // Soft shade at the bottom so the logo card reads on any photo.
    {
      input: Buffer.from(
        `<svg width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`,
      ),
    },
  ];
  const card = logoUrl ? await logoCard(logoUrl) : null;
  if (card) layers.push(card);

  return sharp(photo)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .composite(layers)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}
