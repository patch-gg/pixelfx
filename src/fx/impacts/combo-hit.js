import { PAL, ramp, rng, burst, fly, flyV, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { rayStar, starRays, streak } from "./_lib.js";

export const meta = {
  name: "Combo hit",
  desc: "A rapid combo lands on one target: four quick crossing slash marks with spark pops, each a little bigger, then a beat and a big finisher with a ring.",
  tags: ["impact", "hit", "combo", "multi-hit", "sparks", "combat", "one-shot"],
  size: [56, 56],
  origin: [28, 28],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.electric, hits: 4, gap: 0.07, seed: 18 },
};

// a slash mark: a thin pointed sliver across (x, y), bowed to one side, white along its spine
function sliver(p, x, y, ang, len, w, C, N) {
  const dx = Math.cos(ang) * len * 0.5, dy = Math.sin(ang) * len * 0.5, nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
  p.poly([[x - dx, y - dy], [x + nx, y + ny], [x + dx, y + dy], [x - nx * 0.3, y - ny * 0.3]], C[N - 1]);
  p.line(x - dx * 0.8 + nx * 0.3, y - dy * 0.8 + ny * 0.3, x + dx * 0.8 + nx * 0.3, y + dy * 0.8 + ny * 0.3, WHITE);
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, N = C.length - 1, n = Math.max(1, Math.round(o.hits));
  const fin = n * o.gap + 0.08; // the finisher, after a beat
  // the quick hits: each a slash mark that cuts in, holds a frame, then wipes from both ends
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), t0 = i * o.gap, age = t - t0, s = 0.75 + (0.25 * i) / Math.max(1, n - 1);
    if (age < 0 || age > 0.36) continue;
    const x = (i % 2 ? 1 : -1) * r.range(1, 8), y = r.range(-8, 8), ang = (i % 2 ? -0.75 : 0.75) + r.range(-0.25, 0.25);
    const grow = age < 0.017 ? 0.8 : 1, wipe = ease.inQuad(seg(age, 0.1, 0.22 + 0.04 * (n - i) / n));
    if (wipe < 1) sliver(p, x, y, ang, 24 * s * grow * (1 - wipe), 2.6 * s * (1 - wipe * 0.5), C, N);
    if (age < 0.07) {
      const k = age < 0.035 ? 1 : 0.5;
      rayStar(p, x, y, [0, 1, 2, 3].map((j) => ({ a: (j * TAU) / 4 + 0.785, len: 5 * s * k, w: 1 })), (q) => (q < 0.5 ? WHITE : C[N - 1]));
      p.circle(x, y, 1.6 * s * k, WHITE);
    }
    burst(4, S * 7 + i, (rr) => {
      const a = ang + Math.PI / 2 + rr.range(-1, 1) + (rr.next() < 0.5 ? Math.PI : 0), sp = rr.range(60, 130) * s, life = rr.range(0.12, 0.22);
      if (age > life) return;
      const q = age / life, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
      const [px, py] = fly(x, y, vx, vy, age, 100, 6), [qx, qy] = flyV(vx, vy, age, 100, 6);
      streak(p, px, py, qx, qy, clamp(Math.hypot(qx, qy) * 0.03, 1, 3), (u) => (u > 0.5 && q < 0.5 ? WHITE : C[N - 2]));
    });
    p.glow(x, y, 12 * s, C[N - 2], 0.4 * (1 - seg(age, 0, 0.12)));
  }
  // the finisher: a big star at the middle, a ring, a spray of sparks
  const age = t - fin;
  if (age >= 0) {
    const sk = age < 0.035 ? 1 : Math.pow(1 - seg(age, 0.035, 0.13), 2);
    if (sk > 0.05) {
      const rays = starRays(8, rng(S, 99), 17, 8, 2).map((ry) => ({ ...ry, len: ry.len * sk, w: ry.w * (0.4 + 0.6 * sk) }));
      rayStar(p, 0, 0, rays, (q) => (q < 0.55 ? WHITE : q < 0.85 ? C[N - 1] : C[N - 2]));
      p.circle(0, 0, 3.2 * sk, WHITE);
    }
    const rk = seg(age, 0.06, 0.32);
    if (rk > 0 && rk < 1) {
      const R = 11 + 13 * ease.outCubic(rk), gap = -2 + 3.6 * rk;
      p.ring(0, 0, R, rk < 0.3 ? 2 : 1, rk < 0.35 ? WHITE : C[N - 1], (v, a) => (Math.sin(a * 5 + S) + Math.sin(a * 3 - S) > gap ? 1 : 0));
      p.glowRing(0, 0, R, 3, C[N - 2], 0.25 * (1 - rk));
    }
    burst(12, S + 5, (r, i) => {
      const a = ((i + r.range(0.1, 0.9)) / 12) * TAU, sp = r.range(90, 170), born = r.range(0.02, 0.05), life = r.range(0.16, 0.3), ag = age - born;
      if (ag < 0 || ag > life) return;
      const q = ag / life, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
      const [x, y] = fly(Math.cos(a) * 5, Math.sin(a) * 5, vx, vy, ag, 90, 5.5), [qx, qy] = flyV(vx, vy, ag, 90, 5.5);
      const head = q < 0.35 ? WHITE : q < 0.7 ? C[N - 1] : C[N - 3];
      streak(p, x, y, qx, qy, clamp(Math.hypot(qx, qy) * 0.035, 1, 5), (u) => (u > 0.5 ? head : C[N - 3]));
      p.light(x, y, C[N - 2], 0.4 * (1 - q));
    });
    const L = 1 - seg(age, 0, 0.3);
    p.glow(0, 0, 26, C[N - 2], 0.45 * L * L);
    p.glow(0, 0, 7, C[N - 1], 0.5 * L);
  }
}
