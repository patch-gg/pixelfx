import { PAL, RAMP, ramp, at, rng, burst, cycle, fly, WHITE } from "../../core/index.js";
import { smoke, muzzleFlash } from "./_lib.js";

export const meta = {
  name: "SMG burst",
  desc: "Rapid fire: four shots a loop, each flash a different spiky star for a frame then a gutter, sparks spitting and a stream of smoke wisps.",
  tags: ["projectile", "muzzle", "gun", "automatic", "flash", "directional", "loop"],
  size: [40, 28],
  origin: [5, 16],
  duration: 0.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.volt, shots: 4, seed: 6 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, D = meta.duration, n = o.shots, gap = D / n, cy = 0.5, F = 1 / 30;
  const i = Math.floor(t / gap) % n, ts = t - i * gap;
  // wisps: small puffs leaving the muzzle all the time, drifting forward and up
  const puffs = [];
  cycle(t, D, 5, S + 2, (r) => r.range(0.3, 0.4), (age, life, r) => {
    const u = age / life;
    puffs.push({ x: 4 + age * r.range(28, 46), y: cy - 1 - age * r.range(12, 22), r: 1.5 + u * r.range(2, 3), v: (1 - u) * 0.8 });
  });
  smoke(p, puffs, RAMP.smoke, { base: 0.5, seed: S });
  // the shot: each one its own shape, full for a frame, then a guttering stub
  const r = rng(S, i), tilt = r.range(-0.08, 0.08);
  const spikes = [[tilt, r.range(8, 12), r.range(14, 30)], [-r.range(0.55, 0.95), r.range(3.5, 6), 50], [r.range(0.55, 0.95), r.range(3.5, 6), 50], [-1.65, r.range(1, 2.5), 70], [1.65, r.range(1, 2.5), 70]];
  if (ts < F) {
    muzzleFlash(p, 0, cy, spikes, 0.9, C, 1);
    p.glow(4, cy, 18, at(C, 0.6), 0.5);
    p.glow(3, cy, 6, WHITE, 0.35);
  } else if (ts < 2 * F) {
    muzzleFlash(p, 0, cy, spikes.map(([a, l, s]) => [a, l * 0.45, s]), 0.7, C, 0.3);
    p.glow(4, cy, 14, at(C, 0.55), 0.2);
  }
  // sparks: a few per shot, flung forward
  for (let s = 0; s < n; s++) {
    const age = (((t - s * gap) % D) + D) % D;
    burst(3, S + 10 + s, (q) => {
      const a = q.range(-0.55, 0.55), v = q.range(100, 180), life = q.range(0.08, 0.16);
      if (age > life) return;
      const [x, y] = fly(3, cy, Math.cos(a) * v, Math.sin(a) * v, age, 160, 3);
      p.px(x, y, age / life < 0.5 ? at(C, 0.9) : at(C, 0.6));
    });
  }
}
