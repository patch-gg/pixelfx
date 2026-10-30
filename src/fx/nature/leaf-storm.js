import { PAL, ramp, at, cycle, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Leaf storm",
  desc: "A whirlwind of leaves spirals up around the target: leaves tumble as they orbit behind and in front, pale wind bands sweep round with them.",
  tags: ["nature", "wind", "leaves", "whirlwind", "buff", "actor", "loop"],
  size: [56, 52],
  origin: [28, 44],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.leaf, count: 20, radius: 15, seed: 29 },
};

const WIND = ["#40564a", "#7e9a86", "#c6dccb"].map(hex);
// a leaf in four turns of its tumble, small and big
const LEAVES = [
  ["ab.", ".bc"],
  [".a", "bb", "c."],
  ["abc"],
  ["c.", "bb", ".a"],
];
const BIG = [
  ["..ab", ".abc", "abc."],
  [".ab.", "abbc", ".cc."],
  ["ab..", "cba.", ".cba"],
  [".a.", "abc", "abc", ".c."],
];

function storm(p, t, o, front) {
  const C = ramp(o.palette), S = o.seed, D = meta.duration, R = o.radius;
  // wind bands: arcs of an ellipse sweeping round the body at a few heights
  for (let j = 0; j < 4; j++) {
    const y0 = -4 - j * 7, rx = R * (0.75 + j * 0.12), ry = 3 + j * 0.4, a0 = (t / D) * TAU * 2 + j * 1.9, span = 1.6 + (j % 2) * 0.6;
    let prev = null;
    for (let k = 0; k <= 14; k++) {
      const a = a0 + (k / 14) * span, d = Math.sin(a);
      const x = Math.cos(a) * rx, y = y0 + d * ry;
      if (prev && d >= 0 === front) p.line(prev[0], prev[1], x, y, front ? (k > 10 ? WIND[2] : WIND[1]) : WIND[0], k / 14 < 0.25 ? 0.5 : 1);
      prev = [x, y];
    }
  }
  // leaves: each rides a rising spiral, tumbling, a whole number of turns a loop
  cycle(t, D, o.count, S, (r) => r.range(0.9, 1.5), (age, life, r, i) => {
    const q = age / life, a = r.range(0, TAU) + age * r.range(5.5, 8.5);
    const rad = R * r.range(0.65, 1.05) * (0.75 + 0.35 * q), d = Math.sin(a);
    if (d >= 0 !== front) return;
    const x = Math.cos(a) * rad, y = -1 - q * r.range(26, 36) + d * 3.5;
    const frame = (i % 3 === 0 ? BIG : LEAVES)[(Math.floor(age * r.range(10, 16)) + i) % 4];
    const tone = r.int(0, 2), dim = front ? 0 : 1;
    p.sprite(frame, { a: C[3 + tone - dim], b: C[4 + tone - dim], c: C[2 + tone - dim] }, x - 1, y - 1, {
      a: q > 0.85 ? (1 - q) / 0.15 : 1,
    });
  });
  if (front) p.glow(0, -14, 26, C[5], 0.08);
}

export const drawBack = (p, t, o) => storm(p, t, o, false);
export const draw = (p, t, o) => storm(p, t, o, true);
