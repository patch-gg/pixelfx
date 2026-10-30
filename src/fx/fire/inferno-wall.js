import { PAL, RAMP, ramp, at, rng, cycle, loopNoise, clamp } from "../../core/index.js";
import { fit, tongue, flames, embers, pool } from "./_lib.js";
import { billow } from "../explosions/_lib.js";

export const meta = {
  name: "Inferno wall",
  desc: "A wide wall of tall fire: a white-hot base, a ragged crest of tongues tearing upward, sparks and smoke pouring off the top.",
  tags: ["fire", "wall", "barrier", "hazard", "area", "wide", "loop"],
  size: [136, 96],
  origin: [68, 90],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, width: 58, height: 52, seed: 5 },
};

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, D = meta.duration, ph = t / D, W = o.width, H = o.height;
  const flick = 0.85 + 0.15 * loopNoise(ph, 2, S + 5);
  // thick dark smoke rolling up off the crest, behind the fire: puffs that swell, rise and thin away
  const puffs = [];
  cycle(t, D, 20, S + 30, 1.2, (age, life, r) => {
    const q = age / life;
    puffs.push({ x: r.range(-W * 0.9, W * 0.9) + q * r.range(-5, 5), y: -H * 0.45 - age * r.range(20, 26), r: r.range(8, 12) * (0.55 + 0.6 * q), v: 1 - q * q * q });
  });
  const SMK = [SM[0], SM[1], SM[2], SM[3]];
  billow(p, puffs, (v, lit, x, y, out) => {
    if (v < 0.1) return;
    out.a = clamp((v - 0.1) * 5);
    return at(SMK, 0.15 + lit * 0.12 + v * 0.55);
  });
  // a row of tall tongues over a low band of heat that runs the whole width
  const T = [tongue(0, 2, W + 2, H * 0.34, ph, S + 99, { beat: 2, sway: 2, pulse: 0.06 })];
  const n = Math.round(W / 4.4);
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), x = -W + 4 + ((2 * W - 8) * (i + r.range(0.25, 0.75))) / n;
    const edge = 1 - Math.pow(Math.abs(x) / W, 3) * 0.6;
    T.push(tongue(x, 0, r.range(5, 7.5), H * r.range(0.55, 1) * edge, ph, S + i * 17, { beat: 2 + (i % 2), sway: 3.2, pulse: 0.22 }));
  }
  flames(p, T, { F, ph, seed: S, box: [-W - 6, -H - 14, W + 6, 2], scroll: 12, tear: 1.15 });
  embers(p, t, D, 18, S + 7, [F[7], F[5], F[3]], F[4], { x: 0, y: -H * 0.7, w: W, rise: [22, 34], life: [0.4, 0.75], wob: 4 });
  // light along the wall and on the floor in front of it
  p.glowLine(-W, -H * 0.35, W, -H * 0.35, 34, F[4], 0.3 * flick);
  p.glowLine(-W + 8, -6, W - 8, -6, 10, F[6], 0.25 * flick);
  pool(p, 0, 0, W + 8, 5, F[4], 0.4 * flick);
}
