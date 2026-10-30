import { burst, fly, seg, ease, clamp, rng, WHITE } from "../../core/index.js";
import { fit, sparkle, ovalLine, STARLIGHT } from "./_lib.js";

export const meta = {
  name: "Star fall",
  desc: "Stars rain down on a target area: each streaks in at a slant with a blue tail, bursts on the floor with a flat ring and sparks, and leaves a glint.",
  tags: ["arcane", "stars", "meteor", "rain", "area", "ground", "one-shot"],
  size: [100, 88],
  origin: [58, 76],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: STARLIGHT, count: 7, spread: 28, seed: 16 },
};

const STAR = ["...a...", "...a...", "..aba..", "aabbbaa", ".abbba.", ".ab.ba.", ".a...a."];
const SLANT = 0.3; // dx per dy of the fall: stars come in from the upper left

export function draw(p, t, o) {
  const C = fit(o.palette), n = o.count, S = o.seed, top = -meta.origin[1] + 6;
  // landing spots spread across the area in a shuffled order, so the rain doesn't sweep one way
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => rng(S, a, 5).next() - rng(S, b, 5).next());
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), lx = ((order[i] + 0.5) / n - 0.5) * 2 * o.spread + r.range(-3, 3);
    const t0 = i * (0.62 / n) + r.range(0, 0.05), fall = r.range(0.26, 0.34), H = -top;
    const k = seg(t, t0, t0 + fall), e = ease.inQuad(k);
    const pos = (ee) => [lx - (1 - ee) * H * SLANT, -(1 - ee) * H];
    if (k > 0 && k < 1) {
      // the tail: thick and pale near the head, thinning into deep blue, clipped at the top of the canvas
      const [x, y] = pos(e), len = 10 + 14 * e, ux = SLANT / Math.hypot(SLANT, 1), uy = 1 / Math.hypot(SLANT, 1);
      const tx = x - ux * len, ty = Math.max(top, y - uy * len);
      p.line(x, y, tx + (ty - (y - uy * len)) * SLANT, ty, (u) => (u < 0.25 ? C[5] : u < 0.55 ? C[4] : u < 0.8 ? C[3] : C[2]));
      p.line(x - 1, y, x - 1 - ux * len * 0.45, y - uy * len * 0.45, (u) => (u < 0.5 ? C[4] : C[3]));
      p.sprite(STAR, { a: C[6], b: WHITE }, Math.round(x) - 3, Math.round(y) - 4);
      p.glow(x, y, 9, C[5], 0.4);
      // dust shed from the tail, hanging a moment
      burst(3, S * 7 + i, (q) => {
        const kk = q.range(0.15, 0.85), born = t0 + fall * Math.sqrt(kk), age = t - born, life = q.range(0.15, 0.3);
        if (age < 0 || age > life) return;
        const [bx, by] = pos(ease.inQuad(Math.sqrt(kk)));
        p.px(bx + q.range(-2, 2), by + q.range(-2, 2) + age * 8, age / life < 0.5 ? C[5] : C[4]);
      });
    }
    // the hit
    const a = t - (t0 + fall);
    if (a < 0 || a > 0.5) continue;
    if (a < 0.067) {
      p.ellipse(lx, -1, 6, 2, WHITE);
      sparkle(p, lx, -3, 3, WHITE, C[6], WHITE);
      p.glow(lx, -2, 18, C[5], 0.55);
    }
    const rr = seg(a, 0.02, 0.2);
    if (rr > 0 && rr < 1) {
      const R = 4 + 6 * ease.outCubic(rr);
      ovalLine(p, R, R * 0.33, rr < 0.5 ? C[5] : C[4], 1, lx, 0);
    }
    burst(3, S * 13 + i, (q) => {
      const ang = -Math.PI / 2 + q.range(-1.1, 1.1), sp = q.range(40, 75), life = q.range(0.22, 0.36);
      if (a > life) return;
      const [x, y] = fly(lx, -1, Math.cos(ang) * sp, Math.sin(ang) * sp, a, 260, 1);
      if (y > 0) return;
      p.px(x, y, a / life < 0.4 ? C[6] : C[4]);
    });
    // the glint it leaves on the floor
    const g = seg(a, 0.08, 0.45);
    if (g > 0 && g < 1) sparkle(p, lx, -1, g < 0.2 ? 2 : g < 0.6 ? 1 : 0, C[6], C[5], WHITE, 1 - g * 0.5);
    p.glow(lx, -2, 12, C[4], 0.35 * clamp(1 - a / 0.35));
  }
}
