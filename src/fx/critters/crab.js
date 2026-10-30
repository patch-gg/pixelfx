import { seg, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, lit, keys, shift } from "./_lib.js";

export const meta = {
  name: "Crab",
  desc: "A red crab scuttles sideways in quick little steps, stops to snap both claws and look about on its eye stalks, then scuttles back.",
  tags: ["critter", "crab", "beach", "sea", "scuttle", "loop", "ground"],
  size: [56, 36],
  origin: [28, 32],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a0b10", "#7c1c1e", "#c93b26", "#f27c3c", "#ffd2a2"], seed: 1 },
};

// where it is across the floor: scuttle right, stop, scuttle left, stop
const PATH = [[0, -7], [0.28, 7], [0.5, 7], [0.78, -7]];
const moving = (ph) => (ph < 0.28) || (ph >= 0.5 && ph < 0.78);

function claw(g, S, x, y, side, open) {
  // a fat palm with two fingers reaching out; the upper one lifts open on a snap
  const shade = (nx, ny) => (lit(nx, ny) > 0.72 ? S[4] : lit(nx, ny) > 0.38 ? S[3] : S[2]);
  g.ellipse(x, y, 3, 2.6, shade);
  g.ellipse(x + side * 3.2, y + 1.1, 2.4, 1.2, shade);
  g.ellipse(x + side * 3, y - 1.4 - open * 1.8, 2.3, 1.1, shade);
  g.set(x + side * 4.6, y - 1.6 - open * 1.8, S[4]);
}

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), ph = t / meta.duration;
  const bx = Math.round(keys(ph, PATH)), mv = moving(ph);
  const step = Math.floor(t * 16) % 2, bob = mv && step ? -1 : 0;
  const by = -8 + bob;
  // two snaps in each stop, and the stalks look around
  const snapA = Math.sin(Math.PI * seg(ph, 0.32, 0.4)), snapB = Math.sin(Math.PI * seg(ph, 0.82, 0.9));
  const snapC = Math.sin(Math.PI * seg(ph, 0.41, 0.48)), snapD = Math.sin(Math.PI * seg(ph, 0.91, 0.98));
  const look = mv ? 0 : Math.round(Math.sin(ph * TAU * 3));
  const g = new Grid(-28, -32, 56, 36);
  // legs: three a side, stepping in alternation while it moves
  for (const side of [-1, 1])
    for (let k = 0; k < 3; k++) {
      const lift = mv && (k + (side > 0 ? 1 : 0) + step) % 2 === 0 ? 2 : 0;
      const hx = bx + side * (5 + k * 1.5), hy = by + 3;
      const kx = bx + side * (10 + k * 1.6), ky = by - 0.5 + k * 0.6 - lift;
      const fx = bx + side * (12 + k * 1.8), fy = -0.5 - lift * 0.5;
      g.line(hx, hy, kx, ky, S[2]);
      g.line(kx, ky, fx, fy, S[2]);
      g.set(kx, ky, S[3]);
    }
  // arms up to the claws
  const snapL = Math.max(snapA, snapB), snapR = Math.max(snapC, snapD);
  for (const side of [-1, 1]) {
    const cx = bx + side * 12, cy = by - 6 + (side < 0 ? -snapL : -snapR) * 1.5;
    g.line(bx + side * 7, by - 1, cx - side * 2, cy + 2, S[2]);
    g.line(bx + side * 7, by - 2, cx - side * 2, cy + 1, S[3]);
    claw(g, S, cx, cy, side, side < 0 ? snapL : snapR);
  }
  // eye stalks with beady eyes
  for (const side of [-1, 1]) {
    const ex = bx + side * 3 + look, ey = by - 9;
    g.line(bx + side * 3, by - 4, ex, ey + 1, S[3]);
    g.set(ex, ey, S[0]), g.set(ex + (side > 0 ? 1 : -1), ey, S[0]), g.set(ex, ey - 1, S[0]), g.set(ex + (side > 0 ? 1 : -1), ey - 1, WHITE);
  }
  // the shell: wide and low, lit from above, a speckled back and a little mouth
  g.shade(bx - 10, by - 6, bx + 10, by + 5, (x, y) => {
    const nx = (x - bx) / 9.5, ny = (y - by) / (y < by ? 5.5 : 4.2);
    if (nx * nx + ny * ny > 1) return 0;
    const L = lit(nx, ny * 1.2);
    const spot = ((Math.floor(x) * 7 + Math.floor(y) * 13) % 11 === 0) && ny < 0 && L > 0.4;
    if (spot) return S[4];
    return L > 0.84 ? S[4] : L > 0.5 ? S[3] : L > 0.18 ? S[2] : S[1];
  });
  g.set(bx - 1, by + 3, S[1]), g.set(bx, by + 3, S[1]), g.set(bx + 1, by + 3, S[1]);
  g.outline(S[0]);
  g.draw(p);
  // a soft shadow on the sand
  p.ellipse(bx, 0.5, 13, 1.3, 0xff19141a, 0.6);
}
