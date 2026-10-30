import { PAL, burst, seg, ease, luma, clamp, TAU, WHITE } from "../../core/index.js";
import { fit, silhouette, sparkle } from "./_lib.js";

export const meta = {
  name: "Mirror images",
  desc: "Illusion clones slide out from the actor to both sides with afterimages, hold flickering like a bad signal, then pop one by one.",
  tags: ["arcane", "illusion", "clone", "decoy", "buff", "character", "one-shot"],
  size: [84, 40],
  origin: [42, 33],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.arcane, count: 4, spacing: 15, seed: 18 },
};

// where each clone stands: alternating sides, the outer pair further out and a beat later
function clones(o) {
  return Array.from({ length: o.count }, (_, i) => {
    const side = i % 2 ? 1 : -1, rank = Math.floor(i / 2) + 1;
    return { side, x: side * o.spacing * rank, t0: 0.04 + (rank - 1) * 0.07, pop: 0.78 + i * 0.065 };
  });
}

// the clone's own pixels mapped onto the ramp by brightness: a violet copy that keeps the face and clothes
const tint = (C) => (mx, my, base) => (base ? [C[2], C[3], C[4], C[5], C[6]][clamp(Math.floor(luma(base) * 5.5), 0, 4)] : C[4]);

export function drawBack(p, t, o) {
  const C = fit(o.palette), A = o.actor, frame = Math.floor(t * 30);
  for (const c of clones(o)) {
    const k = ease.outCubic(seg(t, c.t0, c.t0 + 0.26));
    if (k <= 0 || t >= c.pop) continue;
    // afterimages left along the slide
    if (k < 1)
      for (const [lag, col] of [[0.6, C[2]], [0.3, C[3]]]) silhouette(p, A, 1, 1, () => col, 1, Math.round(c.x * k * (1 - lag)));
    // the clone: a scanline gap rolls down it, and now and then it jumps a pixel sideways
    const glitch = Math.sin(t * 47 + c.x) > 0.93 ? c.side : 0, roll = frame % 6;
    silhouette(p, A, 1, 1, (mx, my, base) => ((my + roll) % 6 === 0 ? 0 : tint(C)(mx, my, base)), 1, Math.round(c.x * k) + glitch);
    p.glow(c.x * k, -9, 12, C[4], 0.22 * k);
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette), A = o.actor, S = o.seed;
  // the split: a flash on the actor as the copies peel away
  const f = seg(t, 0, 0.12);
  if (f < 1) {
    p.outline(A.mask, A.x, A.y, f < 0.5 ? WHITE : C[6]);
    p.glow(0, -9, 16, C[5], 0.4 * (1 - f));
  }
  // each clone pops into a twinkle and a puff of motes
  clones(o).forEach((c, i) => {
    const a = t - c.pop;
    if (a < 0 || a > 0.3) return;
    const q = a / 0.3;
    if (q < 0.25) silhouette(p, A, 1, 1, () => WHITE, 1, c.x);
    sparkle(p, c.x, -10, Math.round(3 * (1 - q)), WHITE, C[6], WHITE);
    burst(6, S * 11 + i, (r) => {
      const ang = r.range(0, TAU), sp = r.range(22, 34), x = c.x + Math.cos(ang) * sp * a, y = -10 + Math.sin(ang) * sp * a - a * 24;
      p.px(x, y, q < 0.5 ? C[6] : C[5]);
    });
    p.glow(c.x, -10, 12, C[5], 0.45 * (1 - q));
  });
}
