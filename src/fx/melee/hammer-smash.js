import { PAL, ramp, fit, at, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { dustCloud } from "./_lib.js";

export const meta = {
  name: "Hammer smash",
  desc: "A hammer drops straight down in front of the fighter: a block-wide smear, a white slam on the floor, a dome of force, rocks flung out and dust.",
  tags: ["melee", "smash", "hammer", "heavy", "ground", "shockwave", "combat", "directional", "one-shot"],
  size: [88, 54],
  origin: [24, 46],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.volt, debris: PAL.stone, reach: 17, seed: 15 },
};

const DUST = ramp(["#2e2830", "#463e48", "#655b63", "#8a7f84", "#b0a5a6", "#d6cdc8"]);

export function draw(p, t, o) {
  const C = ramp(o.palette), St = fit(o.debris, 8), S = o.seed, X = o.reach, top = C.length - 1;
  const HIT = 0.1, W = 5; // half the hammer head's width
  // the drop: a block-wide smear falling faster and faster, its leading edge white
  const fall = ease.inQuad(seg(t + 0.03, 0, HIT + 0.03)), headY = -36 + 36 * fall, tailY = -38 + 38 * ease.inQuad(seg(t, 0.04, HIT + 0.06));
  if (headY - tailY > 1 && t < HIT + 0.06) {
    p.shade(X - W, tailY, X + W, headY, (x, y, out) => {
      const v = (y - tailY) / (headY - tailY), side = Math.abs(x - X) / W; // v 0 at the top .. 1 at the head
      if (side > 0.35 + 0.65 * Math.sqrt(v)) return; // a wedge: narrow where it has been, full width at the head
      out.c = v > 0.85 ? WHITE : v > 0.5 ? (side > 0.75 ? C[top - 1] : C[top]) : side > 0.6 ? C[top - 3] : C[top - 2];
      out.a = clamp(v * 1.8);
    });
    // speed lines either side, staggered
    for (const [dx, y0, l] of [[-W - 3, -14, 10], [-W - 6, -8, 6], [W + 2, -12, 9], [W + 5, -6, 6]])
      if (t < HIT && headY + y0 > -40) p.line(X + dx, headY + y0, X + dx, headY + y0 + l, (u) => (u > 0.5 ? C[top - 1] : C[top - 3]));
    p.glow(X, headY - 2, 14, C[top - 2], 0.4 * (1 - seg(t, HIT, 0.2)));
  }
  const q = t - HIT;
  if (q < 0) return;
  // the slam: a white flash flat on the floor, rays shooting up, then gone
  if (q < 0.07) {
    const hot = q < 0.034;
    p.ellipse(X, 0, hot ? 15 : 9, hot ? 6 : 3, (d) => (d < 0.5 ? WHITE : hot ? C[top] : C[top - 1]), (d, a) => (a <= 0.05 ? 1 : 0));
    for (const [dx, h] of [[-9, 8], [-5, 14], [0, 20], [5, 14], [9, 8]]) p.line(X + dx * 0.6, -3, X + dx * 1.4, -h * (hot ? 1 : 0.65), (u) => (u < 0.55 ? WHITE : C[top - 1]));
  }
  // a dome of force swells off the floor and thins away
  const dm = seg(q, 0.01, 0.22);
  if (dm > 0 && dm < 1) {
    const r = 5 + 16 * ease.outCubic(dm);
    p.ring(X, 0, r, dm < 0.4 ? 2 : 1, dm < 0.3 ? WHITE : dm < 0.6 ? C[top - 1] : C[top - 3], (v, a) => (a < -0.08 && a > -Math.PI + 0.08 ? 1 : 0));
    p.glowRing(X, 0, r, 4, C[top - 2], 0.2 * (1 - dm));
  }
  p.glow(X, -3, 30, C[top - 2], 0.5 * Math.pow(1 - seg(q, 0, 0.3), 2));
  p.glow(X, -1, 7, WHITE, 0.6 * (1 - seg(q, 0, 0.1)));
  // the dent: a dark crater line in the floor with cracks running off it
  const dent = 1 - seg(t, 0.62, 0.8);
  if (dent > 0) {
    p.line(X - 6, 1, X + 6, 1, St[0], dent);
    p.line(X - 4, 2, X + 4, 2, St[1], dent);
    for (const [x0, x1, y] of [[X - 6, X - 11, 2], [X + 6, X + 12, 3], [X + 6, X + 9, 1]]) p.line(x0, 1, x1, y, St[0], dent);
  }
  // dust rolls out both ways from under the head
  const puffs = [];
  burst(10, S + 1, (r, i) => {
    const side = i % 2 ? 1 : -1, born = r.range(0, 0.05), age = q - born, life = r.range(0.36, 0.52);
    if (age < 0 || age > life) return;
    const k = age / life, push = ease.outCubic(seg(age, 0, 0.3));
    puffs.push({
      x: X + side * (r.range(3, 6) + push * r.range(8, 18)), y: -2 - push * r.range(1, 5) - age * 6,
      r: r.range(2.4, 4) * (0.5 + 0.7 * push) * (1 - 0.8 * ease.inQuad(seg(k, 0.45, 1))), a: 1 - seg(k, 0.82, 1), sy: 0.8,
    });
  });
  dustCloud(p, puffs, DUST, S, 0.22, 0.5);
  // rocks flung out of the hole: tumbling up and out, landing, a little hop, then sinking away
  burst(8, S + 2, (r, i) => {
    const side = i % 2 ? 1 : -1, a = -Math.PI / 2 + side * r.range(0.25, 1.1), sp = r.range(60, 110), born = r.range(0, 0.02);
    const age = q - born, life = r.range(0.45, 0.62);
    if (age < 0 || age > life) return;
    const g = 300, vy = Math.sin(a) * sp, land = (-vy + Math.sqrt(vy * vy + 2 * g * 2)) / g; // when it comes back to the floor
    let [x, y] = fly(X + side * 2, -2, Math.cos(a) * sp, vy, Math.min(age, land), g);
    if (age > land) { // a small hop, then it rests
      const h = age - land;
      x += Math.cos(a) * sp * 0.25 * Math.min(h, 0.12);
      y = Math.min(0, -1 + -(30 * h - 150 * h * h));
    }
    const s = r.next() < 0.4 ? 3 : 2, spin = Math.floor(age * 16 + i) % 2, k = seg(age, life - 0.1, life);
    p.rect(x, y - s + 1, s, s, St[5 - spin], 1 - k);
    p.rect(x, y - s + 1, s, 1, St[6], 1 - k);
    p.px(x + s - 1, y, St[3]);
  });
}
