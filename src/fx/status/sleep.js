import { seg, ease, rng, TAU } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Sleep",
  desc: "Z letters float up from the sleeper's head one after another, swaying, growing as they rise, fading into the dark.",
  tags: ["status", "sleep", "zzz", "rest", "debuff", "loop"],
  size: [44, 52],
  origin: [16, 48],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: {
    palette: ["#0e0c22", "#1c1a40", "#2c2c66", "#40448c", "#5c68b4", "#86a0d8", "#bcd4f4", "#f2f8ff"],
    count: 3, seed: 2,
  },
};

const Z = [
  ["####", "..#.", ".#..", "####"],
  ["#####", "...#.", "..#..", ".#...", "#####"],
  ["######", "....#.", "...#..", "..#...", ".#....", "######"],
];

function letter(p, rows, x, y, body, top, edge) {
  const h = rows.length, w = rows[0].length, on = (c, r) => r >= 0 && r < h && c >= 0 && c < w && rows[r][c] === "#";
  for (let r = -1; r <= h; r++)
    for (let c = -1; c <= w; c++)
      if (!on(c, r) && (on(c - 1, r) || on(c + 1, r) || on(c, r - 1) || on(c, r + 1) || on(c - 1, r - 1) || on(c + 1, r + 1))) p.px(x + c, y + r, edge);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (on(c, r)) p.px(x + c, y + r, r === 0 ? top : body);
}

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, D = meta.duration, n = o.count;
  const [hx, hy] = [a.head[0] + 3, a.head[1] + 1];
  // one letter after another, evenly spaced, each living most of a loop so they overlap
  for (let i = 0; i < n; i++) {
    const life = D * 0.92, age = (((t - (i * D) / n) % D) + D) % D;
    if (age >= life) continue;
    // a steady climb keeps the letters evenly spaced, just a touch quicker off the head
    const r = rng(o.seed, i), k = age / life, rise = k * 0.75 + ease.outSine(k) * 0.25;
    const x = hx + 1 + rise * r.range(11, 14) + Math.sin(k * TAU * 1.2 + r.range(0, TAU)) * 2, y = hy - 1 - rise * 24;
    const size = k < 0.22 ? 0 : k < 0.55 ? 1 : 2, rows = Z[size], w = rows[0].length;
    const fade = seg(k, 0.72, 1), pop = k < 0.05 ? 1 : 0;
    if (fade > 0.85) continue;
    const body = fade > 0.55 ? C[4] : fade > 0.2 ? C[5] : C[6], top = fade > 0.55 ? C[5] : C[7];
    letter(p, rows, Math.round(x - w / 2), Math.round(y - rows.length / 2) - pop, body, top, fade > 0.55 ? C[1] : C[2]);
  }
  p.glow(hx + 6, hy - 12, 16, C[5], 0.1);
}
