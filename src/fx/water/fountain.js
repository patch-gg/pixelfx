import { PAL, cycle, tileNoise, fract, TAU } from "../../core/index.js";
import { fit, ripple, drop, landTime, STONE } from "./_lib.js";

export const meta = {
  name: "Fountain",
  desc: "A stone basin with a jet shooting up the middle; it blooms at the top and falls back in arcs of droplets that splash and ring the pool.",
  tags: ["water", "fountain", "jet", "basin", "prop", "ambient", "loop"],
  size: [72, 72],
  origin: [36, 66],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, height: 46, seed: 8 },
};

const BY = -9, BRX = 27, BRY = 6, G = 240; // basin rim height and radii, gravity
// the steady streams: launch speed (x, y) and depth (- far, + near)
const STREAMS = [[-24, -16, -0.5], [-15, -26, 0.5], [-8, -34, -0.2], [9, -32, 0.3], [16, -24, -0.4], [23, -15, 0.6]];

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, D = meta.duration, ph = t / D, A = -o.height;
  // the basin: a stone drum with a lit rim, the pool inside
  p.ellipse(0, -3, BRX, BRY, (d, a) => (Math.sin(a) > 0 && d > 0.85 ? STONE[1] : STONE[2]));
  p.rect(-BRX, BY, BRX * 2, -3 - BY, (/* wall */ STONE[2]));
  for (let y = BY; y < -3; y++) p.px(-BRX, y, STONE[3]), p.px(BRX - 1, y, STONE[1]);
  p.ellipse(0, BY, BRX, BRY, (d, a) => (d > 0.82 ? (Math.sin(a) < 0 ? STONE[4] : STONE[5]) : STONE[3]));
  p.ellipse(0, BY, BRX - 4, BRY - 1.6, (d, a) => (d > 0.86 && Math.sin(a) < 0 ? W[1] : d < 0.55 && Math.sin(a) < -0.2 ? W[3] : W[2]));
  // rings around the foot of the jet
  for (let i = 0; i < 2; i++) {
    const k = fract(ph * 2 + i / 2), rr = 4 + k * 15;
    ripple(p, 0, BY, rr, rr * 0.2, W[4], W[4], 1.3 * (1 - k), S + i);
  }
  // streams: steady arcs from the bloom down into the pool, bright dashes running along them, breaking up low
  const streams = (front) => STREAMS.forEach(([vx, vy, z], i) => {
    if (z > 0 !== front) return;
    const land = BY + z * 2.6, y0 = A + 2, tl = landTime(y0, vy, G, land);
    let px = null, py = null;
    for (let s = 0; s <= tl; s += 0.012) {
      const x = vx * s, y = y0 + vy * s + 0.5 * G * s * s, x1 = Math.round(x), y1 = Math.round(y);
      if (x1 === px && y1 === py) continue;
      px = x1, py = y1;
      const dash = fract(s / 0.1 - ph * 12 + i * 0.37), u = s / tl;
      if (u > 0.68 && dash > 1.45 - u) continue;
      p.px(x, y, dash < 0.3 ? (front ? W[7] : W[6]) : front ? W[6] : W[5]);
    }
  });
  // falling droplets: launched from the bloom, arcing out and down into the pool, each ending in a splash
  const arcs = (front) => cycle(t, D, 30, S, (r) => r.range(0.55, 0.8), (age, life, r) => {
    const z = r.range(-1, 1), side = r.sign();
    if (z > 0 !== front) return;
    const vx = side * r.range(10, 28), vy = -r.range(8, 34), x0 = side * 1, y0 = A + 2, land = BY + z * 2.6;
    const tl = landTime(y0, vy, G, land);
    if (age < tl) {
      const x = x0 + vx * age, y = y0 + vy * age + 0.5 * G * age * age;
      drop(p, x, y, vx, vy + G * age, front ? W[7] : W[6], front ? W[5] : W[4], 0.03);
    } else {
      const a = age - tl, lx = x0 + vx * tl;
      if (a < 0.05) p.px(lx - 1, land - 1, W[6]), p.px(lx + 1, land - 1, W[6]);
      else if (a < 0.1) p.px(lx - 2, land - 2, W[5]), p.px(lx + 2, land - 2, W[5]);
      if (a > 0.03) ripple(p, lx, land, 1 + a * 9, (1 + a * 9) * 0.3, W[5], W[4], 1.4 * (1 - a / (life - tl)), S + vx);
    }
  });
  streams(false);
  arcs(false);
  // the jet: a column of streaks racing upward, wider at the foot, blooming at the top
  p.shade(-3, A - 2, 3, BY, (x, y) => {
    const v = (BY - y) / (BY - A), w = 1.9 - v * 0.6 + (v > 0.94 ? 1.2 : 0);
    if (Math.abs(x) > w) return;
    const n = tileNoise(x * 0.8, y * 0.16 + ph * 12, 0, 12, S);
    if (Math.abs(x) > w - 0.9) return x < 0 ? W[6] : W[4];
    return n > 0.15 ? W[7] : W[6];
  });
  // the foot: a churn of white where the jet leaves the pool
  for (let i = 0; i < 5; i++) {
    const a = ph * TAU * 2 + i * 1.3, r = 3 + Math.sin(a * 1.7) * 0.8;
    p.px(Math.cos(a) * r, BY - 1 + Math.sin(a) * 0.8, W[7]);
  }
  p.rect(-3, BY - 1, 7, 1, W[6]);
  streams(true);
  arcs(true);
  p.glow(0, A + 2, 12, W[6], 0.18);
  p.glow(0, BY, 20, W[5], 0.1);
}
