import { ramp, seg, ease, burst, clamp, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Implosion",
  desc: "Everything is sucked in: streaks and rings rush toward a darkening core that crushes down to a point, a beat of stillness, then a tiny pop.",
  tags: ["implosion", "vortex", "magic", "void", "collapse", "one-shot"],
  size: [84, 84],
  origin: [42, 42],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#07050f", "#1a1030", "#33265e", "#574ea0", "#928cdc", "#d4d0ff", "#ffffff"], radius: 34, seed: 30 },
};

const POP = 1.05;

export function draw(p, t, o) {
  const C = fit(ramp(o.palette), 7), S = o.seed, R = o.radius;
  // streaks rushing in, faster and faster, each pointing back the way it came
  burst(60, S, (r) => {
    const a = r.range(0, TAU), arrive = r.range(0.45, 0.97), born = arrive - r.range(0.35, 0.55), r0 = R * r.range(0.7, 1.08);
    const q = seg(t, born, arrive);
    if (q <= 0 || q >= 1) return;
    const d = r0 * (1 - ease.inCubic(q)), len = 2 + 12 * q * q, dx = Math.cos(a), dy = Math.sin(a);
    p.line(dx * d, dy * d, dx * (d + len), dy * (d + len), (u) => (u < 0.25 ? C[5] : u < 0.6 ? C[4] : C[3]), (u) => (q < 0.15 ? q / 0.15 : 1) * (1 - u * 0.5));
    if (q > 0.6) p.light(dx * d, dy * d, C[4], 0.4);
  });
  // rings closing in, one after another, firming up as they tighten
  for (let i = 0; i < 3; i++) {
    const q = seg(t, 0.08 + i * 0.2, 0.62 + i * 0.16);
    if (q <= 0 || q >= 1) continue;
    const rr = R * (1 - ease.inQuad(q)) + 1;
    p.ring(0, 0, rr, 1, q > 0.7 ? C[5] : q > 0.35 ? C[4] : C[3]);
  }
  // the core: a void with a bright rim that swells, then is crushed to a point
  const grow = ease.outCubic(seg(t, 0, 0.45)), crush = ease.inQuad(seg(t, 0.62, 0.98));
  const rc = 8 * grow * (1 - crush * 0.9);
  if (t < 0.98 && rc > 0.8) {
    p.circle(0, 0, rc + 1, (d) => (d > 0.82 ? (crush > 0.5 ? C[6] : C[5]) : d > 0.6 ? C[3] : C[0]));
    p.glow(0, 0, 14 + 10 * crush, C[4], 0.25 + 0.35 * crush);
  }
  // a beat of stillness: one point of light
  if (t >= 0.98 && t < POP) {
    p.px(0, 0, WHITE);
    p.light(0, 0, C[5], 0.8);
  }
  // the pop: small and quick
  const age = t - POP;
  if (age >= 0) {
    if (age < 0.07) p.circle(0, 0, 2 + 30 * age, WHITE), p.glow(0, 0, 16, C[5], 0.8);
    const rq = seg(age, 0, 0.2);
    if (rq > 0 && rq < 1) p.ring(0, 0, 2 + 12 * ease.outCubic(rq), 1, rq < 0.5 ? C[6] : C[4], rq < 0.6 ? 1 : 1 - (rq - 0.6) / 0.4);
    burst(8, S + 1, (r, i) => {
      const a = (i / 8) * TAU + r.range(-0.3, 0.3), L = r.range(0.15, 0.3);
      if (age > L) return;
      const d = 3 + r.range(30, 50) * age * (1 - age / L / 2);
      p.px(Math.cos(a) * d, Math.sin(a) * d, age / L < 0.5 ? WHITE : C[5]);
    });
  }
  // the pull darkens the air a little around the core while it lasts
  const pull = clamp(t / 0.3) * (1 - seg(t, 0.95, 1));
  p.glow(0, 0, R + 4, C[3], 0.2 * pull);
}
