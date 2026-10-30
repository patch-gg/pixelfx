import { PAL, RAMP, ramp, seg, rng, hex } from "../../core/index.js";
import { fit, hot, blast, paintBlast, sparks, debris, shock, flash } from "./_lib.js";

export const meta = {
  name: "Chain explosions",
  desc: "A string of small blasts marching right along the ground, each a beat after the last and a little bigger, flashes popping, smoke stacking up behind.",
  tags: ["explosion", "chain", "sequence", "barrage", "ground", "directional", "one-shot"],
  size: [160, 76],
  origin: [28, 64],
  duration: 1.7,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, count: 5, spacing: 25, beat: 0.12, seed: 27 },
};

const CHAR = [hex("#100c10"), hex("#221a1c")];

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, DU = RAMP.dust, S = o.seed, FIRE = hot(F), n = o.count;
  const L = { fire: [], smoke: [] }, spots = [];
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), x = i * o.spacing + r.range(-3, 3), t0 = i * o.beat + r.range(-0.015, 0.015), k = 0.62 + (0.38 * i) / Math.max(1, n - 1);
    spots.push({ x, t0, k });
    const sc = seg(t, t0 + 0.03, t0 + 0.12) * (1 - seg(t, 1.25 + i * 0.06, 1.55 + i * 0.03));
    if (sc > 0) p.ellipse(x, 0.5, 9 * k, 2, (d) => (d > 0.6 ? CHAR[1] : CHAR[0]), sc);
    blast(t, S + i * 7, { ...L, t0, x, y: -6 * k, n: 7, reach: [3, 10], size: [5.5, 8], life: [0.55, 0.85], a: -Math.PI / 2, spread: 2.2, squash: 0.7, lift: 30, rise: 22, floor: 0, k });
  }
  for (let i = 0; i < n; i++) {
    const { x, t0, k } = spots[i];
    debris(p, t, 6, S + 40 + i, [DU[3], DU[1]], { x, y: -3, t0, sp: [45, 85], spread: 0.9, g: 340, life: [0.5, 0.8], size: [1, 2], floor: 0 });
  }
  paintBlast(p, L, FIRE, SM, S);
  for (let i = 0; i < n; i++) {
    const { x, t0, k } = spots[i], age = t - t0;
    sparks(p, t, 8, S + 60 + i, [F[7], F[5], F[3]], { floor: 0, x, y: -6 * k, t0, a: -Math.PI / 2, spread: 1.4, sp: [60, 115], life: [0.25, 0.45], g: 200 });
    flash(p, t, x, -6 * k, t0, 0.05, 6 * k, F[6], { R: 24, grow: 50 });
    shock(p, t, x, 0, t0, t0 + 0.25, 4, 22 * k, F[6], F[5], { sy: 0.2, k: 0.25 });
    if (age > 0) {
      const lt = 1 - seg(age, 0, 0.45);
      p.glow(x, -10 * k, 26 * k, F[5], 0.4 * lt * lt);
    }
  }
}
