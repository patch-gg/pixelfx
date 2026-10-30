import { PAL, RAMP, ramp, seg, ease, cycle, rand, TAU, WHITE } from "../../core/index.js";
import { Layer, shadow, bob, fit } from "./_lib.js";

export const meta = {
  name: "Scroll",
  desc: "A spell scroll floating over its shadow: it unrolls with a bounce, its runes light up line by line and shed sparks, then it rolls itself back up.",
  tags: ["pickup", "scroll", "spell", "magic", "loop"],
  size: [40, 50],
  origin: [20, 46],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.electric, shadow: true, seed: 10 },
};

const L = new Layer(40, 44);
const PAPER = ramp(["#2a1c10", "#4e3620", "#7a5a36", "#a8865a", "#cfb184", "#ecd9ae", "#fff4d6"]), WOOD = RAMP.wood;
// rune glyphs, 3 x 3
const GLYPHS = ["#.#.#.#.#", "##..##..#", ".#.###.#.", "#..###..#", "####..##.", ".#.#.#.#.", "#.##.#..#", "##.#...##"];
const OPEN = 15, W = 7;

// a roller: a short wooden cylinder with round knobs
function roller(q, y) {
  for (let x = -W - 1; x <= W; x++) {
    q.px(x, y - 1, WOOD[5]);
    q.px(x, y, WOOD[4]);
    q.px(x, y + 1, WOOD[2]);
  }
  for (const s of [-1, 1]) {
    const x = s < 0 ? -W - 3 : W + 1;
    q.rect(x, y - 2, 2, 5, WOOD[3]);
    q.px(x, y - 2, WOOD[5]);
    q.px(x + 1, y + 2, WOOD[1]);
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, S = o.seed;
  // unroll with a bounce, hold, roll back up
  const open = ph < 0.62 ? ease.outBack(seg(ph, 0.12, 0.32), 2.2) : 1 - ease.inQuad(seg(ph, 0.72, 0.88));
  const h = Math.max(0, Math.round(OPEN * open));
  const cy = Math.round(-26 + bob(ph, 1.5)), top = cy - Math.round(h / 2) - 3, bot = top + 3 + h;
  const q = L.begin(-20, cy - 22);
  // the parchment between the rollers: lit on the left, a soft curl at the right edge, lines of runes
  for (let y = top + 2; y < bot - 1; y++)
    for (let x = -W; x < W; x++) q.px(x, y, x === -W ? PAPER[5] : x >= W - 1 ? PAPER[2] : x >= W - 3 ? PAPER[3] : PAPER[4]);
  // three lines of runes; each lights up once the paper has unrolled past it, flickering
  for (let line = 0; line < 3; line++) {
    const gy = top + 3 + line * 4;
    if (gy + 2 >= bot - 1) break;
    const lit = seg(ph, 0.3 + line * 0.07, 0.34 + line * 0.07) * (1 - seg(ph, 0.68, 0.72));
    for (let j = 0; j < 3; j++) {
      const g = GLYPHS[Math.floor(rand(S, line, j) * GLYPHS.length)], gx = -W + 2 + j * 4;
      const flick = rand(S, line, j, Math.floor(t * 10)) < 0.2;
      for (let k = 0; k < 9; k++) if (g[k] === "#") q.px(gx + (k % 3), gy + Math.floor(k / 3), lit > 0.5 ? (flick ? WHITE : C[4]) : lit > 0 ? C[3] : PAPER[2]);
    }
  }
  roller(q, top + 1);
  roller(q, bot);
  // closed, a ribbon ties the roll
  if (h < 3) q.rect(-1, top - 1, 3, bot - top + 3, C[3]), q.rect(-1, top - 1, 1, bot - top + 3, C[5]);
  L.outline(WOOD[0]);
  L.draw(p);
  // runes shed sparks while it is open
  const lit = seg(ph, 0.3, 0.4) * (1 - seg(ph, 0.68, 0.74));
  cycle(t, meta.duration, 10, S, (r) => r.range(0.4, 0.6), (age, life, r) => {
    if (lit <= 0) return;
    const k = age / life, x = r.range(-W + 2, W - 2), y = top + 4 + r.range(0, OPEN - 4) - age * r.range(12, 18);
    if (r.next() > lit) return;
    p.px(x + Math.sin(age * 8 + r.next() * TAU), y, k < 0.4 ? WHITE : k < 0.7 ? C[5] : C[3]);
    p.light(x, y, C[4], 0.45 * (1 - k));
  });
  p.glow(0, (top + bot) / 2, 22, C[4], 0.06 + 0.14 * lit);
  if (o.shadow) shadow(p, 0, 8 + bob(ph, 0.6));
}
