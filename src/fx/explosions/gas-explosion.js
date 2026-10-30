import { PAL, RAMP, ramp, at, seg, ease, clamp, noise2, WHITE } from "../../core/index.js";
import { fit, hot, billow, sparks, pool } from "./_lib.js";

export const meta = {
  name: "Gas explosion",
  desc: "A spark finds the gas: a whoosh of fire rolls out sideways along the floor, a curling front racing right, burning out behind itself into rising smoke.",
  tags: ["explosion", "gas", "whoosh", "fire", "ground", "directional", "one-shot"],
  size: [144, 80],
  origin: [12, 70],
  duration: 1.7,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, reach: 96, seed: 34 },
};

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, R = o.reach, FIRE = hot(F);
  const T0 = 0.06, T1 = 0.62; // the front sets off, and arrives
  // the spark that sets it off
  if (t < T0 + 0.02) {
    p.px(0, -2, WHITE), p.px(1, -3, F[6]), p.px(-1, -3, F[6]);
    p.glow(0, -2, 10, F[5], 0.6);
  }
  // puffs along the path: each catches as the front reaches it, rolls on a little, rises, cools to smoke
  const fire = [], smoke = [];
  // two rows of puffs: a low rolling carpet, and a taller, later crest that curls over at the front
  const N = 26;
  for (let i = 0; i < N; i++) {
    const crest = i % 2 === 1, u = (Math.floor(i / 2) + (crest ? 0.75 : 0.25)) / (N / 2), x0 = u * R;
    const born = T0 + (T1 - T0) * (1 - Math.cbrt(1 - u)) + (crest ? 0.03 : 0), age = t - born;
    if (age < 0) continue;
    const r = rng2(S, i), L = r[0] * 0.3 + (crest ? 0.8 : 0.65), q = age / L;
    if (q >= 1) continue;
    const big = (crest ? 4.5 : 3.5) + 4 * u + r[1] * 1.5, rad = big * (0.45 + 0.75 * ease.outCubic(seg(age, 0, 0.25)));
    const x = x0 + 9 * ease.outCubic(seg(age, 0, 0.5)) * (0.6 + u), y = -rad * (crest ? 1.5 : 0.7) - age * age * (crest ? 22 : 12);
    fire.push({ x, y, r: rad * (1 - 0.4 * seg(q, 0.12, 0.5)), v: 1 - seg(q, 0.04, 0.45), roll: x / Math.max(3, rad), id: i });
    smoke.push({ x: x + q * 3, y: y - q * q * 12, r: rad * (1.1 + 0.5 * q), v: seg(q, 0.12, 0.35) * (1 - seg(q, 0.6, 1)), roll: x / Math.max(3, rad), id: i });
  }
  const tex = (x, y, f) => {
    const dx = x - f.x, dy = y - f.y, c = Math.cos(f.roll), s = Math.sin(f.roll);
    return noise2((dx * c - dy * s) * 0.45 + f.id * 7.3, (dx * s + dy * c) * 0.45, S);
  };
  billow(p, smoke, (v, lit, x, y, out, f) => {
    if (v < 0.06) return;
    out.a = clamp(v * 4);
    return at(SM.slice(1, 6), 0.2 + lit * 0.3 + v * 0.35 + tex(x, y, f) * 0.14);
  });
  // the fire rolls: its texture turns with the distance each puff has travelled
  billow(p, fire, (v, lit, x, y, out, f) => {
    if (v < 0.08) return;
    out.k = v * 0.25;
    return at(FIRE, v * 0.95 + lit * 0.12 + tex(x, y, f) * 0.16);
  });
  // sparks flung ahead of the front
  const front = R * ease.outCubic(seg(t, T0, T1));
  sparks(p, t, 16, S + 2, [F[7], F[5], F[3]], { floor: 0, x: 6, y: -4, t0: T0, a: -0.35, spread: 0.45, sp: [120, 190], life: [0.35, 0.6], g: 160, drag: 2 });
  const L = 1 - seg(t, T1 - 0.1, T1 + 0.6);
  if (t > T0) {
    p.glow(front * 0.8, -10, 40, F[5], 0.4 * L);
    pool(p, front * 0.55, 0, front * 0.6 + 14, 5, F[4], 0.45 * L);
  }
}

function rng2(seed, i) {
  const a = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453, b = Math.sin(seed * 39.3468 + i * 11.135) * 24634.6345;
  return [a - Math.floor(a), b - Math.floor(b)];
}
