import { ramp, lerp, TAU } from "../../core/index.js";
import { box, clip, drift } from "./_lib.js";

export const meta = {
  name: "Falling leaves",
  desc: "Autumn leaves see-saw down through the air, flipping as they swing, settle on the floor for a moment and fade.",
  tags: ["weather", "autumn", "fall", "leaves", "wind", "ambient", "loop"],
  size: [96, 64],
  origin: [48, 58],
  duration: 6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a120c", "#5a1c12", "#962c16", "#cc4a1c", "#e8782a", "#f4a83c", "#fad466"], count: 18, seed: 97 },
};

// a leaf turning over as it swings: face on, three-quarter, edge on, three-quarter from the back; c is the stem side
const TUMBLE = [
  ["..ab..", ".abbb.", "abbbbc", ".bbcc.", "..cc..", "...c.."],
  [".ab..", "abbb.", ".bbc.", "..cc.", "...c."],
  [".a", "ab", "bb", "bc", ".c"],
  ["..ba.", ".bbba", ".cbb.", ".cc..", ".c..."],
];
// far leaves: small and dim
const SMALL = [["ab.", "bbc", ".c."], ["a.", "bc"], ["a", "b", "c"], [".a", "cb"]];
const FLAT = [".aabb.", "abbbcc"];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta);
  drift(t, D, o.count, S, [1, 2], (u, r, i) => {
    const land = r.range(0.6, 0.72); // falling for this share of the trip, then lying on the floor
    const x0 = r.range(B.x0 + 4, B.x1 - 8), swing = r.range(5, 10), swings = r.int(3, 5), ph0 = r.next() * TAU;
    const tone = r.int(0, 2), pal = { a: C[4 + tone], b: C[3 + tone], c: C[1 + tone] }, far = i % 3 === 2;
    if (far && u >= land) return; // far leaves drift down behind the floor line
    const fy = -r.int(0, 2);
    if (u < land) {
      const k = u / land, a = k * TAU * swings * 0.5 + ph0, y = lerp(B.y0 - 6, fy - 1, k);
      // a pendulum swing: fastest through the bottom, hanging at the ends; the drop slows at the ends too
      const x = x0 + Math.sin(a) * swing + k * 8, sv = Math.cos(a);
      const frame = sv > 0.55 ? 0 : sv < -0.55 ? 2 : Math.sin(a) > 0 ? 1 : 3;
      if (far) p.sprite(SMALL[frame], { a: C[2 + tone], b: C[1 + tone], c: C[0 + tone] }, x - 1, y - 1);
      else p.sprite(TUMBLE[frame], pal, x - 3, y - 3);
      return;
    }
    // on the floor: lie flat, then fade away
    const k = (u - land) / (1 - land), x = x0 + Math.sin(TAU * swings * 0.5 + ph0) * swing + 8;
    p.sprite(FLAT, pal, x - 3, fy - 1, { a: k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4 });
  });
}
