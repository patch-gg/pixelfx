import { ramp, at, cycle, fract, WHITE } from "../../core/index.js";
import { ARROW, ARROW_FLAT, arrowPal, steps } from "./_lib.js";

export const meta = {
  name: "Arrow",
  desc: "An arrow in flight: a wooden shaft with a steel head, fletching that flutters, wind streaks peeling back along it and a wake behind the nock.",
  tags: ["projectile", "arrow", "bow", "directional", "loop"],
  size: [56, 15],
  origin: [48, 7],
  duration: 0.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1c2a3a", "#2e4660", "#4a6e8e", "#7aa0bc", "#b4d0e2", "#e8f4fc"], seed: 12 },
};

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 6), S = o.seed, D = meta.duration, ph = t / D;
  // wind streaks sliding back past the shaft, the far ones dimmer
  cycle(t, D, 7, S, (r) => r.range(0.12, 0.17), (age, life, r) => {
    const k = age / life, far = r.chance(0.5), y = r.sign() * (far ? r.int(4, 5) : r.int(2, 3));
    const x = -r.range(2, 10) - age * r.range(170, 210), len = r.range(5, 11) * (1 - k * 0.8);
    p.line(x, y, x - len, y, (u) => (u < 0.25 ? at(C, far ? 0.6 : 0.85) : at(C, far ? 0.35 : 0.6)));
  });
  // the wake: dashes left behind the nock, sliding back and fading out
  for (let x = -26; x >= -46; x--) {
    const u = (-26 - x) / 20;
    if (fract(-x / 7 - ph * 4) < 0.45 + u * 0.4) continue;
    p.px(x, 0, u < 0.4 ? at(C, 0.6) : at(C, 0.38));
  }
  // the arrow: feathers flutter flat and back every other frame
  const flat = Math.floor(ph * 12) % 2 === 1;
  p.sprite(flat ? ARROW_FLAT : ARROW, arrowPal([C[5], C[4], C[3], C[2]]), -24, -2);
  p.glow(-1, 0.5, 5, WHITE, 0.15);
}
