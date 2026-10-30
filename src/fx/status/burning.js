import { PAL, cycle, tileFbm, loopNoise, clamp, at, TAU } from "../../core/index.js";
import { steps, geom } from "./_lib.js";

export const meta = {
  name: "Burning",
  desc: "Flames lick up the target's outline, tallest off the head and shoulders, tongues curl over the body, embers spit and drift up.",
  tags: ["status", "fire", "burn", "dot", "debuff", "loop"],
  size: [40, 50],
  origin: [20, 45],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.fire, seed: 4 },
};

const heatAt = (g, a, x, y, ph, S, tall) => {
  const nr = g.near(x - a.x, y - a.y);
  if (!nr || nr[0] === 0) return -1;
  const [d, , vy] = nr, up = clamp(-vy / d), src = clamp(1 - (y - a.y - vy) / a.h); // 1 at the head, 0 at the feet
  const n = tileFbm(x * 0.42, y * 0.28 + ph * 8, 0, 8, S, 2) * 0.5 + 0.5;
  const reach = 0.5 + up * up * tall * (0.25 + 1.0 * n) * (0.35 + 0.65 * src) + (1 - up) * 4 * Math.max(0, n - 0.42) * (0.4 + src);
  return [1 - d / reach, n];
};

// behind the body: the flame field around the silhouette, licking highest off upward-facing edges
export function drawBack(p, t, o) {
  const F = steps(o.palette), a = o.actor, g = geom(a.mask), ph = t / meta.duration;
  const FIRE = [F[2], F[3], F[4], F[5], F[6], F[7]];
  p.shade(a.x - 6, a.y - 15, a.x + a.w + 6, 0, (x, y) => {
    const h = heatAt(g, a, x, y, ph, o.seed, 10);
    if (h === -1 || h[0] <= 0) return;
    return at(FIRE, h[0] * 0.95 + h[1] * 0.2);
  });
  const flick = 0.85 + 0.15 * loopNoise(ph, 2, o.seed);
  p.glow(0, a.y + 6, 26 * flick, F[4], 0.32 * flick);
}

// in front: flames curling over the body's edges, tongues rising off it, embers
export function draw(p, t, o) {
  const F = steps(o.palette), a = o.actor, g = geom(a.mask), S = o.seed, D = meta.duration, ph = t / D;
  for (const [mx, my] of g.rim) {
    const x = a.x + mx, y = a.y + my, n = tileFbm(x * 0.42, y * 0.28 + ph * 8, 0, 8, S, 2);
    if (n > 0.3 + (my / a.h) * 0.25) p.px(x, y, n > 0.5 ? F[6] : F[5]);
    p.light(x, y, F[5], 0.2);
  }
  // tongues: little flames peeling off the body and rising
  cycle(t, D, 7, S + 3, (r) => r.range(0.28, 0.4), (age, life, r) => {
    const k = age / life, mx = Math.floor(r.range(0, a.w)), top = g.top[mx];
    if (top >= a.h) return;
    const x = a.x + mx + Math.sin(k * 5 + r.next() * 6) * 1.2, y = a.y + top + r.range(0, 6) - k * r.range(8, 14);
    const s = (1 - k) * r.range(1.1, 1.8);
    p.ellipse(x, y, s * 0.7, s * 1.5, k < 0.4 ? F[6] : F[5]);
    if (k < 0.3) p.px(x, y + 1, F[7]);
  });
  // embers spit up and drift
  cycle(t, D, 8, S + 5, (r) => r.range(0.6, 1), (age, life, r) => {
    const k = age / life, x = a.x + r.range(-1, a.w + 1) + Math.sin(age * r.range(5, 9) + r.next() * TAU) * 2.5 * k;
    const y = a.y + r.range(2, 10) - age * r.range(20, 30);
    if (k > 0.5 && Math.sin(age * 40 + r.next() * 9) < -0.4) return;
    p.px(x, y, k < 0.35 ? F[7] : k < 0.7 ? F[5] : F[4]);
    p.light(x, y, F[5], 0.5 * (1 - k));
  });
  p.glow(0, a.y + 4, 9, F[6], 0.2);
}
