import { ramp, rng, clamp, TAU, hex } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Twinkling stars",
  desc: "A deep starfield: faint dust stars flicker, brighter ones pulse into little crosses, and a few big ones flare out long four-point rays.",
  tags: ["weather", "night", "sky", "stars", "space", "twinkle", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 36],
  duration: 4,
  loop: true,
  fps: 30,
  bg: "black",
  options: { palette: ["#1a1c3a", "#3a3e72", "#7a80b8", "#c4c8ec", "#ffffff"], count: 80, seed: 127 },
};

// stars take a tint: cold blue-white, warm yellow, a few rose
const TINTS = [hex("#cfe0ff"), hex("#fff2c8"), hex("#ffd0dc")];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, B = box(meta), ph = t / meta.duration;
  // each star twinkles a whole number of times a loop, from its own phase
  const tw = (r) => 0.5 + 0.5 * Math.sin(ph * TAU * r.int(1, 3) + r.next() * TAU);
  // dust: faint single pixels
  for (let i = 0; i < o.count; i++) {
    const r = rng(S, i), x = r.range(B.x0, B.x1), y = r.range(B.y0, B.y1), b = tw(r);
    if (b < 0.2) continue;
    p.px(x, y, b > 0.75 ? C[2] : C[1]);
  }
  // bright stars: a dot that swells into a small cross at its peak
  for (let i = 0; i < 16; i++) {
    const r = rng(S + 1, i), x = Math.round(r.range(B.x0 + 3, B.x1 - 3)), y = Math.round(r.range(B.y0 + 3, B.y1 - 3)), b = tw(r);
    const tint = TINTS[r.int(0, 2)];
    p.px(x, y, b > 0.5 ? tint : C[2]);
    if (b > 0.7) p.px(x - 1, y, C[2]), p.px(x + 1, y, C[2]), p.px(x, y - 1, C[2]), p.px(x, y + 1, C[2]);
    p.light(x, y, tint, 0.3 * b);
  }
  // big stars: long four-point flares that grow and shrink, glowing
  for (let i = 0; i < 4; i++) {
    const r = rng(S + 2, i), x = Math.round(r.range(B.x0 + 10, B.x1 - 10)), y = Math.round(r.range(B.y0 + 8, B.y1 - 8));
    const b = tw(r), tint = TINTS[i % 3], s = Math.round(1 + b * 4);
    p.px(x, y, C[4]);
    for (let k = 1; k <= s; k++) {
      const c = k === 1 ? tint : k < s ? C[3] : C[2];
      p.px(x - k, y, c), p.px(x + k, y, c), p.px(x, y - k, c), p.px(x, y + k, c);
    }
    if (b > 0.6) p.px(x - 1, y - 1, C[2]), p.px(x + 1, y - 1, C[2]), p.px(x - 1, y + 1, C[2]), p.px(x + 1, y + 1, C[2]);
    p.glow(x, y, 6 + b * 6, tint, 0.15 + 0.3 * b);
  }
}
