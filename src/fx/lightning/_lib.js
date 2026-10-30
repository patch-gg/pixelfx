// Shared by the lightning effects: palettes resampled to a fixed length, bolts drawn the way a pixel artist
// draws them (a hard 1 px core inside a 1 px halo), and light that hugs a whole path without beading at joints.

import { ramp, bolt, clamp, rand } from "../../core/index.js";

/** The palette as exactly n steps, dark to bright, so an effect can index it the same whatever its length. */
export function steps(pal, n = 7) {
  const C = ramp(pal);
  if (C.length === n) return C;
  return Array.from({ length: n }, (_, i) => C[Math.round((i * (C.length - 1)) / (n - 1))]);
}

const HALO = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/** A path as a bolt: a 1 px `core` line inside a 1 px `edge` halo (no halo when edge is null). */
export function zap(p, pts, core, edge = null, a = 1) {
  if (edge != null)
    for (const [dx, dy] of HALO)
      for (let i = 1; i < pts.length; i++) p.line(pts[i - 1][0] + dx, pts[i - 1][1] + dy, pts[i][0] + dx, pts[i][1] + dy, edge, a);
  p.polyline(pts, core, a);
}

/** The first share u (0..1) of a path, cut at the right point: for bolts that grow along their length. */
export function part(pts, u) {
  if (u >= 1) return pts;
  if (u <= 0) return [pts[0]];
  const f = u * (pts.length - 1), i = Math.floor(f), k = f - i, out = pts.slice(0, i + 1);
  if (k > 0) out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
  return out;
}

/**
 * Light along a path: k at the path falling to 0 at distance r. One distance field for the whole path, so
 * joints don't bead the way overlapping glowLines do. `every` thins the path first (light is soft anyway).
 */
export function glowPath(p, pts, r, c, k, every = 3) {
  if (k <= 0.004 || pts.length < 2) return;
  const q = [];
  for (let i = 0; i < pts.length; i += every) q.push(pts[i]);
  if (q[q.length - 1] !== pts[pts.length - 1]) q.push(pts[pts.length - 1]);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of q) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const R2 = r * r, n = q.length;
  p.shade(x0 - r, y0 - r, x1 + r, y1 + r, (x, y, o) => {
    let best = R2;
    for (let i = 1; i < n; i++) {
      const ax = q[i - 1][0], ay = q[i - 1][1], dx = q[i][0] - ax, dy = q[i][1] - ay;
      const u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1e-9));
      const ex = ax + dx * u - x, ey = ay + dy * u - y, d2 = ex * ex + ey * ey;
      if (d2 < best) best = d2;
    }
    if (best >= R2) return;
    const f = 1 - Math.sqrt(best) / r;
    o.l = c;
    o.k = f * f * k;
  });
}

/** A short crackle between two points: a bolt with few, sharp kinks (for arcs a few pixels to ~30 px long). */
export function crackle(r, x0, y0, x1, y1, jag = 0.3) {
  const L = Math.hypot(x1 - x0, y1 - y0);
  return bolt(r, x0, y0, x1, y1, { jag, depth: L < 8 ? 1 : L < 16 ? 2 : L < 36 ? 3 : 4 });
}

/**
 * Branches off a bolt path that alternate sides and leave from the stretch between shares `from` and `to`
 * of it, each pointing along the path's direction turned out by up to `spread` radians. Returns paths.
 */
export function branches(r, path, { count = 4, len = 20, jag = 0.3, spread = 0.8, from = 0.1, to = 0.8, side = 1 } = {}) {
  const out = [], n = path.length;
  if (n < 3) return out;
  for (let k = 0; k < count; k++) {
    const u = from + (to - from) * ((k + r.next()) / count);
    const i = Math.max(1, Math.min(n - 2, Math.round(u * (n - 1))));
    const [x, y] = path[i], [px, py] = path[Math.max(0, i - 2)];
    const s = (k % 2 ? -1 : 1) * side;
    const a = Math.atan2(y - py, x - px) + s * spread * (0.45 + 0.55 * r.next());
    const l = len * (0.45 + 0.55 * r.next());
    out.push(bolt(r, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, { jag, depth: l < 10 ? 2 : 3 }));
  }
  return out;
}

/** Each segment of a path drawn only while u < its own random cut: a bolt that crumbles away as u goes 0 -> 1. */
export function crumble(p, pts, u, seed, c, a = 1) {
  for (let i = 1; i < pts.length; i++) {
    if (rand(seed, i) * 0.85 + 0.15 * (i / pts.length) < u) continue;
    p.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, a);
  }
}

/**
 * A zigzag from (x0, y0) to (x1, y1): kinks every `step` px or so, each pushed sideways up to `amp` px,
 * mostly alternating sides. Reads as pixel-art lightning at any length (midpoint displacement bows long arcs).
 */
export function jagged(r, x0, y0, x1, y1, { step = 5, amp = 3 } = {}) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const n = Math.max(1, Math.round(L / step)), pts = [[x0, y0]];
  let s = r.sign();
  for (let i = 1; i < n; i++) {
    const u = (i + r.range(-0.3, 0.3)) / n, off = s * amp * r.range(0.3, 1);
    pts.push([x0 + dx * u + nx * off, y0 + dy * u + ny * off]);
    if (r.next() < 0.75) s = -s;
  }
  pts.push([x1, y1]);
  return pts;
}

/**
 * A ring drawn as n arcs with gaps (gap 0: a whole ring, toward 1: short dashes), turned by `turn` radians;
 * each arc's length and radius wobble a little by seed. Shock fronts break up this way instead of dithering.
 */
export function brokenRing(p, x, y, R, w, { n = 6, gap = 0, turn = 0, seed = 0, c, wobble = 1 } = {}) {
  for (let j = 0; j < n; j++) {
    const a0 = turn + ((j + 0.4 * rand(seed, j)) / n) * Math.PI * 2;
    const a1 = a0 + ((Math.PI * 2) / n) * (1 - Math.min(0.95, gap * (0.6 + 0.8 * rand(seed, j, 1))));
    if (a1 > a0) p.arc(x, y, R + (rand(seed, j, 2) - 0.5) * wobble, w, a0, a1, c);
  }
}

/** A path with its points held inside the box [x0, x1] x [y0, y1] (keeps long branches on the canvas). */
export const fence = (pts, x0, x1, y0, y1) => pts.map(([x, y]) => [clamp(x, x0, x1), clamp(y, y0, y1)]);
