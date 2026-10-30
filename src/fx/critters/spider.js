import { hex, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, lit, keys, shift } from "./_lib.js";

export const meta = {
  name: "Spider",
  desc: "A round little spider drops on its thread, bounces on the silk like a spring, then climbs back up hand over hand, legs paddling.",
  tags: ["critter", "spider", "insect", "spooky", "hanging", "loop"],
  size: [36, 56],
  origin: [18, 2],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0e0a16", "#2b1f3c", "#4f3b68", "#8a6aa8", "#d6c2ea"], mark: "#e8344c", silk: "#b4b0c6", seed: 1 },
};

// how far down the thread it hangs: a drop, springy bounces, then a climb back up in pulls
const DROP = [[0, 14], [0.11, 33], [0.19, 26.5], [0.27, 31.5], [0.35, 28.5], [0.43, 30.5], [0.52, 29.6],
  [0.62, 26], [0.72, 22.5], [0.82, 19], [0.92, 15.5]];

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), mark = hex(o.mark), silk = hex(o.silk), ph = t / meta.duration;
  const y = keys(ph, DROP), climb = ph > 0.55;
  const ay = Math.round(y), ax = 0, cy = ay + 6;
  // silk from the ceiling
  p.line(0, -2, ax, ay - 5, silk);
  // legs: four a side from the head, knees up, feet out; they paddle when it climbs and splay as it falls
  for (const side of [-1, 1])
    for (let k = 0; k < 4; k++) {
      const w = Math.sin(ph * TAU * (climb ? 6 : 3) + k * 1.7 + (side > 0 ? 1 : 0)) * (climb ? 1.6 : 0.8);
      const hx = ax + side * 2, hy = cy - 1 + k * 0.9;
      const kx = ax + side * (5.5 + k * 0.4), ky = cy - 4 + k * 2.2 + w * (k < 2 ? -1 : 1) - (ph < 0.12 ? 2 : 0);
      const fx = ax + side * (7.5 + (k === 0 || k === 3 ? 0.5 : 1.5)), fy = cy + 1 + k * 2.8 + w;
      p.line(hx, hy, kx, ky, S[2]);
      p.line(kx, ky, fx, fy, S[2]);
      p.px(kx, ky, S[3]);
    }
  const g = new Grid(-18, -2, 36, 56);
  // abdomen up top, hung from the silk, with a mark
  g.ellipse(ax, ay, 5, 5.5, (nx, ny) => {
    const L = lit(nx, ny);
    // an hourglass mark
    if (ny > -0.72 && ny < 0.22 && Math.abs(nx) < 0.1 + 0.62 * Math.abs(ny + 0.25)) return mark;
    return L > 0.75 ? S[3] : L > 0.4 ? S[2] : S[1];
  });
  // head below it, big shiny eyes and two fangs
  g.ellipse(ax, cy + 0.5, 3.8, 3.2, (nx, ny) => (lit(nx, ny) > 0.6 ? S[3] : S[2]));
  for (const side of [-1, 1]) {
    const ex = ax + (side < 0 ? -3 : 1);
    g.set(ex, cy - 1, WHITE), g.set(ex + 1, cy - 1, WHITE), g.set(ex, cy, WHITE), g.set(ex + 1, cy, S[0]);
  }
  g.set(ax - 1, cy + 4, S[3]), g.set(ax + 1, cy + 4, S[3]);
  g.outline(S[0]);
  g.draw(p);
}
