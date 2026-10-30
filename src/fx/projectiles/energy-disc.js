import { PAL, ramp, at, cycle, fly, fract, TAU, WHITE } from "../../core/index.js";
import { onCanvas } from "./_lib.js";

export const meta = {
  name: "Energy disc",
  desc: "A spinning sawblade of blue energy: a white-hot rim of hooked teeth whirling round a hollow core, motion arcs trailing and sparks flung off.",
  tags: ["projectile", "disc", "sawblade", "energy", "sci-fi", "directional", "loop"],
  size: [48, 30],
  origin: [36, 15],
  duration: 0.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.electric, teeth: 5, radius: 9, seed: 14 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, D = meta.duration, ph = t / D, n = o.teeth, R = o.radius;
  const cx = -R + 0.5, cy = 0.5, spin = ph * TAU, inside = onCanvas(meta, 1); // one turn a loop
  // motion arcs: ghost rims sliding off behind
  for (let i = 1; i <= 2; i++) p.arc(cx - i * 4, cy, R - i, 1, Math.PI * 0.55, Math.PI * 1.45, i === 1 ? C[3] : C[2]);
  // the disc: hooked teeth on a bright rim, three curved spokes, a hollow dark core
  p.shade(cx - R - 3, cy - R - 3, cx + R + 3, cy + R + 3, (x, y) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const tooth = fract(((a - spin) * n) / TAU), edge = R - 2.6 + 2.8 * tooth;
    if (d > edge || d < 2.2) return;
    if (d > edge - 1.1) return tooth > 0.7 ? WHITE : at(C, 0.86);
    if (d > R - 3.4) return at(C, 0.7);
    const spoke = Math.sin((a - spin) * 3 + d * 0.5);
    if (d < 3.3) return at(C, 0.44);
    return spoke > 0.55 ? at(C, 0.62) : at(C, 0.32);
  });
  // sparks: flung off the teeth, tangent to the spin, falling behind
  cycle(t, D, 8, S, (r) => r.range(0.1, 0.22), (age, life, r) => {
    const a = r.range(0, TAU), k = age / life, sx = cx + Math.cos(a) * R, sy = cy + Math.sin(a) * R;
    const v = r.range(50, 110), [x, y] = fly(sx, sy, -Math.sin(a) * v - 70, Math.cos(a) * v, age, 60, 2);
    if (!inside(x, y)) return;
    p.px(x, y, k < 0.4 ? WHITE : at(C, 0.7));
    p.light(x, y, at(C, 0.6), 0.4 * (1 - k));
  });
  const pulse = 0.9 + 0.1 * Math.sin(ph * TAU * 2);
  p.glow(cx, cy, R * 2, at(C, 0.55), 0.3 * pulse);
  p.glowRing(cx, cy, R - 1, 3, at(C, 0.75), 0.3 * pulse);
}
