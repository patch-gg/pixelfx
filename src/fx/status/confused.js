import { PAL, seg, ease, rng, TAU } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Confused",
  desc: "A swirl spins over the head while question marks pop up on either side in turn, bounce, wobble and fade.",
  tags: ["status", "confused", "dizzy", "question", "debuff", "loop"],
  size: [44, 48],
  origin: [22, 44],
  duration: 1.8,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.cyber, count: 3, seed: 7 },
};

// a question mark, 5 x 7
const Q = [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."];
const SPOTS = [[-11, 1], [7, -1], [-3, -9]]; // where each mark pops up, around the swirl

function mark(p, rows, x, y, body, edge) {
  const h = rows.length, w = rows[0].length, on = (c, r) => r >= 0 && r < h && c >= 0 && c < w && rows[r][c] === "#";
  for (let r = -1; r <= h; r++)
    for (let c = -1; c <= w; c++) if (!on(c, r) && (on(c - 1, r) || on(c + 1, r) || on(c, r - 1) || on(c, r + 1))) p.px(x + c, y + r, edge);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (on(c, r)) p.px(x + c, y + r, r < 2 ? body[1] : body[0]);
}

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, D = meta.duration, ph = t / D, n = o.count;
  const cx = a.head[0], cy = a.head[1] - 6;

  // the swirl: a spiral turning twice a loop, squashed into a lazy oval
  const turn = ph * TAU * 2, pts = [];
  for (let i = 0; i <= 26; i++) {
    const s = i / 26, ang = turn + s * TAU * 1.6, r = 0.6 + s * 5.4;
    pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.55]);
  }
  for (let i = 1; i < pts.length; i++) p.line(...pts[i - 1], ...pts[i], i > 20 ? C[7] : i > 10 ? C[6] : C[5]);
  p.light(cx, cy, C[5], 0.3);

  // question marks: one after another, alternating sides, popping in with a bounce, drifting up, fading
  for (let i = 0; i < n; i++) {
    const born = (i * D) / n, life = D * 0.62, age = (((t - born) % D) + D) % D;
    if (age >= life) continue;
    const r = rng(o.seed, i), k = age / life, pop = ease.outBack(seg(k, 0, 0.18), 3), [sx, sy] = SPOTS[i % SPOTS.length];
    const wob = Math.round(Math.sin(k * TAU * 2.5 + r.range(0, TAU))) + r.int(-1, 1);
    const x = cx + sx + wob, y = cy + sy - 3 - k * 5 + (1 - pop) * 4;
    if (pop <= 0.05) continue;
    const fade = seg(k, 0.7, 1);
    if (fade > 0.8) continue;
    const body = fade > 0.4 ? [C[5], C[6]] : [C[6], C[7]];
    mark(p, Q, Math.round(x), Math.round(y), body, fade > 0.4 ? C[1] : C[2]);
    p.light(x + 2, y + 3, C[6], 0.25 * (1 - fade));
  }
}
