import { PAL, ramp, burst, fly, flyV, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { rayStar, streak } from "./_lib.js";

export const meta = {
  name: "Parry",
  desc: "Two blades slam together in an X: a white flash at the cross, a fan of gold sparks that arc and cool, a thin ring snapping outward.",
  tags: ["impact", "parry", "clash", "block", "sparks", "sword", "combat", "one-shot"],
  size: [62, 58],
  origin: [28, 30],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.gold, blade: PAL.metal, count: 18, seed: 13 },
};

export function draw(p, t, o) {
  const G = ramp(o.palette), B = ramp(o.blade), S = o.seed, N = G.length - 1, M = B.length - 1;
  const T = 0.034; // contact
  // the blades: two edges slide in from either side and lock in an X, then spring apart, shrinking away
  const inK = ease.outQuad(seg(t, 0, T)), apart = ease.outCubic(seg(t, 0.1, 0.22));
  if (t < 0.22)
    [-1, 1].forEach((s) => {
      const a = s < 0 ? -Math.PI / 4 : (-3 * Math.PI) / 4; // hilt low on its own side, tip up across
      const dx = Math.cos(a), dy = Math.sin(a), off = (1 - inK) * 7 + apart * 5, sh = 1 - apart * 0.75;
      const cx = s * off, cy = apart * 2, hilt = 9 * sh, tip = 11 * sh;
      const x0 = cx - dx * hilt, y0 = cy - dy * hilt, x1 = cx + dx * tip, y1 = cy + dy * tip;
      if (t < T) p.line(x0 + s * 4, y0, x1 + s * 4, y1, B[M - 4]); // motion line behind the sweep
      p.line(x0 + s, y0, x1 + s, y1, B[M - 4]);
      p.line(x0, y0 + 1, x1, y1 + 1, B[M - 2]);
      p.line(x0, y0, x1, y1, (u) => (t < 0.12 && u > 0.2 ? WHITE : B[M - 1]));
    });
  // the ring: thin, snapping out from the contact and breaking into arcs
  const rk = seg(t, T + 0.03, 0.28);
  if (rk > 0 && rk < 1) {
    const R = 7 + 13 * ease.outCubic(rk), gap = -2 + 3.6 * rk;
    p.ring(0, 0, R, 1, rk < 0.35 ? WHITE : rk < 0.7 ? G[N - 1] : G[N - 3],
      (v, ang) => (Math.sin(ang * 4 + S) + Math.sin(ang * 7 - S) > gap ? 1 : 0));
    p.glowRing(0, 0, R, 3, G[N - 2], 0.25 * (1 - rk));
  }
  // sparks: thrown up and out from the cross, perpendicular to the lock, arcing down and cooling
  burst(o.count, S, (r, i) => {
    const up = i % 3 !== 2, a = up ? -Math.PI / 2 + r.range(-1.25, 1.25) : Math.PI / 2 + r.range(-0.9, 0.9);
    const sp = r.range(70, 170) * (up ? 1 : 0.55), born = T + r.range(0, 0.05), life = r.range(0.18, 0.4), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(0, 0, vx0, vy0, age, 260, 2.5), [vx, vy] = flyV(vx0, vy0, age, 260, 2.5);
    const head = q < 0.25 ? WHITE : q < 0.55 ? G[N - 1] : q < 0.8 ? G[N - 3] : G[N - 4];
    streak(p, x, y, vx, vy, clamp(Math.hypot(vx, vy) * 0.03, 1, 5), (u) => (u > 0.5 ? head : G[N - 4]));
    p.light(x, y, G[N - 2], 0.45 * (1 - q));
  });
  // the flash where the edges meet
  if (t >= T && t < T + 0.07) {
    const s = t < T + 0.035 ? 1 : 0.5;
    rayStar(p, 0, 0, [0, 1, 2, 3].map((i) => ({ a: (i * TAU) / 4, len: (i % 2 ? 9 : 12) * s, w: 1.6 })), (q) => (q < 0.5 ? WHITE : G[N - 1]));
    p.circle(0, 0, 2.5 * s, WHITE);
  }
  const L = t < T ? 0.3 : 1 - seg(t, T, 0.3);
  p.glow(0, 0, 24, G[N - 2], 0.4 * L * L);
  p.glow(0, 0, 6, G[N - 1], 0.5 * L);
}
