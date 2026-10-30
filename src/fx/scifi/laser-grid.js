import { ramp, cycle, TAU, WHITE } from "../../core/index.js";
import { steps, zap } from "./_lib.js";

export const meta = {
  name: "Laser grid",
  desc: "Security lasers between two posts: red beams slide up and down while two more sweep the floor from the post tops; drifting dust sparkles where it crosses them.",
  tags: ["scifi", "laser", "security", "trap", "hazard", "ground", "loop"],
  size: [80, 56],
  origin: [40, 52],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1a0408", "#4a0a12", "#8a1020", "#d01c2a", "#ff4a4a", "#ff9a90", "#ffe4e0", "#ffffff"], seed: 31 },
};

const METAL = ramp(["#121119", "#24222f", "#3a3748", "#575369", "#7d7891"]);
const X = 31, TOP = -45;
// the sliding beams: [middle height, swing, cycles per loop, phase]
const SLIDERS = [[-12, 6, 1, 0], [-24, 9, 2, 1.7], [-35, 6, 1, 3.6]];

export function draw(p, t, o) {
  const C = steps(o.palette, 8), S = o.seed, ph = t / meta.duration;
  const beams = [];
  for (const [m, a, n, f] of SLIDERS) {
    const y = Math.round(m + a * Math.sin(ph * TAU * n + f));
    beams.push([-X + 1, y, X - 1, y]);
  }
  for (const s of [-1, 1]) {
    const fx = -s * 6 + s * 20 * Math.sin(ph * TAU + (s > 0 ? 0 : 2.2));
    beams.push([s * (X - 1), TOP + 2, fx, 0]);
  }

  // the beams: a hot core in a red halo, their light, and the spot where each one meets something
  for (const [x0, y0, x1, y1] of beams) {
    zap(p, [[x0, y0], [x1, y1]], C[6], C[3]);
    p.glowLine(x0, y0, x1, y1, 5, C[4], 0.28);
  }
  for (const [x0, y0, x1, y1] of beams) {
    p.px(x0, y0, WHITE);
    p.light(x0, y0, C[5], 0.6);
    if (y1 === 0) {
      p.ellipse(x1, 0, 2.5, 1, C[5]);
      p.px(x1, 0, WHITE);
      p.glow(x1, -1, 9, C[4], 0.45);
    }
  }

  // dust drifting through the room, only seen where a beam catches it
  cycle(t, meta.duration, 26, S, (r) => r.range(1.6, 2.4), (age, life, r) => {
    const x = r.range(-X + 2, X - 2) + Math.sin(age * r.range(0.8, 1.6) + r.next() * TAU) * 3;
    const y = r.range(-44, -2) + age * r.range(2, 5);
    for (const [x0, y0, x1, y1] of beams) {
      const dx = x1 - x0, dy = y1 - y0, u = ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);
      if (u < 0 || u > 1) continue;
      const d = Math.hypot(x0 + dx * u - x, y0 + dy * u - y);
      if (d < 2.2) {
        p.px(x, y, d < 1.2 ? WHITE : C[5]);
        p.light(x, y, C[5], 0.5);
        break;
      }
    }
  });

  // the posts, with a lit rail on their inner faces
  for (const s of [-1, 1]) {
    p.rect(s > 0 ? X : -X - 2, TOP - 2, 3, -TOP + 2, METAL[2]);
    p.rect(s > 0 ? X + 2 : -X - 2, TOP - 2, 1, -TOP + 2, METAL[1]);
    p.rect(s > 0 ? X : -X, TOP, 1, -TOP - 2, C[2]);
    p.rect(s > 0 ? X - 1 : -X - 3, TOP - 3, 5, 2, METAL[3]);
    p.rect(s > 0 ? X - 1 : -X - 3, -2, 5, 2, METAL[1]);
    p.px(s > 0 ? X + 1 : -X - 1, TOP - 3, METAL[4]);
  }
}
