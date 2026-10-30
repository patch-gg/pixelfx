import { PAL, RAMP, ramp, seg, ease, burst, fly, clamp, WHITE } from "../../core/index.js";
import { fit, tongue, flames, pool } from "./_lib.js";

export const meta = {
  name: "Ignite",
  desc: "A spark sputters twice and catches: the flame whooshes up white-hot, settles into a lively burn, then dwindles out in a curl of smoke.",
  tags: ["fire", "ignite", "spark", "burn", "status", "one-shot"],
  size: [44, 64],
  origin: [22, 56],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, height: 24, seed: 13 },
};

// the flame's height over time: nothing, a whoosh that overshoots, a steady burn, then out
function size(t) {
  if (t < 0.36) return 0;
  if (t < 0.56) return 0.1 + 1.25 * ease.outBack(seg(t, 0.36, 0.56), 2.2) * 1.1;
  if (t < 0.75) return 1.47 - 0.47 * ease.inOutQuad(seg(t, 0.56, 0.75));
  return 1 - ease.inQuad(seg(t, 0.95, 1.5));
}

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, H = o.height;
  // two sputtering sparks before it catches: a white pixel, a crackle of bits
  for (const [t0, n, k] of [[0.04, 4, 1], [0.2, 6, 2], [0.33, 7, 3]]) {
    const age = t - t0;
    if (age < 0 || age > 0.24) continue;
    if (age < 0.06) {
      p.px(0, -1, WHITE), p.px(-1, -1, F[6]), p.px(1, -1, F[6]), p.px(0, -2, F[6]);
      p.glow(0, -1, 10, F[5], 0.6);
    }
    burst(n, S + k, (r) => {
      const a = -Math.PI / 2 + r.range(-1.3, 1.3), sp = r.range(30, 60), L = r.range(0.12, 0.24);
      if (age > L) return;
      const [x, y] = fly(0, -1, Math.cos(a) * sp, Math.sin(a) * sp, age, 200, 1);
      if (y > 0) return;
      p.px(x, y, age / L < 0.5 ? F[7] : F[5]);
      p.light(x, y, F[5], 0.4);
    });
  }
  // the flame
  const s = size(t), hot = clamp(1 - seg(t, 0.4, 0.62)) * (t > 0.36 ? 1 : 0);
  if (s > 0.04) {
    const T = [
      tongue(0, 0, 5.5 * Math.min(1, 0.4 + s * 0.6), H * s, t / 0.6, S, { beat: 2, sway: 2.2 }),
      tongue(-3.5, 0, 3.4 * Math.min(1, s), H * 0.55 * s, t / 0.6, S + 11, { beat: 3, sway: 1.6 }),
      tongue(3.5, 0, 3.4 * Math.min(1, s), H * 0.62 * s, t / 0.6, S + 23, { beat: 3, sway: 1.6 }),
    ];
    flames(p, T, { F, ph: t, seed: S, box: [-12, -H * 1.6 - 8, 12, 1], scroll: 20, tear: 1 - hot * 0.6 });
    // the whoosh: the heart goes white for a moment as it catches
    if (hot > 0.55) p.ellipse(0, -H * s * 0.22, 1.6 * s, H * s * 0.18, WHITE);
  }
  // a curl of smoke as it goes out: a few puffs that wind up, swell a little and shrink away
  for (let i = 0; i < 4; i++) {
    const age = t - 1.14 - i * 0.08, life = 0.4;
    if (age < 0 || age > life) continue;
    const q = age / life, x = Math.sin(q * 4 + i * 1.3) * (1.5 + q * 3), y = -5 - age * 46;
    const rad = (q < 0.3 ? 1.2 + q * 4.5 : 2.55 * (1 - (q - 0.3) / 0.7)) * (1 - i * 0.1);
    if (rad > 0.55) p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.5 ? SM[4] : d < 0.85 ? SM[3] : SM[2]));
  }
  // light swells with the flame
  const L = Math.min(1.3, s) + hot * 0.4;
  p.glow(0, -H * 0.4 * Math.max(0.3, s), 26 * Math.max(0.4, Math.min(1.2, s)), F[4], 0.28 * L);
  p.glow(0, -4, 9, F[6], 0.3 * L);
  pool(p, 0, 0, 16, 3, F[4], 0.3 * Math.min(1, L));
}
