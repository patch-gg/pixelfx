import { RAMP, ramp, at, stream, fly, rand, seg, ease, WHITE } from "../../core/index.js";
import { puffs, onCanvas } from "./_lib.js";

export const meta = {
  name: "Signal flare",
  desc: "A flare streaks up on a thin smoke trail, bursts into a blinding red star at the top, then sinks slowly, dripping sparks under a column of smoke.",
  tags: ["projectile", "flare", "signal", "light", "smoke", "one-shot"],
  size: [64, 104],
  origin: [10, 98],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "sky",
  options: { palette: ["#2a0610", "#5c0c1a", "#9c1424", "#e0242c", "#ff5a4a", "#ffa08a", "#ffe0d4", "#ffffff"], seed: 11 },
};

const T1 = 0.7, T2 = 2.3, T3 = 2.55; // ignite at the top, start to gutter, out

/** Where the flare is at time t. */
function at_(t) {
  if (t < T1) {
    const u = seg(t, 0, T1);
    return [28 * ease.outSine(u), -74 * ease.outQuad(u)];
  }
  const s = t - T1;
  return [28 + Math.sin(s * 2.6) * 2.5 + s * 3, -74 + s * 13];
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, inside = onCanvas(meta, 1);
  // smoke: a thin trail on the way up, then a column left hanging as the flare sinks away from it
  const list = [];
  stream(t, 0.02, T1, 50, S, (r) => r.range(0.45, 0.65), (age, life, r, i) => {
    const [x, y] = at_(0.02 + i / 50), k = age / life;
    list.push({ x: x + age * 3, y: y + 2, r: 0.8 + k * 1.6, v: (1 - k) * 0.85 });
  });
  stream(t, T1 + 0.05, T2 - 0.1, 16, S + 1, (r) => r.range(0.8, 1.05), (age, life, r, i) => {
    const [x, y] = at_(T1 + 0.05 + i / 16), k = age / life;
    list.push({ x: x + age * r.range(3, 7), y: y - 3 - age * r.range(5, 9), r: 2 + k * r.range(3.5, 5.5), v: (1 - k) ** 1.2 * 0.95, tone: -0.08 });
  });
  if (t < 0.5) list.push({ x: 1 + t * 6, y: -2 - t * 10, r: 2 + t * 5, v: 1 - t / 0.5 });
  puffs(p, list, RAMP.smoke, { base: 0.58, inside });
  const [x, y] = at_(Math.min(t, T3));
  // sparks dripping off the burning flare
  stream(t, T1, T2, 34, S + 2, (r) => r.range(0.35, 0.6), (age, life, r, i) => {
    const [x0, y0] = at_(T1 + i / 34), k = age / life, vx = r.range(-16, 16), vy = r.range(-14, 4);
    const [sx, sy] = fly(x0, y0 + 1, vx, vy, age, 90, 1), [qx, qy] = fly(x0, y0 + 1, vx, vy, Math.max(0, age - 0.03), 90, 1);
    if (!inside(sx, sy) || !inside(qx, qy) || (k > 0.6 && Math.floor(age * 30 + r.next() * 3) % 3 === 0)) return;
    p.line(qx, qy, sx, sy, k < 0.3 ? at(C, 0.85) : k < 0.65 ? at(C, 0.62) : at(C, 0.42));
  });
  if (t < T1) {
    // climbing: a hot little streak
    const [px0, py0] = at_(Math.max(0, t - 0.03));
    p.line(px0, py0, x, y, (u) => (u > 0.5 ? WHITE : at(C, 0.7)));
    p.glow(x, y, 9, at(C, 0.6), 0.4);
    return;
  }
  if (t >= T3) return;
  // burning: a white star in a red flame that flickers every frame, gutters at the end
  const life = 1 - seg(t, T2, T3), fl = rand(S, Math.floor(t * 30));
  const R = (2.6 + fl * 1.2) * (0.35 + 0.65 * life);
  p.circle(x, y + 0.5, R + 1.4, at(C, 0.5), life > 0.5 ? 1 : 0.5);
  p.circle(x, y + 0.5, R, at(C, 0.7));
  if (life > 0.3) p.circle(x, y + 0.5, R * 0.55, WHITE);
  // the ignition: a four-point burst for the first moments at the top
  const pop = 1 - seg(t, T1, T1 + 0.22);
  if (pop > 0) {
    const L = 3 + 10 * ease.outCubic(seg(t, T1, T1 + 0.05)) * pop;
    p.line(x - L, y, x + L, y, (u) => (Math.abs(u - 0.5) < 0.2 ? WHITE : at(C, 0.75)));
    p.line(x, y - L, x, y + L, (u) => (Math.abs(u - 0.5) < 0.2 ? WHITE : at(C, 0.75)));
    p.glow(x, y, 20, WHITE, 0.4 * pop);
  }
  // light: a big red pool that breathes with the flicker
  const k = life * (0.85 + 0.15 * fl);
  p.glow(x, y, 34, at(C, 0.55), 0.45 * k);
  p.glow(x, y, 9, at(C, 0.85), 0.45 * k);
}
