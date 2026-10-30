import { PAL, ramp, rand, rng, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Glitch",
  desc: "A body breaking up like a bad signal: red and cyan ghosts split off it, bands of it tear sideways, junk blocks flicker round it in bursts.",
  tags: ["scifi", "glitch", "digital", "hack", "status", "debuff", "loop"],
  size: [48, 44],
  origin: [24, 38],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.cyber, seed: 28 },
};

const SPLIT = ramp(["#2a0820", "#8a1048", "#ff2a6d", "#ff9ab8"]);
// bursts of glitching: [start, end] in seconds; quiet in between
const BURSTS = [[0.12, 0.42], [0.86, 1.02], [1.3, 1.37]];
const FPS = 30;

function state(t, S) {
  const f = Math.floor(t * FPS), b = BURSTS.some(([a, z]) => t >= a && t < z);
  return { f, burst: b, hard: b && rand(S, f, 1) < 0.6 };
}

// the ghosts: the silhouette in red to one side and cyan to the other, peeking out from behind the body
export function drawBack(p, t, o) {
  const C = steps(o.palette, 8), A = o.actor, S = o.seed, { f, burst, hard } = state(t, S);
  const sx = burst ? (hard ? 3 : 2) : rand(S, f, 2) < 0.3 ? 1 : 0;
  if (!sx) return;
  const dy = hard ? Math.round(rand(S, f, 3) * 2 - 1) : 0;
  p.mask(A.mask, A.x - sx, A.y + dy, SPLIT[2]);
  p.mask(A.mask, A.x + sx, A.y - dy, C[5]);
}

export function draw(p, t, o) {
  const C = steps(o.palette, 8), A = o.actor, S = o.seed, { f, burst, hard } = state(t, S), m = A.mask;
  if (!burst) {
    // even quiet, a stray dead line flickers across now and then
    if (rand(S, f, 9) < 0.12) {
      const y = A.y + Math.floor(rand(S, f, 10) * A.h);
      p.line(A.x - 3, y, A.x + A.w + 2, y, C[2]);
    }
    return;
  }
  const r = rng(S, f);
  // tears: bands of the body slide sideways; what was there shows as dead signal
  const bands = hard ? 3 : 1;
  for (let b = 0; b < bands; b++) {
    const my0 = r.int(0, m.h - 3), h = r.int(1, hard ? 4 : 2), dx = r.sign() * r.int(2, hard ? 6 : 3);
    for (let my = my0; my < Math.min(m.h, my0 + h); my++) {
      const y = A.y + my, row = [];
      for (let mx = -8; mx < m.w + 8; mx++) row.push(p.get(A.x + mx, y));
      for (let mx = -8; mx < m.w + 8; mx++) {
        const sm = mx - dx, inSrc = sm >= 0 && sm < m.w && m.data[my * m.w + sm], inDst = mx >= 0 && mx < m.w && m.data[my * m.w + mx];
        const src = row[sm + 8];
        if (inSrc) p.px(A.x + mx, y, src || (b % 2 ? C[5] : SPLIT[2]));
        else if (inDst) p.px(A.x + mx, y, (mx + my) % 3 ? C[0] : C[2]);
      }
    }
  }
  // junk blocks and stuck pixels round the body
  const nb = hard ? 5 : 2;
  for (let i = 0; i < nb; i++) {
    const x = Math.round(r.range(-16, 12)), y = Math.round(r.range(-24, -1)), w = r.int(2, 8), h = r.int(1, 2);
    const c = r.pick([C[5], C[6], SPLIT[2], SPLIT[3], WHITE, C[1]]);
    p.rect(x, y, w, h, c);
  }
  // a scanline of noise across the whole frame
  const ny = Math.round(r.range(-22, -2));
  for (let x = -22; x < 22; x++) if (rand(S, f, x) < 0.5) p.px(x, ny, rand(S, f, x, 1) < 0.5 ? C[3] : C[1]);
  p.glow(A.chest[0], A.chest[1], 18, C[4], 0.2);
}
