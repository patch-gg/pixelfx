import { PAL, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { fit, flake, glint } from "./_lib.js";

export const meta = {
  name: "Snowflake burst",
  desc: "A white pop, then big six-armed snowflakes spring out with a bounce, spin away and slow, twinkle and shrink to nothing among drifting specks.",
  tags: ["ice", "snow", "snowflake", "burst", "magic", "winter", "one-shot"],
  size: [76, 76],
  origin: [38, 38],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.ice, count: 6, seed: 26 },
};

const STEP = TAU / 24; // turn in 15 degree steps so the arms stay crisp

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, n = o.count;
  // the pop
  if (t < 0.07) {
    p.circle(0, 0, 4 + t * 60, WHITE);
    p.glow(0, 0, 30, I[6], 0.7);
  }
  // the big flakes: spring out with an overshoot, fly out and slow, spinning down, then shrink away
  burst(n + 4, S, (r, i) => {
    const big = i < n, born = big ? 0.02 + r.range(0, 0.04) : 0.08 + r.range(0, 0.1), age = t - born;
    if (age < 0) return;
    const a = (i / n) * TAU + r.range(-0.25, 0.25) + (big ? 0 : TAU / (2 * n)), reach = big ? r.range(16, 22) : r.range(24, 28);
    const d = reach * ease.outCubic(seg(age, 0, 0.55)) + age * 4, x = Math.cos(a) * d, y = Math.sin(a) * d + age * age * 2;
    const pop = ease.outBack(seg(age, 0, 0.18), 2.8), gone = ease.inQuad(seg(t, 0.85 + r.range(0, 0.15), 1.32));
    const R = (big ? r.range(5.5, 8) : r.range(2.5, 3.5)) * pop * (1 - gone);
    if (R < 1) return;
    const w = r.sign() * r.range(5, 9), rot = Math.round((r.range(0, TAU) + (w * (1 - Math.exp(-2.5 * age))) / 2.5) / STEP) * STEP;
    const tw = Math.sin(t * 22 + i * 1.7) > 0.4;
    flake(p, x, y, R, rot, R > 4 ? I[5] : I[6], tw ? WHITE : I[6], WHITE);
    if (R > 4) p.light(x, y, I[5], 0.35 * (1 - gone));
  });
  // glints winking on and off around them
  burst(9, S + 1, (r) => {
    const t0 = r.range(0.12, 0.9), k = seg(t, t0, t0 + 0.25);
    if (k <= 0 || k >= 1) return;
    const a = r.range(0, TAU), d = r.range(8, 30), s = Math.round(2 * Math.sin(k * Math.PI));
    glint(p, Math.cos(a) * d, Math.sin(a) * d, s, I[5], WHITE);
  });
  // fine snow specks drifting outward and down
  burst(18, S + 2, (r) => {
    const life = r.range(0.6, 1.1), age = t - 0.04;
    if (age < 0 || age > life) return;
    const a = r.range(0, TAU), e = (1 - Math.exp(-3 * age)) / 3, sp = r.range(25, 60);
    p.px(Math.cos(a) * sp * e + Math.sin(age * 5 + a) * 1.5, Math.sin(a) * sp * e + age * age * 14, age / life < 0.6 ? I[6] : I[4]);
  });
  p.glow(0, 0, 34, I[4], 0.25 * (1 - seg(t, 0.05, 0.9)));
}
