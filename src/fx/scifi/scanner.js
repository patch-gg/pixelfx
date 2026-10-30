import { PAL, ease, rand, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Scanner",
  desc: "A scan line sweeps down the body and back up inside blinking target brackets, lighting the slice it crosses and leaving a wireframe outline in its wake.",
  tags: ["scifi", "scan", "tech", "status", "ui", "loop"],
  size: [44, 40],
  origin: [22, 34],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.cyber, seed: 22 },
};

export function draw(p, t, o) {
  const C = steps(o.palette, 8), A = o.actor, S = o.seed, D = meta.duration, ph = t / D, fi = Math.floor(t * 30);
  const x0 = A.x - 4, x1 = A.x + A.w + 3, top = A.y - 2, bot = 0;
  const m = A.mask, on = (mx, my) => mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.data[my * m.w + mx];

  // the sweep: down in the first half, back up in the second, easing at the turns
  const down = ph < 0.5, k = ease.inOutSine(down ? ph * 2 : 2 - ph * 2), sy = Math.round(top + (bot - 1 - top) * k);

  // the wake: the outline of what the line has passed this pass, cooling with distance behind it
  p.outline(m, A.x, A.y, (mx, my) => {
    const y = A.y + my, behind = down ? sy - y : y - sy;
    return behind < 3 ? C[6] : behind < 8 ? C[5] : C[4];
  }, (mx, my) => {
    const y = A.y + my, behind = down ? sy - y : y - sy;
    return behind >= 0 && behind < 16 ? 1 : 0;
  });

  // the slice under the line lights up, the row just behind it in a scanline stipple
  for (let mx = 0; mx < m.w; mx++) {
    const my = sy - A.y, back = down ? my - 1 : my + 1;
    if (on(mx, my)) p.px(A.x + mx, sy, WHITE);
    if (on(mx, back) && mx % 2 === 0) p.px(A.x + mx, A.y + back, C[6]);
  }
  // the line itself, past the body on both sides, and its light
  for (let x = x0 + 1; x < x1; x++) if (!on(x - A.x, sy - A.y)) p.px(x, sy, C[5]);
  p.px(x0, sy, WHITE), p.px(x1, sy, WHITE);
  p.glowLine(x0, sy, x1, sy, 6, C[5], 0.35);

  // target brackets that breathe on the beat
  const b = (fi >> 3) % 2;
  const L = 3, X0 = x0 - b, X1 = x1 + b, Y0 = top - 1 - b, Y1 = bot + 1 + b;
  for (const [cx, cy, sx, sy2] of [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]]) {
    p.line(cx, cy, cx + sx * L, cy, C[5]);
    p.line(cx, cy, cx, cy + sy2 * L, C[5]);
  }
  // a readout ticking beside the brackets
  for (let i = 0; i < 4; i++) {
    const len = 1 + Math.floor(rand(S, i, fi >> 2) * 4);
    p.line(X1 + 3, Y0 + 2 + i * 2, X1 + 2 + len, Y0 + 2 + i * 2, i === (fi >> 2) % 4 ? C[6] : C[3]);
  }
}
