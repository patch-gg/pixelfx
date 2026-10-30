import { PAL, ramp, burst, fly, flyV, seg, ease, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Ember burst",
  desc: "A soft pop throws out a cloud of embers that slow, then float up and drift on the heat, twinkling and cooling from white to red as they wink out.",
  tags: ["fire", "embers", "sparks", "burst", "ambient", "one-shot"],
  size: [84, 100],
  origin: [42, 78],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, count: 56, seed: 14 },
};

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), S = o.seed;
  const COOL = [F[7], F[6], F[5], F[4], F[3], F[2]];
  // the pop: a quick ring of heat and a white heart
  if (t < 0.12) {
    const q = t / 0.12;
    p.ring(0, 0, 3 + 9 * ease.outCubic(q), 1.5, F[5], 1 - q);
    if (t < 0.05) p.circle(0, 0, 4, WHITE);
    p.glow(0, 0, 22, F[5], 0.6 * (1 - q));
  }
  burst(o.count, S, (r, i) => {
    const a = r.range(0, TAU), sp = r.range(35, 95), life = r.range(0.9, 2.2), born = r.range(0, 0.05);
    const age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp * 0.8;
    // thrown out, dragged to a stop, then lifted by the heat and wandering
    let [x, y] = fly(0, 0, vx, vy - 15, age, -r.range(70, 100), 3);
    x += Math.sin(age * r.range(2, 4) + r.next() * TAU) * 3 * seg(age, 0.2, 0.8);
    const c = COOL[Math.min(5, Math.floor(q * q * 6 + r.range(0, 0.6)))];
    // late in life they twinkle and wink out
    if (q > 0.55 && Math.sin(age * r.range(25, 40) + i) < -0.2) return;
    if (age < 0.16) {
      const [ux, uy] = flyV(vx, vy, age, 0, 3.2);
      p.line(x, y, x - ux * 0.03, y - uy * 0.03, COOL[1]);
    }
    const big = i % 6 === 0 && q < 0.7;
    if (big) p.rect(Math.round(x), Math.round(y), 2, 2, COOL[Math.min(5, Math.floor(q * 6) + 1)]);
    p.px(x, y, c);
    p.light(x, y, F[5], (big ? 0.6 : 0.4) * (1 - q));
  });
  p.glow(0, -8, 34, F[4], 0.3 * (1 - seg(t, 0, 1.2)));
}
