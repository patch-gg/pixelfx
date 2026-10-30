import { PAL, ramp, at, rand, seg, clamp, TAU, WHITE } from "../../core/index.js";
import { rotSprite, steps } from "./_lib.js";

export const meta = {
  name: "Boomerang",
  desc: "A boomerang whirls out in a wide loop, hangs at the far turn, swings back underneath and is caught, a dotted arc of its path fading behind.",
  tags: ["projectile", "boomerang", "throwing", "return", "one-shot"],
  size: [104, 50],
  origin: [8, 26],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.wood, reach: 42, seed: 16 },
};

const BOOM = [
  "LL.........LL",
  "wLL.......LLw",
  "dwLL.....LLwd",
  ".dwLL...LLwd.",
  "..dwLLLLLwd..",
  "...ddwwwdd...",
];

export function draw(p, t, o) {
  // each throw is a little different: how high the loop swings and where the spin starts
  const C = steps(ramp(o.palette), 7), A = o.reach, B = 11 + 4 * rand(o.seed, 1), spin0 = rand(o.seed, 2) * TAU;
  // the loop: out along the top, round the far end slowly, back along the bottom
  const theta = (tt) => {
    const u = clamp(tt / meta.duration);
    return Math.PI + TAU * (u + 0.115 * Math.sin(TAU * u));
  };
  const pos = (tt) => {
    const th = theta(tt);
    return [A + A * Math.cos(th), B * Math.sin(th)];
  };
  if (t >= meta.duration - 0.02) return;
  // its path: a dotted arc of where it has been, the old end fading first
  for (let j = 1; j <= 14; j++) {
    const tt = t - j * 0.035;
    if (tt < 0) break;
    const [x, y] = pos(tt);
    p.px(x, y, j < 5 ? at(C, 0.86) : j < 10 ? at(C, 0.6) : at(C, 0.4));
  }
  const [x, y] = pos(t), spin = spin0 + t * TAU * 4.2;
  // the whirl: two smears trailing its spin
  p.arc(x, y + 0.5, 7.5, 1.2, spin - 1.9, spin - 0.7, at(C, 0.45));
  p.arc(x, y + 0.5, 7.5, 1.2, spin - 1.9 + Math.PI, spin - 0.7 + Math.PI, at(C, 0.45));
  rotSprite(p, BOOM, { w: C[4], L: C[6] ?? C[5], d: C[2] }, x, y + 0.5, spin, 6.5, 3.5);
  // caught: a little flash as it slaps back into the hand
  const catchK = seg(t, meta.duration - 0.12, meta.duration - 0.02);
  if (catchK > 0) {
    const r = 2 + catchK * 4;
    for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(x + sx * r, y + sy * r, WHITE);
  }
}
