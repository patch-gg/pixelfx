import { fit, at, burst, fly, seg, ease, clamp, smooth, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Sword slash",
  desc: "A fast crescent smear: the white edge whips through in four frames, the tail catches up and dissolves, glints fly off.",
  tags: ["melee", "slash", "sword", "combat", "directional", "one-shot"],
  size: [72, 68],
  origin: [26, 42],
  duration: 0.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#1f4f94", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"], radius: 24, seed: 2 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 6), R = o.radius, S = o.seed;
  const A0 = -1.95, A1 = 0.62, cx = 1, cy = -13; // from over the shoulder to low in front
  const lead = A0 + (A1 - A0) * ease.outQuart(seg(t, 0, 0.1));
  const tail = A0 + (A1 - A0) * ease.inCubic(seg(t, 0.02, 0.24));
  if (lead - tail > 0.02) {
    const W = 9;
    // the smear: thick behind the edge, tapering to nothing at the tail, a hard white rim outside
    p.arc(cx, cy, R, (u) => W * Math.pow(u, 0.55) * (u > 0.94 ? (1 - u) / 0.06 : 1) + 1, tail, lead,
      (u, v) => (v > 0.82 ? WHITE : at(C.slice(1), v * 0.9 + u * 0.15)),
      (u, v) => clamp(smooth(0, 0.45, u) * (v > 0.82 ? 1.4 : 0.6 + v)) * (1 - seg(t, 0.14, 0.24) * (1 - v)));
    // an inner echo, thinner, a beat behind
    const echo = Math.max(tail, lead - 0.9);
    if (lead - echo > 0.05) p.arc(cx, cy, R - 7, (u) => 2 * u, echo, lead - 0.15, C[3], (u) => 0.7 * u * (1 - seg(t, 0.12, 0.26)));
    // light rides the edge
    const lx = cx + Math.cos(lead) * (R - 3), ly = cy + Math.sin(lead) * (R - 3);
    p.glow(lx, ly, 16, C[3], 0.5 * (1 - seg(t, 0.1, 0.35)));
  }
  // glints thrown off the edge as it passes
  burst(7, S, (r) => {
    const a = A0 + (A1 - A0) * r.range(0.25, 0.95), born = 0.13 * ease.inQuad(r.next()) + 0.01, life = r.range(0.14, 0.22);
    const age = t - born;
    if (age < 0 || age > life) return;
    const sp = r.range(30, 70), dx = Math.cos(a), dy = Math.sin(a);
    const [x, y] = fly(cx + dx * R, cy + dy * R, dx * sp - dy * 25, dy * sp + dx * 25, age, 40, 3);
    const k = age / life;
    if (k < 0.5) p.px(x - 1, y, C[4]), p.px(x + 1, y, C[4]), p.px(x, y - 1, C[4]), p.px(x, y + 1, C[4]);
    p.px(x, y, WHITE);
    p.light(x, y, C[3], 0.5 * (1 - k));
  });
}
