import { PAL, ramp, burst, fly, seg, ease, clamp, lerp, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Root snare",
  desc: "Roots crack up out of the floor on both sides, spiral up around the target's legs and waist, cinch tight with a jolt, hold, then split and crumble away.",
  tags: ["nature", "plant", "roots", "root", "snare", "debuff", "actor", "one-shot"],
  size: [56, 44],
  origin: [28, 38],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.wood, seed: 23 },
};

const DIRT = ["#2e2418", "#4c3a26", "#6e5638"].map(hex);
const LEAF = ["#2c5a22", "#4f9a3a", "#8ccc52"].map(hex);
const STEPS = 64;

// the two roots: where they break the floor, which way they wind, how high they climb
const ROOTS = [
  { x: -1, dir: 1, turns: 1.4, top: 13, born: 0.02, w: 1 },
  { x: 1, dir: -1, turns: 1.15, top: 9, born: 0.07, w: 0.9 },
];

function point(R, s, t) {
  const cinch = ease.outBack(seg(t, 0.36, 0.44), 3);
  const rad = lerp(8.4, 6.4, cinch) + (1 - s) * (1 - s) * 3.5 + Math.sin(t * 50) * 0.25 * seg(t, 0.44, 0.5) * (1 - seg(t, 0.5, 0.6));
  const th = (R.x < 0 ? Math.PI : 0) + R.dir * s * R.turns * TAU;
  const depth = Math.sin(th);
  return [Math.cos(th) * rad, -1 - s * R.top + depth * 1.5, depth];
}

function roots(p, t, o, front) {
  const C = ramp(o.palette), S = o.seed;
  ROOTS.forEach((R, ri) => {
    const grow = ease.outCubic(seg(t, R.born, R.born + 0.32)), smax = grow;
    if (smax <= 0) return;
    const breakAt = 1.06 + ri * 0.05, segs = [];
    for (let i = 0; i < STEPS; i++) {
      const s0 = i / STEPS, s1 = (i + 1) / STEPS;
      if (s1 > smax) break;
      let [x0, y0, d0] = point(R, s0, t), [x1, y1] = point(R, s1, t);
      if (d0 >= 0 !== front) continue;
      // crumbling: each chunk drops free, the top first, and dithers away
      const chunk = Math.floor(i / 6), cb = breakAt + (1 - s0) * 0.16 + (chunk % 3) * 0.02, ca = t - cb;
      let a = 1;
      if (ca > 0) {
        const vx = ((chunk * 37) % 7 - 3) * 6, dy = 0.5 * 300 * ca * ca, dx = vx * ca;
        x0 += dx, x1 += dx, y0 += dy, y1 += dy;
        a = 1 - seg(ca, 0.12, 0.38);
        if (a <= 0 || y0 > 1) continue;
      }
      const w = lerp(3.6, 2.4, s0) * R.w * (smax - s0 < 0.04 ? 0.7 : 1);
      segs.push({ x0, y0, x1, y1, w, a, d0, knot: i % 7 === 3 && ca < 0 });
    }
    // a dark rind first, then the lit upper face over it, then knots catching the light
    for (const g of segs) p.beam(g.x0, g.y0, g.x1, g.y1, g.w, C[1], g.a);
    const snap = t > 0.4 && t < 0.47; // the cinch: the bark flashes taut for two frames
    for (const g of segs) p.beam(g.x0, g.y0 - 0.45, g.x1, g.y1 - 0.45, g.w - 1.6, front ? (snap ? C[6] : g.d0 > 0.5 ? C[5] : C[4]) : C[3], g.a);
    if (front) for (const g of segs) if (g.knot) p.px(g.x0, g.y0 - 1, C[6]);
  });
  if (!front) return;
  // where the roots broke through: cracked floor and dirt flung up
  for (const R of ROOTS) {
    const gx = R.x < 0 ? -11 : 11, k = 1 - seg(t, 1.2, 1.5);
    if (t > R.born && k > 0) {
      p.line(gx - 3, 0, gx + 3, 0, DIRT[0], k);
      p.px(gx - 4, 1, DIRT[0]), p.px(gx + 2, 1, DIRT[0]);
    }
    burst(6, S + (R.x < 0 ? 1 : 2), (r) => {
      const age = t - R.born - r.range(0, 0.05), life = r.range(0.3, 0.45);
      if (age < 0 || age > life) return;
      const [x, y] = fly(gx + r.range(-2, 2), -1, r.range(-30, 30), -r.range(35, 75), age, 280);
      if (y < 1) p.px(x, y, DIRT[r.int(0, 2)]);
    });
  }
  // the cinch: a jolt, leaves shaken loose, strain lines
  const ck = seg(t, 0.4, 0.62);
  if (ck > 0 && ck < 1) {
    burst(5, S + 5, (r, i) => {
      const a = -Math.PI / 2 + r.range(-1.4, 1.4), sp = r.range(25, 50);
      const [x, y] = fly(Math.cos(a) * 6, -9 + r.range(-4, 4), Math.cos(a) * sp, Math.sin(a) * sp, ck * 0.4, 160, 2);
      p.sprite(i % 2 ? ["ab"] : ["a", "b"], { a: LEAF[0], b: LEAF[2] }, x, y);
    });
    if (ck < 0.4) for (const sx of [-1, 1]) {
      p.line(sx * 10, -16, sx * 12, -18, C[6]);
      p.line(sx * 11, -12, sx * 14, -12, C[6]);
    }
  }
}

export const drawBack = (p, t, o) => roots(p, t, o, false);
export const draw = (p, t, o) => roots(p, t, o, true);
