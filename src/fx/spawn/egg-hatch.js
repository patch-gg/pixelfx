import { ramp, burst, fly, seg, ease, TAU, WHITE } from "../../core/index.js";
import { rotSprite, cloud, steps } from "./_lib.js";

export const meta = {
  name: "Egg hatch",
  desc: "A speckled egg rocks in three nervous bursts, cracking a little more each time, then pops: the cap flies off in a flash of light and shell bits.",
  tags: ["spawn", "egg", "hatch", "birth", "cartoon", "ground", "one-shot"],
  size: [52, 56],
  origin: [26, 50],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#3a2a1c", "#6e5438", "#a88a62", "#dcc8a0", "#f6ecd2", "#fffaf0"], spots: "#7a9a4a", seed: 25 },
};

// the egg in three states of cracking (c marks the crack); the pivot is the middle of its base
const EGG = [
  ".....oooo.....",
  "...ooLLwwoo...",
  "..oLLLwwwwwo..",
  ".oLLwwwwwswwo.",
  ".oLwwwsswwwwo.",
  "oLwwwwsswwwwwo",
  "oLwwwwwwwwwwwo",
  "owwwwwwwwwssmo",
  "owwswwwwwwssmo",
  "owwsswwwwwwwmo",
  "owwwwwwwwwwwmo",
  "owwwwwwswwwmmo",
  "owwwwwwwwwwmmo",
  ".owwwwwwwwmmo.",
  ".owwwwwwwmmmo.",
  "..ommmmmmmmo..",
  "...oommmmoo...",
  ".....oooo.....",
];
const CRACKS = [
  [],
  [[5, 8], [6, 9], [7, 8]],
  [[3, 9], [4, 8], [5, 9], [6, 8], [7, 9], [8, 8], [9, 9]],
  [[1, 8], [2, 9], [3, 8], [4, 9], [5, 8], [6, 9], [7, 8], [8, 9], [9, 8], [10, 9], [11, 8], [12, 9]],
];
const SHAKES = [[0.1, 0.38, 0.13], [0.5, 0.78, 0.2], [0.88, 1.08, 0.28]]; // [start, end, how hard]
const POP = 1.1;

const withCrack = (n) => EGG.map((row, y) => [...row].map((ch, x) => (CRACKS[n].some(([cx, cy]) => cx === x && cy === y) ? "c" : ch)).join(""));
const STAGES = [0, 1, 2, 3].map(withCrack);

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 6), S = o.seed;
  const pal = { o: C[1], L: C[5], w: C[4], m: C[3], s: o.spots, c: C[0] };
  if (t < POP) {
    // rocking: three bursts, each harder, with a beat of stillness between
    let ang = 0, cracked = 0;
    for (const [a, b, k] of SHAKES) {
      if (t >= a && t < b) ang = k * Math.sin((t - a) * TAU * 6) * Math.sin(Math.PI * seg(t, a, b));
      if (t >= b - 0.1) cracked++;
    }
    rotSprite(p, STAGES[Math.min(3, cracked)], pal, 0, 0, ang, 7, 18);
    return;
  }
  const te = t - POP;
  // the pop: a cartoon puff, the shell flying apart, a white burst of light on top
  const balls = [];
  burst(6, S, (r, i) => {
    const a = (i / 6) * TAU + r.range(-0.3, 0.3), e = ease.outCubic(seg(te, 0, 0.12)), gone = seg(te, 0.1 + r.range(0, 0.1), 0.4 + r.range(0, 0.1));
    balls.push({ x: Math.cos(a) * 10 * e, y: -12 + Math.sin(a) * 6 * e - te * 8, r: r.range(3.5, 5.5) * (0.3 + 0.7 * e) * (1 - gone) });
  });
  cloud(p, balls, ramp(["#3a3550", "#6a6488", "#a29cbc", "#d8d4ea", "#ffffff"]), { inside: (x, y) => y < 0 });
  const fade = 1 - seg(te, 0.5, 0.75);
  // the cradle of shell left on the floor
  rotSprite(p, STAGES[3].slice(9), pal, 0, 0, 0, 7, 9, { a: fade });
  // the cap: flung up, tumbling, falling off to the side
  if (te < 0.7) {
    const [cx, cy] = fly(0, -13, 26, -120, te, 320, 0.4);
    rotSprite(p, STAGES[3].slice(0, 10), pal, cx, cy, te * 9, 7, 5, { a: 1 - seg(te, 0.5, 0.7), inside: (x, y) => y < 1 });
  }
  // shell bits and sparkles
  burst(9, S + 1, (r, i) => {
    const a = -Math.PI / 2 + r.range(-1.3, 1.3), v = r.range(60, 120), life = r.range(0.4, 0.65);
    if (te > life) return;
    const [x, y] = fly(0, -12, Math.cos(a) * v, Math.sin(a) * v, te, 300, 0.6), k = te / life;
    if (y > 0) return;
    if (x < -24 || x > 24) return;
    if (i < 5) p.rect(x, y, 2, 1, k < 0.5 ? C[4] : C[3]);
    else if (k < 0.7) p.px(x, y, WHITE), p.light(x, y, C[5], 0.4);
  });
  if (te < 0.08) {
    p.circle(0, -10, 11 - te * 50, WHITE);
    p.glow(0, -10, 30, C[4], 0.55);
  }
}
