import { PAL, ramp, at, seg, ease, rng, rand, burst, fly, hex, TAU, WHITE } from "../../core/index.js";
import { fit, tongue, flames, pool } from "./_lib.js";
import { oval, glowOval } from "../explosions/_lib.js";

export const meta = {
  name: "Fire ring",
  desc: "A white flash at the feet, then a ring of flame bursts outward along the ground, burns down as it spreads and leaves a smouldering scorch.",
  tags: ["fire", "ring", "nova", "spell", "ground", "area", "one-shot"],
  size: [124, 56],
  origin: [62, 40],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, radius: 52, height: 20, count: 30, seed: 12 },
};

const SQ = 0.2; // how flat the ring lies on the floor
const CHAR = [hex("#141014"), hex("#2a1c1c")];

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), S = o.seed, Rm = o.radius, Hm = o.height, N = o.count;
  const grow = ease.outCubic(seg(t, 0, 0.6)), R = 3 + (Rm - 3) * grow, end = 1 - seg(t, 1.05, 1.4);
  // the scorch it leaves: a charred band inside the ring with a few embers in it, thinning away by dither
  const sc = seg(t, 0.08, 0.3) * end;
  if (sc > 0) {
    p.shade(-R - 1, -R * SQ - 1, R + 1, R * SQ + 1, (x, y, out) => {
      const d = Math.hypot(x / R, y / (R * SQ));
      if (d > 0.98 || d < 0.55 - 0.3 * grow) return;
      out.a = sc;
      const ex = Math.floor(x / 2), ey = Math.floor(y);
      const ember = rand(ex, ey, S) > 0.955 && t < 0.95 + rand(ex, ey, S + 2) * 0.3;
      if (ember) return rand(ex, ey, S + 1) + Math.sin(t * 14 + ex) * 0.3 > 0.5 ? F[4] : F[3];
      return d > 0.86 ? CHAR[1] : CHAR[0];
    });
  }
  // tongues stand on the ring: tall as it bursts out, burning down as it spreads
  const T = [];
  const life = (1 - ease.inQuad(seg(t, 0.25, 1.15))) * ease.outCubic(seg(t, 0, 0.08));
  for (let i = 0; i < N; i++) {
    const r = rng(S, i), a = ((i + r.range(-0.3, 0.3)) / N) * TAU;
    const h = Hm * r.range(0.55, 1) * life * (1 - 0.35 * Math.sin(a) * grow), x = Math.cos(a) * R, y = Math.sin(a) * R * SQ;
    if (h < 2) continue;
    T.push(tongue(x, y, r.range(2.6, 3.8) * (0.7 + 0.3 * life), h, t * 1.5, S + i * 7, { beat: 3, sway: 1.6, pulse: 0.25 }));
  }
  if (T.length) flames(p, T, { F, ph: t, seed: S, box: [-R - 5, -R * SQ - Hm - 6, R + 5, R * SQ + 2], scroll: 12 });
  // the leading edge: a bright line racing out along the floor
  if (grow < 0.98) oval(p, 0, 0, R + 1, (R + 1) * SQ, F[6], 1 - grow * 0.6);
  // sparks skidding outward along the floor
  burst(18, S + 3, (r) => {
    const a = r.range(0, TAU), sp = r.range(70, 120), L = r.range(0.35, 0.6);
    if (t > L) return;
    const q = t / L, [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp * SQ - r.range(20, 50), t, 160, 2);
    if (y > Math.abs(Math.sin(a)) * 10) return;
    p.px(x, y, q < 0.4 ? F[7] : q < 0.7 ? F[5] : F[3]);
    p.light(x, y, F[5], 0.5 * (1 - q));
  });
  // the flash at the centre: the hero frame
  if (t < 0.07) {
    p.ellipse(0, -1, 7 + 60 * t, 3 + 14 * t, WHITE);
    p.glow(0, -2, 36, F[6], 0.8);
  }
  const L = (1 - seg(t, 0.05, 1.2)) * end;
  glowOval(p, 0, 0, R, R * SQ, 6, F[4], 0.35 * L);
  pool(p, 0, 0, R + 6, R * SQ + 6, F[4], 0.25 * L);
}
