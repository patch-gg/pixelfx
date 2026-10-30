// Shared bits for the melee category: the crescent smear of a swing, the lens of a straight cut, glints.
// Files starting with _ are helpers, not effects.

import { at, clamp, smooth, noise2, WHITE } from "../../core/index.js";

/**
 * A crescent smear swung around a pivot (cx, cy) at radius r, from angle `from` to angle `to` (either
 * direction; y is down so a growing angle turns clockwise). `lead` and `tail` are 0..1 progress of the blade
 * edge and of the smear's end along that path (ease them yourself). The smear is thickest just behind the
 * edge, tapers to nothing at the tail and wears a hard rim on its outer side. C: ramp, dark to bright.
 * fade 0..1 dissolves it from the inside out.
 */
export function swing(p, { cx, cy, r, w, from, to, lead, tail, C, rim = WHITE, fade = 0, rimAt = 0.8, a = 1 }) {
  const la = from + (to - from) * lead, ta = from + (to - from) * tail;
  if (Math.abs(la - ta) < 0.02 || fade >= 1) return;
  const fwd = to > from, lo = Math.min(la, ta), hi = Math.max(la, ta), body = C.slice(1);
  const S = (u) => (fwd ? u : 1 - u); // 0 at the tail, 1 at the edge
  p.arc(cx, cy, r, (u) => {
    const s = S(u);
    return w * Math.pow(s, 0.55) * (s > 0.94 ? (1 - s) / 0.06 : 1) + 1;
  }, lo, hi,
  (u, v) => (v > rimAt ? rim : at(body, v * 0.9 + S(u) * 0.15)),
  (u, v) => a * clamp(smooth(0, 0.45, S(u)) * (v > rimAt ? 1.4 : 0.6 + v)) * (1 - fade * (1 - v * 0.6)));
}

/**
 * A straight cut from (x0, y0) to (x1, y1) that bows `bulge` px to its left (negative: right). Like swing, it
 * runs from `tail` to `lead` (0..1 along the chord), thickest behind the edge, tapering to points at both
 * ends of the chord, with a bright rim on the bulge side. w is the widest it gets.
 */
export function cut(p, x0, y0, x1, y1, { bulge = 3, w = 4, lead = 1, tail = 0, C, rim = WHITE, fade = 0, rimAt = 0.72, a = 1, inner = 0.75 }) {
  if (lead - tail < 0.01 || fade >= 1) return;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const sg = bulge < 0 ? -1 : 1, nx = uy * sg, ny = -ux * sg, B = Math.abs(bulge), pad = B + w + 2;
  const body = C.slice(1);
  p.shade(Math.min(x0, x1) - pad, Math.min(y0, y1) - pad, Math.max(x0, x1) + pad, Math.max(y0, y1) + pad, (x, y, o) => {
    const rx = x - x0, ry = y - y0, u = (rx * ux + ry * uy) / L;
    if (u < tail || u > lead || u < 0 || u > 1) return;
    const s = (u - tail) / (lead - tail);
    const d = rx * nx + ry * ny - B * 4 * u * (1 - u); // across, + toward the bulge
    const ww = w * Math.pow(s, 0.6) * (s > 0.9 ? (1 - s) / 0.1 : 1) * Math.sqrt(Math.sin(Math.PI * u)) + 0.7;
    const lo = -ww * inner, hi = ww * (1 - inner);
    if (d < lo || d > hi) return;
    const v = (d - lo) / (hi - lo);
    o.c = v > rimAt ? rim : at(body, v * 0.85 + s * 0.2);
    o.a = a * clamp(smooth(0, 0.35, s) * (v > rimAt ? 1.5 : 0.55 + v)) * (1 - fade * (1 - v * 0.5));
  });
}

/** A 4-point twinkle: a white center and arms of length n in color c. */
export function glint(p, x, y, n, c, core = WHITE) {
  for (let i = 1; i <= n; i++) {
    const cc = i === n && n > 1 ? c : i === 1 ? core : c;
    p.px(x - i, y, cc), p.px(x + i, y, cc), p.px(x, y - i, cc), p.px(x, y + i, cc);
  }
  p.px(x, y, core);
}

/**
 * A dust ball lit from the top-left: the ramp's lighter steps on its lit side, darker on its shadow side, a
 * crisp edge (no dithered rim). a dithers the whole ball; keep it for the last moments of its life.
 */
export function dustBall(p, x, y, r, D, a = 1, lift = 0) {
  if (r < 0.6 || a <= 0) return;
  p.circle(x, y, r, (d, ang) => at(D, clamp(0.45 + lift + Math.cos(ang + Math.PI * 0.75) * d * 0.5 - d * d * 0.15)), a);
}

/**
 * A dust cloud: puffs [{ x, y, r, a, sy }] merged into one lumpy shape, lit from the top-left, the strongest
 * puff deciding each pixel (so overlaps read as one cloud, not a pile of balls). a fades a puff by dither, sy
 * squashes it (0.6: flatter). lo and span pick the slice of the ramp D the cloud uses (keep it narrow: dust is
 * soft, rocks are contrasty).
 */
export function dustCloud(p, puffs, D, seed = 0, lo = 0.3, span = 0.55) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of puffs) {
    if (f.r < 0.6 || f.a <= 0) continue;
    x0 = Math.min(x0, f.x - f.r); x1 = Math.max(x1, f.x + f.r); y0 = Math.min(y0, f.y - f.r); y1 = Math.max(y1, f.y + f.r);
  }
  if (x0 > x1) return;
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    let best = 0, lit = 0, fa = 1;
    for (const f of puffs) {
      if (f.r < 0.6 || f.a <= 0) continue;
      const dx = x - f.x, dy = (y - f.y) / (f.sy ?? 1), d2 = (dx * dx + dy * dy) / (f.r * f.r);
      if (d2 >= 1) continue;
      const v = 1 - d2;
      if (v > best) (best = v), (lit = (-dx - dy * 1.3) / f.r), (fa = f.a);
    }
    if (best <= 0.03) return;
    out.c = at(D, clamp(lo + span * (0.5 + lit * 0.45 + best * 0.5 - 0.25 + noise2(x * 0.45, y * 0.45, seed) * 0.2)));
    out.a = fa * clamp(best * 6);
  });
}
