import { burst, fly, flyV, seg, ease, rand, TAU, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, jagged } from "./_lib.js";

export const meta = {
  name: "Thunderclap",
  desc: "A crack of thunder in the air: a blinding flash, bolts bursting outward, a heavy shock ring that thins and shatters into arcs, sparks streaking off.",
  tags: ["lightning", "electric", "thunder", "shockwave", "explosion", "one-shot"],
  size: [96, 96],
  origin: [48, 48],
  duration: 0.55,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0e1430", "#1f2f66", "#3b58a8", "#6a8ee0", "#a6c4f6", "#dfeaff", "#ffffff"], radius: 40, seed: 16 },
};

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, RAD = o.radius, beat = Math.floor(t * 20);

  // the flash: a white disc and bolts bursting out of it for the first beats
  if (t < 0.12) {
    const k = seg(t, 0, 0.12);
    burst(5, S + beat * 13, (r, i) => {
      const a = (i / 5) * TAU + r.range(-0.4, 0.4), l = r.range(22, 34) * (1 - 0.3 * k);
      const pts = jagged(r, 0, 0, Math.cos(a) * l, Math.sin(a) * l, { step: 5, amp: 3 });
      zap(p, pts, k < 0.4 ? WHITE : C[5], k < 0.4 ? C[4] : null);
      glowPath(p, pts, 8, C[4], 0.3 * (1 - k));
    });
    p.circle(0, 0, 11 - 6 * k, k < 0.5 ? WHITE : C[6]);
  }

  // the shock ring: thick and white as it leaves, thinning and cooling as it slows, then breaking up into
  // arcs
  const ring = (t0, t1, R1, w0, main) => {
    const k = seg(t, t0, t1);
    if (k <= 0 || k >= 1) return 0;
    const R = 7 + (R1 - 7) * ease.outQuart(k), w = Math.max(1, Math.round(w0 * (1 - k * 1.2)));
    const edge = main ? (k < 0.25 ? WHITE : k < 0.5 ? C[6] : C[5]) : C[5], body = k < 0.4 ? C[5] : C[4];
    const gap = main ? seg(k, 0.55, 1) * 0.85 : 0.35 + 0.5 * k, n = main ? 7 : 9;
    for (let j = 0; j < n; j++) {
      const a0 = ((j + 0.5 * rand(S, j, main)) / n) * TAU, a1 = a0 + (TAU / n) * (1 - gap * (0.6 + 0.8 * rand(S, j, 2)));
      if (a1 > a0) p.arc(0, 0, R + (rand(S, j, 3) - 0.5) * 1.5, w, a0, a1, (u, v) => (v > 0.5 || w === 1 ? edge : body));
    }
    p.glowRing(0, 0, R, 6, C[4], 0.35 * (1 - k) * (main ? 1 : 0.5));
    return R;
  };
  const R = ring(0.02, 0.45, RAD, 5, true);

  // crackles riding the ring's edge
  if (R > 0 && t < 0.36) {
    burst(4, S + 40 + beat, (r) => {
      const a = r.range(0, TAU), s = r.range(0.25, 0.45);
      const pts = jagged(r, Math.cos(a) * R, Math.sin(a) * R, Math.cos(a + s) * (R + r.range(-2, 3)), Math.sin(a + s) * (R + r.range(-2, 3)), { step: 3, amp: 2 });
      p.polyline(pts, beat % 2 ? C[5] : WHITE);
    });
  }

  // sparks streaking straight out, braking hard, cooling
  burst(18, S + 7, (r) => {
    const born = r.range(0, 0.05), age = t - born, life = r.range(0.22, 0.4);
    if (age < 0 || age > life) return;
    const a = r.range(0, TAU), sp = r.range(120, 200), vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(0, 0, vx0, vy0, age, 30, 3.5), [vx, vy] = flyV(vx0, vy0, age, 30, 3.5), q = age / life;
    p.line(x, y, x - vx * 0.04, y - vy * 0.04, q < 0.3 ? WHITE : q < 0.65 ? C[5] : C[3]);
    p.light(x, y, C[4], 0.4 * (1 - q));
  });

  // the air lights up for an instant, then lets go
  const L = 1 - seg(t, 0, 0.4);
  p.glow(0, 0, 56, C[4], 0.55 * L * L * L);
  p.glow(0, 0, 14, C[6], 0.5 * L * L);
}
