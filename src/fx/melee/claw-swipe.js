import { PAL, ramp, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { cut } from "./_lib.js";

export const meta = {
  name: "Claw swipe",
  desc: "Three claws rake down and back in front of the fighter: white tips tear through, three red gashes hold a beat and close, flecks fly.",
  tags: ["melee", "claw", "beast", "scratch", "slash", "combat", "directional", "one-shot"],
  size: [60, 48],
  origin: [12, 40],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.blood, count: 3, seed: 7 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, top = C.length - 1, n = clamp(Math.round(o.count), 1, 5);
  // the rake: from up and out in front, down and back toward the fighter
  const ax = 29, ay = -26, bx = 12, by = -1, L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L, ny = (bx - ax) / L;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 7, mid = Math.abs(off) < 1;
    const shrink = mid ? 0 : 0.12; // the middle claw reaches furthest
    const x0 = ax + nx * off + (bx - ax) * shrink * 0.3, y0 = ay + ny * off + (by - ay) * shrink * 0.3;
    const x1 = bx + nx * off - (bx - ax) * shrink, y1 = by + ny * off - (by - ay) * shrink;
    const t0 = [0.02, 0, 0.035, 0.05, 0.015][i] - 0.02, q = t - t0;
    if (q < 0) continue;
    const lead = ease.outQuart(seg(q, 0, 0.06)), tail = ease.inCubic(seg(q, 0.01, 0.11));
    cut(p, x0, y0, x1, y1, { bulge: -2, w: 3, lead, tail, C, inner: 0.6 });
    // the gash it leaves: a thin red lens that holds, then closes toward its middle
    const g = seg(q, 0.05, 0.09) * (1 - seg(t, 0.26, 0.44));
    if (g <= 0) continue;
    const len = Math.hypot(x1 - x0, y1 - y0), sx = (x1 - x0) / len, sy = (y1 - y0) / len;
    for (let j = 0; j <= len; j++) {
      const u = j / len, s = Math.sin(Math.PI * u) - (1 - g) * 1.05;
      if (s <= 0) continue;
      const b = 2 * 4 * u * (1 - u), x = x0 + sx * j - sy * b, y = y0 + sy * j + sx * b; // on the cut's bowed center line
      const hot = t >= 0.066 && t < 0.1; // the frame all three are open: white-hot
      p.px(x, y, hot && s > 0.3 ? WHITE : s > 0.55 ? C[top - 1] : C[top - 2]);
      if (s > 0.3) p.px(x + 1, y, hot ? C[top - 1] : s > 0.6 ? C[top - 3] : C[top - 4]);
    }
  }
  // red flecks flung off the claws' ends as they finish the rake
  burst(6, S, (r, i) => {
    const born = 0.05 + r.range(0, 0.04), age = t - born, life = r.range(0.18, 0.28);
    if (age < 0 || age > life) return;
    const off = ((i % 3) - 1) * 7, x0 = bx + nx * off + 2, y0 = by + ny * off - 4;
    const a = Math.atan2(by - ay, bx - ax) + r.range(-0.6, 0.3), sp = r.range(40, 80);
    const [x, y] = fly(x0, y0, Math.cos(a) * sp, Math.sin(a) * sp - 30, age, 260, 2), k = age / life;
    if (y > 1) return;
    p.px(x, y, k < 0.35 ? C[top] : k < 0.7 ? C[top - 2] : C[top - 4]);
  });
  p.glow(20, -13, 22, C[top - 2], 0.35 * (1 - seg(t, 0.05, 0.3)) * seg(t, -0.02, 0.03));
}
