import { bump, rng, TAU } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Charmed",
  desc: "A heart beats over the target's head, glowing pink on each beat, while little hearts bob up around it, sway and pop.",
  tags: ["status", "charm", "love", "heart", "debuff", "loop"],
  size: [44, 52],
  origin: [22, 48],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: {
    palette: ["#2a0614", "#5a0c2c", "#9a1648", "#d62a6a", "#ff5a92", "#ff9ac0", "#ffd6e8", "#ffffff"],
    count: 4, seed: 9,
  },
};

const HEARTS = [
  ["##.##", "#####", ".###.", "..#.."],
  [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."],
  [".##...##.", "####.####", "#########", "#########", ".#######.", "..#####..", "...###...", "....#...."],
  [".###...###.", "#####.#####", "###########", "###########", "###########", ".#########.", "..#######..", "...#####...", "....###....", ".....#....."],
];

// a heart: outlined dark, a pale glint in its top-left lobe, the lower half a step deeper
function heart(p, size, cx, cy, C, bright = 0) {
  const rows = HEARTS[size], h = rows.length, w = rows[0].length, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
  const on = (c, r) => r >= 0 && r < h && c >= 0 && c < w && rows[r][c] === "#";
  for (let r = -1; r <= h; r++)
    for (let c = -1; c <= w; c++) if (!on(c, r) && (on(c - 1, r) || on(c + 1, r) || on(c, r - 1) || on(c, r + 1))) p.px(x + c, y + r, C[1]);
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      if (!on(c, r)) continue;
      const glint = size > 0 && r === 1 && c === 1, deep = r >= h / 2 + 1;
      p.px(x + c, y + r, glint ? C[7] : deep ? C[3 + bright] : C[4 + bright]);
    }
}

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, D = meta.duration, ph = t / D, n = o.count;
  const hx = a.head[0], hy = a.head[1] - 9;

  // small hearts: born around the head in turn, popping in, swaying up, shrinking out
  for (let i = 0; i < n; i++) {
    const r = rng(o.seed, i), born = (i * D) / n, life = D * 0.7, age = (((t - born) % D) + D) % D;
    if (age >= life) continue;
    const k = age / life, side = i % 2 ? 1 : -1;
    const x = hx + side * (r.range(8, 11) + k * 3) + Math.sin(k * TAU * 1.5 + i) * 1.4, y = hy + 13 - k * r.range(16, 21);
    const size = k > 0.25 && k < 0.55 && i % 2 === 0 ? 1 : 0;
    heart(p, size, x, y, C, k < 0.4 ? 1 : 0);
    p.light(x, y, C[5], 0.2);
  }

  // the big heart: two beats a loop, swelling for a frame on each and flashing a step brighter
  const beat = Math.max(bump(ph, 0, 0.1), bump(ph, 0.16, 0.26), bump(ph, 0.5, 0.6), bump(ph, 0.66, 0.76));
  const bob = Math.sin(ph * TAU) * 1.2;
  heart(p, beat > 0.5 ? 3 : 2, hx, hy + bob, C, beat > 0.5 ? 1 : 0);
  p.glow(hx, hy + bob, 16, C[5], 0.25 + 0.3 * beat);
  p.glow(hx, a.y + 9, 20, C[4], 0.1 + 0.1 * beat);
}
