import { PAL, RAMP, ramp, at, rng, burst, fly, seg, ease, WHITE } from "../../core/index.js";
import { smoke, muzzleFlash } from "./_lib.js";

export const meta = {
  name: "Pistol muzzle flash",
  desc: "One white-hot frame of spiky flash, a fireball tearing off forward and cooling, a few sparks and a small curl of smoke.",
  tags: ["projectile", "muzzle", "gun", "flash", "directional", "one-shot"],
  size: [40, 28],
  origin: [5, 16],
  duration: 0.45,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, size: 1, seed: 4 },
};

const F = 1 / 30;

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, k = o.size, r = rng(S, 1), cy = 0.5;
  const spikes = [[0, r.range(11, 13), 22], [-0.78, r.range(5, 6.5), 50], [0.78, r.range(5, 6.5), 50], [-1.65, r.range(2, 3), 70], [1.65, r.range(2, 3), 70], [Math.PI, 0.6, 6]];
  // smoke: a small curl rolling forward off the flash, rising and thinning
  const puffs = [];
  burst(4, S + 3, (q, i) => {
    const age = t - 0.03 - i * 0.02, life = q.range(0.28, 0.36);
    if (age < 0 || age > life) return;
    const u = age / life, e = ease.outCubic(seg(age, 0, 0.22));
    puffs.push({ x: (2 + i * 2.6) * k + 6 * e, y: cy - q.range(0, 1.5) - age * q.range(16, 26), r: (1.6 + 2.2 * e + u) * k, v: 1 - u });
  });
  smoke(p, puffs, RAMP.smoke, { base: 0.5, seed: S });
  // the flash: the full spiky star for one frame, then the tongue tears off forward and gutters out
  if (t < F) muzzleFlash(p, 0, cy, spikes, k, C, 1);
  else if (t < 2 * F) {
    muzzleFlash(p, 0, cy, spikes.map(([a, l, s]) => [a, l * 0.3, s]), k * 0.75, C, 0.3);
    p.ellipse(10 * k, cy, 4.5 * k, 2.4 * k, at(C, 0.5));
    p.ellipse(10.5 * k, cy, 2.6 * k, 1.4 * k, at(C, 0.72));
  } else if (t < 3 * F) {
    p.ellipse(13 * k, cy - 0.5, 2.6 * k, 1.5 * k, at(C, 0.4));
    p.px(13 * k, cy - 0.5, at(C, 0.6));
  }
  // sparks: grains of powder flung forward, cooling as they fall
  burst(5, S + 2, (q) => {
    const a = q.range(-0.5, 0.5), sp = q.range(90, 170) * k, life = q.range(0.12, 0.26);
    if (t > life) return;
    const u = t / life, [x, y] = fly(3 * k, cy, Math.cos(a) * sp, Math.sin(a) * sp, t, 120, 4);
    p.px(x, y, u < 0.35 ? at(C, 0.9) : u < 0.7 ? at(C, 0.65) : at(C, 0.45));
    p.light(x, y, at(C, 0.7), 0.4 * (1 - u));
  });
  // light: blinding for a frame, then let go fast
  const L = 1 - seg(t, 0, 0.12);
  p.glow(5 * k, cy, 20 * k, at(C, 0.65), 0.55 * L * L);
  if (t < F) p.glow(3 * k, cy, 7 * k, WHITE, 0.45);
}
