import { PAL, hex, ease, clamp, fbm, rng, fly } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, onScreen, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Burn away",
  desc: "The picture chars and burns in from the edges behind a ragged ember line shedding sparks; then the black burns open from the middle.",
  tags: ["burn", "fire", "embers", "wipe"],
  duration: 1.8,
  options: { palette: PAL.fire, rough: 0.32 },
});

// the inverse of ease.inOutSine: when the front reaches a spot
const unSine = (y) => Math.acos(1 - 2 * clamp(y)) / Math.PI;

// the burn order: 0 at the screen's rim, 1 at its center, made ragged by noise (cached: it never changes)
const cache = new Map();
function field(seed, rough) {
  const key = seed + ":" + rough;
  if (cache.has(key)) return cache.get(key);
  const f = new Float32Array(W * H);
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const m = Math.max(Math.abs(x + 0.5 - W / 2) / (W / 2), Math.abs(y + 0.5 - H / 2) / (H / 2));
      const v = (1 - m) * (1 - rough) + (fbm(x * 0.06, y * 0.09, seed, 4) * 0.5 + 0.5) * rough;
      f[y * W + x] = v;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  for (let i = 0; i < f.length; i++) f[i] = (f[i] - lo) / (hi - lo);
  cache.set(key, f);
  return f;
}

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length, S = o.seed, D = meta.duration;
  const { cin, cout, out } = timeline(t, D);
  if (!out && cin >= 1) return fill(p, ink);
  if (out && cout >= 1) return;
  const F = field(S, o.rough);
  // the front sweeps a little past both ends so the edge band enters and leaves cleanly
  const w = 0.07, front = (k) => -w + (1 + w * 2) * k;
  const k = out ? front(ease.inOutSine(cout)) : front(ease.inOutSine(cin));
  // embers: hottest at the front, cooling to char; the scene side scorches just before the fire reaches it
  const glowC = [C[n - 1], C[n - 2], C[n - 3], C[n - 4], C[Math.max(0, n - 6)]];
  screen(p, (x, y, o2) => {
    const v = F[Math.floor(y) * W + Math.floor(x)], b = out ? 1 - v : v;
    // in: burnt where b < k. out: still covered where b > k (the hole burns outward)
    const d = out ? b - k : k - b; // > 0 on the cover side
    if (d < -0.025) return;
    if (d < 0) {
      o2.a = 0.5;
      return C[Math.max(0, n - 7)];
    }
    if (d < w) {
      const q = d / w;
      o2.l = C[n - 3];
      o2.k = 0.5 * (1 - q);
      return glowC[Math.min(4, Math.floor(q * 5))];
    }
    return ink;
  });
  // sparks: each leaves its spot when the front passes it, drifting up and out as it cools
  const half = out ? cout : cin, T = (out ? 1 - 0.58 : 0.45) * D;
  for (let i = 0; i < 48; i++) {
    const r = rng(S, i, out ? 2 : 1), x0 = r.range(2, W - 2), y0 = r.range(2, H - 2);
    const v = F[Math.floor(y0) * W + Math.floor(x0)], b = out ? 1 - v : v;
    const born = unSine((b + w) / (1 + w * 2));
    const life = r.range(0.18, 0.42), age = (half - born) * T;
    if (age < 0 || age > life) continue;
    const vx = r.range(-14, 14), vy = r.range(-46, -18), q = age / life;
    const [x, y] = fly(x0, y0, vx, vy, age, -30, 1.5);
    if (!onScreen(x, y)) continue;
    // fresh sparks are short streaks, older ones single cooling pixels
    p.px(x, y, q < 0.3 ? C[n - 1] : q < 0.65 ? C[n - 2] : C[n - 4]);
    if (q < 0.45 && onScreen(x, y + 1)) p.px(x - vx * 0.02, y + 1, C[n - 3]);
    p.light(x, y, C[n - 3], 0.5 * (1 - q));
  }
}
