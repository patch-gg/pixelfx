import { PAL, hex, ease, wrap, TAU } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Spiral wipe",
  desc: "A glowing spiral arm sweeps clockwise in from the corners and winds the cover shut at the center, then unwinds it from the middle out.",
  tags: ["wipe", "spiral", "swirl"],
  duration: 1.6,
  options: { palette: PAL.volt, turns: 2 },
});

// the spiral coordinate of every pixel, in (from the rim) and out (from the center): one sweep of a clock
// hand per turn, ring by ring. It never changes, so it's worked out once per turn count.
const cache = new Map();
function spiral(T) {
  if (cache.has(T)) return cache.get(T);
  const sIn = new Float32Array(W * H), sOut = new Float32Array(W * H), cx = W / 2, cy = H / 2;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - cx) / cx, dy = (y + 0.5 - cy) / cy, rho = Math.min(1, Math.hypot(dx, dy) / Math.SQRT2);
      const a = wrap(Math.atan2(dy, dx) / TAU + 0.25, 1); // 0 at twelve o'clock, clockwise
      sIn[y * W + x] = ((1 - rho) * T + a) / (T + 1);
      sOut[y * W + x] = (rho * T + a) / (T + 1);
    }
  const v = { sIn, sOut };
  cache.set(T, v);
  return v;
}

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length, T = Math.max(0.5, o.turns);
  const { cin, cout, out } = timeline(t, meta.duration);
  if (!out && cin >= 1) return fill(p, ink);
  if (out && cout >= 1) return;
  const k = out ? ease.inOutSine(cout) : ease.inOutSine(cin);
  const s = out ? spiral(T).sOut : spiral(T).sIn;
  const hot = C[n - 2], mid = C[Math.max(0, n - 4)];
  // in: covered where s < k. out: uncovered where s < k
  const cov = (x, y) => x < 0 || y < 0 || x >= W || y >= H || (out ? s[y * W + x] >= k : s[y * W + x] < k);
  const band = 0.022;
  screen(p, (x, y, o2) => {
    const ix = Math.floor(x), iy = Math.floor(y), v = s[iy * W + ix];
    const d = out ? v - k : k - v; // > 0 on the cover side
    if (d < 0) {
      if (d > -0.03) (o2.l = C[n - 3]), (o2.k = 0.4 * (1 + d / 0.03));
      return;
    }
    // the rim follows the spiral front and the seam where the arm restarts each turn
    const seam = !cov(ix - 1, iy) || !cov(ix + 1, iy) || !cov(ix, iy - 1) || !cov(ix, iy + 1);
    if (d < band * 0.5 || seam) return hot;
    if (d < band || (!cov(ix - 2, iy) || !cov(ix + 2, iy) || !cov(ix, iy - 2) || !cov(ix, iy + 2))) return mid;
    return ink;
  });
}
