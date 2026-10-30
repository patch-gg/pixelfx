// Shared by the water effects: palette fitting, flat ellipse outlines (ripples on a surface seen at a low
// angle), droplets with streaks, and the time a ballistic drop takes to land. Files starting with _ are
// helpers, not effects.

import { ramp, noise2 } from "../../core/index.js";

const call = (v, ...a) => (typeof v === "function" ? v(...a) : v);

/** Any palette as exactly n steps (nearest step, never blended), so an effect can index W[0..n-1]. */
export function fit(pal, n = 8) {
  const r = ramp(pal);
  return Array.from({ length: n }, (_, i) => r[Math.round((i * (r.length - 1)) / (n - 1))]);
}

/** A stone ramp for props (basin rims, vent grates), dark to light. */
export const STONE = ramp(["#15141c", "#26242f", "#3a3745", "#55505f", "#77717f", "#9a94a0"]);
export const METAL = ramp(["#101219", "#222633", "#3a4052", "#5a6276", "#8590a4"]);
/** Steam, dark to bright: cool greys that end in white. */
export const STEAM = ["#232a38", "#3a4456", "#5a6678", "#8590a3", "#b2bccb", "#dbe2ec", "#f6f9fc"];

/**
 * A 1 px ellipse outline: a ripple on a surface seen at a low angle. c and a may be functions of the angle
 * around it (y is down, so sin(angle) > 0 is the near side).
 */
export function oval(p, cx, cy, rx, ry, c, a = 1) {
  if (rx < 0.75 || ry < 0.3) {
    p.dot(cx, cy, call(c, Math.PI / 2), call(a, Math.PI / 2));
    return;
  }
  const iy = 1 / (ry * ry), ix = 1 / (rx * rx);
  const inside = (x, y) => (x - cx) * (x - cx) * ix + (y - cy) * (y - cy) * iy <= 1;
  p.shade(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, (x, y, o) => {
    if (!inside(x, y) || (inside(x + 1, y) && inside(x - 1, y) && inside(x, y + 1) && inside(x, y - 1))) return;
    const ang = Math.atan2((y - cy) / ry, (x - cx) / rx);
    o.c = call(c, ang);
    o.a = call(a, ang);
  });
}

/**
 * A ripple ring: a crisp 1 px crest, near side in one color and far side in another. keep (0..1) is how much
 * of it is left: as it drops the ring breaks into dashes (whole pixels, not dither) and then is gone.
 */
export function ripple(p, cx, cy, rx, ry, near, far, keep = 1, seed = 0) {
  if (keep <= 0) return;
  const f = 0.42;
  oval(p, cx, cy, rx, ry, (a) => (Math.sin(a) > 0 ? near : far), keep >= 1 ? 1 : (a) =>
    noise2(Math.cos(a) * rx * f + seed * 7.31, Math.sin(a) * rx * f + seed * 3.7, seed) * 0.62 + 0.5 < keep ? 1 : 0);
}

/** A droplet in flight: a head pixel with a tail trailing back along its velocity (k seconds of travel). */
export function drop(p, x, y, vx, vy, head, tail, k = 0.02, a = 1) {
  const tx = x - vx * k, ty = y - vy * k;
  if (Math.abs(tx - x) >= 1 || Math.abs(ty - y) >= 1) p.line(tx, ty, x, y, tail, a);
  p.dot(x, y, head, a);
}

/**
 * Draw with everything outside the local box [x0, x1) x [y0, y1) dropped, color and light alike: for
 * effects that sweep in from off the canvas. (The painter has no clip of its own, so this wraps its two
 * raw writers for the duration of fn.)
 */
export function clip(p, x0, y0, x1, y1, fn) {
  const inBox = (sx, sy) => {
    const lx = p.fromX(sx + 0.5, sy + 0.5), ly = p.fromY(sx + 0.5, sy + 0.5);
    return lx >= x0 && lx < x1 && ly >= y0 && ly < y1;
  };
  const put = Object.getPrototypeOf(p).put, add = Object.getPrototypeOf(p).add;
  p.put = function (sx, sy, c, a) { if (inBox(sx, sy)) put.call(this, sx, sy, c, a); };
  p.add = function (sx, sy, c, k) { if (inBox(sx, sy)) add.call(this, sx, sy, c, k); };
  try {
    fn();
  } finally {
    delete p.put;
    delete p.add;
  }
}

/** When a drop launched at height y0 with vertical speed vy under gravity g (no drag) reaches height y1. */
export function landTime(y0, vy, g, y1) {
  const d = vy * vy + 2 * g * (y1 - y0);
  return d < 0 ? Infinity : (-vy + Math.sqrt(d)) / g;
}
