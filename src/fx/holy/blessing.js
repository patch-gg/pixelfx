import { PAL, cycle, clamp, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle } from "./_lib.js";

export const meta = {
  name: "Blessing",
  desc: "A gentle shower of light over the actor: sparkles drift down through a soft cone of light, twinkling, and wink out at the feet.",
  tags: ["holy", "blessing", "buff", "light", "sparkles", "character", "loop"],
  size: [44, 58],
  origin: [22, 52],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.holy, count: 16, seed: 39 },
};

const TOP = -46;

function shower(p, t, o, front) {
  const C = fit(o.palette), D = meta.duration;
  cycle(t, D, o.count, o.seed, (r) => r.range(1.3, 1.9), (age, life, r, i) => {
    if (r.next() < 0.4 === front) return; // some fall behind the actor
    const k = age / life, x0 = r.range(-5, 5), spread = r.range(-1, 1);
    const y = TOP + 2 + (0 - TOP - 2) * k, x = x0 + spread * 10 * k + Math.sin(age * r.range(2.5, 4) + r.next() * TAU) * 1.8;
    const tw = Math.sin(age * r.range(7, 11) + i), size = k > 0.9 ? 0 : tw > 0.55 ? 2 : tw > -0.3 ? 1 : 0;
    if (front) sparkle(p, x, y, size, C[6], C[5], WHITE);
    else sparkle(p, x, y, Math.min(1, size), C[5], C[4], C[6]);
    p.light(x, y, C[5], (front ? 0.4 : 0.2) * (1 - k * 0.5));
  });
}

export function drawBack(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  // a soft cone of light from above (light only), shimmering slowly
  p.shade(-16, TOP, 16, 2, (x, y, out) => {
    const v = (y - TOP) / (0 - TOP), w = 3 + 11 * v, d = Math.abs(x) / w;
    if (d > 1) return;
    out.l = C[4];
    out.k = 0.13 * (1 - d * d) * (0.85 + 0.15 * Math.sin(ph * TAU * 2 + y * 0.2)) * clamp(v * 4);
  });
  shower(p, t, o, false);
}

export function draw(p, t, o) {
  const C = fit(o.palette);
  shower(p, t, o, true);
  p.glow(0, -2, 14, C[4], 0.15);
}
