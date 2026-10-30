import { stream, seg, ease, clamp, tileNoise, TAU, WHITE } from "../../core/index.js";
import { fit, rune, ovalLine, ahead, AZURE } from "./_lib.js";

export const meta = {
  name: "Magic circle cast",
  desc: "A circle draws itself on the floor stroke by stroke, runes pop in round it, it flashes white and a column of light fires straight up.",
  tags: ["arcane", "circle", "cast", "ground", "magic", "runes", "one-shot"],
  size: [72, 88],
  origin: [36, 74],
  duration: 1.35,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: AZURE, radius: 27, height: 64, seed: 11 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), RX = o.radius, RY = Math.round(RX * 0.43), H = o.height, S = o.seed;
  const flash = t >= 0.66 && t < 0.73, charge = t < 0.66 ? seg(t, 0.52, 0.66) : 0, fade = seg(t, 0.78, 1.18);
  const ink = (base) => (flash ? WHITE : charge > 0.5 ? C[6] : base);
  const gone = (ang, k) => fade > 0 && (Math.sin(ang * 9 + k) + 1) / 2 < fade * 1.25; // the lines break up as it fades
  const near = (ang) => Math.sin(ang) > -0.15;
  // 1. the outer ring is drawn by a pen of light starting at the front and running clockwise
  const A0 = Math.PI / 2, s1 = ease.inOutSine(seg(t, 0, 0.3)) * TAU;
  if (t < 1.3) {
    ovalLine(p, RX, RY, (ang) => ink(near(ang) ? C[5] : C[4]), (ang) => (ahead(A0, ang) <= s1 && !gone(ang, 0) ? 1 : 0));
    // 2. the inner ring, counterclockwise from the back
    const s2 = ease.inOutSine(seg(t, 0.12, 0.38)) * TAU, A1 = -Math.PI / 2, ri = 0.62;
    ovalLine(p, RX * ri, RY * ri, (ang) => ink(near(ang) ? C[5] : C[4]), (ang) => (ahead(ang, A1) <= s2 && !gone(ang, 2) ? 1 : 0));
    // 3. two squares make an eight-point star, each edge drawn out from its corner
    const V = (k) => {
      const a = (k * TAU) / 8 - Math.PI / 2;
      return [Math.cos(a) * RX * ri, Math.sin(a) * RY * ri];
    };
    for (let k = 0; k < 8; k++) {
      const u = ease.outQuad(seg(t, 0.3 + k * 0.025, 0.38 + k * 0.025));
      if (u <= 0 || fade > 0.35 + (k % 4) * 0.12) continue;
      const [x0, y0] = V(k), [x1, y1] = V(k + 2), x2 = x0 + (x1 - x0) * u, y2 = y0 + (y1 - y0) * u;
      p.line(x0, y0, x2, y2, ink((y0 + y1) / 2 > 0 ? C[5] : C[4]));
      if (u < 1) p.px(x2, y2, WHITE);
    }
    // 4. runes pop in round the band, one after another, and lift off as it fades
    for (let i = 0; i < 10; i++) {
      const born = 0.4 + i * 0.016, a = (i / 10) * TAU + Math.PI / 2, lift = seg(t, 0.8 + i * 0.025, 1.05 + i * 0.025);
      if (t < born || lift >= 1) continue;
      const x = Math.cos(a) * RX * 0.81, y = Math.sin(a) * RY * 0.81 - 10 * ease.inQuad(lift);
      const shake = charge > 0 && charge < 1 ? (Math.floor(t * 60 + i) % 2) * 2 - 1 : 0;
      rune(p, i + S, x + shake * 0.6, y, t - born < 0.05 || flash ? WHITE : ink(near(a) ? C[6] : C[5]), 1 - lift, true);
    }
    // the pen heads
    for (const [s, A, R, dir] of [[s1, A0, RX, 1], [ease.inOutSine(seg(t, 0.12, 0.38)) * TAU, -Math.PI / 2, RX * 0.62, -1]]) {
      if (s <= 0 || s >= TAU) continue;
      const a = A + s * dir, x = Math.cos(a) * R, y = Math.sin(a) * R * (RY / RX);
      p.circle(x, y, 1.5, WHITE);
      p.glow(x, y, 8, C[5], 0.5);
    }
  }
  // floor light: builds while it charges, blinds on the flash
  p.shade(-RX, -RY, RX, RY, (x, y, out) => {
    const d = Math.hypot(x / RX, y / RY);
    if (d > 1) return;
    out.l = C[5];
    out.k = (0.08 + 0.2 * charge + (flash ? 0.5 : 0)) * (1 - d * d) * (1 - fade);
  });
  // 5. the column: snaps up out of the inner ring, then narrows to a thread and is gone
  const up = seg(t, 0.66, 0.76), thin = ease.inQuad(seg(t, 0.78, 1.1));
  if (up > 0 && thin < 1) {
    const top = -H * ease.outExpo(up), w = RX * 0.55 * (1 - thin) + 0.6, ri = 0.62;
    p.shade(-w, top - 2, w, RY * ri, (x, y, out) => {
      const v = Math.abs(x) / w, front = RY * ri * Math.sqrt(Math.max(0, 1 - (x / (RX * ri)) ** 2));
      if (v > 1 || y > front) return;
      // streaks: vertical bands that race upward; the top frays into them
      const streak = tileNoise(x * 0.7, y * 0.06 + t * 16, 0, 0, S) * 0.5 + 0.5, tip = clamp((y - top) / 18);
      const lvl = (1 - v) * 1.15 + streak * 0.6 - (1 - tip) * 0.9;
      if (lvl < 0.4) return;
      out.c = flash || lvl > 1.22 ? WHITE : lvl > 0.95 ? C[6] : lvl > 0.65 ? C[5] : C[4];
      out.k = 0.15;
    });
    p.glowLine(0, top * 0.8, 0, 0, w + 8, C[5], 0.35 * (1 - thin));
  }
  // streaks shooting up the column
  stream(t, 0.68, 1.0, 40, S, (r) => r.range(0.18, 0.32), (age, life, r) => {
    const x = r.range(-RX * 0.7, RX * 0.7), y0 = r.range(-RY * 0.4, RY * 0.6), sp = r.range(200, 300);
    const y = y0 - age * sp, len = r.range(4, 9), k = age / life;
    if (y < -H - 6) return;
    p.line(x, y, x, y + len * (1 - k * 0.5), k < 0.4 ? WHITE : k < 0.75 ? C[6] : C[5]);
  });
  if (flash) p.glow(0, -8, 34, C[5], 0.55);
}
