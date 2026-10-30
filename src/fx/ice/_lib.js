// Shared by the ice effects: palette fitting, faceted spikes and shards, snowflakes and glints.
// Files starting with _ are helpers, not effects.

import { ramp, TAU } from "../../core/index.js";

/** Any palette as exactly n steps (nearest step, never blended), so an effect can index I[0..n-1]. */
export function fit(pal, n = 8) {
  const r = ramp(pal);
  return Array.from({ length: n }, (_, i) => r[Math.round((i * (r.length - 1)) / (n - 1))]);
}

/**
 * A crystal spike growing up from (x, y): base half-width w, height h, tip leaning by `lean` px. Two facets,
 * lit on the left, a white ridge from the tip, a dark edge on the shadow side. I is an 8-step ice ramp.
 */
export function spike(p, x, y, w, h, lean, I, a = 1) {
  if (h < 1 || w < 0.5) return;
  const tx = x + lean, ty = y - h, rx = x + w * 0.2;
  p.poly([[x - w, y], [rx, y], [tx, ty]], I[6], a);
  p.poly([[rx, y], [x + w, y], [tx, ty]], I[4], a);
  p.line(x + w, y - 0.5, tx, ty, I[2], a);
  p.line(rx, y - 0.5, tx, ty, (u) => (u > 0.45 ? I[7] : I[5]), a);
  p.line(x - w, y - 0.5, tx, ty, I[5], a);
  p.dot(tx, ty, I[7], a);
}

/**
 * A shard: polygon pts (relative to its center) turned by rot and placed at (x, y). The face picks a step by
 * how it's turned (it catches the light as it spins); edges facing up-left go white, edges facing
 * down-right take the dark step.
 */
export function shard(p, x, y, pts, rot, I, a = 1, tint = null) {
  const c = Math.cos(rot), s = Math.sin(rot), q = pts.map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
  const face = tint ?? (Math.cos(rot * 2 + 0.6) > 0.3 ? I[6] : Math.cos(rot * 2 + 0.6) > -0.4 ? I[5] : I[4]);
  p.poly(q, face, a);
  for (let i = 0; i < q.length; i++) {
    const [ax, ay] = q[i], [bx, by] = q[(i + 1) % q.length], nx = by - ay, ny = -(bx - ax), L = Math.hypot(nx, ny) || 1;
    const lit = (-nx - ny) / L;
    if (tint === null) p.line(ax, ay, bx, by, lit > 0.35 ? I[7] : lit < -0.35 ? I[2] : face, a);
  }
}

/** A random shard outline: n corners around a center, radius about r (r is an Rng). */
export function shardPts(r, rad, n = r.int(3, 4)) {
  const pts = [], a0 = r.range(0, TAU);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU + r.range(-0.4, 0.4), d = rad * r.range(0.6, 1.2) * (i === 0 ? 1.4 : 1);
    pts.push([Math.cos(a) * d, Math.sin(a) * d]);
  }
  return pts;
}

// small flakes as hand-made sprites, a sixth of a turn apart, so they stay crisp as they spin
const SMALL_FLAKES = [
  ["t...t", ".a.a.", "taoat", ".a.a.", "t...t"],
  ["..t..", "t.a.t", ".aoa.", "t.a.t", "..t.."],
];

/**
 * A six-armed snowflake of radius r turned by rot: arms with a pair of side branches, white tips and core.
 * Below r 3 it's a small sprite that flips between two poses as it turns; below 1.5 a plus.
 */
export function flake(p, x, y, r, rot, arm, tip, core, a = 1) {
  if (r < 1.5) {
    p.dot(x, y, core, a);
    if (r >= 1) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(x + dx, y + dy, arm, a);
    return;
  }
  if (r < 3) {
    const pose = Math.floor((((rot % (TAU / 6)) + TAU / 6) % (TAU / 6)) / (TAU / 12));
    p.sprite(SMALL_FLAKES[pose], { a: arm, t: tip, o: core }, Math.round(x) - 2, Math.round(y) - 2, { a });
    return;
  }
  for (let k = 0; k < 6; k++) {
    const t = rot + (k * TAU) / 6, cx = Math.cos(t), cy = Math.sin(t);
    p.line(x, y, x + cx * r, y + cy * r, arm, a);
    if (r >= 3.5) {
      const bx = x + cx * r * 0.55, by = y + cy * r * 0.55, bl = r * 0.36;
      for (const sgn of [-1, 1]) {
        const b = t + sgn * 0.95;
        p.line(bx, by, bx + Math.cos(b) * bl, by + Math.sin(b) * bl, arm, a);
      }
    }
    p.dot(x + cx * r, y + cy * r, tip, a);
  }
  p.dot(x, y, core, a);
  if (r >= 4) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(x + dx, y + dy, core, a);
}

/** A four-point twinkle: arms of length s (0 is one pixel) in `arm`, a `core` center, dimmer tips. */
export function glint(p, x, y, s, arm, core, a = 1) {
  x = Math.round(x);
  y = Math.round(y);
  p.dot(x, y, core, a);
  for (let i = 1; i <= s; i++) {
    const c = i === s && s > 1 ? arm : i === 1 ? core : arm;
    p.dot(x + i, y, c, a), p.dot(x - i, y, c, a), p.dot(x, y + i, c, a), p.dot(x, y - i, c, a);
  }
}
