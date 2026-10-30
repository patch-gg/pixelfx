// Shared by the scifi effects. Palettes resampled to a fixed length, a hex grid for shields and floors, and
// the lightning helpers (bolts, crackles, light along a path) for the effects that spark.

import { ramp } from "../../core/index.js";

export { zap, jagged, glowPath, brokenRing } from "../lightning/_lib.js";

/** The palette as exactly n steps, dark to bright, so an effect can index it the same whatever its length. */
export function steps(pal, n = 7) {
  const C = ramp(pal);
  if (C.length === n) return C;
  return Array.from({ length: n }, (_, i) => C[Math.round((i * (C.length - 1)) / (n - 1))]);
}

const R3 = Math.sqrt(3);

/**
 * The pointy-top hex cell under (x, y) for cells of corner radius s: [q, r, e], the cell's axial coordinates
 * and how near the point is to the cell's edge (0 at the center, 1 on the edge).
 */
export function hexCell(x, y, s) {
  const fq = ((R3 / 3) * x - y / 3) / s, fr = ((2 / 3) * y) / s, fs = -fq - fr;
  let q = Math.round(fq), r = Math.round(fr);
  const S = Math.round(fs), dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(S - fs);
  if (dq > dr && dq > ds) q = -r - S;
  else if (dr > ds) r = -q - S;
  const cx = s * R3 * (q + r / 2), cy = s * 1.5 * r, ax = Math.abs(x - cx), ay = Math.abs(y - cy);
  return [q, r, Math.max(ax, 0.5 * ax + 0.866 * ay) / (0.866 * s)];
}

const cells = new WeakMap();
/** Every filled pixel of an actor's mask as [x, y, mx, my]: local position and position in the mask. */
export function maskCells(a) {
  let list = cells.get(a);
  if (list) return list;
  const m = a.mask;
  list = [];
  for (let my = 0; my < m.h; my++) for (let mx = 0; mx < m.w; mx++) if (m.data[my * m.w + mx]) list.push([a.x + mx, a.y + my, mx, my]);
  cells.set(a, list);
  return list;
}
