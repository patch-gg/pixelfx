import { ramp, lerp, fract, rng, tileFbm, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Sandstorm",
  desc: "A desert wind tears sand across the frame: gritty dust walls roll past in waves, grains streak by at three depths and sand snakes along the floor.",
  tags: ["weather", "sand", "dust", "desert", "wind", "storm", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 66],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a1c10", "#4e3620", "#7a5a34", "#a8844e", "#d0ac6c", "#ecd09a"], count: 150, seed: 107 },
};

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta), ph = t / D;
  // dust walls: stretched noise tiling the frame's width, swept right by whole widths; a warm haze in the
  // light buffer in flat steps, thickest near the ground
  p.shade(B.x0, B.y0, B.x1 + 1, B.y1 + 1, (x, y, out) => {
    const u = (x - B.x0) / B.w, v = (y - B.y0) / B.h;
    const n = tileFbm(u * 4 - ph * 8, v * 6 + Math.sin(u * TAU * 2 - ph * TAU * 2) * 0.35, 4, 0, S, 2) + v * 0.4 - 0.05;
    out.l = n > 0.3 ? C[4] : C[3];
    out.k = n > 0.42 ? 0.4 : n > 0.24 ? 0.3 : n > 0.06 ? 0.21 : 0.13;
  });
  // grains: far specks, mid dashes, near streaks; each crosses the frame a whole number of times a loop
  const layers = [
    { n: 0.45, laps: [2, 3], len: 0, c: 3, dy: 0.06 },
    { n: 0.35, laps: [3, 5], len: 2, c: 4, dy: 0.1 },
    { n: 0.2, laps: [5, 7], len: 6, c: 5, dy: 0.14 },
  ];
  layers.forEach((L, li) => {
    const N = Math.round(o.count * L.n);
    for (let i = 0; i < N; i++) {
      const r = rng(S + 31 * li, i), k = r.int(L.laps[0], L.laps[1]), off = r.next();
      const u = fract(off + (k * t) / D), x = B.x0 - 12 + u * (B.w + 24);
      const y = r.range(B.y0, B.y1 - 4) + u * L.dy * B.w + Math.sin(u * TAU * 3 + i) * 1.5;
      if (L.len) p.line(x, y, x - L.len, y - L.len * L.dy, (q) => (q < 0.35 ? C[L.c] : C[L.c - 1]));
      else p.px(x, y, C[L.c]);
    }
  });
  // drifts: sand snaking along the floor in thin wavy lines
  for (let i = 0; i < 7; i++) {
    const r = rng(S + 99, i), k = r.int(3, 5), u = fract(r.next() + (k * t) / D);
    const len = r.range(10, 22), head = B.x0 - 25 + u * (B.w + 50), y0 = -r.int(0, 2);
    for (let s = 0; s < len; s++) {
      const x = head - s, y = y0 + Math.round(Math.sin(x * 0.35 + i) * 0.8);
      p.px(x, y, s < 3 ? C[5] : s < len * 0.6 ? C[4] : C[3]);
    }
  }
}
