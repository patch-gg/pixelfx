import { cycle, tileFbm, loopNoise, clamp, TAU } from "../../core/index.js";
import { steps, UMBRA } from "./_lib.js";

export const meta = {
  name: "Shadow flames",
  desc: "Inside-out fire: a black heart floating in violet flame that burns pale at the edges and tips, tongues tearing off, embers rising.",
  tags: ["shadow", "fire", "flame", "dark", "hazard", "ground", "loop"],
  size: [44, 56],
  origin: [22, 50],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: UMBRA, height: 26, seed: 3 },
};

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, D = meta.duration, ph = t / D;
  const H = o.height * (0.9 + 0.1 * loopNoise(ph, 1.3, S));
  // heat to color, inverted: the hottest part is the darkest, the edges burn pale
  const BAND = [C[7], C[6], C[5], C[4], C[3], C[2], C[1], C[0]];
  const tone = (h, v) => BAND[clamp(Math.floor((h - 0.12) / 0.12) + (v < 0.45 ? 1 : 0), 0, 7)];

  // the flame: a teardrop of heat torn into tongues by rising noise; the base glows where it feeds
  p.shade(-13, -H - 8, 13, 1, (x, y) => {
    const v = clamp(-y / H, 0, 1.4);
    const sway = (Math.sin(ph * TAU * 2 + v * 2.6) * 0.9 + loopNoise(ph, 0.8, S + 3)) * v * v * 2.6;
    const w = 8.5 * (v < 0.16 ? Math.sqrt(Math.max(0, 1 - ((0.16 - v) / 0.22) ** 2)) : Math.pow(Math.max(0, 1 - (v - 0.16) / 0.88), 0.7));
    if (w <= 0.3) return;
    const d = Math.abs(x - sway) / w;
    const n = tileFbm(x * 0.36, y * 0.25 + ph * 12, 0, 12, S, 3);
    const heat = (1 - Math.pow(d, 1.6)) * (1.08 - v * 0.82) + n * (0.3 + v * 0.45);
    if (heat < 0.12) return;
    if (v < 0.07 && heat > 0.4) return d < 0.45 ? C[5] : C[3];
    return tone(heat, v);
  });
  // tongues tear off the tip and rise, thin enough to be all edge
  cycle(t, D, 6, S + 7, (r) => r.range(0.3, 0.42), (age, life, r) => {
    const k = age / life, x = r.range(-4, 4) + Math.sin(k * 4 + r.next() * 6) * 1.8, y = -H * r.range(0.6, 0.85) - k * 13;
    const s = (1 - k) * r.range(1.2, 2.1);
    p.ellipse(x, y, s * 0.75, s * 1.6, k < 0.45 ? C[6] : C[4]);
    if (s > 1.4 && k < 0.3) p.px(x, y, C[3]);
  });
  // embers: bright motes drifting up and sideways, flickering out
  cycle(t, D, 8, S + 11, (r) => r.range(0.7, 1.2), (age, life, r) => {
    const k = age / life, x = r.range(-6, 6) + Math.sin(age * r.range(4, 8) + r.next() * TAU) * 3 * k, y = -H * 0.5 - age * r.range(14, 22);
    if (k > 0.5 && Math.sin(age * 38 + r.next() * 9) < -0.4) return;
    p.px(x, y, k < 0.4 ? C[7] : k < 0.75 ? C[6] : C[4]);
    p.light(x, y, C[6], 0.5 * (1 - k));
  });

  // scorch on the floor
  p.ellipse(0, 1, 11, 1.4, (d) => (d < 0.7 ? C[1] : C[2]));

  // light: violet, kept off the black heart so it stays dark
  const flick = 0.85 + 0.15 * loopNoise(ph, 2, S + 5);
  p.glow(0, -H * 0.45, 30 * flick, C[5], 0.2 * flick);
  p.glow(0, -2, 12, C[6], 0.3 * flick);
}
