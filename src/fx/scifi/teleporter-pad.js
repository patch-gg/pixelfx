import { PAL, ramp, cycle, wrap, TAU, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Teleporter pad",
  desc: "A metal pad on the floor hums with light: rings lift off it one after another, shrinking and dimming as they rise through a soft column full of motes.",
  tags: ["scifi", "teleport", "pad", "portal", "prop", "ground", "loop"],
  size: [56, 72],
  origin: [28, 66],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.neon, radius: 16, seed: 26 },
};

const METAL = ramp(["#121119", "#24222f", "#3a3748", "#575369", "#7d7891", "#a7a2b8"]);
const RINGS = 4, RISE = 1.2, TOP = -54;

export function draw(p, t, o) {
  const C = steps(o.palette, 8), S = o.seed, R = o.radius, D = meta.duration, ph = t / D;

  // the column: soft light rising off the pad (light only)
  p.shade(-R + 2, TOP - 4, R - 2, -3, (x, y, out) => {
    const v = (-3 - y) / (-3 - TOP + 4), w = 1 - Math.abs(x) / (R - 2);
    out.l = C[4];
    out.k = 0.22 * w * w * (1 - v) * (0.9 + 0.1 * Math.sin(ph * TAU * 4));
  });

  // rings lifting off: the far half dim, the near half bright, cooling as they climb
  const ring = (front) => {
    for (let i = 0; i < RINGS; i++) {
      const age = wrap(t - (i * D) / RINGS, D);
      if (age > RISE) continue;
      const k = age / RISE, y = -3 + (TOP + 3) * (1 - (1 - k) * (1 - k)), rx = R - 2 - 4 * k, ry = 3.5 - 1.2 * k;
      const c = k < 0.15 ? WHITE : k < 0.4 ? C[6] : k < 0.7 ? C[5] : C[4];
      for (let j = 0; j < 32; j++) {
        const a0 = (j / 32) * TAU, a1 = ((j + 1) / 32) * TAU;
        if (Math.sin((a0 + a1) / 2) > 0 !== front) continue;
        p.line(Math.cos(a0) * rx, y + Math.sin(a0) * ry, Math.cos(a1) * rx, y + Math.sin(a1) * ry, front ? c : k < 0.4 ? C[4] : C[3]);
      }
      if (front) p.glow(0, y, rx + 4, C[4], 0.12 * (1 - k));
    }
  };
  ring(false);

  // the pad: a dark plinth, a steel rim, a glowing face with a pulse running outward, a hot emitter
  p.ellipse(0, -1, R + 2, 5, (d, a) => (Math.sin(a) > 0.2 ? METAL[1] : METAL[2]));
  p.rect(-R - 2, -1, 2 * R + 5, 2, METAL[1]);
  p.ellipse(0, -2.5, R, 4, (d, a) => {
    if (d > 0.82) return Math.sin(a) < -0.3 ? METAL[4] : METAL[3];
    const pulse = wrap(d - ph * 4, 1);
    return pulse < 0.12 ? C[6] : d > 0.62 ? C[3] : pulse < 0.3 ? C[5] : C[4];
  });
  p.ellipse(0, -2.5, 3.5, 1, WHITE);
  for (const x of [-R + 3, R - 3]) p.px(x, 0, (Math.floor(t * 5) % 2) ? C[6] : C[3]);

  ring(true);

  // motes drifting up the column
  cycle(t, D, 10, S, (r) => r.range(0.6, 1.1), (age, life, r) => {
    const k = age / life, x = r.range(-R + 5, R - 5) * (1 - k * 0.4), y = -4 - age * r.range(30, 50);
    p.px(x, y, k < 0.4 ? WHITE : k < 0.75 ? C[6] : C[4]);
  });

  p.glow(0, -3, R + 8, C[4], 0.35);
  p.glow(0, -3, 6, C[6], 0.3);
}
