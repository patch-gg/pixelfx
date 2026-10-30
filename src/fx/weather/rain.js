import { ramp, lerp, TAU } from "../../core/index.js";
import { box, clip, drift } from "./_lib.js";

export const meta = {
  name: "Rain",
  desc: "Steady slanted rain in two depths: thin far streaks behind, bright near drops that hit the floor in little crowns and ripples.",
  tags: ["weather", "rain", "water", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 64],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1c2c48", "#2e4a72", "#4c78a8", "#86b6de", "#cfe8fa"], count: 60, slant: 0.28, seed: 71 },
};

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta), sl = o.slant;
  const top = B.y0 - 8;
  // far rain: short dim streaks that fade out before the floor (they fall behind it)
  drift(t, D, Math.round(o.count * 0.7), S, [3, 4], (u, r) => {
    const end = -r.range(2, 30), x0 = r.range(B.x0 - 20, B.x1), y = lerp(top, end + 6, u);
    if (y > end) return;
    const x = x0 + (y - top) * sl, len = 3;
    p.line(x, y, x - len * sl, y - len, C[1]);
  });
  // near rain: long bright streaks; the trip ends on the floor, then plays its splash
  drift(t, D, o.count, S + 1, [4, 6], (u, r) => {
    const x0 = r.range(B.x0 - 18, B.x1 - 2), fy = r.int(0, 2), fall = 0.82; // the last 18% of the trip is the splash
    const len = r.range(4, 7), bright = r.chance(0.35);
    if (u < fall) {
      const y = lerp(top, fy, u / fall), x = x0 + (y - top) * sl;
      p.line(x, y, x - len * sl, y - len, (q) => (q < 0.3 ? C[bright ? 4 : 3] : C[2]));
      return;
    }
    // the splash: a two-drop crown jumps up, a flat ripple spreads, both gone in a few frames
    const k = (u - fall) / (1 - fall), x = x0 + (fy - top) * sl;
    if (k < 0.55) {
      const q = k / 0.55, h = Math.sin(q * Math.PI) * 3;
      p.px(x - 1 - q * 2, fy - h, C[3]);
      p.px(x + 1 + q * 2, fy - h, C[3]);
      if (q < 0.3) p.px(x, fy - 1, C[4]);
    }
    const w = 1 + k * 3;
    p.line(x - w, fy, x + w, fy, C[k < 0.5 ? 3 : 2], k < 0.7 ? 1 : 0.5);
  });
}
