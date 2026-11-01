"""Builds the Ghost Gallery homepage art from the original flattened hero painting.

  python tools/make_assets.py hero_flat.png static/img

Outputs (static/img):
  plate.jpg    monochrome haunted world, ALL ghosts/figures painted out
  phantom.png  the giant phantom, independent transparent sprite (RGBA, grey only)
  fog.png      tileable greyscale fog (alpha) used for drifting fog layers
"""
import sys, os, numpy as np, cv2
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, minimum_filter

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- plate
im = cv2.imread(src)
H, W = im.shape[:2]
g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255

def ell(cx, cy, rx, ry, feather=18):
    m = np.zeros((H, W), np.uint8)
    cv2.ellipse(m, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
    return gaussian_filter(m.astype(np.float32) / 255, feather)

# big phantom: replace with the dark sky estimate (local minimum, smoothed)
sky = gaussian_filter(minimum_filter(g, 41), 22) * 0.55
K = W / 1456.0                                   # masks were measured on a 1456px-wide preview
big = np.clip(ell(int(400*K), int(250*K), int(400*K), int(300*K), 40) + ell(int(300*K), int(120*K), int(340*K), int(160*K), 30), 0, 1)
big = np.clip(big + ell(int(660*K), int(110*K), int(130*K), int(140*K), 25), 0, 1)
big *= np.clip((int(930*K) - np.arange(W)) / (170 * K), 0, 1)[None, :]   # feathered, no hard seam
g = g * (1 - big) + sky * big

# the small ghosts, singer and princess: inpaint
hard = np.zeros((H, W), np.uint8)
for cx, cy, rx, ry in [(150, 290, 100, 105), (255, 462, 52, 58), (470, 595, 95, 75), (822, 182, 34, 32),
                       (1150, 458, 58, 52), (900, 472, 26, 36), (1150, 655, 95, 65), (1345, 365, 110, 125),
                       (1420, 255, 30, 30)]:
    cv2.ellipse(hard, (int(cx*K), int(cy*K)), (int(rx*K), int(ry*K)), 0, 0, 360, 255, -1)
hm = hard > 0
w = (~hm).astype(np.float32)                    # mask-aware blur: fill from the surrounding pixels
def fill(sig):
    return gaussian_filter(g * w, sig) / (gaussian_filter(w, sig) + 1e-4), gaussian_filter(w, sig)
e1, d1 = fill(26); e2, _ = fill(70)
est = np.where(d1 > .12, e1, e2) * .85 + rng.normal(0, .02, g.shape)
g8 = np.where(hm, np.clip(est, 0, 1), g)
soft = gaussian_filter(hard.astype(np.float32) / 255, 9)
g = g * (1 - soft) + gaussian_filter(g8, 2) * soft
g += rng.normal(0, .012, g.shape) * np.clip(big + soft, 0, 1)      # restore grain where filled

# monochrome grade: neutral grey, deeper blacks, a touch more contrast
g = np.clip((g - .02) / .98, 0, 1) ** 1.12
Image.fromarray((g * 255).astype(np.uint8)).convert('RGB').save(f'{out}/plate.jpg', quality=84)

# ---------------------------------------------------------------- phantom sprite
PW, PH = 1500, 1900
HX, HY = 750, 300                       # head centre
def layer(n, wmax, spread_fn, alpha, blur):
    L = Image.new('L', (PW, PH), 0); d = ImageDraw.Draw(L)
    for _ in range(n):
        a = rng.uniform(-1, 1)                          # where on the shoulders it leaves
        side = np.sign(a) or 1
        x0 = HX + a * 125; y0 = HY - 40 + abs(a) ** 2 * 120
        length = rng.uniform(700, 1500); sp = spread_fn(abs(a)) * rng.uniform(.4, 1.1)
        ph, fr = rng.uniform(0, 6.3), rng.uniform(1.2, 3.2)
        pts = []
        for t in np.linspace(0, 1, 46):
            x = x0 + side * sp * t ** 1.5 + np.sin(t * fr * 3 + ph) * 55 * t + a * 90 * t
            y = y0 + length * t - np.sin(t * 3.1 + ph) * 70 * t * abs(a)
            pts.append((x, y))
        w = int(rng.uniform(1, wmax))
        d.line(pts, fill=int(rng.uniform(.4, 1) * alpha), width=w, joint='curve')
    return gaussian_filter(np.asarray(L, np.float32), blur)

spread = lambda a: 150 + a * 760
acc = (layer(260, 3, spread, 46, 1.2) + layer(160, 9, spread, 30, 3.5)
       + layer(70, 34, spread, 20, 10) + layer(26, 90, spread, 14, 26)) / 255

def nz(s_):
    a = gaussian_filter(rng.normal(0, 1, (PH, PW)).astype(np.float32), s_); return a / a.std()
Y, X = np.mgrid[0:PH, 0:PW].astype(np.float32)
wgt = np.clip((Y - HY) / 520, 0, 1) ** 1.1                       # head stays calm, the trail billows
mx = (46 * nz(110) + 18 * nz(34)) * wgt; my = (26 * nz(110) + 9 * nz(34)) * wgt
acc = cv2.remap(acc.astype(np.float32), X + mx, Y + my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)

# soft translucent body: dome head + widening veil
head = np.clip(1 - (((X - HX) / 150) ** 2 + ((Y - HY) / 185) ** 2), 0, 1) ** .55
body = np.clip(1 - ((X - HX) / (140 + np.clip(Y - HY, 0, None) * .55)) ** 2, 0, 1) ** 1.4 * np.clip((Y - HY + 120) / 160, 0, 1)
body = cv2.remap(body.astype(np.float32), X + mx, Y + my, cv2.INTER_LINEAR) * np.exp(-np.clip(Y - HY, 0, None) / 780) * .55
n = lambda s: gaussian_filter(rng.normal(0, 1, (PH, PW)).astype(np.float32), s) * s   # cheap fbm octaves
tex = np.clip(.55 + .9 * n(22) / 8 + .5 * n(7) / 3, .15, 1.5)
alpha = np.clip((acc * 1.5 + head * .62 + body) * tex, 0, 1)

# hollow, simple face: two dark oval eyes + faint brow shadow, no mouth, no limbs
eyes = np.zeros((PH, PW), np.float32)
for ex, tilt in ((HX - 50, -.12), (HX + 50, .12)):
    xx = (X - ex) + tilt * (Y - HY)
    eyes += np.clip(1 - ((xx / 21) ** 2 + ((Y - (HY - 8)) / 38) ** 2), 0, 1) ** .7
eyes = np.clip(gaussian_filter(eyes, 4.5) * 1.5, 0, 1)
brow = gaussian_filter(np.clip(1 - (((X - HX) / 120) ** 2 + ((Y - (HY - 5)) / 55) ** 2), 0, 1), 18) * .22

# fade out at every border so nothing is hard-clipped, dissolve the tail
edge = np.clip(np.minimum.reduce([X, PW - X, Y, PH - Y]) / 140, 0, 1)
alpha *= edge * np.clip(1.15 - (Y / PH) ** 2.2, 0, 1)

lum = np.clip(.62 + .55 * (acc / (acc.max() + 1e-6)) ** .6 + .25 * head, 0, 1) * 232
lum = lum * (1 - brow) * (1 - eyes) + 6 * eyes
alpha = np.clip(alpha * (1 - brow * .5), 0, 1)
alpha = np.maximum(alpha, eyes * .97)
rgba = np.dstack([lum, lum, lum, alpha * 255]).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{out}/phantom.png', optimize=True)

# ---------------------------------------------------------------- tileable fog
FW, FH = 1024, 512
f = sum(gaussian_filter(rng.normal(0, 1, (FH, FW)), s, mode='wrap') * s for s in (60, 26, 11))
f = (f - f.min()) / (f.max() - f.min()); f = np.clip((f - .35) * 1.9, 0, 1) ** 1.6
fy = np.sin(np.linspace(0, np.pi, FH))[:, None] ** 1.2          # fade top/bottom so strips blend
fog = np.dstack([np.full((FH, FW), 205), np.full((FH, FW), 205), np.full((FH, FW), 205), f * fy * 150]).astype(np.uint8)
Image.fromarray(fog, 'RGBA').save(f'{out}/fog.png', optimize=True)
print('ok')
