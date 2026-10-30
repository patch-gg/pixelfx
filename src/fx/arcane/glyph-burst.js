import { burst, fly, seg, ease, clamp, rng, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle, MAGENTA } from "./_lib.js";

export const meta = {
  name: "Glyph burst",
  desc: "A big sigil inks itself in the air stroke by stroke, swells and trembles with light, flashes white and blows apart into spinning strokes.",
  tags: ["arcane", "glyph", "sigil", "burst", "magic", "one-shot"],
  size: [84, 84],
  origin: [42, 42],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: MAGENTA, size: 17, seed: 21 },
};

// the sigil's strokes in unit space (radius 1): a staff through a diamond, two chevrons, two bars
const STROKES = [
  [0, -1.32, 0, 1.32],
  [0, -0.78, 0.78, 0], [0.78, 0, 0, 0.78], [0, 0.78, -0.78, 0], [-0.78, 0, 0, -0.78],
  [-0.5, -0.12, 0, -0.42], [0, -0.42, 0.5, -0.12],
  [-0.5, 0.12, 0, 0.42], [0, 0.42, 0.5, 0.12],
  [-0.62, -0.62, -0.38, -0.86], [0.62, 0.62, 0.38, 0.86],
];
const ARCS = 8, T_FLASH = 0.62, T_BURST = 0.69;

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, R0 = o.size;
  const swell = ease.inQuad(seg(t, 0.36, T_FLASH)), flash = t >= T_FLASH && t < T_BURST, b = seg(t, T_BURST, 1.24);
  const R = R0 * (1 + 0.12 * swell), shake = swell > 0.5 && b === 0 ? ((Math.floor(t * 60) % 2) * 2 - 1) * 0.6 : 0;
  const col = (base) => (flash ? WHITE : swell > 0.6 ? C[6] : base);
  // the ring: drawn round by a pen, then broken into arcs that fly apart
  const ring = ease.inOutSine(seg(t, 0, 0.24));
  for (let i = 0; i < ARCS; i++) {
    const r = rng(S, i, 2), a0 = -Math.PI / 2 + (i / ARCS) * TAU, span = TAU / ARCS, shown = clamp(ring * ARCS - i);
    if (shown <= 0) continue;
    const mid = a0 + span / 2, k = ease.outCubic(b), out = (r.range(16, 26) * k), spin = r.sign() * 0.6 * k;
    const life = r.range(0.4, 0.55);
    if (b > 0 && t - T_BURST > life) continue;
    const dx = Math.cos(mid) * out + shake, dy = Math.sin(mid) * out;
    const shrink = b > 0 ? 1 - seg(t - T_BURST, life * 0.5, life) : 1;
    p.arc(dx, dy, R, 2, a0 + spin + (1 - shrink) * span * 0.5, a0 + spin + span * shown - 0.05 - (1 - shrink) * span * 0.5,
      (u, v) => col(b > 0.35 ? C[4] : v > 0.5 ? C[5] : C[3]));
  }
  // strokes: inked one after another while the ring closes; at the burst each flies out from the centre and spins
  STROKES.forEach(([x0, y0, x1, y1], i) => {
    const r = rng(S, i, 3), born = 0.08 + i * 0.022, ink = ease.outQuad(seg(t, born, born + 0.07));
    if (ink <= 0) return;
    let mx = ((x0 + x1) / 2) * R, my = ((y0 + y1) / 2) * R, hx = ((x1 - x0) / 2) * R, hy = ((y1 - y0) / 2) * R;
    let len = 1, alpha = 1;
    if (b > 0) {
      const life = r.range(0.38, 0.55), age = t - T_BURST;
      if (age > life) return;
      const away = Math.hypot(mx, my) > 1 ? Math.atan2(my, mx) : r.range(0, TAU), k = ease.outCubic(seg(age, 0, life));
      const spin = r.sign() * r.range(1.5, 3.5) * k, cs = Math.cos(spin), sn = Math.sin(spin);
      mx += Math.cos(away) * r.range(18, 30) * k;
      my += Math.sin(away) * r.range(18, 30) * k;
      [hx, hy] = [hx * cs - hy * sn, hx * sn + hy * cs];
      len = 1 - seg(age, life * 0.45, life);
    }
    // inking runs from the stroke's start; a white pen point leads
    const ax = mx - hx * len + shake, ay = my - hy * len, bx = ax + 2 * hx * len * ink, by = ay + 2 * hy * len * ink;
    const c = col(b > 0.4 ? C[4] : b > 0 ? C[6] : C[5]);
    p.line(ax, ay, bx, by, c, alpha);
    if (ink < 1) p.px(bx, by, WHITE);
  });
  // the flash, the blast ring and sparks
  if (flash) p.glow(0, 0, 40, C[5], 0.7);
  const sw = seg(t, T_FLASH + 0.03, T_FLASH + 0.29);
  if (sw > 0 && sw < 1) p.ring(0, 0, R0 * 1.1 + 18 * ease.outCubic(sw), 1, sw < 0.4 ? WHITE : C[6], (v, a) => (Math.sin(a * 6 + sw * 5) > sw * 2.4 - 1.2 ? 1 : 0));
  burst(12, S + 9, (r) => {
    const a = r.range(0, TAU), sp = r.range(60, 120), life = r.range(0.3, 0.5), age = t - T_BURST;
    if (age < 0 || age > life) return;
    const q = age / life, [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, age, 0, 5);
    sparkle(p, x, y, q < 0.3 ? 1 : 0, C[6], C[5], q < 0.5 ? WHITE : C[6]);
  });
  // light: builds with the swell, peaks on the flash, falls away fast
  const L = b > 0 ? Math.pow(1 - b, 2) * 0.55 : 0.15 + 0.3 * swell;
  p.glow(0, 0, R0 * 2.2, C[4], L);
  p.glow(0, 0, 8, C[6], L * 0.6);
}
