import { PAL, burst, fly, seg, ease, clamp, stockActor, TAU, WHITE } from "../../core/index.js";
import { fit, silhouette, sparkle } from "./_lib.js";

export const meta = {
  name: "Blink out",
  desc: "Teleport away: the body lights up from the feet, snaps thin into a tall line of light, shrinks to a point and pops in a star.",
  tags: ["arcane", "teleport", "blink", "vanish", "magic", "character", "one-shot"],
  size: [48, 56],
  origin: [24, 44],
  duration: 0.82,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: false,
  options: { palette: PAL.arcane, seed: 12 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), A = o.actor ?? stockActor(), S = o.seed;
  const sweep = seg(t, 0.06, 0.16), squash = seg(t, 0.16, 0.32), shrink = seg(t, 0.34, 0.44);
  const sx = 1 - 0.94 * ease.inCubic(squash), sy = 1 + 0.4 * ease.inQuad(squash), H = A.h * sy, cy = -A.h * 0.6;
  const mid = (A.w - 1) / 2;
  // 1. the body: own colors, lit from the feet up, then squeezed thin and stretched tall
  if (sx * A.w >= 2 && t < 0.34) {
    const lineRow = A.h * (1 - ease.inQuad(sweep)) - 1;
    silhouette(p, A, sx, sy, (mx, my, base) => {
      const lit = my >= lineRow || squash > 0;
      if (!lit) return base || 0;
      const side = Math.abs(mx - mid) / (mid + 0.5);
      if (squash > 0) return side < 0.2 + squash * 0.5 ? WHITE : side < 0.7 ? C[6] : C[5];
      return my >= lineRow + 2 ? C[6] : WHITE; // the leading edge of the sweep is white
    });
    // a crackling outline while it charges
    if (t < 0.18 && Math.floor(t * 30) % 2 === 0) p.outline(A.mask, A.x, A.y, C[5]);
  }
  // 2. the line: a white thread from the feet to above the head, which then shrinks into its middle
  if (squash >= 1 && shrink < 1 || (sx * A.w < 2 && t < 0.44)) {
    const k = ease.inQuad(shrink), top = -H + (cy + H) * k, bot = cy * k;
    p.line(-0.5, top, -0.5, bot, WHITE);
    if (shrink < 0.5) {
      p.line(-1.5, top + 3, -1.5, bot - 2, C[6]);
      p.line(0.5, top + 3, 0.5, bot - 2, C[5]);
    }
    p.glowLine(0, top, 0, bot, 8, C[5], 0.45);
  }
  if (t < 0.44) p.glow(0, cy, 18, C[4], 0.3 * seg(t, 0.04, 0.3));
  // 3. the pop: a star for two frames, a ring, sparkles flung out and slowing
  const a = t - 0.44;
  if (a >= 0) {
    if (a < 0.07) {
      p.line(-9, cy, 8, cy, C[6]);
      p.line(-0.5, cy - 10, -0.5, cy + 9, C[6]);
      sparkle(p, -0.5, cy, 3, WHITE, C[6], WHITE);
      p.glow(0, cy, 22, C[5], 0.6);
    }
    const rr = seg(a, 0.02, 0.22);
    if (rr > 0 && rr < 1) p.ring(-0.5, cy, 3 + 9 * ease.outCubic(rr), 1, rr < 0.5 ? C[6] : C[5], (v, ang) => (Math.sin(ang * 6 + rr * 4) > rr * 2 - 1 ? 1 : 0));
    burst(9, S, (r) => {
      const ang = r.range(0, TAU), sp = r.range(55, 100), life = r.range(0.22, 0.36);
      if (a > life) return;
      const q = a / life, [x, y] = fly(-0.5, cy, Math.cos(ang) * sp, Math.sin(ang) * sp - 10, a, -20, 5);
      sparkle(p, x, y, q < 0.35 ? 1 : 0, q < 0.5 ? C[6] : C[5], C[5], q < 0.5 ? WHITE : C[6]);
      p.light(x, y, C[5], 0.4 * (1 - q));
    });
    p.glow(0, cy, 14, C[4], 0.35 * clamp(1 - a / 0.3));
  }
}
