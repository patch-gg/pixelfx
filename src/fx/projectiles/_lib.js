// Shared by the projectile effects: billowing smoke, star-shaped flashes, Bézier paths, rotated sprites and
// a canvas clip for things that fly off the edge. Files starting with _ are helpers, not effects.

import { at, clamp, hex, noise2, rng, wrap, TAU, WHITE } from "../../core/index.js";

/** A test for local pixel centers that land on the effect's canvas (meta.size around meta.origin). */
export function onCanvas(meta, pad = 0) {
  const [W, H] = meta.size, [OX, OY] = meta.origin;
  return (x, y) => x > -OX + pad && x < W - OX - pad && y > -OY + pad && y < H - OY - pad;
}

/**
 * Billowing smoke: puffs [{ x, y, r, v }] (v is density 0..1) drawn as one field, so overlapping puffs merge
 * into one cloud lit from the top-left. Thin edges and thinning puffs dither away. R is the smoke ramp (dark
 * to light); base shifts the whole cloud lighter or darker. With dens near 1 and a fire ramp it draws a fireball
 * whose dense middle runs hot.
 */
export function smoke(p, puffs, R, { base = 0.3, seed = 0, inside, lit = 0.18, dens = 0.24, grain = 0.07 } = {}) {
  const list = puffs.filter((f) => f.r > 0.4 && f.v > 0.01);
  if (!list.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of list) {
    x0 = Math.min(x0, f.x - f.r); x1 = Math.max(x1, f.x + f.r);
    y0 = Math.min(y0, f.y - f.r); y1 = Math.max(y1, f.y + f.r);
  }
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    if (inside && !inside(x, y)) return;
    let best = 0, l = 0;
    for (const f of list) {
      const dx = x - f.x, dy = y - f.y, d2 = (dx * dx + dy * dy) / (f.r * f.r);
      if (d2 >= 1) continue;
      const v = (1 - d2) * f.v;
      if (v > best) (best = v), (l = (-dx - dy * 1.4) / f.r);
    }
    if (best < 0.04) return;
    out.c = at(R, base + l * lit + best * dens + noise2(x * 0.3, y * 0.3, seed) * grain);
    out.a = clamp(best * 3);
  });
}

/**
 * Smoke as separate puffs [{ x, y, r, v, tone? }], each lit from the top-left and drawn over the ones before it:
 * cheaper than smoke() for long trails, and bubblier.
 */
export function puffs(p, list, R, { base = 0.3, lit = 0.22, inside } = {}) {
  for (const f of list) {
    if (f.r < 0.5 || f.v <= 0.01) continue;
    const b = base + (f.tone ?? 0);
    p.circle(f.x, f.y, f.r, (d, a) => at(R, b - d * (Math.cos(a) + 1.4 * Math.sin(a)) * lit + (1 - d * d) * f.v * 0.26),
      (d, a) => (inside && !inside(f.x + Math.cos(a) * d * f.r, f.y + Math.sin(a) * d * f.r) ? 0 : clamp((1 - d * d) * f.v * 3)));
  }
}

/**
 * Points of a flash shape around (x, y): a disc of radius r0 with spikes [[angle, length, sharpness], ...]
 * added on top (length * cos(a - angle) ^ sharpness: 4 is a fat lobe, 20 a needle), scaled by k.
 */
export function flashPts(x, y, spikes, r0, k = 1, n = 96) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI;
    let R = r0;
    for (const [sa, len, sharp] of spikes) R += len * Math.pow(Math.max(0, Math.cos(a - sa)), sharp);
    pts.push([x + Math.cos(a) * R * k, y + Math.sin(a) * R * k]);
  }
  return pts;
}

/**
 * A muzzle flash: an outer flame in the ramp's mid step, a hotter inner copy, a white throat. spikes as for
 * flashPts; s scales it; heat 1 is the hero frame, lower heats cool every layer a step and drop the white.
 */
export function muzzleFlash(p, x, y, spikes, s, C, heat = 1) {
  const cool = (1 - heat) * 0.3;
  p.poly(flashPts(x, y, spikes, 2.6, s), at(C, 0.56 - cool));
  p.poly(flashPts(x + 0.8 * s, y, spikes, 1.7, s * 0.62), at(C, 0.8 - cool));
  if (heat > 0.6) p.ellipse(x + 2.6 * s, y, 3.4 * s, 2.1 * s, WHITE);
  else p.ellipse(x + 1.8 * s, y, 2 * s, 1.3 * s, at(C, 0.92 - cool));
}

/** A point on a cubic Bézier P = [[x, y] x 4] at u (0..1). */
export function bez(P, u) {
  const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
}
/** The Bézier's heading (radians) at u. */
export function bezAngle(P, u) {
  const v = 1 - u, d = (i) => 3 * v * v * (P[1][i] - P[0][i]) + 6 * v * u * (P[2][i] - P[1][i]) + 3 * u * u * (P[3][i] - P[2][i]);
  return Math.atan2(d(1), d(0));
}

/**
 * A little sprite (rows and pal as for p.sprite) turned by ang (radians) about its pivot (px, py, in sprite
 * pixels), with the pivot placed at (x, y). Nearest-pixel sampling keeps it hard-edged. opts: { a, tint, inside }.
 */
export function rotSprite(p, rows, pal, x, y, ang, px, py, opts = {}) {
  const H = rows.length, W = rows[0].length, cs = Math.cos(ang), sn = Math.sin(ang), a = opts.a ?? 1, cache = {};
  const R = Math.hypot(Math.max(px, W - px), Math.max(py, H - py)) + 1;
  p.shade(x - R, y - R, x + R, y + R, (lx, ly, out) => {
    if (opts.inside && !opts.inside(lx, ly)) return;
    const dx = lx - x, dy = ly - y, i = Math.floor(dx * cs + dy * sn + px), j = Math.floor(-dx * sn + dy * cs + py);
    if (i < 0 || j < 0 || i >= W || j >= H) return;
    const ch = rows[j][i];
    if (ch === "." || ch === " ") return;
    out.c = opts.tint ?? cache[ch] ?? (cache[ch] = pal[ch] === undefined ? 0 : hex(pal[ch]));
    out.a = a;
  });
}

/**
 * Like cycle(), but particle i is born exactly at i * period / n: an emitter with a steady beat, so a trail has
 * no clumps or gaps. Loops seamlessly over period. fn(age, life, r, i).
 */
export function beat(t, period, n, seed, life, fn) {
  for (let i = 0; i < n; i++) {
    const L = typeof life === "function" ? life(rng(seed, i, 911)) : life;
    for (let age = wrap(t - (i * period) / n, period); age < L; age += period) fn(age, L, rng(seed, i), i);
  }
}

/** A ramp resampled to n steps (picking, never blending), so effects can index steps of any caller's palette. */
export const steps = (C, n) => Array.from({ length: n }, (_, i) => at(C, (i + 0.5) / n));

/**
 * An arrow, 25 x 5, pointing right with its tip in the last column of the middle row: shaft, steel head,
 * fletching (F/f top, G/g underside). ARROW_FLAT is the same arrow with its feathers pressed flat, for flutter.
 */
export const ARROW = [
  "FFf......................",
  ".fFFf...............hh...",
  "nwwwwwwwwwwwwwwwwwwwHHHHT",
  ".gGGg...............ee...",
  "GGg......................",
];
export const ARROW_FLAT = [
  ".........................",
  "FFFFf...............hh...",
  "nwwwwwwwwwwwwwwwwwwwHHHHT",
  "GGGGg...............ee...",
  ".........................",
];
/** The arrow's palette, its fletching from a ramp (light, mid, shadow, deep). */
export const arrowPal = (F) => ({
  F: F[0], f: F[1], G: F[2], g: F[3],
  n: "#3a2414", w: "#9a6a38", H: "#b4c0d2", T: "#ffffff", h: "#8a96aa", e: "#4a5468",
});
