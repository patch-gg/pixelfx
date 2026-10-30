import { PAL, cycle, tileNoise, fract, ease, clamp, TAU } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Whirlpool",
  desc: "A top-down vortex: foam streaks spiral into a dark eye, a churning white rim, flecks of foam sucked in faster and faster.",
  tags: ["water", "whirlpool", "vortex", "maelstrom", "top-down", "loop"],
  size: [64, 64],
  origin: [32, 32],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.water, radius: 27, arms: 4, seed: 11 },
};

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, ph = t / meta.duration, R = o.radius, N = o.arms;
  p.shade(-R - 3, -R - 3, R + 3, R + 3, (x, y) => {
    const r = Math.hypot(x, y), d = r / R, a = Math.atan2(y, x);
    // the rim: a band of churning foam, ragged on the outside
    const u = (a / TAU) * 24 - ph * 24, rim = 0.93 + 0.07 * tileNoise(u, ph * 3, 24, 3, S);
    if (d > rim + 0.06) return;
    if (d > rim - 0.06) return tileNoise(u * 1.5, d * 6, 36, 0, S + 1) > -0.1 ? W[7] : W[6];
    // the arms: log spirals turning a full circle a loop, frayed and broken in places, gone near the eye
    const s = fract((a / TAU) * N - Math.log(d + 0.02) * 1.15 - ph * N);
    const n = tileNoise((a / TAU) * 16 - ph * 16, Math.log(d + 0.02) * 3, 16, 0, S + 2);
    if (d < 0.11) return W[0];
    if (d < 0.17) return W[1];
    const arm = (0.05 + 0.11 * d) * (0.7 + 0.5 * n) * clamp((d - 0.17) / 0.12);
    if (s < arm && n > -0.45) return d > 0.55 ? W[7] : d > 0.32 ? W[6] : W[5];
    // the body: darker the deeper it goes, the bands bent by the swirl
    const dd = d + 0.06 * Math.sin(s * TAU) + 0.04 * n;
    return dd < 0.27 ? W[1] : dd < 0.47 ? W[2] : dd < 0.72 ? W[3] : W[4];
  });
  // flecks of foam sucked in, turning faster as they near the eye
  cycle(t, meta.duration, 14, S, (r) => r.range(1.1, 1.8), (age, life, r) => {
    const k = age / life, a0 = r.range(0, TAU), rr = R * 0.9 * Math.pow(1 - k, 1.3);
    const a = a0 + 1.6 * k + 4.5 * ease.inQuad(k);
    if (rr < R * 0.12) return;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    p.px(x, y, k < 0.6 ? W[7] : W[6]);
    if (k < 0.5) p.px(x - Math.sin(a), y + Math.cos(a), W[6]);
  });
  p.glow(0, 0, R * 1.2, W[4], 0.12);
  p.glowRing(0, 0, R * 0.95, 5, W[6], 0.12);
}
