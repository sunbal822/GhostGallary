"""Cuts the reference ghost out of its background into a transparent sprite.
  python tools/make_phantom_from_reference.py reference.png static/img/phantom.png
Luminance -> alpha (the ghost glows on a dark scene), text/ruins/lantern masked out,
face holes kept opaque so the eyes stay hollow-black on any background, grey only."""
import sys, numpy as np, cv2
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_fill_holes, binary_closing, binary_dilation
src, dst = sys.argv[1], sys.argv[2]
rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W = rgb.shape[:2]; L = rgb.mean(2)
H -= 15; L = L[:H]                                    # drop the uniform bar at the bottom
K = 3                                                 # upscale factor
# --- what to ignore: caption text (top-left), ruins (left), lantern (right)
ig = np.zeros((H, W), np.float32); ig[:60, :110] = 1; ig[92:, :46] = 1; ig[160:, 396:] = 1
ig = gaussian_filter(ig, 4)
# --- face holes (eyes, nose) found at native res
m = gaussian_filter(L, 1) > 62
m = binary_closing(m, iterations=2); filled = binary_fill_holes(m)
holes = np.zeros_like(m); holes[22:95, 330:415] = (filled & ~m)[22:95, 330:415]
holes = binary_dilation(holes, iterations=1).astype(np.float32)
# --- alpha from luminance
a = np.clip((gaussian_filter(L, .8) - 56) / 150, 0, 1) ** .85 * (1 - ig)
a = np.maximum(a, holes * .97)
# --- upscale, pad with transparent margin, dissolve the tail at the left edge
big = lambda x: cv2.resize(x, (W * K, H * K), interpolation=cv2.INTER_CUBIC)
a, holes_b = big(a), big(holes)
a = gaussian_filter(a, 1.1); holes_b = np.clip(gaussian_filter(holes_b, 1.1) * 1.3, 0, 1)
pad = 60 * K
a = np.pad(a, ((pad // 2, pad), (pad, pad // 2))); holes_b = np.pad(holes_b, ((pad // 2, pad), (pad, pad // 2)))
h, w = a.shape; X = np.arange(w)[None, :]; Y = np.arange(h)[:, None]
edge = np.clip(np.minimum.reduce([X + 0 * Y, w - X + 0 * Y, Y + 0 * X, h - Y + 0 * X]) / (45 * K), 0, 1)
a = np.clip(a * edge, 0, 1)
col = 218 + 37 * np.clip(a * 1.4, 0, 1)               # near-white, neutral; shading lives in alpha
col = col * (1 - holes_b) + 8 * holes_b
out = np.dstack([col, col, col, a * 255]).astype(np.uint8)
ys, xs = np.where(out[..., 3] > 6); out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
Image.fromarray(out, 'RGBA').save(dst, optimize=True); print(out.shape[1], out.shape[0])
