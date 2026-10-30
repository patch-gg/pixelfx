import { PAL, RAMP, ramp, at, seg, ease, bump, clamp, fbm, stream, fly, rand, TAU, WHITE } from "../../core/index.js";
import { fit, tongue, flames, pool } from "./_lib.js";

export const meta = {
  name: "Flame pillar",
  desc: "The ground cracks and glows, a column of fire erupts white-hot, roars at full height spewing embers, then collapses back into the floor in smoke.",
  tags: ["fire", "pillar", "eruption", "spell", "ground", "one-shot"],
  size: [64, 116],
  origin: [32, 108],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, height: 90, width: 8, seed: 11 },
};

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, H = o.height, W0 = o.width;
  const FIRE = [F[2], F[3], F[4], F[5], F[6], F[7], WHITE];
  const rise = ease.outExpo(seg(t, 0.2, 0.34)), fall = ease.inQuad(seg(t, 1.0, 1.4));
  const top = H * rise * (1 - fall), hero = bump(t, 0.2, 0.42), live = 1 - seg(t, 1.45, 1.8);
  const w = W0 * (1 + 0.5 * hero) * (1 - 0.45 * fall);
  // smoke left where the column stood, rising and shrinking away
  stream(t, 1.0, 1.4, 16, S + 4, (g) => g.range(0.3, 0.4), (age, life, r) => {
    const q = age / life, x = r.range(-6, 6) + Math.sin(age * 5 + r.next() * TAU) * 2, y = -r.range(6, 40) - age * r.range(20, 34);
    const rad = r.range(2.5, 4.5) * (q < 0.35 ? 0.6 + q : (1 - (q - 0.35) / 0.65) ** 0.7);
    if (rad > 0.6) p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.5 ? SM[4] : d < 0.8 ? SM[3] : SM[2]));
  });
  // the crack in the floor: glows before the eruption and cools after
  const crack = seg(t, 0, 0.18) * (1 - seg(t, 1.3, 1.75));
  if (crack > 0) {
    p.shade(-15, -2, 15, 3, (x, y) => {
      const dx = x / 14, dy = (y - 0.5) / 2.4, d = dx * dx + dy * dy;
      if (d > crack) return;
      const line = Math.abs(y - 0.5 - Math.sin(x * 0.9) * 0.9) < 0.6 && Math.abs(x) < 12 * crack;
      return line ? (crack > 0.6 && rand(Math.floor(x), S) > 0.3 ? F[5] : F[4]) : d > 0.6 * crack ? F[1] : F[0];
    });
  }
  // little flames lick at the crack before it goes, and burn out after the collapse
  const lick = Math.max(seg(t, 0.05, 0.2) * (1 - seg(t, 0.2, 0.3)), seg(t, 1.3, 1.4) * (1 - seg(t, 1.45, 1.75)));
  if (lick > 0.05) {
    const T = [-7, -2, 3, 8].map((x, i) => tongue(x, 0, 2.6, (6 + (i % 2) * 3) * lick, t, S + i * 9, { beat: 3, sway: 1, pulse: 0.2 }));
    flames(p, T, { F, ph: t, seed: S + 2, box: [-12, -14, 12, 1], scroll: 6 });
  }
  // the column: a flared foot, a straight roaring shaft and a crown, white-hot on the hero frames,
  // tearing apart as it sinks back into the ground
  if (top > 1.5) {
    p.shade(-w * 2.2, -top - 10, w * 2.2, 1, (x, y) => {
      const v = -y / top;
      if (v < 0 || v > 1.15) return;
      const prof = v < 0.12 ? 1 + (0.12 - v) * 4 : v > 0.8 ? Math.sqrt(clamp(1 - ((v - 0.8) / 0.33) ** 2)) : 1;
      const n = fbm(x * 0.26, y * 0.11 + t * 14, S, 3);
      const sway = Math.sin(v * 5 + t * 18) * 1.2 * v;
      const d = Math.abs(x - sway) / (w * prof * (1 + 0.25 * n));
      if (d > 1.35) return;
      const heat = (1 - d * d) * (0.98 - v * 0.3) + n * (0.34 + fall * 0.6) + hero * 0.45 - fall * 0.25;
      if (heat < 0.12) return;
      return at(FIRE, heat);
    });
  }
  // embers spewed out of the crown, arcing down
  stream(t, 0.26, 1.1, 34, S + 3, (g) => g.range(0.45, 0.7), (age, life, r) => {
    const q = age / life, x0 = r.range(-w, w), y0 = -H * r.range(0.55, 0.95);
    const [x, y] = fly(x0, y0, r.range(18, 42) * Math.sign(x0 || 1), -r.range(30, 70), age, 120, 0.8);
    if (y > -1) return;
    p.px(x, y, q < 0.35 ? F[7] : q < 0.7 ? F[5] : F[3]);
    p.light(x, y, F[5], 0.5 * (1 - q));
  });
  // light: the floor glows first, then the column floods everything and lets go as it falls
  const L = Math.max(crack * 0.4, (top / H) * (0.8 + 0.4 * hero)) * live;
  pool(p, 0, 0, 22, 5, F[4], 0.45 * L);
  if (top > 2) p.glowLine(0, -2, 0, -top * 0.9, 26, F[4], 0.32 * L);
  p.glow(0, -4, 14, F[6], 0.4 * L);
}
