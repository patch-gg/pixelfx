import { PAL, cycle, tileNoise, clamp, ease, fract, TAU } from "../../core/index.js";
import { fit, ripple } from "./_lib.js";

export const meta = {
  name: "Waterfall",
  desc: "A sheet of water pours over a lip and streaks down into a churning band of white foam, throwing spray and drifting mist.",
  tags: ["water", "waterfall", "cascade", "foam", "mist", "ambient", "loop"],
  size: [64, 84],
  origin: [32, 78],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, height: 70, width: 10, seed: 7 },
};

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, D = meta.duration, ph = t / D, H = o.height, HW = o.width;
  const half = (y) => HW + 2.5 * clamp((y + H) / H);
  // mist behind: a fine drift of pale specks rising off the base either side, thinning as it climbs
  cycle(t, D, 22, S + 5, (r) => r.range(1.2, 2), (age, life, r) => {
    const k = age / life, side = r.sign(), x = side * (HW + 1 + r.range(0, 4) + k * r.range(6, 16)), y = -2 - k * r.range(14, 26);
    if (k > 0.55 && r.next() < (k - 0.55) * 2.2) return;
    p.px(x + Math.sin(age * 3 + r.next() * TAU), y, k < 0.35 ? W[6] : W[5]);
    if (r.next() < 0.4 && k < 0.6) p.px(x + 1, y, W[5]);
  });
  // the pool: dark water spreading from the base, rings running out
  p.ellipse(0, 1, 30, 3.5, (d, a) => (d > 0.85 ? (Math.sin(a) < 0 ? W[4] : W[2]) : W[3]));
  for (let i = 0; i < 2; i++) {
    const k = fract(ph + i / 2), rr = HW + 4 + k * 15;
    ripple(p, 0, 1, rr, 3.2, W[5], W[5], 1.3 * (1 - k), S + i);
  }
  // the sheet: streaks fall the length of it, edges darker, the lip bright where it bends over
  p.shade(-HW - 4, -H - 2, HW + 4, -1, (x, y) => {
    const v = (y + H) / H, edge = v > 0.1 ? tileNoise(x > 0 ? 3 : 7, y * 0.16 - ph * 12, 0, 12, S + 6) * 1.1 * v : 0;
    const w = half(y) + edge, ax = Math.abs(x) / w;
    if (ax > 1) return;
    const n = tileNoise(x * 0.55, y * 0.05 - ph * 6, 0, 6, S) * 0.65 + tileNoise(x * 1.1, y * 0.1 - ph * 12, 0, 12, S + 1) * 0.35;
    if (y < -H + 4) {
      // the lip: the river's surface curling over the edge, rounded at the corners, white on the bend
      if (y < -H && ax > 0.8) return;
      if (y < -H + 1 && ax > 0.93) return;
      return y < -H ? W[5] : y < -H + 2 ? (n > -0.4 ? W[7] : W[6]) : W[6];
    }
    if (ax > 0.86) return x < 0 ? W[4] : W[2];
    if (v < 0.12) return n > -0.2 ? W[6] : W[5];
    return n > 0.42 ? W[7] : n > 0.08 ? W[6] : n > -0.3 ? W[5] : W[4];
  });
  // foam: a churning white band where the sheet hits, lumpy along its top
  p.shade(-HW - 9, -14, HW + 9, 3, (x, y) => {
    const lump = tileNoise(x * 0.3, ph * 4, 0, 4, S + 2) * 3 + tileNoise(x * 0.7, ph * 8 + 3, 0, 8, S + 3) * 1.5;
    const wide = HW + 7 - Math.max(0, -y - 4) * 0.4, top = -9 + lump + Math.abs(x) * 0.25;
    if (Math.abs(x) > wide || y < top) return;
    const n = tileNoise(x * 0.4, y * 0.4 - ph * 8, 0, 8, S + 4);
    if (y > 1) return n > 0 ? W[5] : W[4];
    return n > -0.35 ? W[7] : W[6];
  });
  // foam puffs rolling out of the base
  cycle(t, D, 10, S, (r) => r.range(0.5, 0.8), (age, life, r) => {
    const k = age / life, side = r.sign(), x = side * (r.range(2, HW) + ease.outCubic(k) * r.range(6, 12)), y = -r.range(2, 7) - k * 3;
    const s = r.range(2, 3.5) * (1 - k * 0.6);
    p.circle(x, y, s, (d, a) => (Math.sin(a) > 0.3 && d > 0.6 ? W[5] : k < 0.6 ? W[7] : W[6]));
  });
  // spray thrown up and out
  cycle(t, D, 16, S + 1, (r) => r.range(0.3, 0.45), (age, life, r) => {
    const side = r.sign(), vx = side * r.range(20, 45), vy = -r.range(50, 90), x0 = side * r.range(2, HW), y0 = -8;
    const x = x0 + vx * age, y = y0 + vy * age + 0.5 * 360 * age * age;
    if (y > 0) return;
    p.px(x, y, age / life < 0.5 ? W[7] : W[6]);
  });
  // light: a cool shimmer down the sheet and off the foam
  p.glow(0, -8, 24, W[5], 0.16);
  p.glow(-HW - 8, -10, 14, W[6], 0.12);
  p.glow(HW + 8, -10, 14, W[6], 0.12);
  p.glowLine(0, -H, 0, -6, 9, W[5], 0.08 + 0.03 * Math.sin(ph * TAU));
}
