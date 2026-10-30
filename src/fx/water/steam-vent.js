import { rng, seg, ease, wrap, noise2, at } from "../../core/index.js";
import { fit, STEAM, METAL } from "./_lib.js";

export const meta = {
  name: "Steam vent",
  desc: "A floor grate hisses: a white jet spits up, then steam billows out in a widening plume that leans downwind and wears away, with wisps between.",
  tags: ["water", "steam", "vent", "smoke", "industrial", "hazard", "ambient", "loop"],
  size: [56, 88],
  origin: [28, 82],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: STEAM, bursts: 1, seed: 10 },
};

const LIFE = 1.7;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), S = o.seed, D = meta.duration, nb = o.bursts, P = D / nb;
  // puffs: each burst pushes out a train of them; each shoots up, slows, swells, leans downwind and wears away
  const puffs = [];
  for (let b = 0; b < nb; b++)
    for (let i = 0; i < 14; i++) {
      const r = rng(S, b, i), born = b * P + i * 0.035 + r.range(0, 0.02), life = r.range(0.8, 1.15) * Math.min(1, P / 1.3);
      const age = wrap(t - born, D);
      if (age >= life) continue;
      const k = age / life, drag = 2.4, e = (1 - Math.exp(-drag * age)) / drag;
      const rise = r.range(100, 145) * (1 - i * 0.035) * e + age * 12, out = r.range(-34, 34) * e;
      const x = r.range(-3, 3) + out + Math.sin(age * 3 + r.range(0, 6)) * k * 2 + k * k * 9;
      puffs.push({ x, y: -3 - rise, r: 1.6 + 7.5 * ease.outCubic(k) * r.range(0.7, 1.1), f: 1 - ease.inQuad(seg(k, 0.2, 1)), s: i * 7.1 + b * 3.3 });
    }
  // the steam: each puff wears away from its edges into ragged islands as it thins; lit from the top left
  p.shade(-28, -82, 28, 0, (x, y, out) => {
    let best = 0, lit = 0;
    for (const f of puffs) {
      const dx = x - f.x, dy = y - f.y, d2 = (dx * dx + dy * dy) / (f.r * f.r);
      if (d2 >= 1) continue;
      const v = 1 - d2 - (1 - f.f) * 0.95 + noise2(dx * 0.45 + f.s, dy * 0.45, S) * 0.3 * (1.2 - f.f);
      if (v > best) (best = v), (lit = (-dx - dy * 1.3) / f.r);
    }
    if (best < 0.1) return;
    out.c = at(C.slice(3), 0.3 + lit * 0.4 + best * 0.35);
  });
  // the jet: a hard white spit straight up at the start of each burst
  for (let b = 0; b < nb; b++) {
    const age = wrap(t - b * P, D);
    if (age > 0.22) continue;
    const h = 26 * ease.outCubic(seg(age, 0, 0.1)), w = age < 0.12 ? 2 : 1, a = 1 - seg(age, 0.12, 0.22);
    p.rect(-w + 1, -h, w * 2 - 1, h, C[6], a);
    p.line(0, -h, 0, -1, C[6], a);
    p.glow(0, -h * 0.5, 14, C[5], 0.25 * a);
  }
  // wisps leaking between bursts: thin curls of vapour rising off the grate
  for (let i = 0; i < 6; i++) {
    const r = rng(S + 5, i), born = 0.45 + (i / 6) * (D - 0.5), life = r.range(0.5, 0.7), age = wrap(t - born, D);
    if (age >= life) continue;
    const k = age / life, x = r.range(-5, 5) + Math.sin(age * 9 + i) * (0.5 + k * 1.5), y = -2 - age * r.range(22, 30), len = k < 0.5 ? 3 : 2;
    p.line(x, y, x + Math.sin(age * 9 + i + 1), y - len, k < 0.5 ? C[4] : C[3], 1 - seg(k, 0.6, 1));
  }
  // the vent: a slotted grate in the floor
  p.rect(-7, -1, 15, 1, METAL[3]);
  p.rect(-7, 0, 15, 2, METAL[0]);
  for (let x = -6; x <= 6; x += 3) p.rect(x, 0, 1, 2, METAL[2]);
  p.rect(-7, 2, 15, 1, METAL[1]);
}
