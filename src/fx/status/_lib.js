// Shared bits for the status effects (files starting with _ are helpers, not effects).

import { ramp, luma, clamp } from "../../core/index.js";

/** The palette option resampled to exactly n steps (dark to bright), so fixed indices work for any ramp length. */
export function steps(list, n = 8) {
  const r = ramp(list);
  return Array.from({ length: n }, (_, i) => r[Math.round((i * (r.length - 1)) / (n - 1))]);
}

const GEOM = new WeakMap();
const M = 14; // how far around the mask the geometry reaches

/**
 * Geometry of an actor's mask, computed once: for every cell up to M px around it, the vector to the nearest
 * mask pixel; plus the outline (cells just outside), the rim (mask cells on its edge) and each column's top.
 * Cells are in mask space (0, 0 = the mask's top-left).
 */
export function geom(mask) {
  let g = GEOM.get(mask);
  if (g) return g;
  const { w, h, data } = mask, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[y * w + x] > 0;
  const pts = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) pts.push([x, y]);
  const GW = w + 2 * M, GH = h + 2 * M, d = new Float32Array(GW * GH), vx = new Float32Array(GW * GH), vy = new Float32Array(GW * GH);
  for (let gy = 0; gy < GH; gy++)
    for (let gx = 0; gx < GW; gx++) {
      const x = gx - M, y = gy - M, i = gy * GW + gx;
      if (on(x, y)) continue;
      let best = Infinity, bx = 0, by = 0;
      for (const [px, py] of pts) {
        const dd = (x - px) ** 2 + (y - py) ** 2;
        if (dd < best) (best = dd), (bx = x - px), (by = y - py);
      }
      d[i] = Math.sqrt(best);
      vx[i] = bx;
      vy[i] = by;
    }
  const outline = [], rim = [], top = [];
  for (let y = -1; y <= h; y++)
    for (let x = -1; x <= w; x++) {
      const n4 = on(x - 1, y) + on(x + 1, y) + on(x, y - 1) + on(x, y + 1);
      if (!on(x, y) && n4) outline.push([x, y]);
      if (on(x, y) && n4 < 4) rim.push([x, y]);
    }
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h && !on(x, y)) y++;
    top.push(y);
  }
  g = {
    on, outline, rim, top,
    /** distance from mask cell (x, y) to the silhouette (0 inside), and the vector from the nearest mask pixel */
    near(x, y) {
      const gx = Math.floor(x) + M, gy = Math.floor(y) + M;
      if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return null;
      const i = gy * GW + gx;
      return [d[i], vx[i], vy[i]];
    },
  };
  GEOM.set(mask, g);
  return g;
}

/**
 * Recolor the actor: for every mask pixel, fn(under, mx, my) returns a new color (or 0 to leave it), where
 * under is the color already drawn there (0 in a sprite sheet, where the character isn't drawn). Call it
 * before drawing anything else in front, so `under` is the character.
 */
export function recolor(p, a, fn, alpha = 1) {
  const m = a.mask;
  for (let my = 0; my < m.h; my++)
    for (let mx = 0; mx < m.w; mx++) {
      if (!m.data[my * m.w + mx]) continue;
      const x = a.x + mx, y = a.y + my, c = fn(p.get(x, y), mx, my);
      if (c) p.dot(x, y, c, typeof alpha === "function" ? alpha(mx, my) : alpha);
    }
}

/** Brightness of a drawn color spread to 0..1 (the stock character runs from ink outlines to light skin). */
export const tone = (c) => clamp((luma(c) - 0.05) / 0.75);
