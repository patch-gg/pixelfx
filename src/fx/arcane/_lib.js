// Shared by the arcane effects: palettes, a small rune alphabet, sparkles and a squashable actor silhouette.
// Files starting with _ are helpers, not effects.

import { ramp, hex, stockActor, WHITE } from "../../core/index.js";
import { HERO, HERO_PAL } from "../../core/actor.js";

/** Any palette as exactly n steps (nearest step, never blended), so an effect can index C[0..n-1]. */
export function fit(pal, n = 8) {
  const r = ramp(pal);
  return Array.from({ length: n }, (_, i) => r[Math.round((i * (r.length - 1)) / (n - 1))]);
}

// Extra ramps in the arcane family, dark to bright, hue-shifted like the core ones.
export const AZURE = ["#0d0c2a", "#1b1d62", "#28399e", "#3462d2", "#4f96f0", "#8ccaff", "#d6f0ff", "#ffffff"];
export const MAGENTA = ["#1c0620", "#420e4a", "#741878", "#a8269e", "#da44c8", "#ff80e0", "#ffcef4", "#ffffff"];
export const CHRONO = ["#071a1f", "#0d3239", "#14535a", "#1d7f80", "#35b0a6", "#7fe0cc", "#d2fff1", "#ffffff"];
export const STARLIGHT = ["#0f1232", "#1d2766", "#2f479e", "#4c75cf", "#86aef0", "#c8dcff", "#fff4d2", "#ffffff"];

// Runes: an original angular alphabet. 5x5 for floating glyphs, 3x3 for bands on circles and blades.
export const RUNES = [
  ["..#..", ".###.", "#.#.#", "..#..", ".#.#."],
  ["#...#", "##.##", "#.#.#", "..#..", "..#.."],
  ["####.", "#....", "###..", "#..#.", "#...#"],
  ["#.#.#", "#.#.#", ".###.", "..#..", ".###."],
  [".###.", "#...#", "..#..", ".#.#.", "#...#"],
  ["#..#.", "#.#..", "##...", "#.#..", "#..##"],
  ["..#..", "#.#.#", "#####", "..#..", "..#.."],
  ["##.##", "..#..", ".#.#.", "#...#", "#...#"],
];
export const RUNES3 = [
  ["#.#", ".#.", "#.#"],
  ["###", ".#.", ".#."],
  ["#..", "###", "..#"],
  ["#.#", "###", "#.."],
  ["##.", "#.#", ".##"],
  [".##", "#..", "##."],
  ["#.#", "#.#", ".#."],
  ["###", "#.#", "#.."],
];

/** One rune centred on (x, y) in one color, alpha a (dithered). small: the 3x3 set. edge: a 1 px outline color. */
export function rune(p, i, x, y, c, a = 1, small = false, edge) {
  const set = small ? RUNES3 : RUNES, g = set[((i % set.length) + set.length) % set.length], h = g.length >> 1;
  const X = Math.round(x) - h, Y = Math.round(y) - h;
  if (edge !== undefined) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.sprite(g, {}, X + dx, Y + dy, { tint: edge, a });
  p.sprite(g, {}, X, Y, { tint: c, a });
}

/**
 * A four-point twinkle centred on (x, y). size 0 is one pixel, 1 a small plus, 2 longer arms with dim
 * tips, 3 adds diagonal glints. arm and tip are colors; the core is white unless given.
 */
export function sparkle(p, x, y, size, arm, tip = arm, core = WHITE, a = 1) {
  x = Math.round(x);
  y = Math.round(y);
  const s = Math.round(size);
  if (s >= 1) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(x + dx, y + dy, arm, a);
  if (s >= 2) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) p.dot(x + dx, y + dy, tip, a);
  if (s >= 3) {
    for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) p.dot(x + dx, y + dy, tip, a * 0.6);
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) p.dot(x + dx, y + dy, tip, a * 0.7);
  }
  p.dot(x, y, s >= 1 ? core : arm, a);
}

const HERO_COLORS = Object.fromEntries(Object.entries(HERO_PAL).map(([k, v]) => [k, hex(v)]));
const STOCK_MASK = stockActor().mask;

/**
 * The actor drawn pixel by pixel, squashed to sx x sy around its feet (0, 0). color(mx, my, base) picks
 * each pixel's color: base is the stock character's own color for that pixel (or 0 for a custom mask).
 * a(mx, my) is its alpha. Squashing samples the mask, so it stays hard-edged at any scale.
 */
export function silhouette(p, A, sx, sy, color, a = 1, cx = 0) {
  if (sx <= 0.01 || sy <= 0.01) return;
  const stock = A.mask === STOCK_MASK; // only the stock character's own colors are known
  const W = A.w * sx, H = A.h * sy, left = cx + (A.x + A.w / 2) * sx - W / 2, top = -H;
  const fa = typeof a === "function";
  p.shade(left - 1, top - 1, left + W + 1, 1, (x, y, o) => {
    if (x < left || x >= left + W || y < top || y >= 0) return;
    const mx = Math.floor((x - left) / sx), my = Math.floor((y - top) / sy);
    if (mx < 0 || my < 0 || mx >= A.w || my >= A.h || !A.mask.data[my * A.w + mx]) return;
    const base = stock ? HERO_COLORS[HERO[my][mx]] ?? 0 : 0;
    o.c = color(mx, my, base);
    o.a = fa ? a(mx, my) : a;
  });
}


/**
 * A 1 px ellipse outline (a circle seen at an angle) centred on (x0, y0). c and a may be functions of the
 * angle around it (radians, 0 at the right, +pi/2 at the front). The pixel test uses the true distance to
 * the curve, so the line stays one pixel thick all the way round.
 */
export function ovalLine(p, rx, ry, c, a = 1, x0 = 0, y0 = 0) {
  if (rx < 0.5 || ry < 0.5) return;
  const fc = typeof c === "function", fa = typeof a === "function";
  p.shade(x0 - rx - 1, y0 - ry - 1, x0 + rx + 1, y0 + ry + 1, (x, y, o) => {
    const nx = (x - x0) / rx, ny = (y - y0) / ry, d = Math.hypot(nx, ny);
    if (d < 1e-6) return;
    const g = Math.hypot(nx / rx, ny / ry) / d;
    if (Math.abs(d - 1) / g > 0.5) return;
    const ang = Math.atan2(ny, nx);
    o.c = fc ? c(ang) : c;
    o.a = fa ? a(ang) : a;
  });
}

/** Angle difference folded into [0, TAU): how far b is past a going clockwise (y down). */
export const ahead = (a, b) => (((b - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

/**
 * A 1 px ellipse outline tilted by `tilt` radians (a ring seen at an angle and rolled). c and a may be
 * functions of the angle around the ring, measured in the ring's own frame: sin(angle) > 0 is its near side.
 */
export function tiltedOval(p, cx, cy, rx, ry, tilt, c, a = 1) {
  if (rx < 0.5 || ry < 0.5) return;
  const fc = typeof c === "function", fa = typeof a === "function", cs = Math.cos(tilt), sn = Math.sin(tilt), R = Math.max(rx, ry) + 1;
  p.shade(cx - R, cy - R, cx + R, cy + R, (x, y, o) => {
    const dx = x - cx, dy = y - cy, u = dx * cs + dy * sn, v = -dx * sn + dy * cs;
    const nx = u / rx, ny = v / ry, d = Math.hypot(nx, ny);
    if (d < 1e-6) return;
    const g = Math.hypot(nx / rx, ny / ry) / d;
    if (Math.abs(d - 1) / g > 0.5) return;
    const ang = Math.atan2(ny, nx);
    o.c = fc ? c(ang) : c;
    o.a = fa ? a(ang) : a;
  });
}
