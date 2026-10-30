import { PAL, rng, wrap, clamp, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Hail impact",
  desc: "Hailstones pelt the ground at a slant: each hits with a white crack and a puff of powder, bounces, hops, and melts away; some burst into chips.",
  tags: ["ice", "hail", "weather", "storm", "impact", "ambient", "loop"],
  size: [80, 48],
  origin: [40, 42],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, count: 16, width: 27, seed: 33 },
};

const G = 900;
const STONE = { 4: [".ab.", "abbc", "bbcc", ".cc."], 3: ["ab.", "abc", ".cc"], 2: ["ab", "bc"], 1: ["b"] };

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, D = meta.duration, n = o.count, HW = o.width, pal = { a: WHITE, b: I[6], c: I[4] };
  const stone = (x, y, s) => {
    const rows = STONE[s];
    p.sprite(rows, pal, Math.round(x) - (rows[0].length >> 1), Math.round(y) - rows.length + 1);
  };
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), born = ((i + r.range(-0.3, 0.3)) / n) * D, lane = (i * 5) % n;
    const x0 = -HW + ((lane + r.range(0.15, 0.85)) / n) * HW * 2, depth = r.range(-1, 3), size = r.next() < 0.35 ? 4 : r.next() < 0.5 ? 3 : 2;
    const fallT = r.range(0.08, 0.1), vy = (32 + depth) / fallT, vx = vy * 0.16, burstOn = r.next() < 0.3;
    const age = wrap(t - born, D);
    if (age < fallT) {
      // falling: a streak behind a hard little stone
      const x = x0 - vx * (fallT - age), y = depth - vy * (fallT - age);
      p.line(x - vx * 0.012, y - vy * 0.012 - size + 1, x - vx * 0.004, y - size, I[5]);
      stone(x, y, size);
      continue;
    }
    const a = age - fallT;
    // the hit: a white crack and a puff of powder
    if (a < 0.035) {
      p.line(x0 - 2, depth - 1, x0 + 2, depth - 1, WHITE);
      p.px(x0, depth - 2, WHITE);
      p.light(x0, depth - 1, I[6], 0.6);
    }
    for (let j = 0; j < 4; j++) {
      const pa = a * (1 - j * 0.1), life = 0.22;
      if (pa > life) continue;
      const dir = j < 2 ? -1 : 1, x = x0 + dir * (1 + pa * (j % 2 ? 22 : 40)), y = depth - 1 - pa * (j % 2 ? 26 : 14) + pa * pa * 60;
      p.px(x, y, pa < life * 0.5 ? I[6] : I[4]);
    }
    if (burstOn) {
      // this one bursts: chips flung out low
      for (let j = 0; j < 4; j++) {
        const life = 0.3, vxj = (j - 1.5) * r.range(18, 30), vyj = -r.range(40, 70), tj = Math.min(a, (-2 * vyj) / G);
        if (a > life) continue;
        p.px(x0 + vxj * a, depth - 1 + vyj * tj + 0.5 * G * tj * tj, a < life * 0.6 ? WHITE : I[5]);
      }
      continue;
    }
    // bounce, hop, rest, melt
    const h1 = r.range(5, 9), h2 = h1 * 0.3, T1 = 2 * Math.sqrt((2 * h1) / G), T2 = 2 * Math.sqrt((2 * h2) / G), vxb = r.range(14, 30);
    let x, y;
    if (a < T1) (x = x0 + vxb * a), (y = depth - (h1 - 0.5 * G * (a - T1 / 2) ** 2));
    else if (a < T1 + T2) { const b = a - T1; (x = x0 + vxb * T1 + vxb * 0.5 * b), (y = depth - (h2 - 0.5 * G * (b - T2 / 2) ** 2)); }
    else (x = x0 + vxb * T1 + vxb * 0.5 * T2), (y = depth);
    const rest = a - T1 - T2, melt = clamp(rest / 0.35), s = melt < 0.4 ? size : melt < 0.75 ? Math.max(1, size - 1) : 1;
    if (melt >= 1) continue;
    stone(x, Math.min(depth, y), s);
    if (melt > 0.5) p.px(x + 1, depth, I[3]);
  }
}
