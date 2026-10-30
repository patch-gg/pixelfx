// Shared by the fire effects: flame tongues torn by rising noise, embers, smoke wisps, pools of light.
// Not an effect (the leading _ keeps the tools from listing it).

import { at, cycle, tileFbm, loopNoise, TAU } from "../../core/index.js";

/** A ramp resampled to n steps (nearest), so an effect can index steps whatever palette it is given. */
export function fit(C, n = 8) {
  if (C.length === n) return C;
  return Array.from({ length: n }, (_, i) => C[Math.round((i * (C.length - 1)) / (n - 1))]);
}

/** Half-width of a tongue at height v (0 base, 1 tip) as a share of its widest: round bottom, pointed top. */
export function taper(v) {
  if (v < 0.2) {
    const q = (0.2 - v) / 0.28;
    return q >= 1 ? 0 : Math.sqrt(1 - q * q);
  }
  return v >= 1.05 ? 0 : Math.pow(1 - (v - 0.2) / 0.85, 0.7);
}

/**
 * A flame tongue on loop phase ph: its height breathes with noise and its tip whips side to side, `beat`
 * whole sways a loop (keep it whole for seamless loops). Returns { x, y, w, h, a, f, b } for flames().
 */
export function tongue(x, y, w, h, ph, seed, { sway = 2.4, beat = 2, pulse = 0.15 } = {}) {
  return {
    x, y, w,
    h: h * (1 - pulse + pulse * loopNoise(ph, 1.4, seed)),
    a: 0.8 * sway, f: ph * TAU * beat + seed * 1.7, b: loopNoise(ph, 0.8, seed + 3) * sway,
  };
}

/**
 * Fire made of tongues, painted over box [x0, y0, x1, y1]. Each pixel takes the heat of its strongest
 * tongue, torn up by noise that rises `scroll` whole cells a loop (seamless). The palest step is kept for
 * the base of the core. o: { F (8 steps), ph, seed, box, scroll, nx, ny, tear, core, k (light) }.
 */
export function flames(p, tongues, o) {
  const F = o.F, body = [F[2], F[3], F[4], F[5], F[6]], ph = o.ph ?? 0, S = o.seed ?? 1, k = o.k ?? 0;
  const sc = o.scroll ?? 12, nx = o.nx ?? 0.36, ny = o.ny ?? 0.24, tear = o.tear ?? 1, n = tongues.length;
  const cut = 0.12 - 0.5 * tear, hot = o.core === false ? 9 : 1.02;
  const [x0, y0, x1, y1] = o.box;
  // how far each tongue can reach sideways, sway included: a cheap test before the real one
  const reach = tongues.map((T) => T.w * 1.7 + (Math.abs(T.a) + Math.abs(T.b)) * 1.2);
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    let best = -9, bv = 0;
    for (let i = 0; i < n; i++) {
      const T = tongues[i], v = (T.y - y) / T.h;
      if (v < -0.08 || v > 1.05 || Math.abs(x - T.x) > reach[i]) continue;
      const w = T.w * taper(v);
      if (w <= 0.3) continue;
      const d = Math.abs(x - T.x - (T.a * Math.sin(T.f + v * 2.4) + T.b) * v * v) / w;
      if (d > 1.7) continue;
      const h = (1 - Math.pow(d, 1.6)) * (1.08 - v * 0.8);
      if (h > best) (best = h), (bv = v);
    }
    if (best < cut) return;
    const heat = best + tileFbm(x * nx, y * ny + ph * sc, 0, sc, S, 3) * (0.3 + bv * 0.35) * tear;
    if (heat < 0.12) return;
    out.c = heat > hot && bv < 0.35 ? F[7] : at(body, (heat - 0.12) / 0.92);
    if (k) out.k = k * Math.min(1, heat);
  });
}

/**
 * Embers: single pixels rising from around (x, y), wobbling, cooling and flickering out: a seamless cycle
 * over period D. cols: [hot, warm, cool] colors, glow: their light.
 */
export function embers(p, t, D, n, seed, cols, glow, o = {}) {
  const { x = 0, y = 0, w = 4, rise = [16, 28], life = [0.7, 1.2], wob = 3, k = 0.6, drift = 0 } = o;
  cycle(t, D, n, seed, (g) => g.range(life[0], life[1]), (age, L, r) => {
    const q = age / L, ex = x + r.range(-w, w) + Math.sin(age * r.range(4, 8) + r.next() * TAU) * wob * q + drift * age;
    const ey = y - age * r.range(rise[0], rise[1]);
    if (q > 0.5 && Math.sin(age * 38 + r.next() * 9) < -0.5) return;
    p.px(ex, ey, q < 0.35 ? cols[0] : q < 0.7 ? cols[1] : cols[2]);
    p.light(ex, ey, glow, k * (1 - q));
  });
}

/**
 * Smoke wisps: little puffs that rise from (x, y), lean with `drift`, swell from r0 to r1 and thin out by
 * dither. A seamless cycle over period D. SM: a smoke ramp, dark to light.
 */
export function wisps(p, t, D, n, seed, SM, o = {}) {
  const { x = 0, y = 0, w = 3, rise = [10, 16], drift = 4, life = [1.2, 1.8], r0 = 1, r1 = 3, tone = 2 } = o;
  const lo = SM[Math.min(tone, SM.length - 1)], mid = SM[Math.min(tone + 1, SM.length - 1)], hi = SM[Math.min(tone + 2, SM.length - 1)];
  cycle(t, D, n, seed, (g) => g.range(life[0], life[1]), (age, L, r) => {
    const q = age / L, sway = Math.sin(age * r.range(1.5, 2.6) + r.next() * TAU) * 1.6 * q;
    const sx = x + r.range(-w, w) + drift * q * r.range(0.5, 1) + sway, sy = y - age * r.range(rise[0], rise[1]);
    // solid pixels: it swells, then shrinks away as it thins (tiny shapes dithered just look like dirt)
    const rad = q < 0.6 ? r0 + (r1 - r0) * Math.sqrt(q / 0.6) : r1 * (1 - (q - 0.6) / 0.4) ** 0.7;
    if (rad < 0.5) return;
    p.circle(sx, sy, rad, (d, ang) => (q < 0.5 && d < 0.6 && ang < -0.5 ? hi : q < 0.8 && d < 0.8 ? mid : lo));
  });
}

/** A pool of light on the floor: an ellipse of glow, k at its middle, falling to 0 at its rim. */
export function pool(p, x, y, rx, ry, c, k) {
  if (k <= 0.004 || rx < 1 || ry < 0.5) return;
  p.shade(x - rx, y - ry, x + rx, y + ry, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = dx * dx + dy * dy;
    if (d >= 1) return;
    const f = 1 - Math.sqrt(d);
    out.l = c;
    out.k = f * f * k;
  });
}
