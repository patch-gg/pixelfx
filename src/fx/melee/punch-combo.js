import { ramp, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";

export const meta = {
  name: "Punch combo",
  desc: "Jab, jab, straight: two quick puffs pop in front of the fighter, then a bigger straight lands with a burst of rays and a ring.",
  tags: ["melee", "punch", "combo", "brawler", "fist", "combat", "directional", "one-shot"],
  size: [60, 44],
  origin: [14, 36],
  duration: 0.7,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#2a1208", "#5a2410", "#9a4018", "#d8702a", "#f8a850", "#ffd890", "#fff4d8", "#ffffff"], seed: 16 },
};

// jab, jab, straight: when, where, how big
const HITS = [
  { t: 0.0, x: 13, y: -12, s: 0.75 },
  { t: 0.13, x: 15, y: -8, s: 0.8 },
  { t: 0.3, x: 19, y: -10, s: 1.15 },
];

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, top = C.length - 1;
  HITS.forEach((h, i) => {
    const q = t - h.t, k = h.s, big = i === 2;
    if (q < -0.04 || q > 0.36) return;
    // the fist's streak: lines racing in from the fighter the frame before it lands
    if (q < 0.035) {
      const e = seg(q, -0.04, 0.0);
      for (const [dy, l] of [[0, 1], [-2, 0.6], [2, 0.7]]) {
        const x1 = h.x - 2, x0 = 5 + (x1 - 5) * (1 - l) * e;
        p.line(x0, h.y + dy * k, x1, h.y + dy * k, dy === 0 ? WHITE : C[top - 2]);
      }
    }
    if (q < 0) return;
    // the pop: a white ball for a frame, then a ring of little puffs blown outward that shrink away
    if (q < 0.034) p.circle(h.x, h.y, 3.2 * k, WHITE), p.glow(h.x, h.y, 16 * k, C[top - 2], 0.6);
    const n = big ? 8 : 6, spread = ease.outCubic(seg(q, 0, 0.18)), life = big ? 0.26 : 0.2;
    burst(n, S + i * 7, (r, j) => {
      // puffs blown mostly forward (the way the fist was going), each its own size, reach and life
      const a = (j / n - 0.5) * 3.6 + r.range(-0.25, 0.25), d = (2 + r.range(4, 8) * spread) * k;
      const rad = (r.range(1.8, 2.8) - 2.2 * seg(q, 0.05, life * r.range(0.8, 1.1))) * k;
      if (rad < 0.5 || q < 0.034) return;
      const x = h.x + Math.cos(a) * d, y = h.y + Math.sin(a) * d * 0.8;
      p.circle(x, y, rad, (dd, an) => (dd < 0.5 && Math.sin(an) < 0.3 ? C[top] : q < 0.1 ? C[top - 1] : C[top - 2]));
    });
    if (q > 0.02 && q < 0.09) p.circle(h.x, h.y, (2.2 - 12 * (q - 0.02)) * k, q < 0.06 ? C[top] : C[top - 1]);
    p.glow(h.x, h.y, 14 * k, C[top - 3], 0.35 * (1 - seg(q, 0, 0.2)));
    if (!big) return;
    // the straight: sharp rays shooting out, a thin ring, sparks
    if (q < 0.14) {
      const e = ease.outCubic(seg(q, 0, 0.14));
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2 + 0.2, r0 = (5 + 9 * e) * k * (j % 2 ? 0.8 : 1), r1 = r0 + (6 - 5 * e) * k * (j % 2 ? 0.6 : 1);
        p.line(h.x + Math.cos(a) * r0, h.y + Math.sin(a) * r0, h.x + Math.cos(a) * r1, h.y + Math.sin(a) * r1, j % 2 ? C[top - 1] : WHITE);
      }
    }
    const rg = seg(q, 0.02, 0.16);
    if (rg > 0 && rg < 1) p.ring(h.x, h.y, (5 + 8 * ease.outCubic(rg)) * k, 1, rg < 0.5 ? C[top - 1] : C[top - 3]);
    burst(5, S, (r) => {
      const a = r.range(-1.2, 1.2), sp = r.range(60, 110), lf = r.range(0.12, 0.22), age = q - 0.02;
      if (age < 0 || age > lf) return;
      const [x, y] = fly(h.x, h.y, Math.cos(a) * sp, Math.sin(a) * sp, age, 140, 5), kk = age / lf;
      p.px(x, y, kk < 0.4 ? WHITE : kk < 0.75 ? C[top - 1] : C[top - 3]);
      p.light(x, y, C[top - 2], 0.4 * (1 - kk));
    });
  });
}
