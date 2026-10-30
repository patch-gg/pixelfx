import { RAMP, cycle, fract, seg, ease, TAU, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";

export const meta = {
  name: "Loot beam",
  desc: "A dropped sword on the floor sends up a pillar of rarity light: bands climb it, motes rise inside, a ring pulses out at its foot. The palette sets the rarity.",
  tags: ["pickup", "loot", "drop", "rarity", "beam", "loop"],
  size: [44, 80],
  origin: [22, 72],
  duration: 1.5,
  loop: true,
  fps: 30,
  bg: "ground",
  // legendary orange; try PAL.arcane (epic), PAL.electric (rare), PAL.heal (uncommon)
  options: { palette: ["#1e0c04", "#4a1e06", "#8a3a0a", "#d0640e", "#ff9a1e", "#ffc860", "#ffeab0", "#ffffff"], height: 68, seed: 12 },
};

const L = new Layer(32, 16);
const STEEL = RAMP.metal, GRIP = RAMP.wood;

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, H = o.height;
  // the pillar: three nested columns (wide and deep, narrower and brighter, a white core), each ending in a
  // dithered tip at its own height; light bands climb all three
  const cols = [[3.6, 0.6, C[3], C[4]], [2.1, 0.8, C[5], C[5]], [1, 0.95, C[6], C[6]]];
  for (const [w, top, c, cb] of cols) {
    const h = H * top;
    p.shade(-w - 1, -h, w + 1, -1, (x, y, out) => {
      const v = -y / h, ww = w * (v > 0.75 ? 1 - (v - 0.75) * 1.6 : 1);
      if (Math.abs(x + 0.5) > ww) return;
      out.c = fract(-y / 12 - ph * 3) < 0.25 ? cb : c;
      out.a = v > 0.7 ? 1 - (v - 0.7) / 0.3 : 1;
    });
  }
  // the ring at its foot, pulsing out once a loop
  const rk = ease.outCubic(seg(ph, 0, 0.6));
  if (rk < 0.95) p.ellipse(0, 0, 4 + 13 * rk, 1.5 + 3 * rk, rk < 0.4 ? C[6] : rk < 0.75 ? C[5] : C[3], (d) => (d > 0.74 ? 1 : 0));
  // motes rise inside it
  cycle(t, meta.duration, 9, o.seed, (r) => r.range(0.6, 1.1), (age, life, r) => {
    const k = age / life, x = r.range(-4, 4) + Math.sin(age * 6 + r.next() * TAU), y = -2 - age * r.range(30, 55);
    if (-y > H * 0.9) return;
    p.px(x, y, k < 0.5 ? WHITE : C[6]);
    p.light(x, y, C[5], 0.4 * (1 - k));
  });
  // the item: a short sword lying on the floor, its guard and pommel in the rarity colour
  const q = L.begin(-16, -8);
  for (let x = -3; x <= 7; x++) q.px(x, -3, STEEL[6]), q.px(x, -2, STEEL[4]);
  q.px(8, -3, STEEL[5]);
  q.rect(-5, -5, 2, 5, C[4]);
  q.px(-5, -5, C[6]);
  q.rect(-9, -3, 4, 2, GRIP[3]);
  q.px(-9, -3, GRIP[5]), q.px(-7, -3, GRIP[5]);
  q.rect(-11, -3, 2, 2, C[5]);
  L.outline(C[1]);
  L.draw(p);
  p.glowLine(0, -2, 0, -H * 0.7, 11, C[4], 0.28);
  p.glow(0, -2, 18, C[5], 0.3);
}
