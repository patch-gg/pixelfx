import { ramp, lerp, TAU } from "../../core/index.js";
import { box, clip, drift } from "./_lib.js";

export const meta = {
  name: "Cherry blossoms",
  desc: "Pink petals ride a soft breeze down and across, fluttering and flipping, now and then one catching the light.",
  tags: ["weather", "spring", "petals", "blossom", "sakura", "wind", "ambient", "loop"],
  size: [96, 64],
  origin: [48, 32],
  duration: 4,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: ["#5a2448", "#a4446e", "#dc78a2", "#f6b2cc", "#fff0f6"], count: 34, seed: 101 },
};

// a petal fluttering: face on, turning, edge on, turning back
const FLUTTER = [["ab", "bc"], [".a", "bc"], ["ab"], ["a.", "bc"]];
const BIG = [[".ab", "abc", "bc."], ["ab.", "bbc"], [".a.", "abc"], ["ab.", ".bc"]];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta);
  drift(t, D, o.count, S, [1, 2], (u, r, i) => {
    // each petal crosses from the upper left to the lower right on the breeze, bobbing as it goes
    const near = i % 4 === 0, dx = r.range(50, 80) * (near ? 1.3 : 1);
    const x0 = r.range(B.x0 - 40, B.x1 - 30), y = lerp(B.y0 - 4 - r.range(0, 20), B.y1 + 4, u);
    const bob = Math.sin(u * TAU * r.range(2, 4) + r.next() * TAU);
    const x = x0 + u * dx + bob * 3;
    const frame = Math.floor(u * r.range(30, 50) + i) % 4, glint = Math.sin(u * TAU * 3 + i * 2) > 0.94;
    const pal = near ? { a: C[4], b: C[3], c: C[2] } : r.chance(0.5) ? { a: C[3], b: C[2], c: C[1] } : { a: C[4], b: C[3], c: C[1] };
    p.sprite((near ? BIG : FLUTTER)[frame], glint ? { a: C[4], b: C[4], c: C[3] } : pal, x, y + bob * 1.5);
    if (glint) p.light(x + 1, y, C[3], 0.4);
  });
}
