import { PAL, RAMP, ramp, at, rng, burst, fly, seg, ease, lerp, TAU, WHITE } from "../../core/index.js";
import { smoke, onCanvas } from "./_lib.js";

export const meta = {
  name: "Shotgun blast",
  desc: "A wide cone of flame with a white throat, a spray of pellets streaking out, burning powder and a heavy cloud of smoke that rolls forward and rises.",
  tags: ["projectile", "muzzle", "gun", "shotgun", "flash", "directional", "one-shot"],
  size: [80, 46],
  origin: [5, 25],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, spread: 0.36, pellets: 9, seed: 5 },
};

const F = 1 / 30;

/** The cone: a fan as wide as the spread, flat across its front, torn into tongues of flame. Returns points. */
function conePts(T, spread, L, x0, y0, k, base = 2.6, n = 120) {
  const pts = [], m = T.length - 1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI, q = Math.abs(a) / spread;
    let R = base;
    if (q < 1) {
      const f = (a / spread * 0.5 + 0.5) * m, j = Math.min(m - 1, Math.floor(f)), w = f - j;
      const tongue = T[j] + (T[j + 1] - T[j]) * w, notch = 1 - 0.3 * Math.abs(Math.sin(f * Math.PI));
      R += L * (1 - q ** 5) * tongue * notch;
    }
    pts.push([x0 + Math.cos(a) * R * k, y0 + Math.sin(a) * R * k]);
  }
  return pts;
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, sp = o.spread, inside = onCanvas(meta), cy = 0.5;
  // smoke: a thick cloud shoved out in front of the barrel, slowing, then rolling up and thinning out
  const puffs = [];
  burst(9, S + 4, (q, i) => {
    const age = t - 0.03 - q.range(0, 0.05), life = q.range(0.6, 0.74);
    if (age < 0 || age > life) return;
    const u = age / life, e = ease.outQuart(seg(age, 0, 0.32)), reach = 5 + (i / 8) * 26 + q.range(-2, 2);
    puffs.push({
      x: 3 + reach * e + age * 5, y: cy + q.range(-0.5, 0.5) * reach * sp * e - u * u * q.range(10, 18),
      r: (2.5 + reach * 0.12) * (0.55 + 0.45 * e) * (1 + 0.5 * u), v: 1 - u * u,
    });
  });
  smoke(p, puffs, RAMP.smoke, { base: 0.58, seed: S, inside });
  // pellets: streaks racing out of the cone, gone off the edge in a few frames
  burst(o.pellets, S + 2, (q) => {
    const a = q.range(-sp, sp) * 0.8, v = q.range(520, 700), d = 6 + v * (t + q.range(0, 0.012)), len = q.range(6, 10);
    const x = Math.cos(a) * d, y = cy + Math.sin(a) * d, x1 = x - Math.cos(a) * len, y1 = y - Math.sin(a) * len;
    if (!inside(x1, y1)) return;
    p.line(x, y, x1, y1, (u) => (u < 0.2 ? WHITE : at(C, 0.8 - u * 0.35)), (u) => (inside(lerp(x, x1, u), lerp(y, y1, u)) ? 1 : 0));
  });
  // the flash: a fat cone for one frame, a cooler ragged one torn forward the next, then tongues that peel off
  const r = rng(S, 1), T = Array.from({ length: 9 }, () => r.range(0.75, 1.05));
  const fan = sp * 2.1;
  if (t < F) {
    p.poly(conePts(T, fan, 23, 0, cy, 1), at(C, 0.56));
    p.poly(conePts(T, fan, 23, 1, cy, 0.66, 2), at(C, 0.8));
    p.ellipse(3.5, cy, 4, 2.6, WHITE);
  } else if (t < 2 * F) {
    p.poly(conePts(T, fan, 23, 3, cy, 1.05), at(C, 0.44), (x) => (x < 10 ? 0 : 1));
    p.poly(conePts(T, fan, 23, 4, cy, 0.8, 2), at(C, 0.64), (x) => (x < 11 ? 0 : 1));
    p.circle(1.5, cy, 1.6, at(C, 0.84));
  } else if (t < 3 * F) {
    // the flame front carries on alone as a ragged arc, then it's gone
    p.poly(conePts(T, fan, 24, 0, cy, 1.05), at(C, 0.42), (x, y) => (Math.hypot(x, y - cy) > 15 ? 1 : 0));
    p.poly(conePts(T, fan, 24, 0, cy, 0.98), at(C, 0.56), (x, y) => (Math.hypot(x, y - cy) > 17.5 ? 1 : 0));
  }
  // burning powder: embers thrown forward that fall and wink out
  burst(9, S + 3, (q) => {
    const a = q.range(-sp, sp) * 1.2, v = q.range(80, 200), life = q.range(0.2, 0.45);
    if (t > life) return;
    const u = t / life, [x, y] = fly(4, cy, Math.cos(a) * v, Math.sin(a) * v, t, 140, 3.5);
    if (u > 0.6 && (t * 30 + q.next() * 4) % 3 < 1) return;
    p.px(x, y, u < 0.3 ? at(C, 0.9) : u < 0.65 ? at(C, 0.68) : at(C, 0.48));
    p.light(x, y, at(C, 0.7), 0.35 * (1 - u));
  });
  const L = 1 - seg(t, 0, 0.16);
  p.glow(10, cy, 28, at(C, 0.66), 0.6 * L * L);
  if (t < F) p.glow(4, cy, 9, WHITE, 0.5);
}
