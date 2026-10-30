import { ramp, rng, clamp, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "God rays",
  desc: "Shafts of light slant down from a high window into the dark, slowly breathing and swaying; dust motes drift through and flare as they cross the beams.",
  tags: ["weather", "light", "god rays", "sunbeam", "dust", "interior", "ambient", "loop"],
  size: [96, 72],
  origin: [48, 36],
  duration: 6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#3a2a14", "#7a5a28", "#c8a050", "#f4dc96", "#fff8e0"], count: 40, seed: 131 },
};

// shafts: [offset across, width, strength, breathing phase]
const SHAFTS = [
  [-30, 7, 0.8, 0],
  [-14, 12, 1, 1.7],
  [6, 5, 0.6, 3.1],
  [20, 9, 0.85, 4.4],
];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, B = box(meta), ph = t / meta.duration;
  // the beams come in from the top left at a steep slant, swaying a touch
  const ang = 1.05 + Math.sin(ph * TAU) * 0.03, nx = Math.sin(ang), ny = -Math.cos(ang);
  const across = (x, y) => x * nx + y * ny; // distance across the beams
  const along = (x, y) => (x - B.x0) * Math.cos(ang) + (y - B.y0) * Math.sin(ang); // distance down them
  const beam = (x, y) => {
    let best = 0;
    const spread = 0.75 + along(x, y) / 110; // the beams widen as they fall
    for (const [off, w, k, bp] of SHAFTS) {
      const d = Math.abs(across(x, y) - off * spread) / ((w * spread) / 2);
      if (d >= 1) continue;
      const breathe = 0.75 + 0.25 * Math.sin(ph * TAU * 2 + bp);
      const v = (d < 0.55 ? 1 : 0.55) * k * breathe;
      if (v > best) best = v;
    }
    // stronger near the window, fading as the light falls
    return best * clamp(1.25 - along(x, y) / 95);
  };
  p.shade(B.x0, B.y0, B.x1 + 1, B.y1 + 1, (x, y, out) => {
    const b = beam(x, y);
    if (b < 0.05) return;
    out.l = b > 0.5 ? C[3] : C[2];
    out.k = b > 0.75 ? 0.36 : b > 0.5 ? 0.27 : b > 0.28 ? 0.17 : 0.09;
  });
  // where it pours in: a warm bloom at the top left
  p.glow(B.x0 + 6, B.y0, 40, C[3], 0.3 * (0.85 + 0.15 * Math.sin(ph * TAU * 2)));
  // dust motes: drifting on slow closed loops, bright only while inside a beam
  for (let i = 0; i < o.count; i++) {
    const r = rng(S, i);
    const x = r.range(B.x0, B.x1) + Math.sin(ph * TAU * r.int(1, 2) + r.next() * TAU) * r.range(4, 10);
    const y = r.range(B.y0, B.y1) + Math.sin(ph * TAU * r.int(1, 2) + r.next() * TAU) * r.range(3, 7) + Math.sin(ph * TAU * 3 + i) * 1;
    const b = beam(x, y);
    if (b > 0.3) {
      p.px(x, y, b > 0.6 ? C[4] : C[3]);
      p.light(x, y, C[3], 0.35 * b);
    } else if (i % 2 === 0) p.px(x, y, C[1]);
  }
}
