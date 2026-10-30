import { ramp, rng, clamp, fract, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Heat haze",
  desc: "Hot ground on a still day: wavy heat lines wriggle up off the floor and thin out, and a band of mirage shimmer slides along just above it.",
  tags: ["weather", "heat", "desert", "summer", "shimmer", "mirage", "ambient", "loop"],
  size: [96, 48],
  origin: [48, 42],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#4a2a10", "#8a4a1a", "#d07a2a", "#f4b860", "#fff0c8"], count: 7, seed: 139 },
};

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta), ph = t / D;
  // warmth off the floor
  p.shade(B.x0, -14, B.x1 + 1, 0, (x, y, out) => {
    out.l = C[2];
    out.k = y > -3 ? 0.14 : y > -7 ? 0.09 : 0.04;
  });
  // mirage shimmer: a few rows of long wavering dashes just over the floor, sliding opposite ways
  for (let row = 0; row < 3; row++) {
    const y0 = -2 - row * 3, dir = row % 2 ? 1 : -1;
    for (let x = B.x0; x <= B.x1; x++) {
      const u = (x - B.x0) / B.w;
      const on = Math.sin(u * TAU * (3 + row) + ph * TAU * dir * (1 + row)) + Math.sin(u * TAU * 7 - ph * TAU * 2 + row) * 0.25;
      if (on < 0.45 + row * 0.15) continue;
      const y = y0 + Math.round(Math.sin(u * TAU * 5 + ph * TAU * 3 + row) * 0.7);
      p.dot(x, y, row === 0 ? C[4] : C[3], row < 2 ? 1 : 0.5);
    }
  }
  // heat lines: wavy strokes rising off the ground; each rises a whole number of times a loop
  for (let i = 0; i < o.count; i++) {
    const r = rng(S, i), laps = r.int(1, 2), u = fract(r.next() + (laps * t) / D);
    const x0 = B.x0 + 8 + ((i + r.range(0.1, 0.9)) / o.count) * (B.w - 16), len = r.range(11, 16);
    const base = -2 - u * 24, amp = r.range(1.4, 2.2), freq = r.range(0.32, 0.42);
    const fade = clamp(u * 5) * clamp((1 - u) * 2.2);
    for (let s = 0; s < len; s++) {
      // the wave travels up the stroke as it rises, so it wriggles
      const y = base - s, x = x0 + Math.sin(y * freq + ph * TAU * 3 * laps + i) * amp;
      const k = s / len; // 0 at the bottom of the stroke
      const a = fade * (k < 0.2 || k > 0.8 ? 0.45 : 0.85);
      p.dot(x, y, k > 0.3 && k < 0.7 ? C[4] : C[3], a);
      p.light(x, y, C[3], 0.1 * fade);
    }
  }
}
