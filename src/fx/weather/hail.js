import { ramp, cycle, lerp, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Hail",
  desc: "Hailstones pelt down hard and bounce off the floor in shrinking hops, big ones cracking into chips, then melt away.",
  tags: ["weather", "hail", "ice", "storm", "winter", "ambient", "loop"],
  size: [96, 64],
  origin: [48, 58],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1f4f94", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"], count: 60, seed: 137 },
};

const G = 700; // gravity, px/s²

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta);
  cycle(t, D, o.count, S, (r) => r.range(0.6, 0.75), (age, life, r, i) => {
    const big = i % 4 === 0, s = big ? 3 : 2, fy = -r.int(0, 2), x0 = r.range(B.x0 + 2, B.x1 - 2);
    const vy = r.range(230, 290), sl = 0.12, h0 = fy - (B.y0 - 6), tf = h0 / vy; // a straight, fast drop
    const fade = 1 - (age - (life - 0.12)) / 0.12; // the last frames: melting away
    if (age < tf) {
      const y = lerp(B.y0 - 6, fy, age / tf), x = x0 + (y - fy) * sl;
      p.line(x, y - s - 2, x, y - s, C[1]); // a short streak above it
      p.rect(x - 1, y - s, s, s, C[2]);
      p.px(x - 1, y - s, C[4]);
      return;
    }
    // bounces: each hop shorter; the side kick is fixed per stone
    const a = age - tf, vx = r.range(-28, 28);
    const v1 = vy * 0.32, t1 = (2 * v1) / G, v2 = v1 * 0.35, t2 = (2 * v2) / G;
    let y = fy, x = x0;
    if (a < t1) (y = fy - (v1 * a - 0.5 * G * a * a)), (x = x0 + vx * a);
    else if (a < t1 + t2) (y = fy - (v2 * (a - t1) - 0.5 * G * (a - t1) ** 2)), (x = x0 + vx * (t1 + (a - t1) * 0.5));
    else x = x0 + vx * (t1 + t2 * 0.5);
    // the impact: chips spray off the big ones; a white tick under the small ones
    if (a < 0.08) {
      if (big) for (const sx of [-1, 1]) p.px(x0 + sx * (2 + a * 60), fy - 1 - Math.sin((a / 0.08) * Math.PI) * 3, C[3]);
      else p.px(x0, fy, C[4]);
    }
    const sz = big && a > 0.02 ? 2 : s; // the big ones crack down to a smaller lump
    p.rect(x - 1, y - sz, sz, sz, C[2], fade < 1 ? Math.max(0, fade) : 1);
    if (fade > 0.5) p.px(x - 1, y - sz, C[4]);
  });
}
