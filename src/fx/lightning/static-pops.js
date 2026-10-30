import { rng, rand, wrap, TAU, WHITE } from "../../core/index.js";
import { steps, jagged } from "./_lib.js";

export const meta = {
  name: "Static pops",
  desc: "Little static discharges snap here and there: a white tick, a tiny zigzag or a short jump between two points, a pinprick of sparks, gone in a blink.",
  tags: ["lightning", "electric", "static", "sparkle", "ambient", "loop"],
  size: [48, 40],
  origin: [24, 20],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0e1430", "#1f2f66", "#3b58a8", "#6a8ee0", "#a6c4f6", "#dfeaff", "#ffffff"], count: 16, width: 18, height: 13, seed: 18 },
};

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed;
  const D = meta.duration, n = o.count;
  // pops spread evenly through the loop (a little jitter), so no stretch of it goes quiet
  for (let i = 0; i < n; i++) {
    const born = ((i + 0.6 * rand(S, i, 1)) / n) * D, age = wrap(t - born, D), life = 0.1 + 0.04 * rand(S, i, 2);
    if (age >= life) continue;
    const r = rng(S, i), k = age / life, x = Math.round(r.range(-o.width, o.width)), y = Math.round(r.range(-o.height, o.height));
    const jump = r.chance(0.5), a = r.range(0, TAU), l = jump ? r.range(8, 14) : r.range(4, 7);
    const ex = Math.max(-o.width - 3, Math.min(o.width + 3, x + Math.cos(a) * l)), ey = Math.max(-o.height - 3, Math.min(o.height + 3, y + Math.sin(a) * l));
    const pts = jagged(r, x, y, ex, ey, { step: 2.2, amp: 1.2 });
    if (k < 0.34) {
      // the snap: a white tick with a tiny cross of light, the zigzag at full brightness
      p.polyline(pts, WHITE);
      p.px(x - 1, y, C[5]), p.px(x + 1, y, C[5]), p.px(x, y - 1, C[5]), p.px(x, y + 1, C[5]);
      p.px(x, y, WHITE);
      if (jump) p.px(ex, ey, C[6]);
      p.glow(x, y, 9, C[4], 0.45);
      p.glow((x + ex) / 2, (y + ey) / 2, 5, C[5], 0.3);
    } else {
      // the after-spit: the zigzag cools and a few pinpricks fly off and wink out
      if (k < 0.67) p.polyline(pts, C[4]);
      const d = 1.5 + k * 4;
      for (let j = 0; j < 3; j++) {
        const b = a + Math.PI + (j - 1) * 0.9 + r.range(-0.3, 0.3);
        p.px(x + Math.cos(b) * d, y + Math.sin(b) * d, k < 0.67 ? C[5] : C[3]);
      }
      p.glow(x, y, 6, C[3], 0.25 * (1 - k));
    }
  }
}
