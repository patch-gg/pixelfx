import { PAL, burst, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { fit, plus, ovalLine } from "./_lib.js";

export const meta = {
  name: "Healing ring",
  desc: "A healing ring rolls out across the floor; crosses rise wherever it passes and the green glow it leaves fades away.",
  tags: ["holy", "heal", "aoe", "area", "ground", "one-shot"],
  size: [100, 60],
  origin: [50, 44],
  duration: 1.25,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.heal, accent: PAL.gold, radius: 42, count: 14, seed: 32 },
};

const SQ = 0.34; // floor squash
const T_RING = 0.75;

export function draw(p, t, o) {
  const C = fit(o.palette), G = fit(o.accent), RM = o.radius, S = o.seed;
  const e = ease.outCubic(seg(t, 0, T_RING)), R = 4 + (RM - 4) * e, gone = seg(t, T_RING * 0.7, T_RING + 0.15);
  // the glow it leaves on the floor (light only)
  if (t < 1.1)
    p.shade(-R, -R * SQ, R, R * SQ, (x, y, out) => {
      const d = Math.hypot(x / R, y / (R * SQ));
      if (d > 1) return;
      out.l = C[5];
      out.k = 0.16 * d * d * (1 - seg(t, 0.4, 1.1));
    });
  // the ring: a bright leading line with a darker echo inside, breaking into dashes as it dies
  if (gone < 1) {
    const dash = (k) => (ang) => (Math.sin(ang * 12 + k) > gone * 2.2 - 1.1 ? 1 : 0);
    ovalLine(p, R, R * SQ, gone < 0.3 ? C[6] : C[5], dash(0));
    if (R > 8) ovalLine(p, R - 3, (R - 3) * SQ, C[4], dash(2));
  }
  // crosses rise from the floor at the moment the ring reaches them
  burst(o.count, S, (q, i) => {
    const f = q.range(0.32, 0.97), ang = (i / o.count) * TAU + q.range(-0.3, 0.3);
    const x0 = Math.cos(ang) * RM * f, y0 = Math.sin(ang) * RM * f * SQ;
    const born = T_RING * (1 - Math.cbrt(1 - clamp((RM * f - 4) / (RM - 4)))) + 0.02, life = q.range(0.55, 0.75), age = t - born;
    if (age < 0 || age > life) return;
    const k = age / life, gold = i % 4 === 3;
    const x = x0 + Math.sin(age * 7 + i) * 1.2, y = y0 - 2 - age * q.range(26, 38);
    const size = k < 0.06 ? 1 : k < 0.3 ? 3 : k < 0.68 ? 2 : k < 0.88 ? 1 : 0;
    plus(p, x, y, size, gold ? [G[3], G[5], WHITE] : [C[3], C[5], C[7]]);
    if (k < 0.15) p.px(x0, y0, WHITE);
    p.light(x, y, gold ? G[5] : C[5], 0.35 * (1 - k));
  });
  p.glow(0, -4, RM * 0.8, C[4], 0.2 * (1 - seg(t, 0.2, 1.05)));
}
