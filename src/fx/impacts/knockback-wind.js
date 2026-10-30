import { PAL, ramp, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { puff } from "./_lib.js";

export const meta = {
  name: "Knockback wind",
  desc: "A blow lands from the left and the air bursts: a pale shock cone rolls out to the right over the body, speed lines stream past, dust kicks off the feet.",
  tags: ["impact", "knockback", "wind", "air", "speed-lines", "directional", "actor", "one-shot"],
  size: [80, 40],
  origin: [26, 36],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#1a2a3a", "#2e5468", "#4f8aa0", "#86c4d4", "#c4eef4", "#ffffff"], dust: PAL.dust, lines: 12, seed: 20 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), D = ramp(o.dust), S = o.seed, N = C.length - 1;
  const bx = -9, by = -10; // where the blow lands: the actor's left side, chest high
  // the shock cone: crescents of compressed air rolling out to the right from the blow, worn away at the ends
  [[0, 0.3, 26, 12], [0.06, 0.36, 18, 8]].forEach(([t0, t1, run, R], i) => {
    const q = seg(t, t0, t1);
    if (q <= 0 || q >= 1) return;
    const e = ease.outCubic(q), cx = bx - 3 + run * e, r = 5 + R * e;
    const span = 1.15 * (1 - ease.inQuad(q) * 0.6), lo = Math.min(span, Math.asin(clamp((-1 - by) / r)));
    const w = (u) => (3.4 - i) * (1 - q * 0.5) * Math.sin(Math.PI * clamp(u * 1.1));
    p.arc(cx, by, r, w, -span, lo, (u, v) => (v > 0.6 && q < 0.6 ? WHITE : q < 0.4 ? C[N - 1] : C[N - 2]));
  });
  // speed lines: streaks racing right past the body, each born a little later than the last
  burst(o.lines, S, (r, i) => {
    const born = r.range(0, 0.3) * (i / o.lines + 0.2), life = r.range(0.14, 0.24), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, y = Math.round(-r.range(1.5, 22)), len = r.range(8, 20) * (1 - q * 0.5);
    const x = Math.min(51, -16 + r.range(0, 8) + ease.outQuad(q) * r.range(50, 66)), x0 = Math.max(-24, x - len);
    if (x - x0 >= 2) p.line(x0, y, x, y, (u) => (u > 0.75 && q < 0.5 ? WHITE : u > 0.35 ? C[N - 1] : C[N - 3]));
  });
  // dust kicked off the feet, pushed right, lifting and thinning
  burst(6, S + 1, (r, i) => {
    const born = 0.03 + i * 0.025, life = r.range(0.28, 0.4), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, [x, y] = fly(r.range(-3, 4), -1, r.range(60, 120), -r.range(4, 16), age, -4, 4);
    const rad = (1 + r.range(1.2, 2.6) * ease.outCubic(seg(q, 0, 0.35))) * (1 - 0.7 * ease.inQuad(seg(q, 0.4, 1)));
    puff(p, x, Math.min(y, -rad * 0.8), rad, D.slice(2), 1 - seg(q, 0.88, 1), 0.45 - q * 0.6, 0.85);
  });
  // the blow: a white pop on the actor's side
  if (t < 0.07) {
    const s = t < 0.035 ? 1 : 0.5;
    p.circle(bx, by, 3.5 * s, (d) => (d < 0.6 ? WHITE : C[N - 1]));
    p.line(bx - 8 * s, by, bx + 3 * s, by, WHITE);
    p.line(bx, by - 6 * s, bx, by + 6 * s, C[N - 1]);
  }
  const L = 1 - seg(t, 0, 0.3);
  p.glow(bx + 4, by, 18, C[N - 1], 0.3 * L * L);
}
