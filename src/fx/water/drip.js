import { PAL, seg, ease, wrap, burst } from "../../core/index.js";
import { fit, ripple, landTime, STONE } from "./_lib.js";

export const meta = {
  name: "Drip",
  desc: "A drop swells under a wet ledge, stretches, lets go, falls and plinks into a puddle: droplets hop up and a ring runs out.",
  tags: ["water", "drip", "drop", "puddle", "cave", "ambient", "loop"],
  size: [32, 72],
  origin: [16, 66],
  duration: 1.8,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, height: 60, puddle: 11, seed: 3 },
};

const LET_GO = 1.05, G = 950;
// the bead as it swells (b body, w shine, c shade, d deep shade), then the pinch just before it lets go
const BEAD = [
  ["b"],
  [".b.", "bwb", ".c."],
  ["..b..", ".bbb.", ".wbb.", ".bbc.", "..c.."],
  ["..b..", "..b..", ".bbb.", "bwbbb", "bbbbc", ".bcc.", "..d.."],
  ["..b..", "..b..", "..b..", ".bbb.", "bwbbb", "bbbbc", ".bcc.", "..d.."],
];
const FALL = [".b.", ".b.", "bwb", "bbc", ".c."];

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, D = meta.duration, top = -o.height, PR = o.puddle;
  const pal = { b: W[5], w: W[7], c: W[4], d: W[3] };
  const fall = Math.sqrt((2 * (o.height - 8)) / G), HIT = LET_GO + fall;
  // the puddle: a dark flat pool with a lit far rim
  p.ellipse(0.5, 0.5, PR, 2.5, (d, a) => (d > 0.8 ? (Math.sin(a) < 0 ? W[3] : W[1]) : W[2]));
  p.line(-PR + 4, -1, -3, -1, W[4]);
  // the ledge it hangs from: a lip of stone with a wet film under it
  p.rect(-5, top - 3, 11, 1, STONE[2]);
  p.rect(-4, top - 2, 9, 1, STONE[3]);
  p.rect(-3, top - 1, 7, 1, STONE[1]);
  p.rect(-2, top, 5, 1, W[3]);
  p.px(0, top, W[4]);
  // forming: the bead swells in steps, holds, pinches
  if (t < LET_GO) {
    const g = seg(t, 0.1, 0.8), i = t > 0.9 ? 4 : Math.min(3, Math.floor(g * 4));
    const sag = t > 0.9 ? Math.round(seg(t, 0.9, LET_GO) * 2) : 0;
    const s = BEAD[i];
    p.sprite(s, pal, -(s[0].length >> 1), top + 1 + sag);
  } else {
    // the ledge keeps a tiny bead that springs back
    const s = seg(t, LET_GO, LET_GO + 0.3);
    if (s < 1) p.px(0, top + 1 + Math.round(1.5 * (1 - ease.outElastic(s))), W[5]);
  }
  // falling: stretched, bright head, a speck of tail when fast
  const tf = t - LET_GO;
  if (tf >= 0 && t < HIT) {
    const y = Math.round(top + 6 + 0.5 * G * tf * tf), v = G * tf;
    p.sprite(FALL, pal, -1, y - 5);
    if (v > 200) p.line(0, y - 6 - Math.round(v * 0.01), 0, y - 6, W[4]);
  }
  // the hit: a tiny crown and a flash, droplets hop out, rings run out (wrapping into the next loop)
  const age = wrap(t - HIT, D);
  if (age < 0.07) {
    p.line(-3, -1, 4, -1, W[7]);
    p.px(-2, -2, W[6]), p.px(3, -2, W[6]), p.px(-3, -3, W[5]), p.px(4, -3, W[5]), p.px(0.5, -2, W[7]);
    p.glow(0.5, -2, 10, W[5], 0.3);
  } else if (age < 0.14) {
    p.px(-3, -3, W[6]), p.px(4, -3, W[6]), p.px(-4, -4, W[5]), p.px(5, -4, W[5]);
  }
  burst(3, S, (r, i) => {
    const vx = i === 1 ? r.range(-5, 5) : (i ? 1 : -1) * r.range(18, 30), vy = -r.range(i === 1 ? 95 : 55, i === 1 ? 115 : 75);
    const g = G * 0.7, tl = landTime(-1, vy, g, 0);
    if (age > tl) return;
    const x = 0.5 + vx * age, y = -1 + vy * age + 0.5 * g * age * age;
    p.px(x, y, i === 1 ? W[7] : W[6]);
    if (i === 1 && vy + g * age < 0) p.px(x, y + 1, W[5]);
  });
  for (const [t0, life, rmax] of [[0.03, 0.5, PR - 2], [0.18, 0.45, PR - 5]]) {
    const u = seg(age, t0, t0 + life);
    if (u <= 0 || u >= 1) continue;
    const rr = 2 + (rmax - 2) * ease.outCubic(u);
    ripple(p, 0.5, 0.5, rr, rr * 0.24, u < 0.3 ? W[7] : W[6], W[5], 1.3 * (1 - seg(u, 0.3, 1)), S + t0 * 9);
  }
}
