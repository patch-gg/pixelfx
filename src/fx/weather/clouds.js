import { ramp, at, rng, wrap } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Clouds",
  desc: "Moonlit clouds drift across a night sky in three layers: small dim ones far off, big billowing ones close by, each with a bright crown and a flat dark belly.",
  tags: ["weather", "clouds", "sky", "night", "parallax", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 36],
  duration: 12,
  loop: true,
  fps: 15,
  bg: "sky",
  options: { palette: ["#141626", "#20243a", "#2e3450", "#424a6c", "#5c668a", "#808cae", "#b2bcd6", "#e4eaf6"], seed: 149 },
};

// layers back to front: how many clouds, their size, their height, how many widths they drift a loop, tone
const LAYERS = [
  { n: 4, size: 0.55, y: [-28, -14], laps: 1, lo: 0, hi: 4 },
  { n: 3, size: 0.85, y: [-16, 2], laps: 2, lo: 1, hi: 5 },
  { n: 2, size: 1.25, y: [0, 22], laps: 3, lo: 2, hi: 7 },
];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, B = box(meta), ph = t / meta.duration, W = B.w;
  LAYERS.forEach((L, li) => {
    // each cloud: a few puffs on a flat base, placed around a strip one frame wide that wraps
    const clouds = [];
    for (let i = 0; i < L.n; i++) {
      const r = rng(S + li * 13, i), cx = ((i + r.range(0.1, 0.9)) / L.n) * W, cy = r.range(L.y[0], L.y[1]);
      const puffs = [], n = r.int(3, 5), w = r.range(14, 22) * L.size;
      for (let k = 0; k < n; k++) {
        const u = n === 1 ? 0 : k / (n - 1) - 0.5;
        puffs.push({ dx: u * w * 1.5 + r.range(-2, 2), dy: -(1 - Math.abs(u) * 1.4) * w * 0.35 - r.range(0, 3) * L.size, r: r.range(0.45, 0.65) * w * (1 - Math.abs(u) * 0.5) });
      }
      clouds.push({ cx, cy, puffs, base: cy + w * 0.12 });
    }
    const shift = ph * L.laps * W;
    const top = Math.min(...clouds.map((c) => c.cy)) - 30 * L.size, bottom = Math.max(...clouds.map((c) => c.base)) + 1;
    p.shade(B.x0, Math.max(B.y0, top), B.x1 + 1, Math.min(B.y1 + 1, bottom), (x, y) => {
      let best = 0, lit = 0, flat = 0;
      for (const c of clouds) {
        if (y > c.base) continue; // the flat belly
        const dx0 = wrap(x - B.x0 - c.cx - shift + W / 2, W) - W / 2;
        for (const f of c.puffs) {
          const dx = dx0 - f.dx, dy = y - c.cy - f.dy, v = 1 - (dx * dx + dy * dy) / (f.r * f.r);
          if (v > best) (best = v), (lit = (-dx * 0.4 - dy) / f.r), (flat = c.base - y);
        }
      }
      if (best <= 0) return;
      // moonlight from above: bright crowns, shaded creases, a dark band along the belly
      if (flat < 1.5) return C[L.lo + 1];
      return at(C.slice(L.lo, L.hi + 1), 0.35 + lit * 0.42 + best * 0.12 - (flat < 3.5 ? 0.25 : 0));
    });
  });
}
