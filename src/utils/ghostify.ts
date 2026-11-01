// Turns a photo into a translucent ghost figure, like the painted spirits at the table.
// 1) an open-weight segmentation model (runs in the browser) cuts the person out,
// 2) a canvas pass makes them pale, see-through and misty toward the bottom.
// If the model can't load (offline), a soft oval cut-out is used instead.

const FIGURE_HEIGHT = 520;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('image failed to load'));
    im.src = src;
  });
}

async function cutOut(src: string): Promise<HTMLCanvasElement> {
  const photo = await loadImage(src);
  const c = document.createElement('canvas');
  c.width = photo.naturalWidth;
  c.height = photo.naturalHeight;
  const ctx = c.getContext('2d')!;

  // a PNG that is already cut out (transparent corners) doesn't need the model
  ctx.drawImage(photo, 0, 0);
  const corners = [[0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1]];
  if (corners.every(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] < 20)) return c;
  ctx.clearRect(0, 0, c.width, c.height);

  try {
    const { removeBackground } = await import('@imgly/background-removal');
    const blob = await (await fetch(src)).blob();
    const out = await removeBackground(blob, { output: { format: 'image/png' } });
    const url = URL.createObjectURL(out);
    try {
      ctx.drawImage(await loadImage(url), 0, 0, c.width, c.height);
    } finally {
      URL.revokeObjectURL(url);
    }
    return c;
  } catch (err) {
    console.warn('Background removal unavailable, using a soft oval cut-out instead:', err);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(photo, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    const g = ctx.createRadialGradient(c.width / 2, c.height * 0.45, c.width * 0.12, c.width / 2, c.height * 0.5, c.width * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.65, 'rgba(0,0,0,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = 'source-over';
    return c;
  }
}

function alphaBounds(c: HTMLCanvasElement) {
  const { width: w, height: h } = c;
  const d = c.getContext('2d')!.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (d[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return { x: 0, y: 0, w, h };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** @param src a data URL or object URL of the photo. Returns a transparent PNG data URL of the ghost figure. */
export async function ghostify(src: string): Promise<string> {
  const cut = await cutOut(src);
  const b = alphaBounds(cut);

  const H = FIGURE_HEIGHT;
  const W = Math.max(60, Math.round((b.w / b.h) * H));
  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  const bctx = base.getContext('2d', { willReadFrequently: true })!;
  bctx.drawImage(cut, b.x, b.y, b.w, b.h, 0, 0, W, H);

  const img = bctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    const t = y / H;
    // solid for the upper body, then dissolving into mist
    const fade = t < 0.62 ? 1 : Math.max(0, 1 - Math.pow((t - 0.62) / 0.38, 1.4));
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = d[i + 3];
      if (a === 0) continue;
      const lum = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      // keep a muted trace of the real clothing colour, then wash it with pale ghost blue
      const r = lum + (d[i] - lum) * 0.5;
      const g = lum + (d[i + 1] - lum) * 0.5;
      const bl = lum + (d[i + 2] - lum) * 0.5;
      const lift = (v: number, tint: number) => Math.min(255, v * 1.05 + 22) * 0.72 + tint * 0.28;
      d[i] = lift(r, 200);
      d[i + 1] = lift(g, 214);
      d[i + 2] = lift(bl, 240);
      d[i + 3] = a * (0.5 + 0.38 * (lum / 255)) * fade;
    }
  }
  bctx.putImageData(img, 0, 0);

  // lower body: smoke from the Phantom, feathered at the top and sides
  const tailImg = await loadImage('/static/img/smoke_tail.png').catch(() => null);
  const tw = Math.round(W * 1.05);
  const th = Math.round(H * 0.5);
  const ty = Math.round(H * 0.6);
  const total = ty + th;
  const out = document.createElement('canvas');
  out.width = Math.max(W, tw);
  out.height = total;
  const octx = out.getContext('2d')!;
  if (tailImg) {
    const tc = document.createElement('canvas');
    tc.width = tw;
    tc.height = th;
    const tctx = tc.getContext('2d', { willReadFrequently: true })!;
    tctx.drawImage(tailImg, 0, 0, tw, th);
    const td = tctx.getImageData(0, 0, tw, th);
    for (let y = 0; y < th; y++) {
      const ramp = Math.pow(Math.min(1, y / (th * 0.5)), 2.2);
      for (let x = 0; x < tw; x++) {
        const side = Math.min(1, Math.min(x, tw - 1 - x) / (tw * 0.12));
        td.data[(y * tw + x) * 4 + 3] *= 0.8 * ramp * side;
      }
    }
    tctx.putImageData(td, 0, 0);
    octx.drawImage(tc, Math.round((out.width - tw) / 2), ty);
  }
  const bx = Math.round((out.width - W) / 2);
  // soft glow under the sharp figure
  octx.filter = 'blur(9px)';
  octx.globalAlpha = 0.5;
  octx.drawImage(base, bx, 0);
  octx.filter = 'none';
  octx.globalAlpha = 1;
  octx.drawImage(base, bx, 0);
  return out.toDataURL('image/png');
}
