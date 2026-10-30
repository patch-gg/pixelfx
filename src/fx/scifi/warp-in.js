import { burst, seg, ease, rand, TAU, WHITE } from "../../core/index.js";
import { steps, maskCells } from "./_lib.js";

export const meta = {
  name: "Warp in",
  desc: "A column of light slams down and hums, rings running down it; it narrows to a sparkling silhouette that sets into the body from the head down.",
  tags: ["scifi", "teleport", "warp", "spawn", "beam", "one-shot"],
  size: [48, 84],
  origin: [24, 78],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#0a1430", "#14306a", "#2060b0", "#3aa0e0", "#80dcff", "#d0f6ff", "#ffffff"], height: 76, seed: 23 },
};

const OPEN = 0.36, SHUT = 0.52; // the column holds full width until OPEN, gone by SHUT

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, A = o.actor, H = o.height, beat = Math.floor(t * 20);

  // the silhouette: sparkling light that sets into the body pixel by pixel, head first
  if (t >= OPEN - 0.05) {
    for (const [x, y, mx, my] of maskCells(A)) {
      const set = 0.55 + 0.45 * (0.6 * (my / A.h) + 0.4 * rand(S, mx, my));
      if (t >= set) continue;
      const left = set - t, twinkle = rand(S, mx, my, beat) < 0.25;
      p.px(x, y, left < 0.05 ? C[4] : left < 0.12 ? C[5] : twinkle ? C[4] : C[6]);
    }
    const ring = seg(t, 0.55, 1.05);
    if (ring < 1) p.outline(A.mask, A.x, A.y, ring < 0.5 ? C[5] : C[4], (mx, my) => (rand(S, mx, my, 9) < 1 - ring ? 1 : 0));
  }

  // the column: full height from the first frame, white at the heart, humming, then narrowing away;
  // rings run down it, their far side hidden behind it
  const hw = t < OPEN ? 8 + (t < 0.05 ? 2 : rand(S, beat) * 1.2) : 8 * (1 - ease.inQuad(seg(t, OPEN, SHUT)));
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const k = seg(t, 0.04 + i * 0.1, 0.3 + i * 0.1);
    if (k > 0 && k < 1) rings.push([-H + 6 + (H - 6) * ease.outCubic(k), k]);
  }
  const ring = (y, k, front) => {
    for (let j = 0; j < 44; j++) {
      const a = (j / 44) * TAU;
      if (Math.sin(a) > 0 !== front) continue;
      p.px(Math.cos(a) * (hw + 4), y + Math.sin(a) * 2.5, front ? (k < 0.5 ? WHITE : C[6]) : C[4]);
    }
  };
  if (hw > 0.3) {
    for (const [y, k] of rings) ring(y, k, false);
    p.shade(-hw - 1, -H - 2, hw + 1, 0, (x, y, out) => {
      const v = Math.abs(x) / hw;
      if (v > 1) return;
      out.c = t < 0.05 || v < 0.22 ? WHITE : v < 0.6 ? C[6] : v < 0.88 ? C[5] : C[4];
    });
    p.glowLine(0, -H + 10, 0, 0, 12, C[4], t < 0.05 ? 0.6 : 0.3);
    for (const [y, k] of rings) ring(y, k, true);
    // motes pouring down inside it
    burst(10, S + beat, (r) => {
      const x = r.range(-hw * 0.7, hw * 0.7), y = -H + r.range(0, H);
      p.line(x, y, x, y + 3, C[4]);
    });
  }

  // the floor: a white splash where the column lands, a ring spreading out, the light pooling
  if (t < 0.06) p.ellipse(0, 0, 14, 3, WHITE);
  const fr = seg(t, 0.02, 0.6);
  if (fr > 0 && fr < 1) {
    const rx = 9 + 14 * ease.outCubic(fr);
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU;
      if (fr > 0.6 && i % 3 === 0) continue;
      p.px(Math.cos(a) * rx, Math.sin(a) * rx * 0.22, fr < 0.4 ? C[6] : C[5]);
    }
  }
  p.glow(0, -2, 20, C[4], 0.4 * (1 - seg(t, 0.3, 0.9)));

  // twinkles round the body as it sets
  burst(7, S + 77, (r) => {
    const born = r.range(0.5, 0.95), k = seg(t, born, born + 0.22);
    if (k <= 0 || k >= 1) return;
    const x = r.range(-9, 9), y = r.range(-21, -2) - k * 3, s = k < 0.5 ? 2 : 1;
    p.line(x - s, y, x + s, y, C[5]);
    p.line(x, y - s, x, y + s, C[5]);
    p.px(x, y, WHITE);
  });
}
