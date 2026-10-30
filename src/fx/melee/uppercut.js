import { PAL, ramp, burst, fly, seg, ease, star, clamp, WHITE } from "../../core/index.js";
import { swing } from "./_lib.js";

export const meta = {
  name: "Uppercut",
  desc: "A rising punch: a swoosh hooks up from the hip past the face, and a fat comic star bursts where the fist lands up high.",
  tags: ["melee", "punch", "uppercut", "brawler", "launcher", "combat", "directional", "one-shot"],
  size: [56, 62],
  origin: [16, 52],
  duration: 0.45,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.volt, size: 1, seed: 12 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), k = o.size, S = o.seed, top = C.length - 1;
  const cx = 1, cy = -13 * k, R = 15 * k, A0 = 0.8, A1 = -1.42; // from the hip, up and round past the face
  const lead = ease.outQuart(seg(t + 0.02, 0, 0.1)), tail = ease.inCubic(seg(t, 0.02, 0.2));
  swing(p, { cx, cy, r: R, w: 8 * k, from: A0, to: A1, lead, tail, C, rimAt: 0.74 });
  const la = A0 + (A1 - A0) * lead;
  if (t < 0.18) p.glow(cx + Math.cos(la) * (R - 3), cy + Math.sin(la) * (R - 3), 14 * k, C[top - 2], 0.4 * (1 - seg(t, 0.08, 0.18)));
  // rising speed lines beside the swoosh
  burst(4, S + 2, (r, i) => {
    const born = 0.02 + i * 0.015, age = t - born, life = r.range(0.1, 0.16);
    if (age < 0 || age > life) return;
    const x = cx + R + r.range(1, 5) * k - i * 2, y = cy + r.range(-2, 6) * k - age * 140 * k, l = r.range(5, 9) * k * (1 - age / life);
    p.line(x, y, x, y + l, (u) => (u < 0.4 ? C[top - 1] : C[top - 3]));
  });
  // the punch lands up high: a fat star pops with an overshoot, holds, then shrinks away spinning
  const HIT = 0.085, q = t - HIT;
  if (q < 0) return;
  const fx = cx + Math.cos(A1) * (R + 2) + 2 * k, fy = cy + Math.sin(A1) * (R + 2) - 3 * k;
  const grow = ease.outBack(seg(q, 0, 0.06), 2.2), shrink = 1 - ease.inQuad(seg(q, 0.12, 0.26)), s = grow * shrink;
  if (s > 0.05) {
    const hot = q < 0.034, rot = -Math.PI / 2 + q * 2.5;
    if (!hot) p.poly(star(fx, fy, 5.2 * k * s, 11.5 * k * s, 8, rot), C[top - 3]); // an orange rim, comic style
    p.poly(star(fx, fy, 4.2 * k * s, 10 * k * s, 8, rot), hot ? WHITE : C[top - 1]);
    if (!hot) p.poly(star(fx, fy, 2.6 * k * s, 6 * k * s, 8, rot), WHITE);
    if (s > 0.6) p.poly(star(fx, fy, 1.2 * k, 2.6 * k, 4, rot + 0.4), C[top - 1]);
    p.glow(fx, fy, 22 * k, C[top - 2], 0.4 * s);
    p.glow(fx, fy, 6 * k, WHITE, 0.4 * s);
  }
  // impact lines bursting out round the star
  if (q < 0.12) {
    const e = ease.outCubic(seg(q, 0, 0.12));
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.55 + (i % 2) * 0.15, r0 = (8 + 8 * e) * k, r1 = r0 + (5 - 4 * e) * k;
      p.line(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0, fx + Math.cos(a) * r1, fy + Math.sin(a) * r1, C[top - 1]);
    }
  }
  // sparks thrown up off the hit
  burst(8, S, (r) => {
    const a = -Math.PI / 2 + r.range(-1.4, 1.4), sp = r.range(50, 110) * k, life = r.range(0.15, 0.28), age = q - r.range(0, 0.02);
    if (age < 0 || age > life) return;
    const [x, y] = fly(fx, fy, Math.cos(a) * sp, Math.sin(a) * sp, age, 200, 3), kk = age / life;
    p.px(x, y, kk < 0.4 ? WHITE : kk < 0.75 ? C[top - 1] : C[top - 3]);
    p.light(x, y, C[top - 2], 0.5 * (1 - kk));
  });
}
