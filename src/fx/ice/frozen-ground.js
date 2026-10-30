import { PAL, burst, rng, seg, ease, noise, noise2, WHITE } from "../../core/index.js";
import { fit, spike, glint } from "./_lib.js";

export const meta = {
  name: "Frozen ground",
  desc: "Frost creeps out across the floor in feathery fingers, little crystals sprout as it passes and glint; then it all goes glassy, wet and melts away.",
  tags: ["ice", "frost", "ground", "freeze", "aoe", "trap", "one-shot"],
  size: [128, 32],
  origin: [64, 20],
  duration: 2.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, radius: 56, count: 14, seed: 30 },
};

const Q = 0.15, MELT = [1.5, 2.45];

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, R = o.radius;
  const grow = ease.outCubic(seg(t, 0, 0.95)), melt = seg(t, MELT[0], MELT[1]), F = R * grow * (1 - ease.inQuad(melt) * 0.25);
  // the frost: feathery fingers at the edge, fresh white at the front, pale and veined inside;
  // melting, it darkens to wet ice and wears away into puddles
  if (F > 1)
    p.shade(-F - 3, -F * Q - 1, F + 3, F * Q + 2, (x, y) => {
      const yy = y - 1, a = Math.atan2(yy / Q, x), d = Math.hypot(x, yy / Q) / F;
      const fingers = 0.07 * noise(a * 9, S) + 0.05 * noise(a * 21, S + 1);
      const edge = 1 + fingers - (1 - grow) * 0.02;
      if (d > edge) return;
      const wear = melt > 0 ? noise2(x * 0.18, yy * 0.6, S + 3) * 0.5 + 0.5 : 1;
      if (melt > 0 && wear < melt * 1.25) return;
      const vein = Math.abs(noise2(x * 0.16, yy * 0.5, S + 4)) < 0.06;
      if (melt > 0.15) return vein || d > edge - 0.08 ? I[4] : melt > 0.5 ? I[2] : I[3];
      if (d > edge - 0.035) return grow < 1 ? WHITE : I[7];
      if (d > edge - 0.11) return I[6];
      return vein ? I[6] : d < 0.5 ? I[4] : I[5];
    });
  // crystals sprouting where the frost has reached; they shrink and drip as it melts
  for (let i = 0; i < o.count; i++) {
    const r = rng(S, i), side = i % 2 ? 1 : -1, x = side * r.range(4, R * 0.88), y = r.range(-0.5, 2.5);
    const reach = Math.hypot(x, (y - 1) / Q) / R;
    const born = reach < 1 ? 0.95 * (1 - Math.cbrt(1 - reach)) : 9, age = t - born;
    if (age < 0) continue;
    const h = r.range(3, 7) * ease.outBack(seg(age, 0, 0.15), 2.4) * (1 - ease.inQuad(seg(t, MELT[0] + 0.1, MELT[0] + 0.6 + r.range(0, 0.25))));
    if (h > 0.8) spike(p, x, y, 1.4, h, side * r.range(0.5, 2), I);
    if (h > 3 && Math.sin(t * 17 + i * 2.3) > 0.94 && t < MELT[0]) glint(p, x + side, y - h, 1, I[6], WHITE);
    if (melt > 0.15 && melt < 0.8 && h > 0.8) {
      const dk = (t * 2.2 + i * 0.37) % 1;
      p.px(x, y - h * (1 - dk) + dk * 2, I[5]);
    }
  }
  // cold vapour lifting off the fresh frost
  burst(10, S + 9, (r) => {
    const t0 = r.range(0.2, 1.3), life = r.range(0.6, 0.9), a = t - t0;
    if (a < 0 || a > life) return;
    const x = r.range(-R * 0.8, R * 0.8) * grow, y = -1 - a * r.range(8, 14);
    p.px(x + Math.sin(a * 6 + x) * 1.5, y, a / life < 0.5 ? I[6] : I[4]);
  });
  p.glow(0, 0, R * 0.9, I[4], 0.14 * grow * (1 - melt));
}
