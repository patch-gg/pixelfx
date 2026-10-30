import { seg, ease, rand, lerp, luma, at, WHITE } from "../../core/index.js";
import { steps, maskCells } from "./_lib.js";

export const meta = {
  name: "Cloak",
  desc: "Stealth engaging: the outline flares, a bright seam climbs the body turning it to dark rippling glass, a shimmer clings to the edge, then even that fades.",
  tags: ["scifi", "stealth", "invisible", "cloak", "status", "buff", "one-shot"],
  size: [40, 40],
  origin: [20, 34],
  duration: 1.1,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#06101c", "#0e2236", "#1c3a54", "#2e5a78", "#5a8eac", "#a0d0e8", "#e8f8ff"], seed: 34 },
};

const SWEEP = [0.06, 0.48], GONE = [0.8, 1.05];
// the body is glass from the seam on; once it flickers out, the character itself is gone
export const actorAlpha = (t) => (t < GONE[0] ? 1 : 0);

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, A = o.actor, beat = Math.floor(t * 20);
  const cells = maskCells(A), top = A.y - 1;
  const seam = lerp(1, top, ease.inOutSine(seg(t, SWEEP[0], SWEEP[1])));
  const gone = seg(t, GONE[0], GONE[1]);
  if (gone >= 1) return;
  // going under: the glass flickers out, on for fewer and fewer beats
  if (gone > 0 && rand(S, beat, 77) < gone * 1.2) {
    p.outline(A.mask, A.x, A.y, C[4], (mx, my) => (rand(S, mx, my, beat) < 0.25 * (1 - gone) ? 1 : 0));
    return;
  }

  // read what's under the body first (the body itself, wherever the game draws it into the same frame)
  const under = cells.map(([x, y]) => p.get(x, y));
  // the glass: below the seam the body turns dark and see-through-looking; rows ripple brighter upward
  const ripple = (y) => Math.sin(y * 0.7 + t * 30) > 0.92;
  cells.forEach(([x, y, mx, my], i) => {
    if (y < seam - 1) return;
    if (Math.abs(y - seam) < 1.2 && t < SWEEP[1] + 0.02) return p.px(x, y, rand(S, mx, beat) < 0.3 ? C[6] : WHITE);
    const c = under[i], g = c ? at([C[0], C[1], C[2], C[3]], luma(c) * 1.3) : C[1];
    p.px(x, y, ripple(y) ? C[3] : g);
  });

  // the edge: a white flare as it engages, then a shimmer that crawls around the outline
  if (t < 0.1) p.outline(A.mask, A.x, A.y, t < 0.04 ? WHITE : C[5]);
  else
    p.outline(A.mask, A.x, A.y, (mx, my) => (rand(S, mx, my, beat) < 0.5 ? C[5] : C[4]), (mx, my) => {
      const y = A.y + my;
      if (y < seam - 1) return 0;
      return rand(S, mx, my, beat >> 1) < 0.45 * (1 - gone) ? 1 : 0;
    });
  // glints thrown off the seam as it climbs
  if (t > SWEEP[0] && t < SWEEP[1]) {
    for (let i = 0; i < 2; i++) {
      const s = rand(S, beat, i) < 0.5 ? -1 : 1, x = s * (7 + rand(S, beat, i, 1) * 3);
      p.px(x, seam - rand(S, beat, i, 2) * 2, C[6]);
    }
    p.glowLine(-8, seam, 8, seam, 5, C[5], 0.35);
  }
  p.glow(A.chest[0], A.chest[1], 14, C[4], 0.18 * (1 - gone) * (t < 0.5 ? 1 : 0.5));
}
