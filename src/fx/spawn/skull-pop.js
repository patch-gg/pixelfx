import { PAL, ramp, at, burst, seg, ease, bump, WHITE } from "../../core/index.js";
import { cloud, steps } from "./_lib.js";

export const meta = {
  name: "Skull pop",
  desc: "A death marker: a skull springs up out of a puff, bobs while its jaw chatters, then floats higher and blinks out.",
  tags: ["spawn", "death", "skull", "marker", "cartoon", "one-shot"],
  size: [36, 48],
  origin: [18, 44],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.bone, seed: 23 },
};

const SKULL = [
  "...ooooo...",
  "..owwwwho..",
  ".owwwwwwho.",
  "owwwwwwwwho",
  "owddwwwddwo",
  "owddwwwddwo",
  "owwwwdwwwwo",
  ".oswwwwwso.",
  "..ooooooo..",
];
const JAW = [
  "..owtwtwo..",
  "...ooooo...",
];

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 7), S = o.seed;
  const pal = { o: C[1], w: at(C, 0.84), h: WHITE, d: C[0], s: at(C, 0.6), t: at(C, 0.84) };
  // a quick cartoon puff it springs out of
  const balls = [];
  burst(6, S, (r, i) => {
    const a = (i / 6) * Math.PI * 2 + r.range(-0.3, 0.3), e = ease.outCubic(seg(t, 0, 0.12)), gone = seg(t, 0.12 + r.range(0, 0.08), 0.36 + r.range(0, 0.08));
    balls.push({ x: Math.cos(a) * 6 * e, y: -8 + Math.sin(a) * 4 * e, r: r.range(3, 4.2) * (0.4 + 0.6 * e) * (1 - gone) });
  });
  cloud(p, balls, ramp(["#2c2840", "#5a5478", "#8e88aa", "#c4bed8", "#ecebf6"]), { inside: (x, y) => y < 0 });
  // the skull: springs up with an overshoot, bobs, then drifts up and blinks out
  const rise = ease.outBack(seg(t, 0.04, 0.26), 2.2), late = seg(t, 0.95, 1.4);
  const y = Math.round(-6 - 20 * rise - 8 * ease.inQuad(late) + Math.sin(t * 7) * 1.2 * seg(t, 0.26, 0.4));
  // its shadow on the floor, shrinking as it rises
  if (t > 0.04 && late < 1) p.ellipse(0, 0.5, 5 - 2 * rise - 2 * late, 1, C[0], 0.6);
  if (t < 0.05 || late >= 1 || (late > 0.35 && Math.floor(t * 20) % 2 === 0)) return;
  const chatter = t > 0.36 && t < 0.86 && Math.floor(t * 15) % 2 === 0 ? 1 : 0;
  p.sprite(SKULL, pal, -5, y - 11);
  p.sprite(JAW, pal, -5, y - 2 + chatter);
  if (chatter) p.line(-2, y - 2, 2, y - 2, C[0]);
  // a glint on the crown as it snaps into place
  const g = bump(t, 0.2, 0.42);
  if (g > 0) {
    const s = g > 0.5 ? 2 : 1;
    p.line(3 - s, y - 11, 3 + s, y - 11, WHITE), p.line(3, y - 11 - s, 3, y - 11 + s, WHITE);
  }
  p.glow(0, y - 6, 14, at(C, 0.8), 0.2 * (1 - late));
}
