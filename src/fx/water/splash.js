import { PAL, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { fit, oval, ripple, drop, landTime } from "./_lib.js";

export const meta = {
  name: "Splash",
  desc: "A drop plunges into water: a white flash, a spiky crown leaps up and sheds droplets, a jet bounces back, rings spread.",
  tags: ["water", "splash", "impact", "drop", "liquid", "one-shot"],
  size: [84, 52],
  origin: [42, 40],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, size: 1, seed: 2 },
};

const T0 = 0.1, Q = 0.3, G = 430; // impact time, how flat the surface looks, gravity

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, k = o.size, tau = t - T0;
  // the drop falls in, stretched by its speed
  if (tau < 0) {
    const y = -32 + 32 * (t / T0);
    p.line(0, y - 6, 0, y - 3, W[4]);
    p.rect(-1, y - 3, 2, 3, W[5]);
    p.px(0, y - 1, W[7]);
    return;
  }
  // rings spread from the impact and fade
  for (const [t0, t1, r0, r1] of [[0, 0.95, 6, 30], [0.12, 1.0, 3, 19]]) {
    const u = seg(tau, t0, t1);
    if (u <= 0 || u >= 1) continue;
    const r = (r0 + (r1 - r0) * ease.outCubic(u)) * k;
    ripple(p, 0, 0, r, r * Q, u < 0.2 ? W[7] : W[6], W[5], 1.3 * (1 - seg(u, 0.3, 1)), S + r0);
  }
  // the crown: a wall of water flaring out, its rim torn into spikes, back half darker
  const grow = ease.outCubic(seg(tau, 0, 0.13)), sink = ease.inQuad(seg(tau, 0.12, 0.42));
  const H = 15 * k * grow * (1 - sink), R0 = (2.5 + 6 * ease.outCubic(seg(tau, 0, 0.5))) * k, Rt = R0 + H * 0.5;
  const N = 9, spin = S * 0.7;
  const tip = (a) => H * (0.55 + 0.45 * Math.pow(Math.abs(Math.cos((a * N) / 2 + spin)), 5));
  if (H > 0.6) {
    const da = 0.2 / Rt;
    for (const front of [false, true])
      for (let a = -Math.PI; a < Math.PI; a += da) {
        const s = Math.sin(a);
        if (s > 0 !== front) continue;
        const h = tip(a), bx = Math.cos(a) * R0, by = s * R0 * Q, tx = Math.cos(a) * Rt, ty = s * Rt * Q - h;
        p.line(bx, by, tx, ty, front ? (u) => (u > 0.82 ? W[6] : u > 0.4 ? W[5] : W[4]) : (u) => (u > 0.8 ? W[5] : W[3]));
        if (front && h > H * 0.9) p.px(tx, ty, W[7]);
      }
  }
  // droplets torn off the spikes: thrown out and up, falling back to the surface with a tiny ring
  burst(14, S, (r, i) => {
    const a = (i / 14) * TAU + r.range(-0.2, 0.2), born = r.range(0.07, 0.15), age = tau - born;
    if (age < 0) return;
    const g0 = ease.outCubic(seg(born, 0, 0.13)), h0 = 15 * k * g0, R = (2.5 + 6 * ease.outCubic(seg(born, 0, 0.5))) * k + h0 * 0.5;
    const x0 = Math.cos(a) * R, y0 = Math.sin(a) * R * Q - h0 * r.range(0.8, 1);
    const vx = Math.cos(a) * r.range(22, 50) * k, vy = -r.range(60, 105) * k, land = Math.sin(a) * (R + 10) * Q;
    const tl = landTime(y0, vy, G, land);
    if (age < tl) {
      const x = x0 + vx * age, y = y0 + vy * age + 0.5 * G * age * age;
      const big = r.next() < 0.4;
      drop(p, x, y, vx, vy + G * age, W[7], Math.sin(a) > 0 ? W[5] : W[4], 0.025);
      if (big) p.px(x + 1, y, W[6]);
    } else if (age < tl + 0.2) {
      const u = (age - tl) / 0.2, lx = x0 + vx * tl;
      ripple(p, lx, land, 1 + u * 2, (1 + u * 2) * Q, W[5], W[4], 1.4 * (1 - u), i);
    }
  });
  // the jet bounces back up the middle and drops a bead
  const tj = tau - 0.26;
  if (tj > 0) {
    const up = ease.outCubic(seg(tj, 0, 0.12)), down = ease.inQuad(seg(tj, 0.12, 0.32)), hj = 13 * k * up * (1 - down);
    if (hj > 0.5) {
      p.rect(-1, -hj, 3, hj, W[5]);
      p.line(0, -hj, 0, -1, W[6]);
      p.px(0, -hj, W[7]);
    }
    const tb = tj - 0.12;
    if (tb > 0) {
      const vy = -45 * k, y0 = -13 * k - 2, tl = landTime(y0, vy, G, 0);
      if (tb < tl) {
        const y = y0 + vy * tb + 0.5 * G * tb * tb;
        p.rect(-1, y - 1, 2, 2, W[6]);
        p.px(0, y - 1, W[7]);
      } else if (tb < tl + 0.3) {
        const u = (tb - tl) / 0.3;
        ripple(p, 0, 0, 2 + u * 7, (2 + u * 7) * Q, W[6], W[5], 1.4 * (1 - u), 5);
      }
    }
  }
  // the hit: a flat white flash on the surface for two frames
  if (tau < 0.07) {
    oval(p, 0, 0, 7 * k, 2, WHITE);
    p.rect(-4, -1, 9, 2, WHITE);
    p.glow(0, -2, 22, W[5], 0.35);
  }
  p.glow(0, -6, 18, W[5], 0.12 * (1 - seg(tau, 0, 0.5)));
}
