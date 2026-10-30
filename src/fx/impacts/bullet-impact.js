import { PAL, ramp, burst, fly, flyV, seg, ease, clamp, WHITE } from "../../core/index.js";
import { rayStar, streak, puff } from "./_lib.js";

export const meta = {
  name: "Bullet impact",
  desc: "A round hits a wall on the right: a flat white flash, sparks sprayed back in a cone, a puff of grit, chips falling, a hot pock mark cooling.",
  tags: ["impact", "bullet", "gun", "sparks", "dust", "debris", "directional", "one-shot"],
  size: [48, 46],
  origin: [40, 26],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.volt, dust: PAL.stone, count: 12, seed: 10 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), G = ramp(o.dust), S = o.seed, N = C.length - 1;
  // grit: a puff that billows back off the wall, spreads, drifts up and thins
  burst(6, S + 3, (r, i) => {
    const born = 0.02 + i * 0.015, life = r.range(0.38, 0.55), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, [x, y] = fly(-2, r.range(-2, 2), -r.range(45, 120), r.range(-42, 16), age, -20, 4.5);
    const rad = (1 + r.range(2.2, 4.8) * ease.outCubic(seg(q, 0, 0.45))) * (1 - 0.7 * ease.inQuad(seg(q, 0.45, 1)));
    puff(p, x, y, rad, G.slice(3), 1 - seg(q, 0.85, 1), 0.4 - q * 0.7);
  });
  // the pock mark: a hot dot in the wall face that cools to a dark pit, then goes
  const hot = seg(t, 0, 0.3), pit = 1 - seg(t, 0.42, 0.6);
  if (pit > 0) {
    p.rect(-1, -1, 2, 3, hot < 0.35 ? C[N - 1] : hot < 0.7 ? C[N - 3] : G[1], pit);
    if (hot < 1) p.px(-1, 0, hot < 0.5 ? WHITE : C[N - 2]);
    p.light(-1, 0, C[N - 2], 0.5 * (1 - hot));
  }
  // chips knocked off the wall: tumble back and drop
  burst(5, S + 2, (r) => {
    const born = r.range(0, 0.04), life = r.range(0.3, 0.4), age = t - born;
    if (age < 0 || age > life) return;
    const [x, y] = fly(-1, r.range(-2, 1), -r.range(25, 70), -r.range(20, 60), age, 260, 1);
    const big = r.next() < 0.5;
    p.rect(x, y, big ? 2 : 1, big ? 2 : 1, G[r.next() < 0.5 ? 6 : 5], 1 - seg(age / life, 0.75, 1));
  });
  // sparks: a fan thrown back off the wall, fast, falling, cooling white > yellow > orange
  burst(o.count, S, (r) => {
    const a = Math.PI + r.range(-0.6, 1.05), sp = r.range(100, 240), born = r.range(0, 0.03), life = r.range(0.13, 0.3), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(-1, 0, vx0, vy0, age, 170, 4.5), [vx, vy] = flyV(vx0, vy0, age, 170, 4.5);
    const head = q < 0.35 ? WHITE : q < 0.7 ? C[N - 1] : C[N - 3];
    streak(p, x, y, vx, vy, clamp(Math.hypot(vx, vy) * 0.03, 1, 5), (u) => (u > 0.5 ? head : C[N - 3]));
    p.light(x, y, C[N - 2], 0.45 * (1 - q));
  });
  // the flash: flattened against the wall, pointing back the way the round came
  if (t < 0.1) {
    const s = t < 0.035 ? 1 : t < 0.07 ? 0.6 : 0.3;
    rayStar(p, -1, 0, [
      { a: Math.PI, len: 13 * s, w: 2 }, { a: Math.PI - 0.6, len: 7 * s, w: 1 }, { a: Math.PI + 0.6, len: 7 * s, w: 1 },
      { a: -Math.PI / 2, len: 6 * s, w: 1.2 }, { a: Math.PI / 2, len: 6 * s, w: 1.2 },
    ], (q) => (q < 0.55 ? WHITE : C[N - 1]));
    p.circle(-1, 0, 2.6 * s, WHITE);
  }
  const L = 1 - seg(t, 0, 0.2);
  p.glow(-2, 0, 16, C[N - 2], 0.4 * L * L);
  p.glow(-1, 0, 5, C[N - 1], 0.5 * L);
}
