import { PAL, burst, seg, ease, bump, TAU, WHITE } from "../../core/index.js";
import { twinkle, fit } from "./_lib.js";

export const meta = {
  name: "Collect burst",
  desc: "The pop when you grab something: a white flash, a thin ring snapping out, eight twinkles thrown wide on a spiral, a pinch of glitter.",
  tags: ["pickup", "collect", "sparkle", "burst", "one-shot"],
  size: [48, 48],
  origin: [24, 24],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.holy, count: 8, seed: 14 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed;
  // the flash: two frames of solid white, then a shrinking core
  if (t < 0.07) p.circle(0, 0, 4 + 30 * t, WHITE);
  else if (t < 0.14) p.circle(0, 0, 3 * (1 - seg(t, 0.07, 0.14)), C[6]);
  // the ring snaps out and thins
  const rk = seg(t, 0.02, 0.26);
  if (rk > 0 && rk < 1) {
    const r = 4 + 15 * ease.outCubic(rk);
    p.ring(0, 0, r, rk < 0.4 ? 2 : 1, rk < 0.5 ? C[6] : C[4], rk < 0.75 ? 1 : 0.5);
    p.glowRing(0, 0, r, 4, C[5], 0.35 * (1 - rk));
  }
  // twinkles thrown out on a slight spiral, big and small alternating, shrinking as they go
  burst(o.count, S, (r, i) => {
    const life = r.range(0.38, 0.52), k = t / life;
    if (t < 0.03 || k >= 1) return;
    const a = (i / o.count) * TAU + r.range(-0.2, 0.2) + 0.5 * ease.outCubic(k), reach = (i % 2 ? 12 : 17) * r.range(0.85, 1.1);
    const d = 3 + reach * ease.outExpo(k), x = Math.cos(a) * d, y = Math.sin(a) * d;
    const s = Math.round((i % 2 ? 2 : 3.4) * (1 - ease.inQuad(k)) + 0.4);
    twinkle(p, Math.round(x), Math.round(y), s, C[4], C[5]);
    p.light(x, y, C[5], 0.5 * (1 - k));
  });
  // glitter: specks drifting out past the twinkles, blinking off
  burst(10, S + 1, (r) => {
    const life = r.range(0.3, 0.48), k = t / life, born = r.range(0.03, 0.08);
    if (t < born || k >= 1) return;
    const a = r.range(0, TAU), d = r.range(6, 21) * ease.outCubic(seg(t, born, life));
    if (k > 0.6 && Math.floor(t * 30) % 2) return;
    p.px(Math.cos(a) * d, Math.sin(a) * d, k < 0.5 ? C[6] : C[4]);
  });
  p.glow(0, 0, 22, C[4], 0.55 * bump(t, 0, 0.3) * (1 - seg(t, 0, 0.3)) + 0.5 * (t < 0.07 ? 1 : 0));
}
