import { cycle, tileFbm, loopNoise, TAU } from "../../core/index.js";
import { Grid, shades, shift } from "./_lib.js";

export const meta = {
  name: "Wisp",
  desc: "A will-o'-wisp loops a lazy figure eight: a bright flame-ball with two dot eyes, its cold fire tail licking up behind it, sparks peeling off.",
  tags: ["critter", "wisp", "spirit", "fire", "magic", "glow", "loop"],
  size: [44, 48],
  origin: [22, 26],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#061e2a", "#0e5668", "#1ea4ae", "#6deed8", "#e8fffa"], seed: 2 },
};

const path = (ph) => [Math.sin(ph * TAU) * 8, Math.sin(ph * TAU * 2) * 4 + 2];

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), ph = t / meta.duration, D = meta.duration;
  const [hx, hy] = path(ph);
  // the tail: a flame that always licks upward, dragged back against the way it's flying, thinning out
  const vx = Math.cos(ph * TAU) * 8, vy = Math.cos(ph * TAU * 2) * 8, vl = Math.hypot(vx, vy) || 1;
  const nodes = [];
  for (let i = 0; i < 10; i++) {
    const r = 5.2 * (1 - i / 11.5) + 0.5 * loopNoise(ph * 2 + i * 0.07, 0.6, o.seed);
    const wob = Math.sin(ph * TAU * 3 - i * 0.7) * i * 0.18;
    nodes.push([hx - (vx / vl) * i * 1.1 + wob, hy - (vy / vl) * i * 0.6 - i * 1.5, r, 1 - i * 0.07]);
  }
  const g = new Grid(-22, -26, 44, 48);
  g.shade(-21, -25, 21, 21, (x, y) => {
    let heat = 0;
    for (const [nx, ny, r, w] of nodes) {
      const d = Math.hypot(x - nx, (y - ny) * 0.9) / r;
      if (d < 1) heat = Math.max(heat, (1 - d) * w);
    }
    if (heat <= 0) return 0;
    heat += tileFbm(x * 0.35, y * 0.3 + ph * 10, 0, 10, o.seed, 2) * 0.22;
    if (heat > 0.62) return S[4];
    if (heat > 0.38) return S[3];
    if (heat > 0.18) return S[2];
    if (heat > 0.05) return S[1];
    return 0;
  });
  // a solid round head over the flame, with a bright core and two eyes that look where it's going
  g.ellipse(hx, hy, 4.6, 4.4, (nx, ny) => (nx * nx + ny * ny < 0.35 ? S[4] : ny > 0.3 || nx > 0.55 ? S[2] : S[3]));
  const look = Math.cos(ph * TAU) > 0 ? 1 : -1, ex = Math.round(hx + look * 1.2), ey = Math.round(hy - 0.5);
  const blink = (ph > 0.3 && ph < 0.33) || (ph > 0.8 && ph < 0.83);
  g.set(ex - 2, ey, S[0]), g.set(ex + 1, ey, S[0]);
  if (!blink) g.set(ex - 2, ey - 1, S[0]), g.set(ex + 1, ey - 1, S[0]);
  g.outline(S[0]);
  g.draw(p);
  // sparks shed from the tail
  cycle(t, D, 7, o.seed + 1, (r) => r.range(0.4, 0.8), (age, life, r) => {
    const k = age / life, [sx, sy] = path((t - age) / D - 0.1);
    const x = sx + r.range(-3, 3) + Math.sin(age * 6 + r.next() * 6), y = sy - 8 - age * r.range(10, 18);
    p.px(x, y, k < 0.4 ? S[4] : k < 0.75 ? S[3] : S[2]);
    p.light(x, y, S[3], 0.4 * (1 - k));
  });
  p.glow(hx, hy, 20, S[3], 0.3);
  p.glow(hx, hy, 7, S[4], 0.3);
}
