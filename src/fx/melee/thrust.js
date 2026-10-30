import { PAL, ramp, burst, fly, seg, ease, WHITE } from "../../core/index.js";

export const meta = {
  name: "Thrust",
  desc: "A piercing stab: a narrow lance of streaks shoots out in two frames, a sharp star flashes at the tip, speed lines and sparks run on past it.",
  tags: ["melee", "thrust", "stab", "spear", "rapier", "combat", "directional", "one-shot"],
  size: [76, 40],
  origin: [10, 31],
  duration: 0.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.gold, reach: 44, seed: 5 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), R = o.reach, S = o.seed, top = C.length - 1;
  const x0 = 5, y0 = -10; // the hand
  const tipX = x0 + R * ease.outExpo(seg(t + 0.025, 0, 0.09)); // the tip shoots out in two frames
  const tailX = x0 + R * ease.inCubic(seg(t, 0.05, 0.21)); // and the smear is pulled in after it
  const len = tipX - tailX;
  if (len > 1) {
    // the lance: a bundle of streaks, the white one longest, the outer ones shorter and deeper, so it comes to a point
    const rows = [[0, 0, 0, WHITE], [-1, 0.2, 2, C[top - 1]], [1, 0.2, 2, C[top - 1]], [-2, 0.4, 6, C[top - 3]], [2, 0.42, 6, C[top - 3]]];
    const thin = seg(t, 0.09, 0.18); // the outer streaks drop away first
    for (const [dy, from, back, c] of rows) {
      if (Math.abs(dy) > 2 - Math.floor(thin * 2.5)) continue;
      const a = tailX + len * from, b = tipX - back;
      if (b - a >= 1) p.line(a, y0 + dy, b, y0 + dy, c);
    }
    p.px(tipX + 1, y0, WHITE);
    p.glowLine(tailX, y0, tipX, y0, 7, C[top - 3], 0.3 * (1 - seg(t, 0.1, 0.22)));
  }
  // speed lines: thin streaks above and below, racing out with the lance, gone right after
  burst(6, S + 2, (r, i) => {
    const dy = (i % 2 ? 1 : -1) * r.range(5, 10), born = r.range(0, 0.05), age = t - born, life = r.range(0.08, 0.13);
    if (age < 0 || age > life) return;
    const q = age / life, head = x0 + 6 + R * r.range(0.5, 0.95) * ease.outCubic(seg(age, 0, 0.08)), l = r.range(6, 16) * (1 - q * 0.7);
    p.line(head - l, y0 + dy, head, y0 + dy, q < 0.5 ? C[top - 1] : C[top - 3]);
  });
  // the tip flash: a sharp four-point star, long along the thrust, from the frame the lance lands
  const fl = seg(t, 0.06, 0.07) * (1 - seg(t, 0.07, 0.24));
  if (fl > 0) {
    const tx = x0 + R + 1, e = Math.pow(fl, 1.4), H = Math.round(14 * e), V = Math.round(7 * e), hot = t < 0.1;
    for (let i = -H; i <= H; i++) {
      const w = Math.abs(i) / (H || 1);
      p.px(tx + i, y0, w < 0.55 ? WHITE : C[top - 1]);
      if (w < 0.25 && H > 5) p.px(tx + i, y0 - 1, hot ? WHITE : C[top - 1]), p.px(tx + i, y0 + 1, hot ? WHITE : C[top - 1]);
    }
    for (let j = -V; j <= V; j++) p.px(tx, y0 + j, Math.abs(j) / (V || 1) < 0.5 ? WHITE : C[top - 1]);
    if (hot) p.circle(tx, y0, 3, WHITE);
    p.glow(tx, y0, 20, C[top - 3], 0.5 * e);
    p.glow(tx, y0, 6, C[top - 1], 0.6 * e);
  }
  // sparks carried on past the tip
  burst(7, S, (r) => {
    const born = 0.07 + r.range(0, 0.03), age = t - born, life = r.range(0.12, 0.22);
    if (age < 0 || age > life) return;
    const a = r.range(-0.7, 0.7), sp = r.range(60, 130), q = age / life;
    const [x, y] = fly(x0 + R, y0, Math.cos(a) * sp, Math.sin(a) * sp, age, 60, 7);
    p.px(x, y, q < 0.35 ? WHITE : q < 0.7 ? C[top - 1] : C[top - 3]);
    if (q < 0.4) p.px(x - 1, y, C[top - 2]);
    p.light(x, y, C[top - 2], 0.5 * (1 - q));
  });
}
