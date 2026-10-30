import { PAL, hex, ease, seg, clamp, rand, noise2 } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Pixel dissolve",
  desc: "The screen breaks into blocks in clumpy random order, each winking in through a dim flash, some with a bright speck; then they wink back out.",
  tags: ["dissolve", "blocks", "random", "retro"],
  duration: 1.4,
  options: { palette: PAL.cyber, cell: 5 },
});

// when each block arrives (in) and leaves (out), as shares of each half: random, nudged by low noise into clumps
const cache = new Map();
function times(seed, cols, rows) {
  const key = `${seed}:${cols}:${rows}`;
  if (cache.has(key)) return cache.get(key);
  const n = cols * rows, tin = new Float32Array(n), tout = new Float32Array(n), glint = new Uint8Array(n);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const q = j * cols + i;
      const a = 0.62 * rand(seed, i, j, 1) + 0.38 * (noise2(i * 0.22, j * 0.22, seed) * 0.5 + 0.5);
      const b = 0.62 * rand(seed, i, j, 2) + 0.38 * (noise2(i * 0.22 + 40, j * 0.22, seed + 1) * 0.5 + 0.5);
      tin[q] = clamp((a - 0.18) / 0.64);
      tout[q] = clamp((b - 0.18) / 0.64);
      glint[q] = rand(seed, i, j, 3) < 0.3 ? 1 : 0;
    }
  const v = { tin, tout, glint };
  cache.set(key, v);
  return v;
}

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length;
  const { cin, cout, out } = timeline(t, meta.duration);
  if (!out && cin >= 1) return fill(p, ink);
  if (out && cout >= 1) return;
  const cs = Math.max(2, o.cell | 0), cols = Math.ceil(W / cs), rows = Math.ceil(H / cs);
  const { tin, tout, glint } = times(o.seed, cols, rows);
  const POP = 0.13, hot = C[n - 1], warm = C[Math.max(0, n - 5)];
  // a block's life: (a glint for some) -> a dim block -> cover, and back again on the way out
  const stage = (q) => {
    if (!out) {
      const g = seg(ease.inOutSine(cin) * (1 + POP), tin[q], tin[q] + POP);
      return g <= 0 ? 0 : g < 0.4 ? 1 : g < 0.75 ? 2 : 3;
    }
    const g = seg(ease.inOutSine(cout) * (1 + POP), tout[q], tout[q] + POP);
    return g <= 0 ? 3 : g < 0.4 ? 2 : g < 0.75 ? 1 : 0;
  };
  screen(p, (x, y) => {
    const i = Math.floor(x / cs), j = Math.floor(y / cs), s = stage(j * cols + i);
    if (s === 3) return ink;
    if (s === 2) return warm;
    if (s === 1 && glint[j * cols + i]) {
      const lx = x - i * cs, ly = y - j * cs, m = (cs - 1) / 2;
      if (Math.abs(lx - 0.5 - m) <= 1 && Math.abs(ly - 0.5 - m) <= 1) return hot;
    }
  });
}
