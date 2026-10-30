import { PAL, ramp, rng, fract, clamp, ease, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Wind gust",
  desc: "Wind streams right: long pale streaks whip across, some curling into a loop as they go, and leaves tumble along with the gust, bobbing and spinning.",
  tags: ["nature", "wind", "air", "gust", "leaves", "directional", "loop"],
  size: [96, 48],
  origin: [48, 24],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#3c4a5c", "#6e8296", "#a8bccc", "#e2eef6"], count: 11, leaves: PAL.leaf, seed: 61 },
};

const LEAVES = [["..ab", ".abc", "abc."], [".ab.", "abbc", ".cc."], ["ab..", "cba.", ".cba"], [".a.", "abc", "abc", ".c."]];

export function draw(p, t, o) {
  const C = ramp(o.palette), L = ramp(o.leaves), S = o.seed, D = meta.duration, ph = t / D;
  const [W, H] = meta.size, [OX, OY] = meta.origin, X0 = -OX, X1 = W - OX - 1, Y0 = -OY, Y1 = H - OY - 1;
  const inside = (x, y) => x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
  // streaks: each crosses the canvas a whole number of times a loop, so the loop has no seam
  for (let i = 0; i < o.count; i++) {
    const r = rng(S, i), laps = r.int(2, 3), u = fract(r.next() + (laps * t) / D);
    const len = r.range(22, 44), y0 = r.range(-17, 17), amp = r.range(1, 2.5), curl = r.chance(0.5), R = r.range(2.6, 3.8);
    const loopLen = curl ? TAU * R : 0, c = len * r.range(0.3, 0.5), span = W + len + 30, head = X0 - 15 + u * span;
    const near = r.chance(0.55);
    // s is the distance back along the streak from its head; curlers turn one loop at c, then carry on
    const path = (s) => {
      const xl = head - Math.min(s, c) - Math.max(0, s - c - loopLen), base = y0 + Math.sin(xl * 0.07 + i) * amp;
      if (!curl || s < c || s > c + loopLen) return [xl, base];
      const a = (s - c) / R;
      return [head - c - Math.sin(a) * R, base - R + Math.cos(a) * R];
    };
    let prev = null;
    const total = len + loopLen, steps = Math.ceil(total * 1.3);
    for (let k = 0; k <= steps; k++) {
      const s2 = (k / steps) * total, pt = path(s2);
      if (prev && inside(pt[0], pt[1]) && inside(prev[0], prev[1])) {
        const f = s2 / total; // 0 at the head, 1 at the tail
        const col = f < 0.12 ? C[3] : f < 0.5 ? (near ? C[2] : C[1]) : C[near ? 1 : 0];
        p.line(prev[0], prev[1], pt[0], pt[1], col, f > 0.82 ? 0.5 : 1);
      }
      prev = pt;
    }
  }
  // leaves riding the gust
  for (let i = 0; i < 5; i++) {
    const r = rng(S + 7, i), laps = r.int(1, 2), u = fract(r.next() + (laps * t) / D);
    const x = X0 - 6 + u * (W + 12), y = r.range(-14, 14) + Math.sin(u * TAU * r.int(1, 3) + i) * r.range(3, 7);
    if (!inside(x, y) || !inside(x + 3, y + 3)) continue;
    const frame = LEAVES[(Math.floor(t * r.range(9, 14)) + i) % 4], tone = r.int(0, 2);
    p.sprite(frame, { a: L[3 + tone], b: L[4 + tone], c: L[2 + tone] }, x, y);
  }
}
