import { hex, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, lit, shift } from "./_lib.js";

export const meta = {
  name: "Bird",
  desc: "A little bluebird flies in place, side on: three hard flaps and a glide, body lifting on each downstroke, tail fanning, beak forward.",
  tags: ["critter", "bird", "flying", "nature", "loop"],
  size: [44, 40],
  origin: [22, 20],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0b1330", "#1d3c7c", "#3a74ca", "#7cb6f2", "#e4f2ff"], breast: "#f0a050", beak: "#f6c344", seed: 1 },
};

// wing tip (from the shoulder) for each frame of a beat: up, down-sweep, down, folded back up; and the glide
const TIP = [[-3, -13], [-10, -4], [-4, 9], [-8, -6]], GLIDE = [-10, -3];
const LIFT = [1, 0, -1, -1];

function wing(g, sx, sy, [tx, ty], fill, lead, tips) {
  // leading edge from the front of the shoulder to the tip; the trailing edge from the back of the shoulder,
  // its feathers fanning out away from the leading edge
  const A = [sx + 2, sy - 1], B = [sx - 3, sy + 1], T = [sx + tx, sy + ty];
  let nx = -(T[1] - A[1]), ny = T[0] - A[0];
  const L = Math.hypot(nx, ny) || 1;
  if (nx * (B[0] - A[0]) + ny * (B[1] - A[1]) < 0) (nx = -nx), (ny = -ny);
  (nx /= L), (ny /= L);
  const at = (f, out) => [B[0] + (T[0] - B[0]) * f + nx * out, B[1] + (T[1] - B[1]) * f + ny * out];
  const mid = [(A[0] + T[0]) / 2 - nx * 0.8, (A[1] + T[1]) / 2 - ny * 0.8];
  g.poly([A, mid, T, at(0.84, 1.8), at(0.74, 0.6), at(0.6, 2), at(0.46, 0.8), at(0.3, 1.8), at(0.15, 0.6), B], fill);
  g.line(A[0], A[1], T[0], T[1], lead);
  for (const f of [0.84, 0.6, 0.3]) {
    const [x, y] = at(f, 1.4);
    g.set(x, y, tips);
  }
}

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), breast = hex(o.breast), beak = hex(o.beak), ph = t / meta.duration;
  const beat = Math.floor(ph * 4), f = (ph * 4) % 1, fi = Math.floor(f * 4), glide = beat === 3;
  const tip = glide ? GLIDE : TIP[fi];
  const by = Math.round((glide ? 0 : LIFT[fi]) + Math.sin(ph * TAU) * 1.5), bx = 0;
  const g = new Grid(-22, -20, 44, 40);
  // far wing first, in shadow
  wing(g, bx + 1, by - 2, [tip[0] * 0.8 + 2, tip[1] * 0.85], S[1], S[2], S[0]);
  // tail: a little fan behind
  const tl = glide ? 0 : fi === 2 ? 1 : fi === 0 ? -1 : 0;
  g.poly([[bx - 4, by - 1], [bx - 10, by - 3 + tl], [bx - 9, by + 0.5 + tl], [bx - 10.5, by + 3 + tl], [bx - 4, by + 2]], S[2]);
  g.line(bx - 5, by + 0.5, bx - 9, by + 0.5 + tl, S[1]);
  // body: blue back, warm breast
  g.ellipse(bx, by, 6.2, 4.2, (nx, ny) => {
    if (ny > 0.05 && nx > -0.55) return lit(nx, ny) > 0.35 ? breast : hex("#c06a34");
    return lit(nx, ny) > 0.62 ? S[3] : S[2];
  });
  // head and beak
  g.ellipse(bx + 5.5, by - 3.4, 3.4, 3.1, (nx, ny) => (ny > 0.45 && nx > -0.2 ? breast : lit(nx, ny) > 0.55 ? S[3] : S[2]));
  g.poly([[bx + 8.4, by - 4.6], [bx + 11.6, by - 3.2], [bx + 8.4, by - 2]], beak);
  g.set(bx + 6, by - 4, S[0]), g.set(bx + 6, by - 5, WHITE);
  // near wing on top
  wing(g, bx, by - 1, tip, S[2], S[3], S[1]);
  g.outline(S[0]);
  g.draw(p);
}
