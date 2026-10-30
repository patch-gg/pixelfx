import { ramp, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { swing } from "./_lib.js";

export const meta = {
  name: "Counter flash",
  desc: "A parry turned counter: a razor-thin white cross flares where the blow is caught, twinkles to an X, and a quick return cut flicks out.",
  tags: ["melee", "parry", "counter", "riposte", "flash", "combat", "directional", "one-shot"],
  size: [68, 44],
  origin: [26, 36],
  duration: 0.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#08202a", "#0c3a4a", "#12607a", "#1c90b0", "#40c4e0", "#90e8f8", "#d8faff", "#ffffff"], seed: 17 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, top = C.length - 1;
  const X = 11, Y = -12; // where the blow is caught
  // the catch: a long, thin cross of light that snaps out on the first frame and pulls back in
  const pull = ease.outCubic(seg(t, 0.03, 0.2));
  if (pull < 1) {
    const H = Math.round(28 * (1 - pull)), V = Math.round(15 * (1 - pull)), hot = t < 0.034;
    for (let i = -H; i <= H; i++) {
      const u = Math.abs(i) / (H || 1);
      p.px(X + i, Y, u < 0.45 ? WHITE : u < 0.8 ? C[top - 1] : C[top - 3]);
      if (u < 0.12 || (hot && u < 0.3)) p.px(X + i, Y - 1, hot ? WHITE : C[top - 1]), p.px(X + i, Y + 1, hot ? WHITE : C[top - 1]);
    }
    for (let j = -V; j <= V; j++) {
      const u = Math.abs(j) / (V || 1);
      p.px(X, Y + j, u < 0.45 ? WHITE : u < 0.8 ? C[top - 1] : C[top - 3]);
    }
    p.glowLine(X - H, Y, X + H, Y, 4, C[top - 2], 0.35 * (1 - pull));
  }
  // the core: a white diamond that twinkles from + to x and shrinks away
  const tw = 1 - seg(t, 0.02, 0.3);
  if (tw > 0) {
    const r = Math.round(1 + 3 * tw);
    for (let i = -r; i <= r; i++) for (let j = -r + Math.abs(i); j <= r - Math.abs(i); j++) p.px(X + i, Y + j, Math.abs(i) + Math.abs(j) < r ? WHITE : C[top - 1]);
    if (t > 0.07 && t < 0.24) {
      const d = Math.round(2 + 6 * seg(t, 0.07, 0.12) * (1 - seg(t, 0.12, 0.24)));
      for (let i = 2; i <= d; i++) for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) p.px(X + sx * i, Y + sy * i, i < d * 0.6 ? C[top] : C[top - 2]);
    }
    p.glow(X, Y, 22, C[top - 2], 0.5 * tw * tw);
    p.glow(X, Y, 6, WHITE, 0.5 * tw);
  }
  // the return cut: a short, quick crescent flicked out from the catch
  const q = t - 0.08;
  if (q > 0) {
    const lead = ease.outQuart(seg(q, 0, 0.06)), tail = ease.inCubic(seg(q, 0.01, 0.14));
    swing(p, { cx: X - 2, cy: Y + 2, r: 17, w: 6, from: -1.2, to: 0.75, lead, tail, C, rimAt: 0.72 });
    if (q < 0.14) {
      const la = -1.2 + 1.95 * lead;
      p.glow(X - 2 + Math.cos(la) * 14, Y + 2 + Math.sin(la) * 14, 12, C[top - 3], 0.4 * (1 - seg(q, 0.05, 0.14)));
    }
  }
  // sparks knocked off the catch, out and down
  burst(9, S, (r) => {
    const born = r.range(0, 0.03), age = t - born, life = r.range(0.16, 0.3);
    if (age < 0 || age > life) return;
    const a = r.range(-2.4, 0.6), sp = r.range(60, 130);
    const [x, y] = fly(X, Y, Math.cos(a) * sp, Math.sin(a) * sp, age, 220, 4), k = age / life;
    if (y > 0) return;
    p.px(x, y, k < 0.3 ? WHITE : k < 0.65 ? C[top - 1] : C[top - 3]);
    p.light(x, y, C[top - 2], 0.45 * (1 - k));
  });
}
