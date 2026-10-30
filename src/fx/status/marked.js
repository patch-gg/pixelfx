import { seg, ease, bump, rand, TAU, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Marked",
  desc: "Target brackets slam in around the body and lock with a flash, an aim point tightens on the chest, a marker bobs overhead; then it lets go and locks again.",
  tags: ["status", "mark", "target", "reticle", "debuff", "loop"],
  size: [44, 40],
  origin: [22, 35],
  duration: 1.4,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: {
    palette: ["#1a0408", "#3a0810", "#6a0e1a", "#a01624", "#d82a2e", "#ff5040", "#ff9a80", "#fff0e8"],
    seed: 1,
  },
};

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, ph = t / meta.duration;
  // lock in fast, hold and breathe, ease off; the frame after the last is the first again
  const lock = ease.outBack(seg(ph, 0, 0.13), 2.2), release = ease.inQuad(seg(ph, 0.8, 1));
  const gap = 6 * (1 - lock) + 6 * release;
  const flash = bump(ph, 0.1, 0.2), dim = release > 0.5;
  const col = flash > 0.5 ? WHITE : dim ? C[3] : C[5], hi = flash > 0.5 ? WHITE : dim ? C[4] : C[7];

  // corner brackets around the body's box
  const x0 = a.x - 3 - gap, x1 = a.x + a.w + 2 + gap, y0 = a.y - 3 - gap, y1 = 1 + gap * 0.5, L = 3;
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    p.line(cx, cy, cx + sx * L, cy, col);
    p.line(cx, cy, cx, cy + sy * L, col);
    p.px(cx, cy, hi);
  }

  // the aim point on the chest: four short ticks closing in on a dot
  const [hx, hy] = [a.chest[0], a.chest[1] + 1], d = Math.round(2 + 4 * (1 - lock) + 3 * release);
  for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(hx + sx * d, hy + sy * d, hx + sx * (d + 1), hy + sy * (d + 1), col);
  p.px(hx, hy, flash > 0.3 ? WHITE : hi);
  // the marker overhead: a chevron bobbing over the head
  const my = Math.round(a.head[1] - 6 + Math.sin(ph * TAU * 2 + rand(o.seed) * TAU) * 1.2), mx = a.head[0];
  p.line(mx - 3, my, mx + 3, my, hi);
  p.line(mx - 2, my + 1, mx + 2, my + 1, col);
  p.line(mx - 1, my + 2, mx + 1, my + 2, col);
  p.px(mx, my + 3, col);
  p.glow(hx, hy, 10 + 6 * flash, C[5], 0.15 + 0.35 * flash);
  p.light(mx, my + 1, C[6], 0.4);
}
