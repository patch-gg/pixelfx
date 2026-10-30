import { cycle, rand, rng, clamp, TAU, WHITE } from "../../core/index.js";
import { steps, glowPath, jagged } from "./_lib.js";

export const meta = {
  name: "Electric field",
  desc: "A live patch of floor: a humming tinted ellipse where little arcs skitter along the ground, static hairs flicker up and sparks hop.",
  tags: ["lightning", "electric", "trap", "hazard", "zone", "ground", "loop"],
  size: [72, 32],
  origin: [36, 26],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#140a30", "#2e1a78", "#5a38c8", "#8a70ff", "#bcb0ff", "#e8e2ff", "#ffffff"], width: 28, seed: 17 },
};

const RATE = 15;

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, RX = o.width, RY = RX * 0.17, beat = Math.floor(t * RATE);
  const fresh = t * RATE - beat < 0.5, ph = t / meta.duration;
  // a point on the floor patch, from two numbers in 0..1
  const at = (u, v) => {
    const a = u * TAU, d = Math.sqrt(v) * 0.92;
    return [Math.cos(a) * RX * d, Math.sin(a) * RY * d];
  };

  // the live floor: the patch lit from within (light only, so the floor shows through), a hard rim
  // with a pulse chasing round it
  p.shade(-RX, -RY, RX, RY, (x, y, out) => {
    const d = Math.hypot(x / RX, y / RY);
    if (d > 1) return;
    out.l = C[3];
    out.k = 0.22 + 0.2 * d * d;
  });
  const n = Math.round(RX * 4.4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, x = Math.cos(a) * RX, y = Math.sin(a) * RY;
    const pulse = Math.sin(a * 3 - ph * TAU * 2);
    p.px(x, y, pulse > 0.75 ? C[5] : pulse > 0.2 ? C[4] : C[3]);
  }

  // static hairs: short upright flickers across the patch
  for (let i = 0; i < 9; i++) {
    if (rand(S, beat, i, 1) < 0.45) continue;
    const [x, y] = at(rand(S, i, 2), rand(S, i, 3)), h = 2 + Math.floor(rand(S, beat, i, 4) * 4);
    p.line(x, y, x, y - h, C[3]);
    p.px(x, y - h, C[5]);
  }

  // skittering arcs: flat zigzags hopping between points on the floor, new ones every beat
  for (let i = 0; i < 3; i++) {
    const r = rng(S, beat, i), [x0, y0] = at(r.next(), r.next());
    const a = r.range(-0.35, 0.35) + (r.chance(0.5) ? Math.PI : 0), l = r.range(7, 15);
    const x1 = clamp(x0 + Math.cos(a) * l, -RX * 0.9, RX * 0.9), y1 = clamp(y0 + Math.sin(a) * l * 0.3, -RY * 0.8, RY * 0.8);
    const pts = jagged(r, x0, y0, x1, y1, { step: 2.5, amp: 1.6 }).map(([x, y], j, all) => [x, y - 1.5 * Math.sin((Math.PI * j) / (all.length - 1))]);
    p.polyline(pts, fresh ? WHITE : C[5]);
    if (fresh) p.px(x0, y0, C[6]), p.px(x1, y1, C[6]);
    glowPath(p, pts, 6, C[4], fresh ? 0.3 : 0.15, 2);
  }

  // sparks hop up off the floor and drop back
  cycle(t, meta.duration, 8, S + 3, (r) => r.range(0.2, 0.32), (age, life, r) => {
    const [x0, y0] = at(r.next(), r.next()), vy = -r.range(45, 75), vx = r.range(-15, 15);
    const x = x0 + vx * age, y = y0 + vy * age + 300 * age * age;
    if (y > y0) return;
    p.px(x, y, age / life < 0.5 ? WHITE : C[4]);
    p.light(x, y, C[4], 0.4);
  });

  // the hum: light pooled on the patch, flickering with the beats
  const fl = 0.8 + 0.2 * rand(S, beat, 77);
  p.glow(0, -2, RX * 1.2, C[3], 0.3 * fl);
  p.glow(0, 0, RX * 0.5, C[4], 0.2 * fl);
}
