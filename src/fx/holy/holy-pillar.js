import { PAL, burst, stream, fly, seg, ease, clamp, tileNoise, WHITE } from "../../core/index.js";
import { fit, ovalLine, sparkle } from "./_lib.js";

export const meta = {
  name: "Holy pillar",
  desc: "Light from the sky: a thin line drops onto the target, bursts into a white-gold pillar that splashes on the floor, pours a moment, then narrows away.",
  tags: ["holy", "light", "pillar", "beam", "ground", "one-shot"],
  size: [72, 118],
  origin: [36, 106],
  duration: 1.15,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.holy, width: 10, seed: 33 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, top = -meta.origin[1], W = o.width;
  // 1. the warning line: a thread of light drops from the sky to the floor
  const drop = ease.inQuad(seg(t, 0, 0.1));
  if (drop > 0 && t < 0.16) {
    const y = top + (0 - top) * drop;
    p.line(0, top, 0, y, C[6]);
    p.px(0, y, WHITE);
    p.glow(0, y, 6, C[5], 0.4);
  }
  // 2. the pillar: opens in a blink, pours, then narrows to nothing
  const open = ease.outExpo(seg(t, 0.12, 0.2)), close = ease.inQuad(seg(t, 0.8, 1.1)), flash = t >= 0.12 && t < 0.19;
  const w = W * open * (1 - close);
  if (w > 0.3) {
    p.shade(-w * 1.8 - 1, top, w * 1.8 + 1, 1, (x, y, out) => {
      const base = clamp((y + 9) / 9), ww = w * (1 + 0.7 * base * base); // it flares where it meets the floor
      const v = Math.abs(x) / ww;
      if (v > 1) return;
      const pour = tileNoise(x * 0.7, y * 0.05 - t * 12, 0, 0, S) * 0.5 + 0.5; // streaks pouring down
      const lvl = (1 - v) * 1.3 + pour * 0.5 - 0.15;
      if (lvl < 0.2) return;
      out.c = flash || lvl > 1.2 ? WHITE : lvl > 0.95 ? C[6] : lvl > 0.7 ? C[5] : lvl > 0.42 ? C[4] : C[3];
      out.k = 0.1;
    });
    p.glowLine(0, top + 24, 0, 0, w + 12, C[4], 0.3 * (1 - close));
  }
  // falling rays: thin threads of light either side of the pillar, sliding down
  if (w > 2)
    stream(t, 0.14, 0.95, 26, S + 5, (q) => q.range(0.2, 0.35), (age, life, q) => {
      const k = age / life, x = q.sign() * (w + q.range(2, 7)), len = q.range(10, 22);
      const y = top + (0 - top + len) * k - len;
      p.line(x, Math.max(top, y), x, Math.min(0, y + len), k < 0.5 ? C[6] : C[5]);
    });
  // 3. the splash on the floor: a flat white burst, rings racing out, dust kicked aside
  const a = t - 0.12;
  if (a >= 0) {
    if (a < 0.067) {
      p.ellipse(0, 0, W * 2.2, 3, WHITE);
      p.glow(0, -6, 28, C[5], 0.6);
    }
    for (const [d, R0] of [[0, 20], [0.1, 14]]) {
      const rr = seg(a, d, d + 0.3);
      if (rr <= 0 || rr >= 1) continue;
      const R = W + R0 * ease.outCubic(rr);
      ovalLine(p, R, R * 0.28, rr < 0.35 ? C[7] : rr < 0.7 ? C[5] : C[3]);
    }
    burst(6, S + 2, (q) => {
      const side = q.sign(), sp = q.range(40, 75), up = q.range(30, 60), life = q.range(0.3, 0.45);
      if (a > life) return;
      const [x, y] = fly(side * W * 0.6, -1, side * sp, -up, a, 240, 2);
      if (y > 1) return;
      p.px(x, y, a / life < 0.4 ? C[6] : C[4]);
    });
  }
  // 4. a bright puddle where it lands, while it pours
  if (w > 0.6) {
    p.ellipse(0, 0, w * 1.8, 1.6, C[6]);
    p.shade(-w * 3, -6, w * 3, 6, (x, y, out) => {
      const d = Math.hypot(x / (w * 3), y / 6);
      if (d < 1) (out.l = C[5]), (out.k = 0.25 * (1 - d));
    });
  }
  // 5. motes rising inside the light
  stream(t, 0.18, 0.95, 24, S + 3, (q) => q.range(0.35, 0.6), (age, life, q) => {
    const k = age / life, x = q.range(-0.8, 0.8) * W, y = -q.range(0, 20) - age * q.range(50, 90);
    if (Math.abs(x) > w) return;
    sparkle(p, x, y, k < 0.3 ? 1 : 0, C[7], C[6], WHITE);
  });
}
