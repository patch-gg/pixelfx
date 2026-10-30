import { ramp, rng, clamp, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Fireflies",
  desc: "Fireflies wander low over the ground at night, each on its own lazy loop, glowing up and fading out at their own slow rhythms.",
  tags: ["weather", "night", "fireflies", "bugs", "glow", "ambient", "loop"],
  size: [96, 64],
  origin: [48, 58],
  duration: 6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1e2a10", "#4a6a18", "#a0c838", "#e8f878", "#ffffe0"], count: 12, seed: 103 },
};

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, B = box(meta), ph = t / meta.duration;
  for (let i = 0; i < o.count; i++) {
    const r = rng(S, i);
    // a wandering path: two slow sines a whole number of turns a loop on each axis, so it closes on itself
    const cx = r.range(B.x0 + 10, B.x1 - 10), cy = r.range(-40, -8);
    const x = cx + Math.sin(ph * TAU * r.int(1, 2) + r.next() * TAU) * r.range(6, 14) + Math.sin(ph * TAU * r.int(3, 4) + r.next() * TAU) * 3;
    const y = cy + Math.sin(ph * TAU * r.int(1, 3) + r.next() * TAU) * r.range(4, 8) + Math.sin(ph * TAU * r.int(4, 6) + r.next() * TAU) * 1.5;
    // glow: a few slow pulses a loop, eased on and off
    const blinks = r.int(2, 4), off = r.next();
    const s = Math.sin((ph * blinks + off) * TAU), b = clamp((s - 0.1) / 0.9);
    const glow = b * b * (3 - 2 * b);
    if (glow < 0.05) {
      p.px(x, y, C[1]); // the bug in the dark
      continue;
    }
    p.px(x, y, glow > 0.6 ? C[4] : glow > 0.25 ? C[3] : C[2]);
    if (glow > 0.7) {
      p.px(x - 1, y, C[2]), p.px(x + 1, y, C[2]), p.px(x, y - 1, C[2]), p.px(x, y + 1, C[2]);
    }
    p.glow(x, y, 9, C[3], 0.45 * glow);
    p.glow(x, y, 3, C[4], 0.4 * glow);
  }
}
