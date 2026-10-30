import { PAL, ramp, burst, fly, seg, ease, clamp, lerp, smooth, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Vine whip",
  desc: "A thorny vine bursts from the ground coiled back, then lashes right: the curl unrolls to the tip, which cracks in a spray of sap and leaves, and the vine slithers home.",
  tags: ["nature", "plant", "vine", "whip", "melee", "directional", "one-shot"],
  size: [100, 64],
  origin: [26, 56],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.leaf, length: 56, seed: 17 },
};

const THORN = ["#5a4a24", "#a8925a", "#e6d8a0"].map(hex);
const DIRT = ["#2e2418", "#4c3a26", "#6e5638"].map(hex);
const N = 30;

// the vine's centerline at time t: N + 1 points along its length, base on the floor
function path(t, L) {
  const lash = seg(t, 0.13, 0.26); // the unrolling wave runs from base to tip
  const settle = seg(t, 0.26, 0.46);
  const ds = (L * (0.6 + 0.4 * ease.outCubic(lash))) / N, pts = [[0, 0]];
  let x = 0, y = 0;
  for (let i = 0; i < N; i++) {
    const u = i / N;
    const wound = -1.7 - 1.25 * Math.pow(u, 1.2); // reared up and back, the tip hanging behind
    const lashed = -1.45 + 1.62 * Math.pow(u, 0.5); // up out of the ground, then out flat to the right
    const w = smooth(0, 1, lash * 1.7 - u * 0.7);
    const flick = Math.sin(settle * Math.PI * 2.5) * (1 - settle) * 0.5 * u * u; // the tip overshoots and wobbles
    const droop = ease.inQuad(seg(t, 0.46, 0.75)) * 0.8 * u; // and wilts as it pulls back
    const a = lerp(wound, lashed, w) + flick + droop + Math.sin(t * 9 + u * 5) * 0.04;
    x += Math.cos(a) * ds;
    y += Math.sin(a) * ds;
    pts.push([x, y]);
  }
  return pts;
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, L = o.length;
  const grow = ease.outCubic(seg(t, 0, 0.1)), back = ease.inCubic(seg(t, 0.48, 0.78));
  const pts = path(t, L);
  const len = N * grow, off = N * back; // vine points [0, len) are out, slid back `off` points into the ground
  const at = (s) => {
    const u = s - off;
    if (u < 0) return null;
    const i = Math.min(N - 1, Math.floor(u)), f = u - i, a = pts[i], b = pts[i + 1];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
  };
  // dirt kicked up where it breaks the ground
  burst(7, S + 3, (r) => {
    const age = t - r.range(0, 0.06), life = r.range(0.3, 0.5);
    if (age < 0 || age > life) return;
    const [x, y] = fly(r.range(-2, 2), -1, r.range(-40, 40), -r.range(30, 70), age, 260);
    if (y < 1) p.px(x, y, DIRT[r.int(0, 2)]);
  });
  // the body: a tapering tube, dark rim, bright core
  for (let s = 0; s < len - 0.5; s += 0.5) {
    const P = at(s), Q = at(s + 0.5);
    if (!P || !Q) continue;
    const w = 1.4 + 2.8 * (1 - s / N);
    p.beam(P[0], P[1], Q[0], Q[1], w, (u, v) => (v > 0.55 ? C[2] : C[4]));
  }
  for (let s = 0; s < len - 1; s += 1) {
    const P = at(s), Q = at(s + 1);
    if (P && Q && s < N * 0.85) p.line(P[0], P[1] - 1, Q[0], Q[1] - 1, s % 6 < 3 ? C[5] : C[4]);
  }
  // thorns: hooked spikes along the outside of the curve, leaves at two joints
  for (let j = 0; j < 9; j++) {
    const s = 3 + j * 3.1;
    if (s > len - 1) break;
    const P = at(s), Q = at(s + 0.6);
    if (!P || !Q) continue;
    const dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy) || 1, side = j % 2 ? 1 : -1;
    const nx = (-dy / l) * side, ny = (dx / l) * side, sz = 2.5 - j * 0.12;
    const bx = P[0] + nx * 1.2, by = P[1] + ny * 1.2, tx = bx + nx * sz - (dx / l) * 1.2, ty = by + ny * sz - (dy / l) * 1.2;
    p.line(bx, by, tx, ty, THORN[1]);
    p.px(tx, ty, THORN[2]);
  }
  for (const [s, side] of [[8, 1], [17, -1]]) {
    if (s > len - 1) continue;
    const P = at(s);
    if (!P) continue;
    p.sprite(side > 0 ? [".ab", "ab."] : ["ba.", ".ba"], { a: C[3], b: C[5] }, P[0] - 1, P[1] - (side > 0 ? 3 : -1));
  }
  // the smear: where the tip has just been during the lash
  if (t > 0.15 && t < 0.32 && off === 0) {
    let prev = null;
    for (let i = 0; i < 7; i++) {
      const tt = t - i * 0.014, q = path(tt, L)[N];
      if (prev) p.line(prev[0], prev[1], q[0], q[1], i < 3 ? C[7] : C[6], 1 - i / 7);
      prev = q;
    }
  }
  // the crack: a star of light at the tip, sap and leaf bits thrown forward
  const tip = pts[N], ck = seg(t, 0.25, 0.38);
  if (ck > 0 && ck < 1) {
    const s = Math.round(4 * (1 - ck) + 1);
    p.line(tip[0] - s, tip[1], tip[0] + s, tip[1], C[7]);
    p.line(tip[0], tip[1] - s, tip[0], tip[1] + s, C[7]);
    if (ck < 0.35) p.circle(tip[0], tip[1], 2, C[7]);
    p.glow(tip[0], tip[1], 14, C[6], 0.5 * (1 - ck));
  }
  burst(9, S, (r, i) => {
    const age = t - 0.26 - r.range(0, 0.03), life = r.range(0.28, 0.45);
    if (age < 0 || age > life) return;
    const a = r.range(-1.3, 0.8), sp = r.range(35, 70);
    const [x, y] = fly(tip[0], tip[1], Math.cos(a) * sp, Math.sin(a) * sp, age, 180, 2.5), k = age / life;
    if (y > 0) return;
    if (i < 3) p.sprite(k < 0.5 ? ["ab", "b."] : ["b.", "ab"], { a: C[3], b: C[5] }, x, y);
    else p.px(x, y, k < 0.4 ? C[7] : C[5]);
  });
  p.glow(tip[0] * 0.6, tip[1] * 0.6, 26, C[4], 0.12 * clamp(grow - back));
}
