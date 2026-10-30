import { PAL, cycle, tileNoise, clamp, seg, wrap, rand, TAU } from "../../core/index.js";
import { fit, drop } from "./_lib.js";

export const meta = {
  name: "Water jet",
  desc: "A pressurised stream blasts right from a nozzle: bright streaks race down a wobbling beam that breaks into blobs and spray at the end.",
  tags: ["water", "jet", "stream", "hose", "beam", "directional", "loop"],
  size: [96, 32],
  origin: [4, 16],
  duration: 0.5,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.water, length: 66, width: 2.4, seed: 6 },
};

const SEG = 7; // length of the blobs the end breaks into, px

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, ph = t / meta.duration, L = o.length, HW = o.width;
  const yc = (x) => Math.sin(x * 0.11 - ph * TAU * 2) * 0.9 * clamp(x / L);
  const end = (x) => seg(x, L * 0.62, L + 14);
  const hw = (x) => (HW + 1.4 * clamp(x / L) + 0.45 * tileNoise(x * 0.12 - ph * 12, 0.5, 12, 0, S + 4)) * (1 - 0.45 * end(x));
  // the beam: streaks race along it; toward the end it breaks into blobs that get smaller
  p.shade(0, -9, L + 16, 9, (x, y) => {
    const e = end(x);
    let w = hw(x), dy = 0;
    if (e > 0) {
      // the blobs: each its own length and drift, sliding along with the flow, rounder and smaller further out
      const xs = (x - ph * SEG * 9) / SEG, id = wrap(Math.floor(xs), 9), f = xs - Math.floor(xs);
      const len = (1 - e * 0.8) * (1 - e * 0.5 * rand(S, id)), c = 0.5 + (rand(S, id, 1) - 0.5) * (1 - len);
      const u = (f - c) / (len / 2);
      if (Math.abs(u) >= 1) return;
      w *= Math.sqrt(1 - u * u * Math.min(1, 0.6 + e * 3)) * (1 - e * 0.4 * rand(S, id, 2));
      dy = (rand(S, id, 3) - 0.5) * 3 * e;
    }
    const v = (y - yc(x) - dy) / w;
    if (Math.abs(v) > 1) return;
    const n = tileNoise(x * 0.09 - ph * 16, y * 0.8, 8, 0, S);
    if (v < -0.72) return W[6];
    if (v > 0.68) return W[3];
    if (v > 0.3) return n > 0.25 ? W[5] : W[4];
    if (Math.abs(v + 0.15) < 0.28) return n > -0.15 ? W[7] : W[6];
    return n > 0.35 ? W[6] : W[5];
  });
  // the nozzle flare: pressure bursting out of the mouth
  p.rect(-1, -3, 2, 7, W[5]);
  p.rect(-1, -2, 2, 4, W[6]);
  p.rect(-1, -1, 3, 2, W[7]);
  // spray peeling off the beam and the frayed end
  cycle(t, meta.duration, 24, S, (r) => r.range(0.16, 0.28), (age, life, r) => {
    const x0 = r.range(10, L + 4), side = r.sign(), y0 = yc(x0) + side * hw(x0) * 0.9;
    const vx = r.range(70, 130), vy = side * r.range(12, 36) - 8, k = age / life;
    const x = x0 + vx * age, y = y0 + vy * age + 70 * age * age;
    if (x > 88) return;
    drop(p, x, y, vx, vy + 140 * age, k < 0.5 ? W[7] : W[6], W[5], 0.02);
  });
  cycle(t, meta.duration, 12, S + 3, (r) => r.range(0.16, 0.3), (age, life, r) => {
    const x = L + 6 + age * r.range(40, 70), y = r.range(-3, 3) + age * r.range(-24, 30) + 60 * age * age;
    if (x < 90) p.px(x, y, age / life < 0.5 ? W[6] : W[4]);
  });
  p.glowLine(0, 0, L * 0.8, 0, 6, W[5], 0.1);
  p.glow(0, 0, 8, W[6], 0.3);
}
