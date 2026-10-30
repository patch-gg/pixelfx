// Helpers shared by the weather loops. Weather fills its whole canvas edge to edge, so things enter and
// leave across the borders: clip() keeps every pixel (and every bit of light) inside the canvas, and
// drift() moves particles across it a whole number of times a loop, so the loop has no seam.

import { rng, fract } from "../../core/index.js";

/** The canvas in local coordinates: { x0, y0, x1, y1 } (inclusive pixel bounds), w, h. */
export function box(meta) {
  const [W, H] = meta.size, [OX, OY] = meta.origin;
  return { x0: -OX, y0: -OY, x1: W - OX - 1, y1: H - OY - 1, w: W, h: H };
}

/**
 * A painter that draws only inside the effect's canvas: the same API, with color and light outside the
 * canvas dropped. Works under the painter's flip and rotation (the test is done in local space).
 */
export function clip(p, meta) {
  const B = box(meta), q = Object.create(p);
  const ok = (sx, sy) => {
    const lx = p.fromX(sx + 0.5, sy + 0.5), ly = p.fromY(sx + 0.5, sy + 0.5);
    return lx >= B.x0 && lx < B.x1 + 1 && ly >= B.y0 && ly < B.y1 + 1;
  };
  q.put = (sx, sy, c, a) => ok(sx, sy) && p.put(sx, sy, c, a);
  q.add = (sx, sy, c, k) => ok(sx, sy) && p.add(sx, sy, c, k);
  return q;
}

/**
 * n particles that each make `trips` crossings per loop (a number, or [min, max] whole numbers per particle),
 * each starting at its own phase. fn(u, r, i) gets u, 0..1 along the current crossing, and the particle's
 * rng (the same numbers every frame). Make u = 0 and u = 1 fall outside the canvas and the loop is seamless.
 */
export function drift(t, D, n, seed, trips, fn) {
  for (let i = 0; i < n; i++) {
    const r = rng(seed, i), k = Array.isArray(trips) ? r.int(trips[0], trips[1]) : trips;
    fn(fract(r.next() + (k * t) / D), r, i);
  }
}
