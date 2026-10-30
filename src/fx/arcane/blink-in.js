import { PAL, burst, cycle, seg, ease, clamp, stockActor, TAU, WHITE } from "../../core/index.js";
import { fit, silhouette, sparkle } from "./_lib.js";

export const meta = {
  name: "Blink in",
  desc: "Teleport arrival: sparks rush to a point, a star pops, a line of light stretches and springs open into the body, the glow drains away.",
  tags: ["arcane", "teleport", "blink", "appear", "magic", "character", "one-shot"],
  size: [48, 56],
  origin: [24, 44],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: false,
  options: { palette: PAL.arcane, seed: 13 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), A = o.actor ?? stockActor(), S = o.seed, cy = -A.h * 0.6, mid = (A.w - 1) / 2;
  // 1. sparks rush in to a point, faster and faster
  burst(10, S, (r) => {
    const t0 = r.range(0, 0.06), k = seg(t, t0, 0.16);
    if (t < t0 || k >= 1) return;
    const ang = r.range(0, TAU), R = r.range(14, 20) * (1 - ease.inQuad(k)), R2 = r.range(14, 20) * (1 - ease.inQuad(Math.max(0, k - 0.15)));
    const x = Math.cos(ang) * R - 0.5, y = cy + Math.sin(ang) * R;
    p.line(Math.cos(ang) * R2 - 0.5, cy + Math.sin(ang) * R2, x, y, k > 0.5 ? C[6] : C[5]);
    p.light(x, y, C[5], 0.4);
  });
  // 2. the star at the meeting point
  const a = t - 0.16;
  if (a >= 0 && a < 0.08) {
    p.line(-9, cy, 8, cy, C[6]);
    p.line(-0.5, cy - 10, -0.5, cy + 9, C[6]);
    sparkle(p, -0.5, cy, 3, WHITE, C[6], WHITE);
    p.glow(0, cy, 22, C[5], 0.6);
  }
  // 3. a line of light stretches from the star to full height (taller than the body)
  const grow = ease.outCubic(seg(t, 0.18, 0.26)), open = seg(t, 0.26, 0.42), drain = seg(t, 0.44, 0.66);
  const H0 = A.h * 1.4;
  if (grow > 0 && open === 0) {
    const top = cy + (-H0 - cy) * grow, bot = cy * (1 - grow);
    p.line(-0.5, top, -0.5, bot, WHITE);
    if (grow > 0.6) {
      p.line(-1.5, top + 3, -1.5, bot - 2, C[6]);
      p.line(0.5, top + 3, 0.5, bot - 2, C[5]);
    }
    p.glowLine(0, top, 0, bot, 8, C[5], 0.45);
  }
  // 4. the body springs open from the line, overshoots wide and settles, then its glow drains top to bottom
  if (open > 0 && t < meta.duration) {
    const sx = 0.06 + 0.94 * ease.outBack(open, 2.2), sy = 1.4 - 0.4 * ease.outCubic(open) + 0.06 * Math.sin(seg(t, 0.38, 0.5) * Math.PI);
    const row = (A.h + 3) * ease.inOutSine(drain) - 1, out = seg(t, 0.62, 0.76);
    silhouette(p, A, Math.max(0.06, sx), sy, (mx, my, base) => {
      if (drain > 0 && my <= row - 2) return base || 0; // revealed (custom actors: leave it to the game's sprite)
      if (drain > 0 && my <= row) return WHITE; // the drain's leading edge
      const side = Math.abs(mx - mid) / (mid + 0.5);
      return side < 0.7 - open * 0.5 ? WHITE : side < 0.8 ? C[6] : C[5];
    });
    if (drain > 0.3 && out < 1 && Math.floor(t * 30) % 2 === 0) p.outline(A.mask, A.x, A.y, C[5], 1 - out);
    p.glow(0, cy, 18, C[4], 0.35 * (1 - drain));
  }
  // motes left floating as it settles
  cycle(t, 10, 6, S + 5, 0.4, (age, life, r) => {
    const born = 0.3 + r.range(0, 0.15), q = (t - born) / life;
    if (q < 0 || q >= 1) return;
    const x = r.range(-8, 8), y = cy + r.range(-8, 10) - (t - born) * r.range(14, 26);
    p.px(x, y, q < 0.5 ? C[6] : C[5]);
  });
  if (a >= 0) p.glow(0, cy, 12, C[4], 0.3 * clamp(1 - (a - 0.1) / 0.4));
}
