import { PAL, burst, fly, flyV, seg, ease, rng, rand, TAU, WHITE } from "../../core/index.js";
import { steps, zap, jagged, brokenRing } from "./_lib.js";

export const meta = {
  name: "Charge up",
  desc: "Sparks and arcs are drawn in to a point, the core swelling and crackling, ripples closing in faster and faster; a white flash, then it all bursts out as bolts.",
  tags: ["lightning", "electric", "charge", "spell", "buildup", "release", "one-shot"],
  size: [80, 80],
  origin: [40, 40],
  duration: 1.25,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.electric, radius: 30, seed: 20 },
};

const GATHER = 0.75, FLASH = 0.8;

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, R = o.radius, beat = Math.floor(t * 20);

  if (t < FLASH) {
    const g = seg(t, 0, GATHER), core = 1 + 4 * ease.inQuad(g);
    // ripples closing in, quicker as the charge builds, broken arcs turning as they shrink
    [0, 0.32, 0.56, 0.72].forEach((r0, j) => {
      const k = seg(t, r0 * GATHER, r0 * GATHER + 0.28 * (1 - r0 * 0.6));
      if (k > 0 && k < 1)
        brokenRing(p, 0, 0, R * (1 - ease.inQuad(k)) + core, 1, { n: 5, gap: 0.45 - 0.3 * k, turn: j + k * 2, seed: S + j, c: k < 0.6 ? C[3] : C[4] });
    });
    // sparks sucked in from all round
    burst(30, S, (r) => {
      const born = r.range(0, GATHER - 0.15), life = r.range(0.22, 0.34), age = t - born;
      if (age < 0 || age > life) return;
      const a = r.range(0, TAU) + age * 2, k = ease.inQuad(age / life), d = (R + r.range(-2, 3)) * (1 - k) + core;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      p.line(x, y, x + Math.cos(a) * (1 + 3 * k), y + Math.sin(a) * (1 + 3 * k), k > 0.6 ? WHITE : C[5]);
    });
    // arcs leaping in from the edge, more of them as it builds
    const n = Math.floor(1 + 3 * g);
    for (let i = 0; i < n; i++) {
      const r = rng(S, beat, i);
      if (!r.chance(0.35 + 0.5 * g)) continue;
      const a = r.range(0, TAU), d = R * r.range(0.6, 1);
      const pts = jagged(r, Math.cos(a) * d, Math.sin(a) * d, 0, 0, { step: 3.5, amp: 2 });
      p.polyline(pts, g > 0.6 ? C[6] : C[5]);
    }
    // the core: swelling, flickering
    const jit = rand(S, beat, 4) * 0.8;
    p.circle(0, 0, core + jit, (d) => (d < 0.55 ? WHITE : d < 0.85 ? C[6] : C[5]));
    p.glow(0, 0, 12 + 22 * g, C[4], 0.15 + 0.35 * g);
    p.glow(0, 0, 6 + 4 * g, C[6], 0.3 * g);
  }

  // the flash
  if (t >= GATHER && t < FLASH + 0.034) {
    p.circle(0, 0, 9, WHITE);
    p.glow(0, 0, 44, C[5], 0.8);
  }

  // the release: bolts burst outward and hold a beat, then flicker and thin
  const rel = seg(t, FLASH, 1.15);
  if (t >= FLASH && rel < 1) {
    const hb = Math.floor((t - FLASH) * 20);
    burst(7, S + 50 + hb, (r, i) => {
      const a = (i / 7) * TAU + r.range(-0.3, 0.3), l = (R + r.range(-4, 6)) * (0.6 + 0.4 * ease.outCubic(seg(t, FLASH, FLASH + 0.08)));
      if (rel > 0.4 && r.chance(rel)) return;
      const pts = jagged(r, 0, 0, Math.cos(a) * l, Math.sin(a) * l, { step: 4.5, amp: 2.6 });
      zap(p, pts, rel < 0.25 ? WHITE : C[5], rel < 0.15 ? C[4] : null);
    });
    const k = ease.outCubic(seg(t, FLASH, FLASH + 0.3));
    if (k < 1) brokenRing(p, 0, 0, 8 + (R + 2) * k, Math.max(1, Math.round(3 * (1 - k))), { n: 7, gap: seg(k, 0.4, 1), seed: S + 9, c: k < 0.4 ? WHITE : C[5] });
    p.circle(0, 0, 5 * (1 - rel), rel < 0.3 ? WHITE : C[5]);
    p.glow(0, 0, 40, C[4], 0.45 * (1 - rel) * (1 - rel));
  }

  // sparks flung out with the release
  burst(16, S + 9, (r) => {
    const age = t - FLASH - r.range(0, 0.03), life = r.range(0.25, 0.42);
    if (age < 0 || age > life) return;
    const a = r.range(0, TAU), sp = r.range(70, 140), vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(0, 0, vx0, vy0, age, 90, 3), [vx, vy] = flyV(vx0, vy0, age, 90, 3), q = age / life;
    if (Math.abs(x) > 36 || Math.abs(y) > 36) return;
    p.line(x, y, x - vx * 0.03, y - vy * 0.03, q < 0.35 ? WHITE : q < 0.7 ? C[5] : C[3]);
    p.light(x, y, C[4], 0.4 * (1 - q));
  });
}
