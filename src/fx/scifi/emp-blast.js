import { PAL, burst, fly, flyV, seg, ease, rng, rand, TAU, WHITE } from "../../core/index.js";
import { steps, jagged } from "./_lib.js";

export const meta = {
  name: "EMP blast",
  desc: "An electromagnetic pulse: a white pop, then a bubble of interference swells out, strobing and crackling over its skin, and shorts out into dead pixels.",
  tags: ["scifi", "emp", "pulse", "shockwave", "electric", "grenade", "one-shot"],
  size: [96, 96],
  origin: [48, 48],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.electric, radius: 42, seed: 33 },
};

const OFF = [[0.13, 0.166], [0.3, 0.333], [0.5, 0.533]]; // strobe: frames where the bubble cuts out

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, R0 = o.radius, beat = Math.floor(t * 20);
  const R = 4 + (R0 - 4) * ease.outExpo(seg(t, 0, 0.5));
  const fade = seg(t, 0.45, 0.85), off = OFF.some(([a, b]) => t >= a && t < b);

  // the bubble: interference lines in its outer shell, an equator to round it out, a hard skin that
  // breaks up as it fades
  if (fade < 1 && !off) {
    const scroll = Math.floor(t * 40);
    p.shade(-R, -R, R, R, (x, y, out) => {
      const d = (x * x + y * y) / (R * R);
      if (d > 1) return;
      if (d > 0.9) {
        const a = Math.atan2(y, x), gap = rand(S, Math.floor((a + 4) * 7), 7) < fade * 1.3;
        if (gap) return;
        out.c = t < 0.1 ? WHITE : fade < 0.3 ? C[5] : fade < 0.6 ? C[4] : C[3];
        out.k = 0.2 * (1 - fade);
        return;
      }
      if ((Math.floor(y) + scroll) % 3 !== 0 || fade > 0.45 || d < 0.55) return;
      out.c = d > 0.78 ? C[4] : d > 0.66 ? C[3] : C[2];
    });
    if (fade < 0.6) {
      for (let i = 0; i < 48; i++) {
        const a0 = (i / 48) * TAU, a1 = ((i + 1) / 48) * TAU, front = Math.sin(a0 + 0.06) > 0;
        p.line(Math.cos(a0) * R, Math.sin(a0) * R * 0.24, Math.cos(a1) * R, Math.sin(a1) * R * 0.24, front ? C[5] : C[3]);
      }
    }
  }

  // the pop: a white ball and a flash
  if (t < 0.1) {
    p.circle(0, 0, 7 - 50 * t, WHITE);
    p.glow(0, 0, 40, C[5], 0.7 * (1 - t / 0.1));
  }

  // crackles crawling over the skin
  if (t > 0.04 && t < 0.7 && !off) {
    for (let i = 0; i < 4; i++) {
      const r = rng(S, beat, i), a = r.range(0, TAU), da = r.range(0.2, 0.35) * r.sign();
      const pts = jagged(r, Math.cos(a) * R, Math.sin(a) * R, Math.cos(a + da) * R, Math.sin(a + da) * R, { step: 3, amp: 1.8 });
      p.polyline(pts, beat % 2 ? C[5] : WHITE);
    }
  }

  // dead pixels and sparks kicked out by the pulse
  burst(16, S + 5, (r) => {
    const born = r.range(0.02, 0.3), age = t - born, life = r.range(0.2, 0.35);
    if (age < 0 || age > life) return;
    const a = r.range(0, TAU), sp = r.range(60, 120), vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(0, 0, vx0, vy0, age, 60, 2.5), [vx, vy] = flyV(vx0, vy0, age, 60, 2.5), q = age / life;
    if (Math.abs(x) > 45 || Math.abs(y) > 45) return;
    if (r.chance(0.4)) p.rect(Math.round(x), Math.round(y), 2, 2, q < 0.5 ? C[6] : C[4]);
    else p.line(x, y, x - vx * 0.03, y - vy * 0.03, q < 0.4 ? WHITE : q < 0.7 ? C[5] : C[3]);
  });

  const L = 1 - seg(t, 0, 0.6);
  if (!off) p.glow(0, 0, Math.max(8, R * 0.9), C[4], 0.3 * L * L);
}
