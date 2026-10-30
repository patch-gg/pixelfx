import { PAL, cycle, clamp, tileNoise, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle } from "./_lib.js";

export const meta = {
  name: "Arcane beam",
  desc: "A continuous violet beam firing right: a white-hot core in a wobbling sheath, two strands twisting round it, a flaring source and a splash at the end.",
  tags: ["arcane", "beam", "laser", "channel", "magic", "directional", "loop"],
  size: [132, 40],
  origin: [13, 19],
  duration: 0.8,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, length: 104, width: 4, seed: 15 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), L = o.length, W = o.width, S = o.seed, ph = t / meta.duration;
  // the beam's spine sways more the further it gets from the hand; every motion is a whole number of waves a loop
  const spine = (x) => Math.sin(x * 0.07 - ph * TAU * 2) * 1.6 * clamp(x / 40);
  const half = (x) => W * (0.85 + 0.25 * Math.sin(x * 0.3 - ph * TAU * 4)) + 0.6 * tileNoise(x * 0.25 - ph * 16, 0, 16, 0, S);
  // strands behind the beam
  const strand = (x, k) => spine(x) + (half(x) + 2.5) * Math.sin(x * 0.18 - ph * TAU * 3 + k * Math.PI);
  const depth = (x, k) => Math.cos(x * 0.18 - ph * TAU * 3 + k * Math.PI);
  const strands = (front) => {
    for (let x = 5; x < L - 3; x++)
      for (let k = 0; k < 2; k++) {
        const d = depth(x + 0.5, k);
        if (d >= 0 !== front) continue;
        p.line(x, strand(x, k), x + 1, strand(x + 1, k), front ? (d > 0.6 ? C[6] : C[5]) : C[3]);
      }
  };
  strands(false);
  // the body: core, sheath and a ragged edge, scrolling
  p.shade(0, -W * 2 - 4, L + 1, W * 2 + 4, (x, y, out) => {
    if (x < 0 || x > L) return;
    const v = Math.abs(y - spine(x)) / half(x), flick = tileNoise(x * 0.35 - ph * 24, y * 0.5, 24, 0, S + 1) * 0.12;
    const tipFade = clamp((L - x) / 6);
    const lvl = v - flick + (1 - tipFade) * 0.6;
    if (lvl > 1.2) return;
    out.c = lvl < 0.2 ? WHITE : lvl < 0.45 ? C[6] : lvl < 0.72 ? C[5] : lvl < 0.98 ? C[4] : C[3];
    out.k = 0.12;
  });
  // strands in front
  strands(true);
  // motes streaming along it, faster than the eye can follow
  cycle(t, meta.duration, 10, S, (r) => r.range(0.25, 0.45), (age, life, r) => {
    const k = age / life, x = 6 + k * (L - 10), y = spine(x) + r.range(-1, 1) * (half(x) + 4);
    p.line(x - 4, y, x, y, k < 0.7 ? C[6] : C[5]);
  });
  // the source: a hot ball at the hand with four rays turning
  const pulse = 0.5 + 0.5 * Math.sin(ph * TAU * 4);
  p.circle(0, 0, W + 1.5 + pulse, (d) => (d < 0.55 ? WHITE : d < 0.85 ? C[6] : C[5]));
  for (let i = 0; i < 4; i++) {
    const a = ph * TAU + (i * TAU) / 4, rl = W + 5 + 2 * pulse;
    p.line(Math.cos(a) * (W + 1), Math.sin(a) * (W + 1), Math.cos(a) * rl, Math.sin(a) * rl, i % 2 ? C[6] : C[5]);
  }
  // the end: a splash that churns and throws sparks back
  const ex = L, ey = spine(L);
  // flattened against whatever it hits: taller than it is wide
  p.ellipse(ex, ey, W * 0.7 + pulse, W * 1.5 + pulse * 1.5, (d) => (d < 0.4 ? WHITE : d < 0.75 ? C[6] : C[5]));
  cycle(t, meta.duration, 8, S + 3, (r) => r.range(0.12, 0.24), (age, life, r) => {
    const k = age / life, a = Math.PI + r.range(-1.3, 1.3), sp = r.range(50, 90);
    const x = ex + Math.cos(a) * sp * age, y = ey + Math.sin(a) * sp * age + 60 * age * age;
    sparkle(p, x, y, k < 0.4 ? 1 : 0, C[6], C[5], k < 0.5 ? WHITE : C[6]);
  });
  p.glowLine(0, 0, L, ey, 10, C[4], 0.28);
  p.glow(0, 0, 14, C[5], 0.35 + 0.15 * pulse);
  p.glow(ex, ey, 12, C[5], 0.35 + 0.15 * pulse);
}
