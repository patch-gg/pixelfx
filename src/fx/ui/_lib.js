// Helpers for the ui effects: chunky outlined text, per-letter layout, shakes. Not an effect (starts with _).

import { noise } from "../../core/index.js";
export { Layer, twinkle, fit } from "../pickups/_lib.js";

/**
 * Text with a thick outline and an optional drop shadow, so it reads over anything. (x, y) is the top of the
 * text at its center (or left/right with align). w is the outline width in px, sh the shadow's drop in px.
 */
export function boldText(p, str, x, y, fill, { font = "big", scale = 1, outline, shadow, w = 1, sh = 1, a = 1, align = "center" } = {}) {
  const o = { font, scale, align, a };
  if (shadow !== undefined)
    for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) p.text(str, x + dx, y + dy + sh, shadow, o);
  if (outline !== undefined)
    for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (dx || dy) p.text(str, x + dx, y + dy, outline, o);
  p.text(str, x, y, fill, o);
}

/** Where each letter of str sits: [{ ch, x, w }] with x from the left edge, plus the total width. */
export function letters(p, str, font = "big", scale = 1) {
  const out = [];
  let x = 0;
  for (const ch of str) {
    const w = p.measure(ch, { font, scale })[0];
    out.push({ ch, x, w });
    x += w + scale;
  }
  return { list: out, w: Math.max(0, x - scale) };
}

/** A whole-pixel shake that dies away: [dx, dy] for time t, amplitude amp (px), decaying from t0 over len s. */
export function shake(t, amp, t0 = 0, len = 0.3, seed = 1, hz = 30) {
  const k = 1 - Math.min(1, Math.max(0, (t - t0) / len));
  if (k <= 0 || t < t0) return [0, 0];
  return [Math.round(noise(t * hz, seed) * amp * k * 1.6), Math.round(noise(t * hz, seed + 7) * amp * k * 1.2)];
}

/** Stamp a layer slanted like italics: each row above y0 shifts right by k px per row (whole pixels). */
export function blitSlant(p, L, k, y0, dx = 0, dy = 0, a = 1) {
  const f = L.f, C = f.color;
  for (let i = 0; i < C.length; i++) {
    if (!C[i]) continue;
    const x = (i % f.w) + f.ox, y = Math.floor(i / f.w) + f.oy;
    p.dot(x + dx + Math.round((y0 - y) * k), y + dy, C[i], a);
  }
}
