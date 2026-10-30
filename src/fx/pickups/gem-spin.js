import { at, bump, cycle, TAU } from "../../core/index.js";
import { Layer, shadow, twinkle, bob, fit } from "./_lib.js";

export const meta = {
  name: "Gem spin",
  desc: "A cut ruby turning on its axis: eight facets slide past the light, the crown lit, the pavilion glowing from within, a glint.",
  tags: ["pickup", "gem", "jewel", "treasure", "loop"],
  size: [32, 40],
  origin: [16, 36],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1a0410", "#40081e", "#78102c", "#b8163a", "#ec2a48", "#ff6670", "#ffc2c2", "#ffffff"], shadow: true, seed: 2 },
};

const L = new Layer(40, 40);
const N = 8, STEP = TAU / N;
// light from the upper left, toward the viewer; the pavilion takes it mirrored (light bouncing inside)
const LX = -0.55, LY = -0.55, LZ = 0.63;

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  const th = ph * STEP * 6; // six facets slide past per loop: the octagon repeats every STEP, so this loops
  const cy = Math.round(-15 + bob(ph, 2)), TOP = cy - 7, GIR = cy - 2, BOT = cy + 9;
  const radius = (y) => (y < GIR ? 4 + (4 * (y - TOP)) / (GIR - TOP) : 8 * (1 - (y - GIR) / (BOT - GIR)));
  L.begin(-12, TOP - 3);
  L.fill(-11, TOP, 11, BOT, (x, y) => {
    if (y < TOP || y > BOT) return 0;
    const r = radius(y);
    if (r <= 0.2) return 0;
    const s = x / r;
    // the front facet under this pixel
    for (let k = 0; k < N; k++) {
      const a0 = th + k * STEP, mid = a0 + STEP / 2;
      if (Math.cos(mid) <= 0) continue;
      const x0 = Math.sin(a0), x1 = Math.sin(a0 + STEP);
      if (s < x0 || s >= x1) continue;
      const crown = y < GIR, tilt = crown ? 0.75 : -0.7, ct = Math.cos(tilt);
      const nx = Math.sin(mid) * ct, ny = -Math.sin(tilt), nz = Math.cos(mid) * ct;
      // b runs about 0 (facing away) to 1 (facing the light)
      const b = crown ? nx * LX + ny * LY + nz * LZ : -nx * LX + ny * -LY + nz * LZ * 0.6;
      const edge = Math.min(s - x0, x1 - s) * r < 0.6 ? 0.18 : 0; // facet edges read as a lighter seam
      if (crown && y < TOP + 1) return b > 0.5 ? C[6] : C[5]; // the table's front edge
      return crown ? at(C.slice(3, 7), b * 0.8 + edge) : at(C.slice(2, 6), b * 0.95 + edge);
    }
    return 0;
  });
  // the girdle: a hard bright line where crown meets pavilion
  for (let x = -8; x < 8; x++) if (L.get(x, GIR)) L.set(x, GIR, x < 0 ? C[6] : C[5]);
  L.outline(C[1]);
  L.draw(p);
  // glints ride the crown's edge once a loop, and a smaller one on the pavilion
  const g = bump(ph, 0.55, 0.8);
  if (g > 0) {
    twinkle(p, -5, TOP, 1 + Math.round(g * 3.4), C[5], C[6]);
    p.light(-5, TOP, C[6], 0.7 * g);
  }
  const g2 = bump(ph, 0.1, 0.25);
  if (g2 > 0) twinkle(p, 3, cy + 3, 1 + Math.round(g2 * 2), C[6], C[6]);
  // motes of red light drift off it
  cycle(t, meta.duration, 4, o.seed, 0.8, (age, life, r) => {
    const k = age / life, x = r.range(-9, 9), y = cy + r.range(-4, 6) - age * 10;
    if (k < 0.8) p.px(x, y, k < 0.4 ? C[6] : C[5]);
    p.light(x, y, C[5], 0.4 * (1 - k));
  });
  p.glow(0, cy, 22, C[4], 0.08 + 0.03 * Math.sin(ph * TAU * 2));
  if (o.shadow) shadow(p, 0, 6.5 + bob(ph, 0.8));
}
