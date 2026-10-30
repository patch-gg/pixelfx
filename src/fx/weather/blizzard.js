import { ramp, at, lerp, clamp, fract, rng, tileFbm, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Blizzard",
  desc: "A whiteout: snow driven almost flat across the frame in gusts, streaks of near flakes, and pale sheets of blown snow tearing past.",
  tags: ["weather", "snow", "blizzard", "wind", "winter", "cold", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 36],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#2a3448", "#4a5a76", "#7e92b0", "#bccce0", "#f0f6fc"], count: 140, seed: 83 },
};

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta), ph = t / D;
  // gusts: the whole field surges and eases twice a loop
  const gust = (k) => Math.sin(ph * TAU * 2 + k) * 0.03 + Math.sin(ph * TAU * 3 + k * 2) * 0.015;
  // sheets of blown snow: stretched noise, tiling the frame's width, scrolled a whole width per pass
  p.shade(B.x0, B.y0, B.x1 + 1, B.y1 + 1, (x, y, out) => {
    const u = (x - B.x0) / B.w, v = (y - B.y0) / B.h;
    const n = tileFbm(u * 4 - ph * 8, v * 14 + Math.sin(u * TAU + ph * TAU) * 0.8, 4, 0, S, 2);
    // banded haze in the light buffer: flat steps, no dither, never quite clear
    out.l = C[3];
    out.k = n > 0.3 ? 0.32 : n > 0.12 ? 0.21 : n > -0.08 ? 0.12 : 0.05;
  });
  // flakes: three depths, driven right and a little down; near ones smear into streaks
  const layers = [
    { n: 0.45, laps: [2, 3], len: 0, c: 2, dy: 0.18 },
    { n: 0.35, laps: [3, 4], len: 2, c: 3, dy: 0.22 },
    { n: 0.2, laps: [4, 6], len: 6, c: 4, dy: 0.28 },
  ];
  layers.forEach((L, li) => {
    const N = Math.round(o.count * L.n);
    for (let i = 0; i < N; i++) {
      const r = rng(S + li * 17, i), k = r.int(L.laps[0], L.laps[1]), off = r.next();
      const u = fract(off + (k * t) / D + gust(off * 6)), span = B.w + 30;
      const x = B.x0 - 15 + u * span, y = r.range(B.y0 - 10, B.y1) + u * span * L.dy + Math.sin(u * TAU * 2 + i) * 2;
      const yy = B.y0 + ((y - B.y0) % (B.h + 4) + (B.h + 4)) % (B.h + 4);
      if (L.len) p.line(x, yy, x - L.len, yy - L.len * L.dy, (q) => (q < 0.4 ? C[L.c] : C[L.c - 1]));
      else p.px(x, yy, C[L.c]);
    }
  });
}
