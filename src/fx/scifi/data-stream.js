import { PAL, rand, wrap } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Data stream",
  desc: "Columns of code fall through a dark panel: bright heads drop cell by cell, trails of glyphs flicker and change behind them and fade out.",
  tags: ["scifi", "data", "code", "hacker", "digital", "screen", "ambient", "loop"],
  size: [48, 58],
  origin: [24, 29],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.matrix, columns: 8, seed: 29 },
};

const GLYPHS = "0123456789+-=<>:/*%#ACEFHKLNRTXZ";
const ROWS = 9, WRAP = 16, TRAIL = 6, PITCH = 6;

export function draw(p, t, o) {
  const C = steps(o.palette, 8), S = o.seed, ph = t / meta.duration, n = o.columns;
  const x0 = -Math.round(((n - 1) * PITCH) / 2), y0 = -27;
  for (let i = 0; i < n; i++) {
    const speed = rand(S, i, 1) < 0.4 ? 2 : 1, twin = rand(S, i, 2) < 0.25;
    for (let s = 0; s < (twin ? 2 : 1); s++) {
      // the head, in cells; whole laps of WRAP cells a loop, so it comes round seamlessly
      const head = wrap(rand(S, i, 3, s) * WRAP + s * 8 + ph * speed * WRAP, WRAP) - 2;
      for (let j = 0; j < ROWS; j++) {
        const d = Math.floor(head) - j;
        if (d < 0 || d >= TRAIL) continue;
        const flip = Math.floor(t * 6 + rand(S, i, j, 4) * 12) % 12, g = GLYPHS[Math.floor(rand(S, i, j, flip) * GLYPHS.length)];
        const c = d === 0 ? C[7] : d === 1 ? C[6] : d < 3 ? C[5] : d < 4 ? C[4] : C[3];
        p.text(g, x0 + i * PITCH, y0 + j * 6, c, { font: "mini", align: "center" });
        if (d === 0) p.glow(x0 + i * PITCH, y0 + j * 6 + 2, 7, C[5], 0.35);
      }
    }
  }
  p.glow(0, 0, 34, C[3], 0.12);
}
