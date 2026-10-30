import { PAL, ramp, at, burst, stream, fly, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { onCanvas } from "./_lib.js";

export const meta = {
  name: "Magic missile",
  desc: "An arcane bolt darts out, weaving toward its mark in tightening swerves and shedding twinkling sparkles, then bursts into a star of light.",
  tags: ["projectile", "magic", "arcane", "homing", "sparkle", "one-shot"],
  size: [112, 48],
  origin: [6, 25],
  duration: 1.05,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, distance: 88, seed: 9 },
};

const HIT = 0.55;

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, TX = o.distance, inside = onCanvas(meta, 1);
  // the path: a straight run with swerves that tighten onto the target
  const pos = (u) => [TX * u, -Math.sin(u * Math.PI * 2.5) * 11 * Math.pow(1 - u, 1.1) + 0.5];
  const prog = (tt) => Math.pow(seg(tt, 0, HIT), 1.25);
  // sparkles shed along the way: they hang, twinkle and fade
  stream(t, 0.02, HIT - 0.03, 40, S, (r) => r.range(0.3, 0.5), (age, life, r, i) => {
    const [x0, y0] = pos(prog(0.02 + i / 40)), k = age / life;
    const x = x0 + r.range(-2.5, 2.5), y = y0 + r.range(-2.5, 2.5) + age * r.range(4, 10);
    if (k > 0.7 && Math.floor((age + r.next()) * 24) % 2) return;
    const twinkle = Math.floor((age + r.next()) * 16) % 3 === 0 && k < 0.6;
    p.px(x, y, k < 0.3 ? WHITE : k < 0.65 ? at(C, 0.8) : at(C, 0.6));
    if (twinkle) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(x + dx, y + dy, at(C, 0.68));
  });
  if (t < HIT) {
    const u = prog(t), [x, y] = pos(u);
    // the ribbon: where it was a moment ago, thinning and cooling
    for (let j = 9; j >= 1; j--) {
      const [qx, qy] = pos(prog(t - j * 0.014)), k = j / 9;
      if (t - j * 0.014 < 0) continue;
      p.circle(qx, qy, 2.4 * (1 - k * 0.85), k < 0.3 ? at(C, 0.7) : k < 0.6 ? at(C, 0.56) : at(C, 0.44));
    }
    // the bolt: a white heart in a violet shell with a four-point glint that turns
    p.circle(x, y, 3, (d) => (d < 0.4 ? WHITE : d < 0.75 ? at(C, 0.86) : at(C, 0.66)));
    const spin = Math.floor(t * 20) % 2, arm = 4;
    for (let s = 1; s <= arm; s++) {
      const c = s < 3 ? WHITE : at(C, 0.8);
      if (spin) (p.px(x + s, y, c), p.px(x - s, y, c), p.px(x, y + s, c), p.px(x, y - s, c));
      else if (s < 3) (p.px(x + s, y + s, c), p.px(x - s, y - s, c), p.px(x + s, y - s, c), p.px(x - s, y + s, c));
    }
    p.glow(x, y, 14, at(C, 0.62), 0.42);
    p.glow(x, y, 5, at(C, 0.9), 0.4);
  }
  // the hit: a white star of rays that shoots out and draws back, a ring, sparkles flung wide
  const te = t - HIT, [tx, ty] = pos(1);
  if (te < 0) return;
  const rays = 1 - seg(te, 0.04, 0.2);
  if (rays > 0) {
    // a four-point star of light, long cardinal rays and short diagonal ones, that shoots out and draws back
    const len = (4 + 11 * ease.outCubic(seg(te, 0, 0.06))) * rays;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, l = i % 2 ? len * 0.4 : len;
      p.line(tx, ty, tx + Math.cos(a) * l, ty + Math.sin(a) * l, (u) => (u < 0.45 ? WHITE : u < 0.8 ? at(C, 0.84) : at(C, 0.66)));
    }
    p.circle(tx, ty, 3 * rays + 1, (d) => (d < 0.6 ? WHITE : at(C, 0.86)));
  }
  const ring = seg(te, 0.1, 0.38);
  if (ring > 0 && ring < 1) p.ring(tx, ty, 6 + 10 * ease.outCubic(ring), 1, at(C, 0.7), 1 - ring);
  burst(12, S + 1, (r) => {
    const a = r.range(0, TAU), v = r.range(50, 110), life = r.range(0.28, 0.46);
    if (te > life) return;
    const k = te / life, [x, y] = fly(tx, ty, Math.cos(a) * v, Math.sin(a) * v, te, 30, 4);
    if (!inside(x, y) || (k > 0.6 && Math.floor(te * 24 + r.next() * 4) % 2)) return;
    p.px(x, y, k < 0.3 ? WHITE : k < 0.6 ? at(C, 0.8) : at(C, 0.6));
    p.light(x, y, at(C, 0.7), 0.4 * (1 - k));
  });
  p.glow(tx, ty, 26, at(C, 0.62), 0.6 * clamp(1 - te / 0.4) ** 2);
}
