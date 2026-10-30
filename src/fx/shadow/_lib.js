// Shared bits for the shadow effects (files starting with _ are helpers, not effects).

import { ramp } from "../../core/index.js";

/** The palette option resampled to exactly n steps (dark to bright), so fixed indices work for any ramp length. */
export function steps(list, n = 8) {
  const r = ramp(list);
  return Array.from({ length: n }, (_, i) => r[Math.round((i * (r.length - 1)) / (n - 1))]);
}

// Dark magic: near-black violet through purple to a pale orchid rim. Shadows lean blue, highlights lean pink,
// so dark shapes keep a bright edge on a dark backdrop.
export const UMBRA = ["#07040c", "#170b28", "#2c1049", "#481872", "#6e22a0", "#9a3acb", "#cc70ec", "#f6d2ff"];
// Crimson for dooms and drains.
export const CRIMSON = ["#0c0306", "#24060e", "#460a16", "#72101e", "#a61c26", "#d83434", "#ff6e58", "#ffc8b0"];
// Spectral green for the restless dead.
export const SPECTRAL = ["#03100c", "#082219", "#0e3a2a", "#165a3e", "#228654", "#3cb86c", "#86e69a", "#dcffe0"];

// Skull shapes: # bone, e eye socket, n nose, t gap between teeth. Colors come from a function, so one shape
// can be shaded, tinted or flashed.
export const SKULL_11 = [
  "...#####...",
  ".#########.",
  "###########",
  "###########",
  "##ee###ee##",
  "#eee###eee#",
  "#eee#n#eee#",
  ".####n####.",
  "..#######..",
  "..#t#t#t#..",
  "...#####...",
];
export const SKULL_7 = [
  ".#####.",
  "#######",
  "#ee#ee#",
  "#ee#ee#",
  "###n###",
  ".#####.",
  ".#t#t#.",
];

/**
 * Draw a shape from strings with a color function: fn(ch, mx, my, w, h) returns a color, or 0 to skip.
 * "." is always empty. Top-left at (x, y); a is a dithered alpha (number or (mx, my) => a).
 */
export function shape(p, rows, x, y, fn, a = 1) {
  const h = rows.length, w = rows[0].length;
  for (let my = 0; my < h; my++)
    for (let mx = 0; mx < w; mx++) {
      const ch = rows[my][mx];
      if (ch === ".") continue;
      const c = fn(ch, mx, my, w, h);
      if (c) p.dot(x + mx, y + my, c, typeof a === "function" ? a(mx, my) : a);
    }
}
