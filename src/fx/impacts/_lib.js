// Shared bits for the impacts category: sharp ray stars, streak sparks and shaded dust puffs.
// Files starting with _ are helpers, not effects.

import { at, clamp, TAU } from "../../core/index.js";

/**
 * A sharp star made of tapered rays around (x, y). rays: [{ a (angle), len, w (half-width at the base) }].
 * col(q) picks the color by q = distance along the ray (0 center .. 1 tip). The spine of each ray is a 1 px
 * line so thin tips never break up.
 */
export function rayStar(p, x, y, rays, col) {
  for (const r of rays) {
    if (r.len < 1) continue;
    const dx = Math.cos(r.a), dy = Math.sin(r.a), nx = -dy, ny = dx, w = Math.max(0, r.w);
    if (w > 0.6) {
      const tip = [x + dx * r.len, y + dy * r.len];
      p.poly([[x + nx * w, y + ny * w], tip, [x - nx * w, y - ny * w], [x - dx * w * 0.8, y - dy * w * 0.8]], (px, py) =>
        col(clamp(((px - x) * dx + (py - y) * dy) / r.len)));
    }
    p.line(x, y, x + dx * r.len, y + dy * r.len, (u) => col(u));
  }
}

/**
 * Rays for an n-point hit star (4..8): the four cardinal rays long, then n - 4 short diagonals picked by the
 * rng, so 5 to 7 points come out uneven. Returns [{ a, len, w }].
 */
export function starRays(n, r, long, short, w = 1.6) {
  const rays = [];
  for (let i = 0; i < 4; i++) rays.push({ a: (i * TAU) / 4, len: long * r.range(0.85, 1.12), w });
  const diag = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(r.next() * (i + 1));
    [diag[i], diag[j]] = [diag[j], diag[i]];
  }
  diag.length = clamp(n - 4, 0, 4);
  for (const i of diag) rays.push({ a: TAU / 8 + (i * TAU) / 4, len: short * r.range(0.8, 1.2), w: w * 0.3 });
  return rays;
}

/** A spark streak: a short line from its head back along its velocity. c(u): u 0 at the tail .. 1 at the head. */
export function streak(p, x, y, vx, vy, len, c) {
  const v = Math.hypot(vx, vy) || 1;
  p.line(x - (vx / v) * len, y - (vy / v) * len, x, y, c);
}

/**
 * A dust puff: a ball lit from the top-left with the ramp's darker steps on its shadowed side, dithered by a.
 * D: dust ramp (dark .. light), lift shifts it brighter (-1..1), contrast < 1 flattens the shading (soft dust).
 */
export function puff(p, x, y, r, D, a = 1, lift = 0, contrast = 1) {
  if (r < 0.6 || a <= 0) return;
  p.circle(x, y, r, (d, ang) => {
    const lit = Math.cos(ang + Math.PI * 0.75) * d; // +1 toward the top-left
    return at(D, clamp(0.55 + (lit * 0.45 - d * d * 0.25) * contrast + lift * 0.3));
  }, (d) => a * (d > 0.8 ? 0.8 : 1));
}
