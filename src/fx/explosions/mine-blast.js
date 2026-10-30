import { PAL, RAMP, ramp, at, seg, ease, clamp, burst, fly, noise2, WHITE, hex } from "../../core/index.js";
import { fit, hot, billow, paintBlast, debris, shock, pool } from "./_lib.js";

export const meta = {
  name: "Mine blast",
  desc: "A buried mine blinks red twice and arms, then fires a narrow jet of fire and dirt straight up; clods rain back down and a crater smokes in the floor.",
  tags: ["explosion", "mine", "trap", "dirt", "ground", "one-shot"],
  size: [88, 124],
  origin: [44, 116],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, height: 88, seed: 33 },
};

const SHELL = [hex("#1c201c"), hex("#3c463a"), hex("#66725e"), hex("#98a48a")];
const LAMP = [hex("#5a1018"), hex("#ff3a3a"), hex("#ffc0b0")], HOLE = [hex("#0e0b0c"), hex("#1e1714")];
const BOOM = 0.45;

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, DU = RAMP.dust, E = RAMP.earth, S = o.seed, H = o.height, FIRE = hot(F);
  if (t < BOOM) {
    // the mine: a squat dome half sunk in the floor; its lamp blinks, blinks, then holds
    p.shade(-6, -4, 6, 1, (x, y) => {
      const d = Math.hypot(x / 6, (y + 0.5) / 3.6);
      if (d > 1 || y > 0) return;
      return d > 0.82 ? SHELL[0] : y < -2.5 ? SHELL[3] : x < 0 ? SHELL[2] : SHELL[1];
    });
    const on = (t > 0.06 && t < 0.11) || (t > 0.22 && t < 0.27) || t > 0.36;
    p.px(0, -4, on ? LAMP[1] : LAMP[0]);
    if (on) p.px(0, -5, LAMP[2]), p.glow(0, -4, 10, LAMP[1], 0.55);
    return;
  }
  const age = t - BOOM;
  // the crater: dark, with a lip of dirt, filling back in at the end
  const cr = seg(age, 0.02, 0.1) * (1 - seg(t, 1.45, 1.9));
  if (cr > 0) p.ellipse(0, 0.5, 11, 2.4, (d, a) => (d > 0.72 ? (a < 0 ? DU[4] : DU[2]) : d > 0.4 ? HOLE[1] : HOLE[0]), cr);
  // the jet: a narrow column of puffs fired straight up, cooling into a column of smoke
  const reach = ease.outExpo(seg(age, 0, 0.16)), fire = [], smoke = [];
  burst(13, S, (r, i) => {
    const h = (6 + (i / 12) * (H - 10)) * reach, L = r.range(0.6, 0.95) - i * 0.015, q = clamp(age / L);
    if (q >= 1) return;
    const x = r.range(-1.5, 1.5) + Math.sin(i * 1.7 + age * 6) * (1 + q * 2), y = -h - age * age * 20;
    const rad = (r.range(4, 6) - i * 0.12) * (0.7 + 0.6 * ease.outCubic(seg(age, 0, 0.3)));
    fire.push({ x, y, r: rad * (1 - 0.4 * seg(q, 0.1, 0.6)), v: 1 - seg(q, 0.02, 0.5) });
    smoke.push({ x: x + q * r.range(-4, 4), y: y - q * 10, r: rad * (1.1 + 0.7 * q), v: seg(q, 0.1, 0.3) * (1 - seg(q, 0.6, 1)) });
  });
  // a skirt of dust thrown out low along the floor
  const dust = [];
  burst(8, S + 1, (r, i) => {
    const side = i % 2 ? 1 : -1, L = r.range(0.7, 1.1), q = age / L;
    if (q >= 1) return;
    const [x] = fly(0, 0, side * r.range(45, 85), 0, age, 0, 3.2), rad = r.range(3, 4.5) * (0.6 + q);
    dust.push({ x, y: -rad * 0.6 - age * 5, r: rad, v: (1 - q) * seg(age, 0, 0.05) });
  });
  billow(p, dust, (v, lit, x, y, out) => {
    if (v < 0.08) return;
    out.a = clamp(v * 3);
    return at(DU.slice(1, 6), 0.2 + lit * 0.3 + v * 0.35 + noise2(x * 0.5, y * 0.5, S) * 0.12);
  });
  paintBlast(p, { fire, smoke }, FIRE, SM, S, { tone: 0.1 });
  // the white-hot core of the jet for the first frames
  if (age < 0.1) {
    const top = -(H * 0.85) * ease.outExpo(seg(age, 0, 0.1));
    p.beam(0, -2, 0, top, 4 * (1 - age / 0.1) + 1.5, WHITE);
    p.glowLine(0, 0, 0, top, 16, F[6], 0.7);
  }
  // dirt clods fired up in a narrow cone, raining back down
  debris(p, age, 14, S + 2, [E[4], E[2]], { y: -4, a: -Math.PI / 2, spread: 0.16, sp: [120, 215], g: 330, life: [1.2, 1.45], size: [1, 2], floor: 0 });
  debris(p, age, 10, S + 3, [E[3], E[2]], { y: -4, a: -Math.PI / 2, spread: 0.75, sp: [55, 95], g: 340, life: [0.7, 1.1], size: [1, 2], floor: 0 });
  shock(p, age, 0, 0, 0, 0.3, 4, 28, F[5], F[4], { sy: 0.18 });
  const lt = 1 - seg(age, 0, 0.7);
  p.glowLine(0, -6, 0, -H * 0.6, 26, F[4], 0.4 * lt * lt);
  pool(p, 0, 0, 26, 5, F[4], 0.45 * lt);
}
