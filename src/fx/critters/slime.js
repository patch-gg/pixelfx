import { RAMP, seg, clamp, hex, WHITE } from "../../core/index.js";
import { Grid, shades, lit, keys, shift } from "./_lib.js";

export const meta = {
  name: "Slime",
  desc: "A glossy slime hops in place: it squashes down to wind up, stretches into the jump, rounds out in the air, splats on landing and wobbles back.",
  tags: ["critter", "slime", "monster", "bounce", "loop"],
  size: [40, 40],
  origin: [20, 34],
  duration: 1.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#123a2c", "#1f6b3c", "#3aa64a", "#8edc5a", "#effcc4"], height: 14, seed: 1 },
};

const SHADOW = hex("#141019");

// squash (-) and stretch (+) through the hop, and when it's off the ground
const SQUASH = [[0, 0], [0.1, 0.04], [0.2, -0.06], [0.3, -0.34], [0.345, 0.3], [0.45, 0.06], [0.53, -0.03],
  [0.64, 0.12], [0.71, 0.22], [0.745, -0.42], [0.8, 0.17], [0.86, -0.1], [0.92, 0.05], [0.97, -0.01]];
const AIR0 = 0.335, AIR1 = 0.72;

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), ph = t / meta.duration;
  const q = seg(ph, AIR0, AIR1), air = q > 0 && q < 1 ? 1 : 0;
  const lift = -o.height * 4 * q * (1 - q);
  const s = keys(ph, SQUASH);
  const Hs = 13 * (1 + s), Ws = 10.5 * (1 - 0.5 * s), base = lift;
  const c = 0.34, low = air ? 1.0 : 1.45;
  // the shadow on the floor shrinks as it rises
  const sw = Ws * (1 - 0.45 * (-lift / o.height)) + 1;
  p.ellipse(0, 0.5, sw, 1.4, SHADOW, 0.7);
  const g = new Grid(-20, -36, 40, 38);
  g.shade(-Ws - 1, base - Hs - 1, Ws + 1, base, (x, y) => {
    const v = (base - y) / Hs;
    if (v < 0 || v > 1) return 0;
    const nx = x / Ws, ny = (c - v) / (v > c ? 1 - c : c * low);
    if (nx * nx + ny * ny > 1) return 0;
    // a glossy blob: highlight up-left, the base sinking into shadow, light bouncing up into the far side
    const sx = nx + 0.42, sy = ny + 0.5;
    if (sx * sx + sy * sy * 1.4 < 0.035) return S[4];
    const L = lit(nx, ny * 0.9);
    if (v < 0.09 && !air) return S[1];
    if (L > 0.7) return S[3];
    if (L > 0.32) return S[2];
    return nx > 0.35 && ny > 0.3 && L > 0.12 ? S[2] : S[1];
  });
  // eyes ride the squash; a blink near the start of the loop
  const blink = ph > 0.06 && ph < 0.1, eh = Math.max(1, Math.round(3 * (1 + s * 0.8)));
  for (const side of [-1, 1]) {
    const ex = Math.round(side * Ws * 0.32 - (side > 0 ? 1 : 0)), ey = Math.round(base - Hs * 0.52);
    if (blink) {
      g.set(ex, ey + 1, S[0]), g.set(ex + 1, ey + 1, S[0]);
      continue;
    }
    for (let k = 0; k < eh; k++) g.set(ex, ey + k - 1, S[0]), g.set(ex + 1, ey + k - 1, S[0]);
    g.set(ex, ey - 1, WHITE);
  }
  g.outline(S[0]);
  g.draw(p);
  // landing dust: little puffs kicked out sideways
  const d = seg(ph, 0.745, 0.92);
  if (d > 0 && d < 1) {
    const DU = RAMP.dust;
    for (const side of [-1, 1])
      for (let k = 0; k < 2; k++) {
        const e = 1 - (1 - d) ** 2, x = side * (11 + e * (5 + k * 4)), y = -1.5 - e * (1.5 + k * 1.5);
        p.circle(x, y, (k ? 1.2 : 1.8) * (1 - d * 0.6), DU[k ? 4 : 5], clamp(1.3 - d * 1.4));
      }
  }
}
