import { hex, TAU } from "../../core/index.js";
import { Grid, shades, lit, shift } from "./_lib.js";

export const meta = {
  name: "Bat",
  desc: "A bat flaps in place in four hard wing frames, body bobbing against the beat, ears up, eyes glinting, drifting in a lazy figure eight.",
  tags: ["critter", "bat", "flying", "spooky", "loop"],
  size: [48, 34],
  origin: [24, 16],
  duration: 0.9,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#130d1c", "#2f2245", "#57437a", "#8c74ad", "#d4a2c4"], eyes: "#ffd23c", flaps: 3, seed: 1 },
};

// the right wing spread flat, from the shoulder: leading edge out to the wrist, three fingers, scalloped trailing edge
const WRIST = [7, -3.5], TIPS = [[15.5, -4.5], [15, 3], [8.5, 7]];
const EDGE = [[0, -1.5], WRIST, TIPS[0], [12.5, 0], TIPS[1], [10, 3], TIPS[2], [4.5, 4], [0, 4.5]];
// four wing frames a flap: [angle, span]: up, sweeping down, down, folded on the way back up
const FRAMES = [[-1.05, 0.9], [-0.15, 1], [0.62, 0.92], [-0.42, 0.66]];

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), eye = hex(o.eyes), ph = t / meta.duration;
  const f = (ph * o.flaps) % 1, fi = Math.floor(f * 4), [ang, span] = FRAMES[fi];
  const bx = Math.round(Math.sin(ph * TAU) * 3), by = Math.round(Math.sin(ph * TAU * 2) * 1.5 + [1, 0, -1.5, -0.5][fi]);
  const g = new Grid(-24, -17, 48, 34);
  const cs = Math.cos(ang), sn = Math.sin(ang);
  for (const side of [-1, 1]) {
    const sx = bx + side * 2.5, sy = by - 1;
    const tf = ([x, y]) => [sx + side * (x * span * cs - y * sn), sy + x * span * sn + y * cs];
    const pts = EDGE.map(tf);
    g.poly(pts, S[1]);
    // the arm and finger bones catch a little light
    const [wx, wy] = tf(WRIST);
    g.line(sx, sy - 1, wx, wy, S[3]);
    for (const tip of TIPS) {
      const [tx, ty] = tf(tip);
      g.line(wx, wy, wx + (tx - wx) * 0.8, wy + (ty - wy) * 0.8, S[2]);
    }
    g.set(wx, wy, S[3]);
  }
  // body: furry egg, head with tall ears, pale snout
  g.ellipse(bx, by + 2.5, 3.2, 4.2, (nx, ny) => (lit(nx, ny) > 0.62 ? S[3] : S[2]));
  g.ellipse(bx, by - 2.5, 3.6, 3.2, (nx, ny) => (lit(nx, ny) > 0.6 ? S[3] : S[2]));
  for (const side of [-1, 1]) {
    g.poly([[bx + side * 0.6, by - 4], [bx + side * 3.6, by - 9.5], [bx + side * 3.8, by - 3.5]], S[2]);
    g.set(bx + side * 2.6 - (side > 0 ? 0 : 0), by - 6, S[4]);
    g.set(bx + side * 2.6, by - 5, S[4]);
  }
  // eyes, a pink nose, two fangs
  g.set(bx - 2, by - 3, eye), g.set(bx + 1, by - 3, eye);
  g.set(bx - 1, by - 1, S[4]), g.set(bx, by - 1, S[4]);
  g.set(bx - 1, by, 0xffffffff), g.set(bx, by + 0, S[2]), g.set(bx + 1, by, 0xffffffff);
  // feet tucked under
  g.set(bx - 1, by + 7, S[2]), g.set(bx + 1, by + 7, S[2]);
  g.outline(S[0]);
  g.draw(p);
  p.light(bx - 2, by - 3, eye, 0.5);
  p.light(bx + 1, by - 3, eye, 0.5);
}
