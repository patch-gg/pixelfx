import { PAL, burst, fly, seg, ease, rand, clamp, TAU, WHITE } from "../../core/index.js";
import { fit, rune, sparkle } from "./_lib.js";

export const meta = {
  name: "Mana burst",
  desc: "A violet blast: a white flash, a ragged star of energy tearing outward, runes flung to the rim that circle once and pop into sparks.",
  tags: ["arcane", "burst", "magic", "runes", "explosion", "one-shot"],
  size: [88, 88],
  origin: [44, 44],
  duration: 0.95,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, count: 8, seed: 9 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, n = o.count;
  // the blast: a ragged star that tears outward and hollows into a ring, cooling from the inside
  const b = seg(t, 0, 0.34);
  if (b > 0 && b < 1) {
    const Rb = 5 + 21 * ease.outExpo(b), hollow = Rb * 0.9 * ease.outCubic(seg(t, 0.05, 0.34)), N = 9;
    // spikes of uneven length and width: a triangle wave around the circle, warped so they bunch up
    const spikes = (a) => {
      const f0 = (a / TAU + 1) % 1, f = (f0 + 0.04 * Math.sin(f0 * TAU * 2 + S)) * N, i = Math.floor(f) % N, w = f - Math.floor(f);
      const tri = 1 - Math.abs(2 * w - 1);
      return Math.pow(tri, 1.6 + rand(S, i, 1)) * (0.4 + 0.6 * rand(S, i));
    };
    const BODY = [C[2], C[3], C[4], C[5], C[6], WHITE];
    p.shade(-Rb * 1.15, -Rb * 1.15, Rb * 1.15, Rb * 1.15, (x, y) => {
      const d = Math.hypot(x, y), edge = Rb * (0.6 + 0.55 * spikes(Math.atan2(y, x)));
      if (d > edge || d < hollow) return;
      const v = (d - hollow) / Math.max(1, edge - hollow), heat = (1 - b) * 2.6 + (1 - Math.abs(v - 0.4)) * 2.2;
      return BODY[clamp(Math.floor(heat - (v > 0.8 ? 1.2 : 0)), 0, 5)];
    });
  }
  // flash: two frames of white
  if (t < 0.067) {
    p.circle(0, 0, 7 + 40 * t, WHITE);
    p.glow(0, 0, 44, C[5], 0.8);
  }
  // shockwave
  const sw = seg(t, 0.02, 0.3);
  if (sw > 0 && sw < 1) {
    const r = 8 + 30 * ease.outCubic(sw);
    // crisp at first, then torn into dashes rather than dithered away
    p.ring(0, 0, r, 1, sw < 0.4 ? C[6] : C[5], (v, a) => (Math.sin(a * 7 + sw * 3) > sw * 2.4 - 1.2 ? 1 : 0));
    p.glowRing(0, 0, r, 4, C[4], 0.3 * (1 - sw));
  }
  // runes: flung out, braking hard, then circling slowly at the rim until each one pops into a spark
  burst(n, S + 1, (r, i) => {
    const ang0 = (i / n) * TAU + r.range(-0.22, 0.22) - Math.PI / 2, reach = r.range(22, 29), t0 = r.range(0.02, 0.05);
    const k = ease.outCubic(seg(t, t0, t0 + 0.36)), pop = 0.42 + (i / n) * 0.26 + r.range(0, 0.04);
    if (t < t0) return;
    const ang = ang0 + 0.5 * ease.inOutSine(seg(t, 0.15, pop)), rad = 4 + reach * k + 3 * seg(t, 0.35, pop);
    const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
    if (t < pop) {
      const hot = seg(t, t0, t0 + 0.16), flick = t > pop - 0.1 && Math.sin(t * 90 + i) > 0.3;
      rune(p, r.int(0, 7), x, y, hot < 0.5 || flick ? WHITE : C[6], 1, false, C[3]);
      if (k < 0.85) p.line(x - Math.cos(ang) * 7 * (1 - k), y - Math.sin(ang) * 7 * (1 - k), x - Math.cos(ang) * 3, y - Math.sin(ang) * 3, C[4]);
      p.glow(x, y, 6, C[4], 0.3);
      return;
    }
    // the pop: a twinkle that shrinks away
    const q = seg(t, pop, pop + 0.2);
    if (q >= 1) return;
    sparkle(p, x, y, 3 - q * 3, q < 0.3 ? WHITE : C[6], C[5], WHITE);
    p.light(x, y, C[5], 0.5 * (1 - q));
  });
  // motes thrown off the blast
  burst(16, S + 2, (r) => {
    const a = r.range(0, TAU), sp = r.range(50, 110), life = r.range(0.35, 0.7);
    if (t > life) return;
    const q = t / life, [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 10, 4.5);
    p.dot(x, y, q < 0.3 ? WHITE : q < 0.6 ? C[6] : C[5], 1 - q * 0.6);
  });
  const L = 1 - seg(t, 0, 0.5);
  p.glow(0, 0, 40, C[4], 0.5 * L * L);
  p.glow(0, 0, 12, C[6], 0.5 * L * L * L);
}
