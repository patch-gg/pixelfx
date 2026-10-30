import { ramp, rng, seg, ease, lerp, clamp, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Shooting stars",
  desc: "A quiet starry sky where now and then a meteor streaks down to the right, its trail burning white to blue, flaring once before it winks out.",
  tags: ["weather", "night", "sky", "stars", "meteor", "shooting star", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 36],
  duration: 4,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: ["#1c2a5a", "#3a5aa8", "#7ca4e8", "#c8e0ff", "#fff8e8", "#ffffff"], seed: 113 },
};

// meteors: [start time, start x, start y, angle, speed, trail length]
const METEORS = [
  [0.2, -60, -34, 0.42, 190, 26],
  [1.75, -10, -38, 0.55, 230, 22],
  [2.95, -48, -16, 0.3, 160, 30],
];
const LIFE = 0.5;

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, B = box(meta), ph = t / meta.duration;
  // a few bright stars of our own, breathing gently
  for (let i = 0; i < 9; i++) {
    const r = rng(S, i), x = r.range(B.x0 + 4, B.x1 - 4), y = r.range(B.y0 + 3, B.y1 - 10);
    const b = 0.5 + 0.5 * Math.sin(ph * TAU * r.int(1, 2) + r.next() * TAU);
    p.px(x, y, b > 0.6 ? C[5] : C[3]);
    if (b > 0.85 && i % 3 === 0) p.px(x - 1, y, C[2]), p.px(x + 1, y, C[2]), p.px(x, y - 1, C[2]), p.px(x, y + 1, C[2]);
  }
  for (const [t0, x0, y0, ang, sp, len] of METEORS) {
    const a = t - t0;
    if (a < 0 || a > LIFE + 0.25) continue;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const k = clamp(a / LIFE), dist = sp * LIFE * ease.outQuad(k) * 0.9 + sp * a * 0.1;
    const hx = x0 + dx * dist, hy = y0 + dy * dist;
    if (a <= LIFE) {
      // the trail: grows in, then shortens as the meteor burns out
      const L = len * Math.min(1, a / 0.12) * (1 - ease.inQuad(seg(k, 0.6, 1)));
      p.line(hx, hy, hx - dx * L, hy - dy * L, (u) => (u < 0.15 ? C[5] : u < 0.4 ? C[4] : u < 0.7 ? C[2] : C[1]), (u) => (u < 0.75 ? 1 : 1 - (u - 0.75) * 3));
      // the hot end of the trail is two pixels thick
      p.line(hx - dx, hy - dy + 1, hx - dx * L * 0.35, hy - dy * L * 0.35 + 1, (u) => (u < 0.4 ? C[3] : C[2]));
      p.glowLine(hx, hy, hx - dx * L * 0.6, hy - dy * L * 0.6, 4, C[2], 0.25);
      const flare = k > 0.72 && k < 0.86;
      p.px(hx, hy, C[5]);
      if (flare) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.px(hx + ox, hy + oy, C[4]);
      p.glow(hx, hy, flare ? 9 : 5, C[3], flare ? 0.6 : 0.4);
    } else {
      // afterglow: a faint line where it passed, gone in a few frames
      const q = (a - LIFE) / 0.25, L = len * 0.5;
      p.line(hx - dx * 2, hy - dy * 2, hx - dx * L, hy - dy * L, C[1], 0.5 * (1 - q));
    }
  }
}
