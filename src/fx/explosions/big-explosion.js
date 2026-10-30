import { PAL, RAMP, ramp, seg, burst, stream, fly, TAU, hex } from "../../core/index.js";
import { fit, hot, blast, paintBlast, sparks, debris, hop, shock, flash, pool } from "./_lib.js";

export const meta = {
  name: "Big explosion",
  desc: "A three-stage blast: a white flash, a fireball that swells twice more as it climbs into a rising column of smoke, heavy debris trailing smoke, a shockwave.",
  tags: ["explosion", "fire", "smoke", "debris", "big", "ground", "one-shot"],
  size: [136, 148],
  origin: [68, 128],
  duration: 2.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, size: 1, seed: 21 },
};

const ROCK = [hex("#5a4648"), hex("#2e2228"), hex("#1a1218")];
const CHAR = [hex("#100c10"), hex("#211619")];

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, k = o.size, FIRE = hot(F);
  const L = { fire: [], smoke: [] };
  // the scorch left on the floor
  const sc = seg(t, 0.05, 0.2) * (1 - seg(t, 2.2, 2.8));
  if (sc > 0) p.ellipse(0, 0.5, 30 * k, 3, (d) => (d > 0.7 ? CHAR[1] : CHAR[0]), sc);
  // stage one sits on the floor; stages two and three burst out of it higher up, a beat apart
  blast(t, S, { ...L, y: -12 * k, n: 14, reach: [8, 20], size: [8, 12], life: [1.0, 1.4], a: -Math.PI / 2, spread: Math.PI, squash: 0.65, lift: 20, rise: 34, floor: 0, k });
  blast(t, S + 1, { ...L, t0: 0.13, x: 12 * k, y: -28 * k, n: 8, reach: [5, 12], size: [7, 10], life: [0.9, 1.25], a: -Math.PI / 2, spread: 2.2, lift: 24, rise: 34, k });
  blast(t, S + 2, { ...L, t0: 0.26, x: -9 * k, y: -40 * k, n: 8, reach: [5, 12], size: [7, 10], life: [0.9, 1.25], a: -Math.PI / 2, spread: 2.2, lift: 24, rise: 34, k });
  // the column: hot puffs that keep boiling up out of the blast, slowing as they climb, swelling into smoke
  stream(t, 0.12, 1.45, 24, S + 3, (g) => g.range(1.1, 1.3), (age, life, r) => {
    const born = t - age, thin = 1 - 0.5 * seg(born, 0.4, 1.45); // later puffs are smaller: the column narrows
    const q = age / life, [cx, cy] = fly(r.range(-6, 6) * k * thin, -18 * k, r.range(-10, 10), -r.range(88, 114) * k, age, 0, 1.1);
    const rad = (r.range(5, 7) + 9 * Math.sqrt(q)) * k * thin;
    L.smoke.push({ x: cx + Math.sin(age * 3 + r.next() * TAU) * 2, y: cy, r: rad, v: seg(q, 0.05, 0.2) * (1 - seg(q, 0.55, 1)) });
    if (age < 0.3 && born < 0.45) L.fire.push({ x: cx, y: cy, r: rad * 0.8, v: (1 - age / 0.3) * (1 - born / 0.45) });
  });
  // heavy chunks arc out trailing smoke, thud down and rest
  burst(7, S + 5, (r) => {
    const a = -Math.PI / 2 + r.range(-0.9, 0.9), sp = r.range(85, 120) * k, life = r.range(1.4, 1.9), sz = Math.round(r.range(2.5, 4));
    if (t > life) return;
    const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp, at = (tt) => hop(0, -10 * k, vx, vy, tt, 300, 0, 0.25, 0.4, 1);
    for (let j = 7; j >= 1; j--) {
      const tt = t - j * 0.04;
      if (tt < 0.02) continue;
      const [x, y, rest] = at(tt), rad = (2.8 - j * 0.3) * (1 - seg(t, 0.5, 0.9));
      if (!rest && rad > 0.6) p.circle(x, y, rad, j < 3 ? SM[4] : SM[3]);
    }
    const [x, y, rest] = at(t), al = 1 - seg(t, life * 0.8, life), x0 = Math.round(x - sz / 2), y0 = rest ? -sz : Math.round(y - sz / 2);
    p.rect(x0, y0, sz, sz, ROCK[1], al);
    p.rect(x0, y0, sz - 1, 1, ROCK[0], al);
    p.rect(x0 + sz - 1, y0 + 1, 1, sz - 1, ROCK[2], al);
    if (!rest) p.light(x, y, F[4], 0.4 * (1 - seg(t, 0.2, 0.8)));
  });
  debris(p, t, 18, S + 8, [ROCK[0], ROCK[1]], { y: -10 * k, sp: [60, 115], spread: 1, g: 340, life: [1.1, 1.5], size: [1, 2], floor: 0 });
  paintBlast(p, L, FIRE, SM, S, { tone: 0.18 });
  sparks(p, t, 26, S + 7, [F[7], F[5], F[3]], { floor: 0, y: -14 * k, a: -Math.PI / 2, spread: 1.6, sp: [90, 170], life: [0.4, 0.8], g: 180, up: 20 });
  // the hero frame, the shockwave in the air and along the floor
  flash(p, t, 0, -14 * k, 0, 0.08, 14 * k, F[6], { R: 46, grow: 90 });
  // a dome of shock racing up and out over the blast
  const sw = seg(t, 0.03, 0.36);
  if (sw > 0 && sw < 1) {
    const r = 14 + 46 * k * (1 - (1 - sw) ** 3);
    p.arc(0, -2, r, 1, Math.PI, Math.PI * 2, F[7], sw < 0.4 ? 1 : 1 - (sw - 0.4) / 0.6);
  }
  shock(p, t, 0, 0, 0, 0.42, 10, 62 * k, F[6], F[5], { sy: 0.14 });
  const lt = 1 - seg(t, 0, 0.9);
  p.glow(0, -24 * k, 56, F[5], 0.55 * lt * lt);
  pool(p, 0, 0, 50, 6, F[4], 0.5 * lt);
}
