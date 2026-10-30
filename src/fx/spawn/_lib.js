// Shared by the spawn and death effects: the actor's own pixels (to break up, burn or shatter), a stretched copy
// of the silhouette, a cartoon cloud, and the smoke helpers from the projectiles kit. Files starting with _ are
// helpers, not effects.

import { createFrame, painterFor, drawActor, stockActor, at } from "../../core/index.js";

export { smoke, puffs, beat, onCanvas, rotSprite, steps } from "../projectiles/_lib.js";

const STOCK = stockActor();
const cache = new WeakMap();

/** The actor an effect works on: the caller's, or the stock character. */
export const actorOf = (o) => o.actor ?? STOCK;

/**
 * Every pixel of the actor's silhouette in local space, feet at (0, 0): [{ x, y, mx, my, c }]. The stock
 * character keeps its own colors; any other mask is shaded from the ramp R (top-lit, darker toward the feet).
 */
export function actorPixels(actor, R) {
  let list = cache.get(actor.mask);
  if (list && (list.R === R || !list.tinted)) return list;
  const { mask: m, x: ax, y: ay } = actor, stock = m === STOCK.mask;
  let color = null;
  if (stock) {
    const f = createFrame(m.w, m.h), p = painterFor(f).place(-ax, -ay);
    drawActor(p, actor);
    color = f.color;
  }
  list = [];
  for (let my = 0; my < m.h; my++)
    for (let mx = 0; mx < m.w; mx++)
      if (m.data[my * m.w + mx]) list.push({ x: ax + mx, y: ay + my, mx, my, c: stock ? color[my * m.w + mx] : at(R, 0.8 - (my / m.h) * 0.5) });
  list.tinted = !stock;
  list.R = R;
  cache.set(actor.mask, list);
  return list;
}

/**
 * A cartoon cloud: balls [{ x, y, r }] merged into one shape with a 1 px outline, a flat body, a highlight on
 * the top-left of each ball and a shadow on the bottom-right. C is the cloud ramp, dark (outline) to light
 * (shine). a fades the whole cloud by dither; inside(x, y) can clip it (to keep it above the floor).
 */
export function cloud(p, balls, C, { a = 1, inside } = {}) {
  const L = balls.filter((f) => f.r > 0.6);
  if (!L.length || a <= 0) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of L) {
    x0 = Math.min(x0, f.x - f.r); x1 = Math.max(x1, f.x + f.r);
    y0 = Math.min(y0, f.y - f.r); y1 = Math.max(y1, f.y + f.r);
  }
  const ink = [at(C, 0.2), at(C, 0.4), at(C, 0.6), at(C, 0.8), at(C, 0.99)];
  // which ink a point takes: -1 outside, 0 the outline ring, 1..4 shadow to shine by the nearest ball's normal
  const band = (x, y) => {
    let sd = -Infinity, nx = 0, ny = 0;
    for (const f of L) {
      const dx = x - f.x, dy = y - f.y, s = f.r - Math.sqrt(dx * dx + dy * dy);
      if (s > sd) (sd = s), (nx = dx / f.r), (ny = dy / f.r);
    }
    if (sd <= -1) return -1;
    if (sd <= 0) return 0;
    const lit = -(nx + ny * 1.3);
    return lit > 0.6 ? 4 : lit > 0.05 ? 3 : lit > -0.55 ? 2 : 1;
  };
  p.shade(x0 - 1.5, y0 - 1.5, x1 + 1.5, y1 + 1.5, (x, y, out) => {
    if (inside && !inside(x, y)) return;
    let b = band(x, y);
    if (b < 0) return;
    if (b > 0) {
      // no lone pixels: a shade that none of its four neighbours share takes the commonest of theirs
      const n = [band(x + 1, y), band(x - 1, y), band(x, y + 1), band(x, y - 1)].filter((v) => v > 0);
      if (n.length && !n.includes(b)) b = n.sort((u, v) => n.filter((w) => w === v).length - n.filter((w) => w === u).length)[0];
    }
    out.a = a;
    return ink[b];
  });
}

/** Is (mx, my) inside the mask? */
export const inMask = (m, mx, my) => mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.data[my * m.w + mx] === 1;

/**
 * The silhouette scaled by (sx, sy) about its feet, drawn at (x, y): fn(mx, my, edge) returns a color for each
 * covered pixel (mx, my are mask coordinates, edge is true on the outer ring). Return nothing to skip.
 */
export function stretchMask(p, actor, x, y, sx, sy, fn) {
  const m = actor.mask, W = m.w * sx, H = m.h * sy, x0 = x - W / 2 + (actor.x + m.w / 2) * sx;
  const covered = (lx, ly) => inMask(m, Math.floor((lx - x0) / sx), Math.floor((ly - (y - H)) / sy));
  p.shade(x0 - 1, y - H - 1, x0 + W + 1, y + 1, (lx, ly, out) => {
    const mx = Math.floor((lx - x0) / sx), my = Math.floor((ly - (y - H)) / sy);
    if (!inMask(m, mx, my)) return;
    const edge = !covered(lx - 1, ly) || !covered(lx + 1, ly) || !covered(lx, ly - 1) || !covered(lx, ly + 1);
    const c = fn(mx, my, edge, out);
    if (c) out.c = c;
  });
}
