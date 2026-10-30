import { PAL, hex, seg, ease, rand, clamp, WHITE } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Glitch wipe",
  desc: "Torn bands of cover stutter in from both sides at their own speeds, edges split into pink and cyan, data slivers flicker; then they tear back out.",
  tags: ["wipe", "glitch", "digital", "bands"],
  duration: 1.3,
  options: { palette: PAL.neon, split: "#3ce8ff", rate: 15 },
});

// the bands: chunky random heights down the screen, each with a side, a start and a speed (cached per seed)
const cache = new Map();
function bands(seed) {
  if (cache.has(seed)) return cache.get(seed);
  const list = [];
  for (let y = 0, i = 0; y < H; i++) {
    let h = [4, 6, 8, 10, 14][Math.floor(rand(seed, i, 1) * 5)];
    if (H - y - h < 4) h = H - y;
    list.push({
      y, h, left: i % 2 === 0 ? rand(seed, i, 3) < 0.7 : rand(seed, i, 3) < 0.3,
      d0: rand(seed, i, 4) * 0.42, l0: 0.32 + rand(seed, i, 5) * 0.26,
      d1: rand(seed, i, 6) * 0.42, l1: 0.32 + rand(seed, i, 7) * 0.26,
    });
    y += h;
  }
  cache.set(seed, list);
  return list;
}

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), split = hex(o.split), n = C.length, S = o.seed;
  const { cin, cout, out } = timeline(t, meta.duration);
  if (!out && cin >= 1) return fill(p, ink);
  if (out && cout >= 1) return;
  // time moves in jerks; on some steps a band jumps ahead or slips back
  const step = Math.floor(t * o.rate), B = bands(S), pink = C[n - 4];
  const edgeX = B.map((b, i) => {
    const jit = rand(S, i, step, 8) < 0.3 ? (rand(S, i, step, 9) - 0.4) * 30 : 0;
    const k = out ? ease.inQuad(seg(cout, b.d1, b.d1 + b.l1)) : ease.inQuad(seg(cin, b.d0, b.d0 + b.l0));
    const L = k <= 0 ? 0 : k >= 1 ? W : clamp(Math.round(W * k + jit), 0, W);
    // in: the cover runs from its side to the edge; out: from the edge on to the far side
    return b.left ? L : W - L;
  });
  const rowBand = new Int16Array(H);
  B.forEach((b, i) => { for (let y = b.y; y < b.y + b.h; y++) rowBand[y] = i; });
  screen(p, (x, y) => {
    const i = rowBand[Math.floor(y)], b = B[i], e = edgeX[i];
    // which side of the edge is cover: in, the band's own side; out, the other
    const coverLeft = b.left === !out;
    const d = coverLeft ? e - x : x - e; // > 0 inside the cover
    const live = e > 0.5 && e < W - 0.5;
    if (d > 0) {
      if (live && d < 3) return pink;
      return ink;
    }
    // the split: a cyan ghost of the edge a few px ahead of it
    if (live && d > -6 && d <= -3) return split;
  });
  // data slivers: a few short bright bars riding next to live edges, one step each
  const amount = Math.round(Math.sin(Math.PI * (out ? cout : cin)) * 6);
  for (let j = 0; j < amount; j++) {
    const r = (k) => rand(S, step, j, k), bi = Math.floor(r(1) * B.length), b = B[bi], e = edgeX[bi];
    if (e <= 0.5 || e >= W - 0.5) continue;
    const w = 4 + Math.floor(r(2) * 10), side = r(3) < 0.5 ? -1 : 1, h = Math.min(b.h, 1 + Math.floor(r(4) * 2));
    const x = clamp(e + side * (4 + r(5) * 16) - (side < 0 ? w : 0), 0, W - w);
    p.rect(Math.round(x), b.y + Math.floor(r(6) * (b.h - h + 1)), w, h, r(7) < 0.5 ? split : r(7) < 0.85 ? pink : WHITE);
  }
}
