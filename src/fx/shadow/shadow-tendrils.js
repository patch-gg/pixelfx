import { burst, cycle, seg, ease, TAU } from "../../core/index.js";
import { steps, UMBRA } from "./_lib.js";

export const meta = {
  name: "Shadow tendrils",
  desc: "A black pool spreads underfoot, tentacles of shadow lash up out of it with violet rims, curl and writhe, then sink back as it closes.",
  tags: ["shadow", "tentacle", "ground", "summon", "dark", "one-shot"],
  size: [72, 60],
  origin: [36, 53],
  duration: 1.7,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: UMBRA, count: 4, height: 34, seed: 4 },
};

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, n = o.count;
  const open = ease.outCubic(seg(t, 0, 0.14)), close = ease.inQuad(seg(t, 1.35, 1.7));
  const poolR = 22 * open * (1 - close);

  // the pool: a hole of black on the floor with a lit far rim
  if (poolR > 0.8) {
    p.ellipse(0, 0.5, poolR, poolR * 0.2 + 0.8, (d, a) => (d > 0.8 ? (Math.sin(a) < 0 ? C[6] : C[4]) : d > 0.55 ? C[1] : C[0]));
    p.glow(0, -2, 28 * (1 - close), C[5], 0.3 * open * (1 - close));
  }

  // tentacles: a spine integrated from a heading that leans out, writhes, and hooks at the tip
  const tents = [];
  burst(n, S, (r, i) => {
    const side = (i + 0.5) / n - 0.5, hero = i === Math.floor(n / 2);
    const bx = side * 34 + r.range(-2, 2), H = o.height * (hero ? 1 : r.range(0.62, 0.85));
    const born = hero ? 0.1 : 0.04 + r.range(0, 0.14), sink = 1.0 + r.range(0, 0.16);
    const grow = ease.outBack(seg(t, born, born + 0.32), 1.5) * (1 - ease.inQuad(seg(t, sink, sink + 0.34)));
    if (grow <= 0.02) return;
    const lean = side * 1.1 + r.range(-0.15, 0.15), curl = (side < 0 ? -1 : 1) * (hero ? 1.6 : r.range(1.1, 1.8));
    const ph = r.range(0, TAU), sp = r.range(6, 9), w0 = hero ? 3.6 : r.range(2.4, 3.2);
    const N = 18, ds = (H * grow) / N, pts = [];
    let x = bx, y = 1;
    for (let j = 0; j <= N; j++) {
      const s = j / N;
      pts.push([x, y, w0 * Math.pow(1 - s, 0.8) + 0.45]);
      const head = -Math.PI / 2 + lean * s + 0.75 * Math.sin(t * sp + ph - s * 3) * s + curl * s * s * s * (0.6 + 0.4 * grow);
      x += Math.cos(head) * ds;
      y += Math.sin(head) * ds;
    }
    tents.push(pts);
    // a splash of shadow as it bursts out of the pool
    burst(4, S + 10 + i, (q) => {
      const age = t - born, life = q.range(0.28, 0.4);
      if (age < 0 || age > life) return;
      const vx = q.range(-40, 40), vy = -q.range(40, 75), x = bx + vx * age, y = vy * age + 150 * age * age;
      if (y > 0.5) return;
      p.rect(x, y, 2, 2, C[1]), p.px(x, y, C[5]);
    });
  });
  // stamp in passes so overlapping tentacles merge: outline, lit left edge, black body, darker core
  const pass = (dx, dy, grow, c) => {
    for (const pts of tents) for (const [x, y, w] of pts) p.circle(x + dx, y + dy, Math.max(0.5, w + grow), c);
  };
  pass(0, 0, 1, C[3]);
  pass(-0.7, -0.4, 0, C[6]);
  pass(0.5, 0.2, -0.05, C[1]);
  pass(0.9, 0.3, -1.5, C[0]);
  for (const pts of tents) p.light(pts[18][0], pts[18][1], C[6], 0.4);

  // motes rising off the pool while it's open
  cycle(t, 1.7, 9, S + 2, (r) => r.range(0.5, 0.9), (age, life, r) => {
    if (poolR < 5) return;
    const k = age / life, x = r.range(-0.9, 0.9) * poolR, y = -age * r.range(18, 30);
    p.px(x + Math.sin(age * 9 + r.next() * 6), y, k < 0.5 ? C[6] : C[5]);
  });
}
