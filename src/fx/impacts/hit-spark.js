import { PAL, ramp, rng, burst, fly, flyV, seg, clamp, WHITE } from "../../core/index.js";
import { rayStar, starRays, streak } from "./_lib.js";

export const meta = {
  name: "Hit spark",
  desc: "A generic hit: a thin white star pops to full size in a frame and shrinks away while streak sparks spray out and cool.",
  tags: ["impact", "hit", "spark", "combat", "one-shot"],
  size: [44, 44],
  origin: [22, 22],
  duration: 0.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.volt, points: 8, size: 1, seed: 7 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, k = o.size, n = clamp(Math.round(o.points), 4, 8);
  const top = C.length - 1;
  // the star: a small hot core on the hit frame, full size the next, then it shrinks and cools
  const s = t < 0.03 ? 0.55 : Math.pow(1 - seg(t, 0.033, 0.19), 1.6);
  if (s > 0.05) {
    const rays = starRays(n, rng(S, 5), 14 * k, 6 * k, 1.8 * k).map((r) => ({ ...r, len: r.len * s, w: r.w * (0.4 + 0.6 * s) }));
    const cool = seg(t, 0.06, 0.16);
    rayStar(p, 0, 0, rays, (q) => (q < 0.5 - cool * 0.4 ? WHITE : q < 0.82 ? C[top - 1] : C[top - 2]));
    p.circle(0, 0, 2 * k * (0.5 + 0.5 * s), cool < 0.5 ? WHITE : C[top - 1]);
  }
  // streak sparks: fast out, dragged to a stop, cooling white > yellow > orange
  burst(8, S, (r, i) => {
    const a = ((i + r.range(0.1, 0.9)) / 8) * Math.PI * 2, sp = r.range(55, 165) * k, life = r.range(0.12, 0.24), born = r.range(0.045, 0.08);
    const age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(Math.cos(a) * 5, Math.sin(a) * 5, vx0, vy0, age, 60, 8), [vx, vy] = flyV(vx0, vy0, age, 60, 8);
    const len = clamp(Math.hypot(vx, vy) * 0.04, 0, 6);
    const head = q < 0.3 ? WHITE : q < 0.65 ? C[top - 1] : C[top - 3];
    if (len < 1) p.px(x, y, head);
    else streak(p, x, y, vx, vy, len, (u) => (u > 0.5 ? head : C[top - 3]));
    p.light(x, y, C[top - 2], 0.5 * (1 - q));
  });
  // light: a quick pop, gone as the star dies
  const L = 1 - seg(t, 0, 0.2);
  p.glow(0, 0, 15 * k, C[top - 2], 0.4 * L * L);
  p.glow(0, 0, 5 * k, C[top - 1], 0.5 * L);
}
