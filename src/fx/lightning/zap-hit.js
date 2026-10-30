import { PAL, burst, fly, flyV, seg, ease, rng, TAU, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, jagged } from "./_lib.js";

export const meta = {
  name: "Zap hit",
  desc: "An electric hit: a white-hot star of zigzag spikes snaps out, re-forms smaller each beat as a ring races off, then kinked sparks scatter and fizzle.",
  tags: ["lightning", "electric", "hit", "impact", "combat", "one-shot"],
  size: [56, 56],
  origin: [28, 28],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.electric, spikes: 6, seed: 14 },
};

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, beat = Math.floor(t * 20);

  // the star: zigzag spikes out from the hit, white and haloed on the hero frames, shrinking and re-forming
  const k = seg(t, 0, 0.26);
  if (k < 1) {
    const hero = t < 0.067, len = (hero ? 1 : 0.9 - 0.6 * ease.inQuad(k));
    burst(o.spikes, S + beat * 31, (r, i) => {
      const a = (i / o.spikes) * TAU + r.range(-0.35, 0.35) + 0.4, l = r.range(12, 19) * len;
      const pts = jagged(r, 0, 0, Math.cos(a) * l, Math.sin(a) * l, { step: 3.5, amp: 2 });
      if (k < 0.45) zap(p, pts, hero ? WHITE : C[6], k < 0.25 ? C[4] : null);
      else p.polyline(pts, C[4]);
      if (hero) glowPath(p, pts, 6, C[4], 0.3, 2);
    });
    p.circle(0, 0, t < 0.034 ? 6 : hero ? 4.5 : 3.5 * (1 - k) + 0.6, hero ? WHITE : k < 0.4 ? C[6] : C[5]);
  }

  // a thin ring racing out, breaking into arcs as it goes
  const rk = seg(t, 0.03, 0.17);
  if (rk > 0 && rk < 1) {
    const R = 7 + 15 * ease.outCubic(rk), gap = rk * 0.9;
    for (let j = 0; j < 5; j++) {
      const a0 = (j / 5) * TAU + 0.3, a1 = a0 + (TAU / 5) * (1 - gap);
      p.arc(0, 0, R, 1, a0, a1, rk < 0.4 ? WHITE : rk < 0.7 ? C[5] : C[4]);
    }
  }

  // kinked sparks: three-pixel zigzags flung out, flickering, burning down
  burst(9, S + 3, (r) => {
    const born = r.range(0.02, 0.08), age = t - born, life = r.range(0.2, 0.36);
    if (age < 0 || age > life) return;
    const a = r.range(0, TAU), sp = r.range(70, 130), vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(0, 0, vx0, vy0, age, 60, 5), [vx, vy] = flyV(vx0, vy0, age, 60, 5), q = age / life;
    if (q > 0.6 && (beat + r.int(0, 1)) % 2) return;
    const s = Math.hypot(vx, vy) || 1, ux = vx / s, uy = vy / s, L = 2 + 3 * (1 - q);
    p.polyline([[x, y], [x - ux * L * 0.5 - uy * 1.5, y - uy * L * 0.5 + ux * 1.5], [x - ux * L, y - uy * L]], q < 0.35 ? WHITE : q < 0.7 ? C[5] : C[3]);
    p.light(x, y, C[4], 0.4 * (1 - q));
  });

  // a few after-crackles twitching around the spot
  if (t > 0.18 && t < 0.42 && beat % 2 === 0) {
    const r = rng(S, beat, 9), a = r.range(0, TAU), l = r.range(5, 9);
    p.polyline(jagged(r, 0, 0, Math.cos(a) * l, Math.sin(a) * l, { step: 2.5, amp: 1.5 }), C[4]);
  }
  const L = 1 - seg(t, 0, 0.3);
  p.glow(0, 0, 30, C[4], 0.55 * L * L);
  p.glow(0, 0, 8, C[5], 0.5 * L);
}
