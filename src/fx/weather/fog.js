import { ramp, clamp, tileFbm, TAU } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Fog",
  desc: "Banks of fog roll slowly across in three layers, the far ones slower and darker, a thick pale mist hugging the floor.",
  tags: ["weather", "fog", "mist", "haze", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 64],
  duration: 12,
  loop: true,
  fps: 15,
  bg: "ground",
  options: { palette: ["#2a3040", "#465064", "#6c7890", "#9ca8bc", "#d0d8e4"], seed: 89 },
};

// fog is translucent, so it lives in the light buffer, thickening in flat posterized steps (never a smear,
// never a dither pattern); each bank's thickest core takes a paler step
const level = (d) => (d > 0.62 ? 3 : d > 0.38 ? 2 : d > 0.16 ? 1 : 0);
const HAZE = [0, 0.08, 0.15, 0.23];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, B = box(meta), ph = t / meta.duration;
  // [center height, half thickness, laps a loop, color step, seed]: back to front
  const banks = [
    [-34, 13, 1, 1, 0],
    [-18, 11, 2, 2, 1],
    [-3, 8, 3, 3, 2],
  ];
  for (const [cy, hw, laps, ci, k] of banks) {
    // the band's wave depends only on the column: once per column
    const wave = [];
    for (let cx = B.x0; cx <= B.x1; cx++) wave.push(Math.sin(((cx + 0.5 - B.x0) / B.w) * TAU * 2 - ph * TAU * laps + k) * 3);
    const reach = hw * 1.3 + 3;
    p.shade(B.x0, Math.max(B.y0, cy - reach), B.x1, Math.min(B.y1, cy + reach), (x, y, out) => {
      const u = (x - B.x0) / B.w, edge = 1 - Math.abs(y - cy - wave[Math.floor(x) - B.x0]) / hw;
      if (edge < -0.25) return;
      // a wavy band; its edges tear into wisps that scroll by a whole width a lap
      const n = tileFbm(u * 5 - ph * 5 * laps, (y - cy) * 0.09 + k * 7.3, 5, 0, S + k, 2);
      const lv = level(edge * 0.75 + n * 0.55);
      if (!lv) return;
      out.l = C[ci + (lv === 3 ? 1 : 0)];
      out.k = HAZE[lv] * (0.85 + ci * 0.15);
      // in the thick of it, streaks of mist drawn as long horizontal dashes that ride along with the bank
      if (lv === 3 && Math.round(y - cy) % 4 === 0) {
        const dash = tileFbm(u * 20 - ph * 20 * laps, y * 0.5 + k * 3.1, 20, 0, S + 9 + k, 1);
        if (dash > 0.12) return C[ci + 1];
      }
    });
  }
}
