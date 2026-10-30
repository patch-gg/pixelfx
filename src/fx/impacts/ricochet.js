import { PAL, ramp, burst, fly, flyV, seg, ease, clamp, WHITE } from "../../core/index.js";
import { rayStar, streak, puff } from "./_lib.js";

export const meta = {
  name: "Ricochet",
  desc: "A tracer streaks down into the floor, flashes, and skips off up-right in a long fading streak, kicking up sparks and a pinch of dust.",
  tags: ["impact", "bullet", "ricochet", "tracer", "sparks", "directional", "one-shot"],
  size: [72, 40],
  origin: [26, 32],
  duration: 0.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#3a0e0a", "#8a2a10", "#d85a14", "#ff9a2a", "#ffd86a", "#fff6c8", "#ffffff"], dust: PAL.dust, skip: 0.32, seed: 11 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), D = ramp(o.dust), S = o.seed, N = C.length - 1;
  const ix = Math.cos(0.72), iy = Math.sin(0.72); // the way in: down and right
  const ox = Math.cos(-o.skip), oy = Math.sin(-o.skip); // the way out: up and right, shallow
  const T = 0.034; // the frame it hits
  // the round coming in: a tracer whose head reaches the floor on the hit frame
  const inHead = 15 * (1 - seg(t, 0, T)), inTail = Math.min(33, inHead + 26 * (1 - seg(t, 0, 0.07)));
  if (inTail - inHead > 1)
    p.line(-ix * inTail, -iy * inTail, -ix * inHead, -iy * inHead, (u) => (u > 0.75 ? WHITE : u > 0.35 ? C[N - 2] : C[N - 3]));
  // the round going out: the head races off, the tail chases it down
  const outHead = 44 * ease.outQuad(seg(t, T, 0.15)), outTail = 44 * ease.inQuad(seg(t, T + 0.02, 0.24));
  if (outHead - outTail > 1) {
    const fade = seg(t, 0.14, 0.24);
    p.line(ox * outTail, oy * outTail - 1, ox * outHead, oy * outHead - 1,
      (u) => (u > 0.8 - fade * 0.3 ? (fade < 0.5 ? WHITE : C[N - 1]) : u > 0.4 ? C[N - 2] : C[N - 3]));
    if (fade < 0.6) p.px(ox * outHead, oy * outHead - 2, WHITE);
    p.glowLine(ox * outTail, oy * outTail - 1, ox * outHead, oy * outHead - 1, 4, C[N - 2], 0.3 * (1 - fade));
  }
  // a scorch skid on the floor where it hit, fading
  const sk = 1 - seg(t, 0.2, 0.4);
  if (t >= T && sk > 0) p.line(-3, 0, 3, 0, (u) => (u < 0.3 || u > 0.8 ? C[1] : C[2]), sk);
  // dust kicked up off the floor
  burst(3, S + 2, (r, i) => {
    const born = T + i * 0.02, life = r.range(0.24, 0.32), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, [x, y] = fly(r.range(-1, 2), -1, r.range(10, 40), -r.range(16, 34), age, -10, 4);
    puff(p, x, Math.min(y, -1), (0.8 + r.range(0.8, 1.8) * ease.outCubic(q)) * (1 - 0.6 * seg(q, 0.5, 1)), D.slice(4), 1 - seg(q, 0.8, 1), 0.5 - q * 0.5);
  });
  // sparks: sprayed forward off the hit, dropping, skidding along the floor as they cool
  burst(9, S, (r) => {
    const a = -o.skip + r.range(-0.9, 0.35), sp = r.range(70, 170), born = T + r.range(0, 0.03), life = r.range(0.15, 0.32), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    let [x, y] = fly(0, -1, vx0, vy0, age, 260, 3.5);
    const [vx, vy] = flyV(vx0, vy0, age, 260, 3.5);
    y = Math.min(y, -1);
    const head = q < 0.3 ? WHITE : q < 0.65 ? C[N - 1] : C[N - 3];
    streak(p, x, y, vx, y >= -1 ? 0 : vy, clamp(Math.hypot(vx, vy) * 0.03, 1, 4), (u) => (u > 0.5 ? head : C[N - 3]));
    p.light(x, y, C[N - 2], 0.4 * (1 - q));
  });
  // the hit: a flat white flash pressed onto the floor
  if (t >= T && t < T + 0.07) {
    const s = t < T + 0.035 ? 1 : 0.5;
    rayStar(p, 0, -1, [
      { a: 0, len: 8 * s, w: 1.4 }, { a: Math.PI, len: 7 * s, w: 1.4 }, { a: -Math.PI / 2, len: 6 * s, w: 1.4 },
      { a: -Math.PI / 4, len: 4 * s, w: 0.4 }, { a: (-3 * Math.PI) / 4, len: 4 * s, w: 0.4 },
    ], (q) => (q < 0.5 ? WHITE : C[N - 1]));
    p.circle(0, -1, 2 * s, WHITE);
  }
  const L = t < T ? 0.4 : 1 - seg(t, T, 0.25);
  p.glow(0, -2, 18, C[N - 2], 0.4 * L * L);
  p.glow(0, -1, 5, C[N - 1], 0.5 * L);
}
