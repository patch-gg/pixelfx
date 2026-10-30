import { ramp, rng, burst, fly, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { streak } from "./_lib.js";

export const meta = {
  name: "Critical hit",
  desc: "A loud crit: a jagged red-to-white comic starburst punches in with overshoot, shudders, then breaks into a ring, streaks and shards.",
  tags: ["impact", "hit", "critical", "crit", "combat", "comic", "one-shot"],
  size: [72, 72],
  origin: [36, 36],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a0508", "#7a0d14", "#c81c1c", "#ff5a1a", "#ffb424", "#fff07a", "#ffffff"],
    spikes: 12,
    size: 1,
    seed: 8,
  },
};

// the burst outline: alternating tips and notches, uneven like an inked comic burst
function burstPts(n, R, Ri, r) {
  const pts = [];
  for (let j = 0; j < 2 * n; j++) {
    const a = (j * Math.PI) / n + r.range(-0.09, 0.09);
    const rad = j % 2 ? Ri * r.range(0.82, 1.12) : R * (j % 4 === 0 ? 1 : 0.8) * r.range(0.78, 1.14);
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  return pts;
}

// how far the outline is from the center along angle ang (the ray meets one of the edges near its slot)
function edgeR(pts, ang) {
  const m = pts.length, ux = Math.cos(ang), uy = Math.sin(ang);
  const j0 = Math.floor((((ang % TAU) + TAU) % TAU) / (TAU / m));
  for (const dj of [0, -1, 1, -2, 2]) {
    const j = (j0 + dj + m) % m, [ax, ay] = pts[j], [bx, by] = pts[(j + 1) % m], ex = bx - ax, ey = by - ay;
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const sAlong = (ax * uy - ay * ux) / den, tRay = (ax * ey - ay * ex) / den;
    if (sAlong >= -1e-6 && sAlong <= 1 + 1e-6 && tRay > 0) return tRay;
  }
  return 0;
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, k = o.size, n = clamp(Math.round(o.spikes), 8, 20), N = C.length - 1;
  const fi = Math.floor(t * meta.fps + 1e-6);
  // the burst: frame 0 a white flash, then it slams in past full size, shudders for a few frames, collapses
  const grow = ease.outBack(seg(t, 0, 0.07), 3.2), fall = ease.inQuad(seg(t, 0.13, 0.2));
  const s = (0.62 + 0.38 * grow) * (1 - fall);
  if (s > 0.05) {
    const shake = t > 0.04 && t < 0.13, jx = shake ? [1, -1, 0, 1][fi % 4] : 0, jy = shake ? [0, 1, -1, -1][fi % 4] : 0;
    const pts = burstPts(n, 28 * k, 15 * k, rng(S, fi % 2 && shake ? 2 : 1));
    // nested copies of the outline, outer to inner: an inked rim stepping in to a white core (one pass)
    const flash = t < 0.033, cool = seg(t, 0.12, 0.22);
    const bands = flash ? [C[N - 2], C[N - 1], WHITE] : [...C.slice(0, N), WHITE], nb = bands.length;
    const scale = bands.map((c, b) => s * (flash ? 1 - b / 3.4 : b ? 0.94 * (1 - (b - 1) / (nb - 0.6)) * (1 - cool * 0.5) : 1));
    const R = 28 * k * 1.14 * s + 1;
    p.shade(jx - R, jy - R, jx + R, jy + R, (x, y) => {
      const dx = x - jx, dy = y - jy, d = Math.hypot(dx, dy), e = edgeR(pts, Math.atan2(dy, dx));
      let c = 0;
      for (let b = 0; b < nb; b++) if (d < e * scale[b]) c = bands[b];
      return c;
    });
  }
  // the ring the burst leaves behind: fat and yellow, torn into arcs, thinning to red as it runs out
  const rk = seg(t, 0.14, 0.42);
  if (rk > 0 && rk < 1) {
    const R = (17 + 15 * ease.outCubic(rk)) * k, W = 4 * (1 - rk) * k, gap = -2 + 3.7 * Math.pow(rk, 1.3);
    p.ring(0, 0, R, Math.max(1, W), rk < 0.25 ? C[N - 1] : rk < 0.5 ? C[N - 2] : rk < 0.75 ? C[3] : C[2],
      (v, ang) => (Math.sin(ang * 5 + S) + Math.sin(ang * 3 - S * 2) > gap ? 1 : 0));
    p.glowRing(0, 0, R, 5, C[N - 2], 0.3 * (1 - rk) * (1 - rk));
  }
  // streaks shot out radially as it breaks: long and white first, shrinking to red dashes
  burst(14, S + 1, (r, i) => {
    const a = ((i + r.range(-0.3, 0.3)) / 14) * TAU, born = r.range(0.12, 0.15), life = r.range(0.12, 0.18), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, d = (13 + r.range(14, 21) * ease.outCubic(q)) * k, len = r.range(8, 13) * (1 - q * 0.8) * k;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    streak(p, x, y, Math.cos(a), Math.sin(a), len, (u) => (u > 0.55 ? (q < 0.45 ? WHITE : C[N - 1]) : u > 0.25 ? C[N - 2] : C[3]));
    p.light(x, y, C[N - 2], 0.5 * (1 - q));
  });
  // shards: little spinning red-orange triangles thrown out, falling, shrinking away
  burst(8, S + 2, (r, i) => {
    const a = ((i + r.range(0.1, 0.9)) / 8) * TAU, sp = r.range(60, 105) * k, born = r.range(0.13, 0.17), life = r.range(0.22, 0.32), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - 25;
    const [x, y] = fly(Math.cos(a) * 9 * k, Math.sin(a) * 9 * k, vx, vy, age, 150, 3.5);
    const sz = r.range(1.8, 3) * k * (1 - q * 0.7), spin = r.range(-14, 14) * age + r.range(0, TAU);
    const pts = [0, 1, 2].map((j) => [x + Math.cos(spin + (j * TAU) / 3) * sz * (j ? 1 : 1.6), y + Math.sin(spin + (j * TAU) / 3) * sz * (j ? 1 : 1.6)]);
    if (sz > 1.1) p.poly(pts, q < 0.35 ? C[N - 2] : q < 0.7 ? C[3] : C[2]);
    if (q < 0.75) p.px(x, y, q < 0.4 ? C[N - 1] : C[3]);
  });
  // light: blinding for a moment, then gone
  const L = 1 - seg(t, 0, 0.32);
  p.glow(0, 0, 40 * k, C[N - 2], 0.5 * L * L);
  p.glow(0, 0, 12 * k, C[N - 1], 0.55 * L);
}
