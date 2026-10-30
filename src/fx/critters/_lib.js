// Shared by the critters: a small offscreen grid to build a creature from parts (shaded shapes, string
// sprites, lines), then wrap the whole silhouette in one dark outline and put it on the painter.

import { hex, ramp, clamp, wrap } from "../../core/index.js";

/**
 * The loop time for this critter: seeds other than 1 start it at a different point in its loop, so a crowd of
 * the same critter doesn't move in lockstep.
 */
export const shift = (t, D, seed = 1) => wrap(t + ((seed - 1) * 0.618) * D, D);

/** k colors spread evenly over a palette (dark to bright), so any ramp length works. */
export function shades(palette, k = 5) {
  const C = ramp(palette), n = C.length;
  if (n === k) return C;
  return Array.from({ length: k }, (_, i) => C[Math.round((i * (n - 1)) / (k - 1))]);
}

/**
 * Lambert light on a sphere-ish blob from a normalized offset (nx, ny in -1..1, y down): 0 dark .. 1 lit.
 * The light comes from the top-left and a little in front.
 */
export function lit(nx, ny, lx = -0.55, ly = -0.62) {
  const d2 = nx * nx + ny * ny, nz = Math.sqrt(Math.max(0, 1 - d2));
  const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly));
  return clamp(nx * lx + ny * ly + nz * lz);
}

/** A looping curve through keyframes [[phase, value], ...] (phases 0..1, eased between keys). */
export function keys(ph, list) {
  ph = wrap(ph, 1);
  for (let i = 0; i < list.length; i++) {
    const [p0, v0] = list[i], [p1, v1] = list[(i + 1) % list.length];
    const end = i + 1 < list.length ? p1 : p1 + 1;
    const x = ph < p0 ? ph + 1 : ph;
    if (x >= p0 && x <= end) {
      const u = (x - p0) / (end - p0 || 1);
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
  }
  return list[0][1];
}

/** A creature-sized canvas in local coordinates: cells [x0, x0 + w) x [y0, y0 + h). */
export class Grid {
  constructor(x0, y0, w, h) {
    this.x0 = x0; this.y0 = y0; this.w = w; this.h = h;
    this.c = new Uint32Array(w * h);
  }
  idx(x, y) {
    const ix = Math.floor(x) - this.x0, iy = Math.floor(y) - this.y0;
    return ix < 0 || iy < 0 || ix >= this.w || iy >= this.h ? -1 : iy * this.w + ix;
  }
  set(x, y, c) {
    const i = this.idx(x, y);
    if (i >= 0) this.c[i] = c;
  }
  get(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.c[i];
  }
  /** fn(x, y) at each cell center in the box returns a color (or 0 / undefined to leave it). */
  shade(x0, y0, x1, y1, fn) {
    for (let y = Math.floor(y0); y <= Math.floor(y1); y++)
      for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
        const c = fn(x + 0.5, y + 0.5);
        if (c) this.set(x, y, c);
      }
  }
  /** Filled ellipse; c may be fn(nx, ny) of the normalized offset (-1..1), returning a color. */
  ellipse(cx, cy, rx, ry, c) {
    if (rx <= 0 || ry <= 0) return;
    this.shade(cx - rx, cy - ry, cx + rx, cy + ry, (x, y) => {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) return 0;
      return typeof c === "function" ? c(nx, ny) : c;
    });
  }
  /** 1 px line. */
  line(x0, y0, x1, y1, c) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, typeof c === "function" ? c(i / n) : c);
  }
  /** A line of discs, r may be fn(u): tails, tentacles, legs. c may be fn(u, v) with v 0 center .. 1 edge. */
  tube(pts, r, c) {
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1], [bx, by] = pts[k], L = Math.max(1, Math.hypot(bx - ax, by - ay));
      for (let s = 0; s <= L; s += 0.5) {
        const u = (k - 1 + s / L) / (pts.length - 1), rr = typeof r === "function" ? r(u) : r;
        const x = ax + ((bx - ax) * s) / L, y = ay + ((by - ay) * s) / L;
        if (rr < 0.75) {
          this.set(x, y, typeof c === "function" ? c(u, 0) : c);
          continue;
        }
        this.shade(x - rr, y - rr, x + rr, y + rr, (px, py) => {
          const d = Math.hypot(px - x, py - y) / rr;
          return d > 1 ? 0 : typeof c === "function" ? c(u, d) : c;
        });
      }
    }
  }
  /** Filled polygon (even-odd); c may be fn(x, y). */
  poly(pts, c) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
    const n = pts.length;
    this.shade(x0, y0, x1, y1, (x, y) => {
      let inside = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside ? (typeof c === "function" ? c(x, y) : c) : 0;
    });
  }
  /**
   * A sprite from strings, its pixel (ax, ay) placed at (X, Y). opts: { sx, sy (scale), rot, flip }.
   * Scaled or turned sprites are resampled nearest-neighbour, so they stay hard pixels.
   */
  sprite(rows, pal, X, Y, { ax = 0, ay = 0, sx = 1, sy = 1, rot = 0, flip = false } = {}) {
    const H = rows.length, W = rows[0].length, cache = {};
    const col = (ch) => (ch in cache ? cache[ch] : (cache[ch] = pal[ch] === undefined ? 0 : hex(pal[ch])));
    if (sx === 1 && sy === 1 && rot === 0) {
      for (let r = 0; r < H; r++)
        for (let q = 0; q < W; q++) {
          const ch = rows[r][flip ? W - 1 - q : q];
          if (ch === "." || ch === " ") continue;
          const c = col(ch);
          if (c) this.set(Math.round(X - (flip ? W - 1 - ax : ax)) + q, Math.round(Y - ay) + r, c);
        }
      return;
    }
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const R = Math.hypot(Math.max(ax, W - ax) * Math.abs(sx), Math.max(ay, H - ay) * Math.abs(sy)) + 1;
    this.shade(X - R, Y - R, X + R, Y + R, (x, y) => {
      const dx = x - X, dy = y - Y, u = (dx * cs + dy * sn) / sx, v = (-dx * sn + dy * cs) / sy;
      let q = Math.floor(ax + u), r = Math.floor(ay + v);
      if (q < 0 || r < 0 || q >= W || r >= H) return 0;
      if (flip) q = W - 1 - q;
      const ch = rows[r][q];
      return ch === "." || ch === " " ? 0 : col(ch);
    });
  }
  /** Wrap everything drawn so far in a 1 px outline (4-neighbour), color c. */
  outline(c) {
    const src = this.c.slice(), w = this.w, h = this.h;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (src[i]) continue;
        if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) this.c[i] = c;
      }
  }
  /** Put the grid on the painter (a < 1 dithers it out). */
  draw(p, a = 1) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.c[y * this.w + x];
        if (c) p.dot(this.x0 + x, this.y0 + y, c, a);
      }
  }
}
