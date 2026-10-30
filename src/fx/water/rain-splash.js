import { PAL, rng, seg, clamp, wrap } from "../../core/index.js";
import { fit, ripple, landTime } from "./_lib.js";

export const meta = {
  name: "Rain splash",
  desc: "Rain on the ground: slanted drops hit and burst into tiny crowns, flick droplets and leave rings that spread and fade.",
  tags: ["water", "rain", "weather", "splash", "puddle", "ambient", "loop"],
  size: [80, 44],
  origin: [40, 36],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, count: 20, width: 30, seed: 4 },
};

const G = 520;

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, D = meta.duration, HW = o.width, n = o.count;
  for (let i = 0; i < n; i++) {
    // births spread evenly through the loop and lanes spread across the ground, so it never clumps or gaps
    const r = rng(S, i), born = ((i + r.range(-0.35, 0.35)) / n) * D, lane = (i * 7) % n;
    const x0 = -HW + ((lane + r.range(0.1, 0.9)) / n) * HW * 2, depth = r.range(-1.5, 4.5), near = (depth + 1.5) / 6;
    const fallT = r.range(0.085, 0.1), vy = (28 + depth) / fallT, vx = vy * 0.22, life = fallT + r.range(0.45, 0.6);
    const age = wrap(t - born, D);
    if (age >= life) continue;
    // falling: a slanted streak, nearer drops longer and brighter
    if (age < fallT) {
      const x = x0 - vx * (fallT - age), y = depth - vy * (fallT - age), len = 0.014 + near * 0.008;
      p.line(x - vx * len, y - vy * len, x, y, near > 0.5 ? W[5] : W[4]);
      p.px(x, y, near > 0.5 ? W[7] : W[6]);
      continue;
    }
    const a = age - fallT, rest = life - fallT, big = near > 0.45;
    // the crown: a flash, then two flicks that open up and fall away
    if (a < 0.034) {
      p.px(x0, depth - 1, W[7]);
      p.px(x0 - 1, depth, W[6]), p.px(x0 + 1, depth, W[6]);
      if (big) p.px(x0, depth - 2, W[6]);
    } else if (a < 0.1) {
      const h = big ? 3 : 2;
      p.line(x0 - 1, depth - 1, x0 - 2, depth - h, W[6]);
      p.line(x0 + 1, depth - 1, x0 + 2, depth - h, W[6]);
      p.px(x0 - 2, depth - h, W[7]), p.px(x0 + 2, depth - h, W[7]);
    } else if (a < 0.16) {
      p.px(x0 - 3, depth - 2, W[5]), p.px(x0 + 3, depth - 2, W[5]);
      if (big) p.px(x0 - 3, depth - 3, W[6]), p.px(x0 + 3, depth - 3, W[6]);
    }
    // a flicked droplet or two
    for (const side of [-1, 1]) {
      if (r.next() < 0.4) continue;
      const dvx = side * r.range(12, 26), dvy = -r.range(50, 80), tl = landTime(depth - 2, dvy, G, depth);
      if (a < 0.06 || a > tl) continue;
      p.px(x0 + dvx * a, depth - 2 + dvy * a + 0.5 * G * a * a, W[6]);
    }
    // the ring it leaves, spreading and breaking up
    const u = clamp(a / rest), rr = 1.5 + u * (3 + near * 4);
    if (a > 0.05) ripple(p, x0, depth, rr, rr * 0.3, big ? W[6] : W[5], W[4], 1.3 * (1 - seg(u, 0.25, 1)), S + i * 3);
  }
}
