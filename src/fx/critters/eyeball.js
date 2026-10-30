import { hex, seg, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, lit, keys, shift } from "./_lib.js";

export const meta = {
  name: "Eyeball",
  desc: "A floating eyeball darts its gaze left, right and up with snappy holds, blinks with fleshy lids, veins on the white, its nerve tail swaying.",
  tags: ["critter", "eye", "eyeball", "monster", "creepy", "float", "loop"],
  size: [40, 48],
  origin: [20, 20],
  duration: 3.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0d2418", "#1d6232", "#36a648", "#8ede6e", "#e2ffb4"], seed: 1 },
};

const WHITES = ["#2a1422", "#8c5e72", "#c9aab0", "#ece0dc", "#fffaf4"].map(hex);
const LID = ["#5a2c44", "#8e4e66", "#b8748a"].map(hex);
const VEIN = hex("#c02c44"), PUPIL = hex("#0b0a10");
// where it looks: snap, hold, snap (phase, value)
const GX = [[0, 0], [0.12, 0], [0.16, -0.5], [0.36, -0.5], [0.4, 0.48], [0.58, 0.48], [0.62, 0.22], [0.76, 0.22], [0.8, 0]];
const GY = [[0, 0], [0.12, 0], [0.16, 0.06], [0.36, 0.06], [0.4, -0.04], [0.58, -0.04], [0.62, -0.42], [0.76, -0.42], [0.8, 0]];
// veins: [angle on the rim, bend]
const VEINS = [[2.6, 1], [3.5, -1], [0.3, -1], [5.6, 1], [1.4, 1]];

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const I = shades(o.palette, 5), ph = t / meta.duration, R = 9;
  const by = Math.round(Math.sin(ph * TAU * 2) * 1.6), cx = 0, cy = by;
  const gx = keys(ph, GX), gy = keys(ph, GY);
  const g = new Grid(-20, -20, 40, 48);
  // the nerve tail hangs behind and sways
  const tail = [];
  for (let s = 0; s <= 12; s += 1.5) tail.push([-2 - s * 0.35 + Math.sin(ph * TAU * 2 - s * 0.3) * s * 0.22, cy + R - 1 + s]);
  g.tube(tail, (u) => 2.2 * (1 - u * 0.7), (u, v) => (v < 0.45 ? LID[2] : LID[1]));
  // the white: a lit sphere
  g.ellipse(cx, cy, R, R, (nx, ny) => {
    const L = lit(nx, ny);
    return WHITES[L > 0.8 ? 4 : L > 0.48 ? 3 : L > 0.22 ? 2 : 1];
  });
  // veins creep in from the rim
  for (const [a, bend] of VEINS) {
    const x0 = Math.cos(a) * (R - 0.5), y0 = cy + Math.sin(a) * (R - 0.5);
    const x1 = Math.cos(a) * (R - 3.5) + Math.cos(a + 1.57) * bend, y1 = cy + Math.sin(a) * (R - 3.5) + Math.sin(a + 1.57) * bend;
    g.line(x0, y0, x1, y1, VEIN);
    g.set(x1 + Math.cos(a + 1.57 * bend) * 1, y1 + Math.sin(a + 1.57 * bend) * 1, VEIN);
  }
  // the iris turns on the ball: it slides and foreshortens toward the rim
  const ix = cx + gx * R, iy = cy + gy * R, irx = 4.4 * Math.sqrt(1 - gx * gx * 0.9), iry = 4.4 * Math.sqrt(1 - gy * gy * 0.9);
  g.ellipse(ix, iy, irx, iry, (nx, ny) => {
    const d = Math.hypot(nx, ny);
    if (d < 0.42) return PUPIL;
    if (d > 0.82) return I[1];
    return lit(nx, ny) > 0.55 ? I[3] : I[2];
  });
  g.set(Math.round(ix - irx * 0.4) - 1, Math.round(iy - iry * 0.45), WHITE);
  g.set(Math.round(ix - irx * 0.4), Math.round(iy - iry * 0.45) - 1, WHITE);
  // a blink: fleshy lids shut from top and bottom and open again
  const shut = Math.sin(Math.PI * seg(ph, 0.86, 0.93));
  if (shut > 0) {
    const top = cy - R + shut * (R + 0.5) * 1.05, bot = cy + R - shut * (R - 0.5) * 0.95;
    g.shade(cx - R - 1, cy - R - 1, cx + R + 1, cy + R + 1, (x, y) => {
      if (Math.hypot(x - cx, y - cy) > R + 0.2) return 0;
      if (y > top && y < bot) return 0;
      // lid edges dark, the lids lit like the ball they cover
      if ((y < top && y > top - 1.2) || (y > bot && y < bot + 1.2)) return LID[0];
      return lit((x - cx) / R, (y - cy) / R) > 0.55 ? LID[2] : LID[1];
    });
  }
  g.outline(WHITES[0]);
  g.draw(p);
}
