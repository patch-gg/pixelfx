import { PAL, ramp, rand, rng, loopNoise, clamp, hex, TAU } from "../../core/index.js";
import { fit, tongue, flames, embers, pool } from "./_lib.js";

export const meta = {
  name: "Ground fire",
  desc: "A patch of burning ground: a charred scorch with glowing cracks and a row of low flames that dance up, shrink away and flare again.",
  tags: ["fire", "ground", "hazard", "area", "loop"],
  size: [72, 40],
  origin: [36, 32],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, width: 26, height: 15, count: 11, seed: 4 },
};

const CHAR = [hex("#100b0e"), hex("#1f1416"), hex("#2e1d1c")];

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), S = o.seed, D = meta.duration, ph = t / D, W = o.width, H = o.height;
  const flick = 0.85 + 0.15 * loopNoise(ph, 2, S + 5);
  // the scorch: a charred oval on the floor, cracks glowing and dimming
  p.shade(-W - 4, -2, W + 4, 3, (x, y) => {
    const dx = x / (W + 3), dy = (y - 0.5) / 2.6, d = dx * dx + dy * dy;
    if (d > 1) return;
    const crack = rand(Math.floor(x / 2), Math.floor(y), S) > 0.78 && d < 0.75;
    if (crack) {
      const g = 0.5 + 0.5 * Math.sin(ph * TAU * 2 + x * 0.7);
      return g > 0.66 ? F[4] : g > 0.3 ? F[3] : F[2];
    }
    return d > 0.8 ? CHAR[2] : d > 0.4 ? CHAR[1] : CHAR[0];
  });
  // low tongues along the patch, each breathing on its own: some sink out of sight, then flare back up
  // a low lick of flame along the whole patch keeps it reading as one fire
  const T = [tongue(0, 1, W, 6, ph, S + 77, { beat: 2, sway: 1, pulse: 0.2 })];
  for (let i = 0; i < o.count; i++) {
    const r = rng(S, i), x = -W + 2 + ((2 * W - 4) * (i + r.range(0.2, 0.8))) / o.count;
    const lift = clamp(0.5 + 0.8 * loopNoise(ph, 1.3, S + i * 7));
    const h = H * r.range(0.55, 1) * lift * (1 - 0.45 * Math.abs(x / W) ** 2);
    if (h < 2.5) continue;
    T.push(tongue(x, 0, r.range(3.2, 4.6) * (0.65 + 0.35 * lift), h, ph, S + i * 13, { beat: 2 + (i % 3), sway: 1.6, pulse: 0.1 }));
  }
  flames(p, T, { F, ph, seed: S, box: [-W - 4, -H * 1.2 - 4, W + 4, 1], scroll: 12, nx: 0.42, ny: 0.3 });
  embers(p, t, D, 7, S + 9, [F[6], F[5], F[3]], F[4], { x: 0, y: -H * 0.6, w: W * 0.8, rise: [12, 20], life: [0.6, 1], wob: 2 });
  // light: a low, wide pool and a soft glow
  pool(p, 0, 0, W + 10, 6, F[4], 0.38 * flick);
  p.glow(0, -H * 0.4, W + 6, F[4], 0.18 * flick);
}
