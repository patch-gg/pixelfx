import { PAL, burst, fly, flyV, seg, ease, clamp, rng, rand, TAU, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, part, crackle, branches, crumble, jagged } from "./_lib.js";

export const meta = {
  name: "Chain lightning",
  desc: "A bolt leaps from the hand to a target, then on to the next and the next, each hit flashing as the arcs behind it flicker and crumble.",
  tags: ["lightning", "electric", "spell", "chain", "directional", "one-shot"],
  size: [112, 48],
  origin: [8, 25],
  duration: 0.66,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#100c34", "#241c7c", "#3c3cd0", "#6a78ff", "#a8b8ff", "#e0e6ff", "#ffffff"], targets: 3, spacing: 30, seed: 8 },
};

const HOP = 0.09, LIFE = 0.34;

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, n = o.targets;
  const pts = [[0, 0]];
  for (let i = 1; i <= n; i++) pts.push([i * o.spacing + rand(S, i, 1) * 8 - 4, (rand(S, i, 2) * 2 - 1) * 9]);
  const fi = Math.floor(t * 20);

  // the hand: a crackling spark ball that throws the first bolt
  const hand = 1 - seg(t, 0.05, 0.22);
  if (hand > 0) {
    p.circle(0, 0, 1 + 2 * hand, hand > 0.6 ? WHITE : C[5]);
    burst(3, S + fi, (r) => {
      const a = r.range(0, TAU), l = r.range(3, 6) * hand;
      p.polyline(crackle(r, 0, 0, Math.cos(a) * l, Math.sin(a) * l, 0.5), C[4]);
    });
    p.glow(0, 0, 12, C[4], 0.4 * hand);
  }

  for (let i = 0; i < n; i++) {
    const t0 = 0.03 + i * HOP, age = t - t0;
    if (age < 0) continue;
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    // the arc: jumps across in a frame, white-hot for two, then flickers thinner and crumbles
    if (age < LIFE) {
      const q = age / LIFE, path = jagged(rng(S, i, fi), x0, y0, x1, y1, { step: 4.5, amp: 3.2 });
      const arc = part(path, seg(age, 0, 0.034));
      if (q < 0.25) {
        for (const b of branches(rng(S, i, fi, 1), arc, { count: 2, len: 9, from: 0.2, to: 0.8 })) p.polyline(b, C[4]);
        zap(p, arc, q < 0.12 ? WHITE : C[6], q < 0.12 ? C[5] : C[4]);
      } else if (q < 0.55) zap(p, arc, C[5], fi % 3 ? null : C[3]);
      else crumble(p, arc, (q - 0.55) / 0.45, S + i, C[4]);
      glowPath(p, arc, 9, C[4], 0.4 * (1 - q) * (1 - q));
    }
    // the hit: a white flash and a ring at the target, sparks kicked out the far side
    const h = age - 0.034;
    if (h >= 0 && h < 0.4) {
      if (h < 0.034) p.circle(x1, y1, 4.5, WHITE);
      else if (h < 0.2) {
        // a star of short spikes, re-forming each beat and shrinking
        const k = seg(h, 0.034, 0.2);
        burst(5, S + 60 + i * 7 + fi, (r, j) => {
          const a = (j / 5) * TAU + r.range(-0.4, 0.4), l = r.range(5, 9) * (1 - ease.inQuad(k));
          p.polyline(jagged(r, x1, y1, x1 + Math.cos(a) * l, y1 + Math.sin(a) * l, { step: 3, amp: 1.5 }), k < 0.4 ? C[6] : C[4]);
        });
        p.circle(x1, y1, 2.5 * (1 - k) + 0.5, k < 0.5 ? WHITE : C[6]);
      }
      p.glow(x1, y1, 16, C[4], 0.5 * (1 - seg(h, 0, 0.3)));
      burst(6, S + 40 + i, (r) => {
        const life = r.range(0.18, 0.34);
        if (h > life) return;
        const a = r.range(-1.4, 1.4), sp = r.range(35, 75), vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp - 20;
        const [x, y] = fly(x1, y1, vx0, vy0, h, 160, 4), [vx, vy] = flyV(vx0, vy0, h, 160, 4), q = h / life;
        if (x > 101 || Math.abs(y) > 21) return;
        p.line(x, y, x - vx * 0.03, y - vy * 0.03, q < 0.4 ? WHITE : q < 0.7 ? C[5] : C[3]);
        p.light(x, y, C[4], 0.4 * (1 - q));
      });
      // a little leftover charge crawling around the struck point
      if (h > 0.05 && h < 0.3) {
        const a = rand(S, i, fi) * TAU, rr = 4;
        p.polyline(crackle(rng(S, i, fi, 2), x1 + Math.cos(a) * rr, y1 + Math.sin(a) * rr, x1 + Math.cos(a + 2.2) * rr, y1 + Math.sin(a + 2.2) * rr, 0.5), C[4], clamp((0.3 - h) / 0.1));
      }
    }
  }
}
