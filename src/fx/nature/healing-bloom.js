import { PAL, ramp, burst, fly, seg, ease, clamp, lerp, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Healing bloom",
  desc: "A sprout shoots up and a bud swells and opens into a flower with a glowing heart; a ring of green light pulses out and the petals lift off as glowing motes.",
  tags: ["nature", "heal", "flower", "plant", "buff", "ground", "one-shot"],
  size: [64, 64],
  origin: [32, 56],
  duration: 2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.heal, seed: 37 },
};

const PETAL = ["#7a2e5a", "#c4508a", "#f08ab8", "#ffc8de", "#fff4f8"].map(hex);
const STALK = ["#163a1c", "#2c6a2c", "#4c9a3a", "#86cc58"].map(hex);
const N = 6;
const T_OPEN = 0.45;

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed;
  const out = 1 - seg(t, 1.45, 1.85); // the whole plant shrinks back into the floor at the end
  const grow = ease.outCubic(seg(t, 0, 0.3)) * ease.outQuad(out);
  const H = 18 * grow;
  if (H > 0.5) {
    // the stalk with a slight S curve, two leaves unfurling off it
    const sway = Math.sin(t * 5) * 0.6 * seg(t, 0.3, 0.6);
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const v = i / 8;
      pts.push([Math.sin(v * Math.PI) * 1.4 + sway * v, -v * H]);
    }
    for (let i = 1; i < pts.length; i++) {
      p.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], STALK[2]);
      p.px(pts[i][0] + 1, pts[i][1], STALK[1]);
    }
    const lf = ease.outBack(seg(t, 0.12, 0.35), 2) * out;
    if (lf > 0.1) {
      const ly = -H * 0.35, l = 5 * lf;
      p.poly([[1, ly], [1 + l * 0.6, ly - l * 0.7], [1 + l * 1.2, ly - l * 0.4], [1 + l * 0.5, ly + 0.5]], STALK[3]);
      p.line(1, ly, 1 + l * 1.1, ly - l * 0.45, STALK[2]);
      const ry = -H * 0.55;
      p.poly([[0, ry], [-l * 0.6, ry - l * 0.7], [-l * 1.2, ry - l * 0.4], [-l * 0.5, ry + 0.5]], STALK[2]);
      p.line(0, ry, -l * 1.1, ry - l * 0.45, STALK[1]);
    }
  }
  const head = [Math.sin(Math.PI) * 1.4 + Math.sin(t * 5) * 0.6 * seg(t, 0.3, 0.6), -H];
  // the bud swells, then the petals unfold outward with an overshoot
  const bud = ease.outBack(seg(t, 0.2, 0.4), 2) * out;
  const open = ease.outBack(seg(t, T_OPEN, T_OPEN + 0.22), 1.8);
  const lift = seg(t, 1.0, 1.5); // the petals let go one by one
  for (let i = 0; i < N; i++) {
    const a0 = -Math.PI / 2 + ((i - (N - 1) / 2) / N) * Math.PI * 1.25;
    const free = seg(lift, i / N * 0.6, i / N * 0.6 + 0.3);
    if (free > 0) continue;
    const a = lerp(-Math.PI / 2 + (a0 + Math.PI / 2) * 0.15, a0, open), len = lerp(3, 8, Math.min(1, open)) * bud;
    if (len < 1) continue;
    const x1 = head[0] + Math.cos(a) * len, y1 = head[1] + Math.sin(a) * len;
    p.beam(head[0], head[1], x1, y1, 3.6 * Math.min(1, bud), (u, v) => (v > 0.62 ? PETAL[1] : u > 0.72 ? PETAL[3] : PETAL[2]));
    if (open > 0.5) p.px(head[0] + Math.cos(a) * (len - 1.5), head[1] + Math.sin(a) * (len - 1.5) - 0.5, PETAL[4]);
  }
  if (bud > 0.2 && lift < 1) {
    // the heart: gold-green, glowing hard as it opens
    const hk = open > 0 ? 1 : 0.5;
    p.circle(head[0], head[1], 1.6 * Math.min(1, bud), open > 0 ? C[6] : STALK[3]);
    if (open > 0) p.px(head[0], head[1], C[7]);
    p.glow(head[0], head[1], 16, C[5], 0.35 * hk * (1 - lift));
  }
  // the pulse: a flash and a ring of healing light spreading over the floor
  const pk = seg(t, T_OPEN, T_OPEN + 0.5);
  if (pk > 0 && pk < 1) {
    const r = 4 + 24 * ease.outCubic(pk);
    p.ellipse(0, 0, r, r * 0.22, pk < 0.4 ? C[7] : C[5], (d) => (d > 1 - 0.3 * (1 - pk) ? 1 : 0));
    p.glowRing(0, 0, r * 0.6, 6, C[5], 0.25 * (1 - pk));
    if (pk < 0.12) p.circle(head[0], head[1], 5, C[7]);
  }
  // petals set free: lift and spiral up, turning into glowing motes
  burst(N, S, (r, i) => {
    const born = 1.0 + (i / N) * 0.3, age = t - born, life = r.range(0.55, 0.72);
    if (age < 0 || age > life) return;
    const k = age / life, a0 = -Math.PI / 2 + ((i - (N - 1) / 2) / N) * Math.PI * 1.25;
    const x = head[0] + Math.cos(a0) * 6 + Math.sin(age * 7 + i) * 3, y = head[1] + Math.sin(a0) * 6 - ease.outQuad(k) * 22;
    if (k < 0.45) p.sprite(age * 12 % 2 < 1 ? ["ab", "b."] : [".a", "ab"], { a: PETAL[2], b: PETAL[4] }, x, y);
    else p.px(x, y, k < 0.75 ? C[7] : C[6]);
    p.light(x, y, C[5], 0.5 * (1 - k));
  });
  // healing motes rising around the flower
  burst(14, S + 1, (r) => {
    const born = T_OPEN + r.range(0, 0.8), age = t - born, life = r.range(0.55, 0.75);
    if (age < 0 || age > life) return;
    const k = age / life, x = r.range(-14, 14) + Math.sin(age * 6 + r.next() * TAU), y = -r.range(0, 8) - age * r.range(22, 36);
    const plus = r.next() < 0.3 && k < 0.6;
    if (plus) p.px(x - 1, y, C[5]), p.px(x + 1, y, C[5]), p.px(x, y - 1, C[5]), p.px(x, y + 1, C[5]);
    p.px(x, y, k < 0.5 ? C[7] : C[5]);
    p.light(x, y, C[5], 0.4 * (1 - k));
  });
  p.glow(0, -10, 34, C[4], 0.22 * seg(t, T_OPEN - 0.1, T_OPEN + 0.1) * (1 - seg(t, 1.2, 1.9)));
}
