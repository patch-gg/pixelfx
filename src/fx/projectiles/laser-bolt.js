import { ramp, at, fract, cycle, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Laser bolt",
  desc: "A red blaster bolt: a white-cored capsule with a hard red rim that throbs, a shimmering tail, afterimage dashes dropping behind.",
  tags: ["projectile", "laser", "blaster", "sci-fi", "directional", "loop"],
  size: [52, 15],
  origin: [47, 7],
  duration: 0.3,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1e0408", "#4a0a12", "#8e1020", "#d81e2c", "#ff4a48", "#ff9e8c", "#ffe4dc", "#ffffff"], length: 16, seed: 2 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), L = o.length, S = o.seed, D = meta.duration, ph = t / D;
  const fat = fract(ph * 3) < 0.34; // the rim swells one frame in three
  // tail: a streak behind the bolt whose length shimmers
  const tl = Math.round(9 + 3 * Math.sin(ph * TAU * 3 + 1));
  p.line(-L - 1, 0, -L - tl, 0, (u) => (u < 0.4 ? at(C, 0.62) : u < 0.75 ? at(C, 0.46) : at(C, 0.32)));
  // afterimages: short dashes that drop off the tail and fall back, shrinking
  cycle(t, D, 3, S + 1, (r) => r.range(0.14, 0.2), (age, life, r) => {
    const k = age / life, x0 = -L - 6 - age * 80, len = Math.round(6 * (1 - k)) + 1;
    p.line(x0, 0, x0 - len, 0, k < 0.45 ? at(C, 0.46) : at(C, 0.32));
  });
  // the bolt
  p.beam(-L, 0.5, 0, 0.5, fat ? 5.2 : 3.6, (u, v) => (v < 0.28 ? (u < 0.18 ? at(C, 0.8) : WHITE) : v < 0.68 ? at(C, fat ? 0.8 : 0.7) : at(C, 0.56)));
  // sparks fizzing off the tail
  cycle(t, D, 5, S, (r) => r.range(0.1, 0.2), (age, life, r) => {
    const k = age / life, x = -L + r.range(-2, 6) - age * r.range(60, 110), y = r.sign() * (2 + age * r.range(8, 22));
    p.px(x, y, k < 0.5 ? at(C, 0.62) : at(C, 0.46));
  });
  const pulse = fat ? 1 : 0.8;
  p.glowLine(-L, 0.5, 0, 0.5, 7, at(C, 0.55), 0.32 * pulse);
  p.glow(-L * 0.35, 0.5, 5, at(C, 0.85), 0.3 * pulse);
}
