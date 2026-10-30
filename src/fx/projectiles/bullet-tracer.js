import { PAL, ramp, at, cycle, fly, loopNoise, fract, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Bullet tracer",
  desc: "A tracer round: a white-hot slug, a long burning streak that flickers and breaks into dashes as it cools, sparks peeling off behind.",
  tags: ["projectile", "bullet", "tracer", "gun", "directional", "loop"],
  size: [58, 15],
  origin: [52, 7],
  duration: 0.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, length: 46, seed: 1 },
};

const SLUG = [".##..", "####o", ".##.."];

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, D = meta.duration, ph = t / D;
  const L = o.length * (0.86 + 0.14 * loopNoise(ph, 3, S));
  // the streak: a core line cooling from white to deep red, breaking into dashes that slide back at the tail
  for (let x = -2; x >= -L; x--) {
    const u = -x / L;
    if (u > 0.5 && fract(-x / 11 - ph * 3) > 1.3 - u) continue;
    p.px(x, 0, u < 0.14 ? WHITE : at(C, 0.92 - u * 0.62));
  }
  // a fatter hot end: two shorter rows hugging the core
  const e1 = Math.round(L * (0.3 + 0.04 * Math.sin(ph * TAU * 3))), e2 = Math.round(L * 0.22);
  p.line(-2, -1, -e1, -1, (u) => at(C, 0.86 - u * 0.34));
  p.line(-2, 1, -e2, 1, (u) => at(C, 0.78 - u * 0.34));
  p.sprite(SLUG, { "#": WHITE, o: at(C, 0.85) }, -4, -1);
  // sparks shed from the streak, falling behind
  cycle(t, D, 7, S + 5, (r) => r.range(0.12, 0.26), (age, life, r) => {
    const k = age / life, [x, y] = fly(-r.range(3, 22), 0, -r.range(70, 150), r.sign() * r.range(8, 22), age, 60, 3);
    p.px(x, y, k < 0.4 ? at(C, 0.85) : at(C, 0.6));
    p.light(x, y, at(C, 0.7), 0.4 * (1 - k));
  });
  // light: a hot point at the slug and a dim line along the streak
  const fl = 0.85 + 0.15 * Math.sin(ph * TAU * 6);
  p.glowLine(-L * 0.55, 0.5, -2, 0.5, 5, at(C, 0.6), 0.22 * fl);
  p.glow(-1, 0.5, 6, at(C, 0.8), 0.5 * fl);
}
