import { PAL, ramp, at, cycle, star, wrap, TAU, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Shuriken",
  desc: "A four-point throwing star spinning fast, its blades lit and shaded by turns, smears trailing each tip and wind streaks behind.",
  tags: ["projectile", "shuriken", "ninja", "throwing", "metal", "directional", "loop"],
  size: [46, 22],
  origin: [36, 11],
  duration: 0.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.metal, size: 7.5, seed: 15 },
};

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 8), S = o.seed, D = meta.duration, ph = t / D, R = o.size;
  const cx = -R + 0.5, cy = 0.5, rot = ph * TAU * 0.75; // three quarter-turns a loop: 22.5 degrees a frame
  // wind streaks behind
  cycle(t, D, 5, S, (r) => r.range(0.1, 0.14), (age, life, r) => {
    const k = age / life, y = cy + r.sign() * r.int(2, 5), x = cx - R + 2 - age * r.range(120, 150), len = r.range(4, 9) * (1 - k * 0.8);
    p.line(x, y, x - len, y, (u) => (u < 0.3 ? C[4] : C[3]));
  });
  // smears: each tip drags a short arc behind it
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * TAU) / 4 - Math.PI / 2;
    p.arc(cx, cy, R + 0.4, 1.3, a - 0.75, a - 0.12, (u) => (u > 0.55 ? C[3] : C[2]));
  }
  // the star: each blade split into a lit face and a shaded face, a dark hole in the middle
  p.poly(star(cx, cy, R * 0.4, R, 4, rot - Math.PI / 2), (x, y) => {
    const a = wrap(Math.atan2(y - cy, x - cx) - rot + Math.PI / 2, TAU / 4) / (TAU / 4);
    return a < 0.5 ? at(C, 0.84) : at(C, 0.52);
  });
  p.circle(cx, cy, 1.4, C[1]);
  // a glint that rides the top blade
  const g = rot - Math.PI / 2 + TAU / 8;
  p.px(cx + Math.cos(g - 0.6) * R * 0.45, cy + Math.sin(g - 0.6) * R * 0.45, WHITE);
}
