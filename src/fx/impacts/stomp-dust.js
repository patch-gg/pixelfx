import { PAL, ramp, burst, fly, seg, ease } from "../../core/index.js";
import { puff } from "./_lib.js";

export const meta = {
  name: "Stomp dust",
  desc: "A landing kicks dust out both ways: a flat skirt splits into two rolling clusters of puffs that skid out along the floor, lift a little and thin away.",
  tags: ["impact", "dust", "land", "stomp", "jump", "ground", "one-shot"],
  size: [64, 24],
  origin: [32, 20],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.dust, size: 1, seed: 15 },
};

export function draw(p, t, o) {
  const D = ramp(o.palette), S = o.seed, k = o.size, N = D.length - 1;
  // the squash: a flat skirt of dust under the feet for the first frames
  const sq = seg(t, 0, 0.1);
  if (sq < 1) p.ellipse(0, -1, (5 + 9 * ease.outCubic(sq)) * k, (2.2 - sq) * k, (d, a) => (Math.sin(a) < -0.3 ? D[N] : D[N - 1]), (d) => (d > 1 - sq ? 0 : 1));
  // two clusters rolling out: a lead puff, smaller ones trailing and lifting, all skidding to a stop
  burst(12, S, (r, i) => {
    const side = i % 2 ? 1 : -1, rank = i >> 1; // 0 leads, the rest trail further and further behind
    const born = 0.01 + rank * r.range(0.01, 0.025), life = r.range(0.4, 0.58) - rank * 0.025, age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, sp = (130 - rank * 17) * r.range(0.85, 1.15) * k;
    const [x, y] = fly(side * r.range(1, 4) * k, -1.5, side * sp, -r.range(4, 10 + rank * 5) * k, age, -4, 4.8);
    const rad = (1 + (3 - rank * 0.35) * r.range(0.75, 1.15) * ease.outCubic(seg(q, 0, 0.35))) * k * (1 - 0.75 * ease.inQuad(seg(q, 0.4, 1)));
    puff(p, x, Math.min(y, -rad * 0.8), rad, D.slice(2), 1 - seg(q, 0.88, 1), 0.45 - q * 0.7, 0.95);
  });
  // a few pebbles hopping out
  burst(4, S + 1, (r, i) => {
    const side = i % 2 ? 1 : -1, life = r.range(0.3, 0.42);
    if (t > life) return;
    const [x, y] = fly(side * 2, -1, side * r.range(40, 80) * k, -r.range(35, 60), t, 320, 1);
    if (y < 0) p.px(x, y, D[N - 2]);
  });
}
