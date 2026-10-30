import { PAL, RAMP, ramp, seg, burst, fly, rand, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Firework burst",
  desc: "A shell bursts into a sphere of coloured stars around a gold core: they streak out, slow, droop on fading trails and crackle as they fall and wink out.",
  tags: ["firework", "celebration", "sparks", "sky", "one-shot"],
  size: [108, 120],
  origin: [54, 48],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "sky",
  options: { palette: PAL.neon, count: 60, seed: 28 },
};

// one shell: stars thrown over a sphere, so seen from the side the ones flying at us look slower
function shell(p, t, n, seed, speed, life, cols, trail) {
  burst(n, seed, (r, i) => {
    const z = r.range(-1, 1), a = r.range(0, TAU), s = Math.sqrt(1 - z * z), sp = speed * r.range(0.9, 1.06);
    const vx = Math.cos(a) * s * sp, vy = Math.sin(a) * s * sp, L = r.range(life[0], life[1]);
    if (t > L) return;
    const q = t / L, pos = (tt) => fly(0, 0, vx, vy, tt, 36, 2.3);
    const [x, y] = pos(t), [tx, ty] = pos(Math.max(0, t - trail * (1 - q * 0.6)));
    if (q < 0.85) p.line(tx, ty, x, y, (u) => (u < 0.45 ? cols[0] : cols[1]));
    // late in life the stars crackle: blinking on and off, a few flaring white
    const blink = q > 0.5 ? rand(i, Math.floor(t * 18), seed) : 1;
    if (blink < 0.35) return;
    p.px(x, y, q < 0.25 || blink > 0.93 ? WHITE : q < 0.7 ? cols[3] : cols[2]);
    p.light(x, y, cols[2], 0.55 * (1 - q));
  });
}

export function draw(p, t, o) {
  const C = fit(ramp(o.palette)), G = RAMP.gold, S = o.seed;
  if (t < 0.08) {
    p.circle(0, 0, 3 + 30 * t, WHITE);
    p.glow(0, 0, 34, C[5], 0.8 * (1 - t / 0.08));
  }
  shell(p, t, o.count, S, 92, [1.6, 2.3], [C[2], C[3], C[5], C[6]], 0.16);
  shell(p, t, 22, S + 1, 38, [1.1, 1.6], [G[2], G[3], G[5], G[6]], 0.12);
  const L = 1 - seg(t, 0, 1.4);
  p.glow(0, 4, 46, C[4], 0.35 * L * L);
}
