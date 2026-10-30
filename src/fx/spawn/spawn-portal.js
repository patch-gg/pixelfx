import { PAL, ramp, at, burst, fly, seg, ease, fract, clamp, TAU, WHITE } from "../../core/index.js";
import { smoke, steps } from "./_lib.js";

export const meta = {
  name: "Spawn portal",
  desc: "A swirling rift tears open flat on the floor, belches a column of violet smoke and sparks as something comes through, then twists shut with a pop.",
  tags: ["spawn", "portal", "summon", "arcane", "ground", "one-shot"],
  size: [64, 64],
  origin: [32, 56],
  duration: 1.7,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, width: 17, seed: 31 },
};

const OPEN = [0, 0.3], PUFF = 0.3, SHUT = [1.05, 1.3];

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 8), S = o.seed;
  const open = ease.outBack(seg(t, OPEN[0], OPEN[1]), 1.8) * (1 - ease.inBack(seg(t, SHUT[0], SHUT[1]), 2));
  const rx = o.width * Math.max(0, open), ry = rx * 0.3;
  // the rift: a flattened whirl lying on the floor, spiral arms turning into the dark, a bright lip
  if (rx > 1) {
    const inner = [C[0], C[1], C[2], C[3], C[4], C[5]];
    p.shade(-rx - 1, -ry - 1, rx + 1, ry + 1, (x, y, out) => {
      const dx = x / rx, dy = y / ry, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
      if (d > 1) return;
      if (d > 0.84) return d > 0.93 ? at(C, 0.98) : at(C, 0.82);
      const arm = fract((a / TAU) * 3 - Math.log(d + 0.06) * 0.85 - t * 2.5), band = 0.5 + 0.5 * Math.sin(arm * TAU);
      return at(inner, d * 0.7 + band * 0.42 - 0.12);
    });
  }
  // the puff: violet smoke shoved up out of the rift, spreading into a mushroom and thinning away
  const list = [];
  burst(14, S, (r, i) => {
    const age = t - PUFF - r.range(0, 0.06), life = r.range(0.6, 0.85);
    if (age < 0 || age > life) return;
    const k = i / 13, q = age / life, e = ease.outCubic(seg(age, 0, 0.35)), h = k * r.range(24, 32);
    // a column that widens as it climbs: low puffs stay narrow, the top ones roll out sideways
    const spread = (r.next() * 2 - 1) * (1.5 + k * k * 11) * e;
    list.push({ x: spread, y: -2 - h * e - age * 6, r: (2.6 + k * 3.2) * (0.5 + 0.6 * e) * (1 + 0.4 * q), v: 1 - q * q });
  });
  smoke(p, list, [C[1], C[2], C[3], C[4], C[5]], { base: 0.3, lit: 0.25, seed: S, inside: (x, y) => y < 1 });
  // sparks thrown up with it
  burst(14, S + 1, (r) => {
    const age = t - PUFF, life = r.range(0.35, 0.65);
    if (age < 0 || age > life) return;
    const a = -Math.PI / 2 + r.range(-0.6, 0.6), v = r.range(60, 120), [x, y] = fly(r.range(-6, 6), -1, Math.cos(a) * v, Math.sin(a) * v, age, 140, 1.2), k = age / life;
    if (y > -1 || (k > 0.6 && Math.floor(age * 24 + r.next() * 4) % 2)) return;
    p.px(x, y, k < 0.3 ? WHITE : k < 0.6 ? at(C, 0.86) : at(C, 0.6));
    p.light(x, y, at(C, 0.75), 0.4 * (1 - k));
  });
  // the pop as it closes: a white star on the floor for a few frames
  const pop = seg(t, SHUT[1] - 0.02, SHUT[1] + 0.12);
  if (pop > 0 && pop < 1) {
    const L = Math.round(2 + 6 * (1 - pop));
    p.line(-L, 0, L, 0, at(C, 0.9)), p.line(0, -L * 0.6, 0, L * 0.4, at(C, 0.9)), p.px(0, 0, WHITE);
  }
  // light: the rift lights the air above it, flaring with the puff
  const lit = clamp(open) * 0.3 + 0.35 * Math.max(0, 1 - Math.abs(t - PUFF - 0.08) / 0.3);
  p.glow(0, -2, 28, at(C, 0.6), lit);
  if (pop > 0 && pop < 1) p.glow(0, 0, 12, WHITE, 0.4 * (1 - pop));
}
