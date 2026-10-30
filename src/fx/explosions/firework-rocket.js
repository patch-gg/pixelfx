import { PAL, RAMP, ramp, seg, ease, burst, stream, fly, rand, TAU, WHITE, hex } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Firework rocket",
  desc: "A rocket fizzes off the ground and climbs on a sparkling trail, slows at the top, and bursts into a palm of drooping golden fronds that glitter as they fall.",
  tags: ["firework", "rocket", "celebration", "sky", "one-shot"],
  size: [96, 144],
  origin: [48, 138],
  duration: 2.9,
  loop: false,
  fps: 30,
  bg: "sky",
  options: { palette: PAL.gold, height: 100, arms: 11, seed: 29 },
};

const SHELL = [hex("#7a1c24"), hex("#d23a3a"), hex("#ff8a6a")], STICK = hex("#6a4a2a");
const UP = 0.1, TOP = 0.95;

export function draw(p, t, o) {
  const G = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, H = o.height;
  const pos = (tt) => {
    const k = ease.outQuad(seg(tt, UP, TOP));
    return [Math.sin(tt * 9) * 1.2 * (1 - k) + k * 2, -H * k];
  };
  // a few dim puffs of smoke hang along the climb
  stream(t, UP, TOP, 22, S + 1, (g) => g.range(0.4, 0.7), (age, life, r) => {
    const [x, y] = pos(t - age), q = age / life, rad = (1 - q) * r.range(1.2, 2.2), sy = y - 3 + age * 6;
    if (rad > 0.6 && sy + rad < 0) p.circle(x + r.range(-1, 1), sy, rad, q < 0.5 ? SM[3] : SM[2]);
  });
  // ignition: a fountain of sparks at the foot
  burst(10, S + 2, (r) => {
    const L = r.range(0.15, 0.3), age = t - r.range(0, 0.08);
    if (age < 0 || age > L) return;
    const [x, y] = fly(0, -1, r.range(-40, 40), -r.range(30, 70), age, 300);
    if (y < 0) p.px(x, y, age / L < 0.5 ? G[6] : G[4]);
  });
  // the climb: sparks shed from the tail, falling and twinkling out
  stream(t, UP, TOP, 70, S + 3, (g) => g.range(0.3, 0.6), (age, life, r, i) => {
    const [x0, y0] = pos(t - age), q = age / life, [x, y] = fly(x0, y0 - 4, r.range(-14, 14), r.range(0, 20), age, 70, 1);
    if (y > -1 || (q > 0.5 && rand(i, Math.floor(t * 20), S) < 0.4)) return;
    p.px(x, y, q < 0.3 ? WHITE : q < 0.65 ? G[5] : G[3]);
  });
  if (t < TOP) {
    // the rocket: (x, y) is the foot of its stick; a red shell with a white nose, the exhaust under the shell
    const [px, py] = pos(t), x = Math.round(px), y = Math.round(py);
    p.rect(x, y - 10, 2, 5, SHELL[1]);
    p.px(x, y - 10, SHELL[2]), p.px(x + 1, y - 6, SHELL[0]), p.px(x, y - 11, WHITE);
    p.line(x + 1, y - 5, x + 1, y - 1, STICK);
    if (t > UP) p.px(x, y - 5, Math.floor(t * 30) % 2 ? WHITE : G[6]), p.px(x, y - 4, G[5]);
    p.glow(x, y - 5, 9, G[5], t > UP ? 0.5 : 0.2);
    return;
  }
  // the burst: a palm of heavy fronds that arc out, droop, and leave glittering trails
  const age = t - TOP, [bx, by0] = pos(TOP), by = by0 - 8;
  if (age < 0.07) {
    p.circle(bx, by, 3 + 30 * age, WHITE);
    p.glow(bx, by, 32, G[5], 0.8);
  }
  burst(o.arms, S + 4, (r, i) => {
    const a = (i / o.arms) * TAU + r.range(-0.2, 0.2), z = r.range(0.55, 1), sp = r.range(62, 74) * z, L = r.range(1.45, 1.85);
    if (age > L) return;
    const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp * 0.9 - 8, q = age / L;
    // the frond: points along its own path, newest brightest; its tail burns away first
    for (let j = 13; j >= 0; j--) {
      const tt = age - j * 0.045;
      if (tt < 0) continue;
      const fade = j / 13 + q * 0.9;
      if (fade > 1.15) continue;
      const [x, y] = fly(bx, by, vx, vy, tt, 58, 1.7);
      const glit = rand(i, j, Math.floor(t * 15)) > 0.86;
      p.px(x, y, j === 0 && q < 0.6 ? WHITE : glit ? G[7] : fade < 0.45 ? G[5] : fade < 0.8 ? G[4] : G[2]);
    }
    const [hx, hy] = fly(bx, by, vx, vy, age, 58, 1.7);
    p.light(hx, hy, G[5], 0.5 * (1 - q));
  });
  // glitter dropping off the fronds
  stream(t, TOP + 0.3, TOP + 1.25, 26, S + 5, (g) => g.range(0.4, 0.6), (ga, life, r) => {
    const born = t - ga, a = r.range(0, TAU), d = r.range(14, 30) * seg(born - TOP, 0, 0.6);
    const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d * 0.8 + 12 * seg(born - TOP, 0, 1.4) + ga * ga * 40;
    if (rand(r.next() * 999, Math.floor(t * 20)) > 0.45) p.px(x, y, ga / life < 0.5 ? G[6] : G[4]);
  });
  const L = 1 - seg(age, 0, 1.2);
  p.glow(bx, by + 8, 40, G[4], 0.35 * L * L);
}
