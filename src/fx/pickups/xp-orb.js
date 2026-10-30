import { PAL, cycle, TAU, WHITE } from "../../core/index.js";
import { Layer, shadow, pillow, fit } from "./_lib.js";

export const meta = {
  name: "XP orb",
  desc: "A green experience orb looping a lazy figure eight, pulsing as it goes, a tapering comet tail behind it with a twinkle riding it, motes shed.",
  tags: ["pickup", "xp", "experience", "orb", "loop"],
  size: [44, 40],
  origin: [22, 36],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.matrix, radius: 4.5, shadow: true, seed: 6 },
};

const L = new Layer(48, 40);
const pos = (ph) => [9 * Math.sin(ph * TAU), -17 + 4 * Math.sin(ph * TAU * 2)];

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  const [x, y] = pos(ph), ox = Math.round(x), oy = Math.round(y);
  // the tail: tapering segments through where it was, cooling down the ramp, with a twinkle riding it
  let [px0, py0] = [x, y];
  for (let i = 1; i <= 8; i++) {
    const [tx, ty] = pos(ph - i * 0.028), w = 2 * (o.radius - 1) * (1 - i / 9);
    p.beam(px0, py0, tx, ty, Math.max(1, w), i < 3 ? C[5] : i < 6 ? C[4] : C[3]);
    p.light(tx, ty, C[5], 0.3 * (1 - i / 9));
    [px0, py0] = [tx, ty];
  }
  const tw = Math.floor(ph * 8) % 2, [sx, sy] = pos(ph - (tw ? 0.09 : 0.15));
  p.px(sx - 1, sy, C[6]), p.px(sx + 1, sy, C[6]), p.px(sx, sy - 1, C[6]), p.px(sx, sy + 1, C[6]), p.px(sx, sy, WHITE);
  // the orb: a lit sphere with a dark rim, pulsing twice a loop
  const R = o.radius * (1 + 0.1 * Math.sin(ph * TAU * 2));
  L.begin(ox - 8, oy - 8);
  pillow(L, ox - R - 1, oy - R - 1, ox + R + 1, oy + R + 1, (px, py) => Math.hypot(px - ox, py - oy) - R, (b) =>
    b > 0.92 ? C[7] : b > 0.78 ? C[6] : b > 0.5 ? C[5] : b > 0.2 ? C[4] : C[3], { bevel: R });
  L.outline(C[2]);
  L.draw(p);
  // motes shed from the trail, hanging and fading where they were dropped
  cycle(t, meta.duration, 6, o.seed, (r) => r.range(0.35, 0.6), (age, life, r) => {
    const born = (t - age) / meta.duration, [mx, my] = pos(born), k = age / life;
    const px = mx + r.range(-4, 4), py = my + r.range(-4, 4) + age * 6;
    if (k > 0.6 && Math.floor(age * 30) % 2) return;
    p.px(px, py, k < 0.4 ? C[6] : C[4]);
  });
  p.glow(ox, oy, 16, C[4], 0.26);
  p.glow(ox, oy, 6, C[6], 0.16);
  if (o.shadow) shadow(p, ox, 4 + (y + 17) * 0.2, 0.9);
}
