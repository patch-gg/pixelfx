import { ramp, at, cycle, ease, TAU, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Tractor beam",
  desc: "A hovering emitter fans a beam down to the floor; rungs of light climb it and loose rocks and grit tumble upward into the lens.",
  tags: ["scifi", "beam", "ufo", "abduct", "lift", "ground", "loop"],
  size: [64, 84],
  origin: [32, 79],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#04160e", "#0a2e1c", "#125232", "#1e8048", "#3cb862", "#86eaa0", "#dcffe4"], height: 70, seed: 27 },
};

const HULL = ramp(["#101018", "#1f1e2b", "#33313f", "#4c4a5c", "#706d84", "#9c99b0"]);
const ROCK = ramp(["#34352c", "#575645", "#7f7b62"]);
const ROCKS = [[".##", "###", "##."], ["##.", "###", ".#."], [".#.", "###", ".##"]];

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, H = o.height, D = meta.duration, ph = t / D;
  const top = -H + 4, hw = (y) => 6 + 14 * ((y - top) / -top); // the beam's half width at height y

  // the beam: soft light (light only) with a slow shimmer climbing it, hard edges
  p.shade(-21, top, 21, 0, (x, y, out) => {
    const w = hw(y);
    if (Math.abs(x) > w) return;
    out.l = C[4];
    out.k = 0.1 + 0.1 * (1 - Math.abs(x) / w) + 0.06 * Math.sin((y / 11) * TAU + ph * TAU * 3);
  });
  for (const s of [-1, 1]) p.line(s * 6, top, s * 20, 0, C[3]);
  // the lift: streaks of light running up the beam, faster as they near the lens
  cycle(t, D, 16, S + 1, (r) => r.range(0.7, 1.1), (age, life, r) => {
    const k = age / life, y = -2 - ease.inQuad(k) * (H - 10), x = r.range(-0.85, 0.85) * hw(y), L = 2 + 4 * k;
    p.line(x, y, x, y + L, k < 0.3 ? C[3] : k < 0.7 ? C[4] : C[5]);
  });

  // debris: lifted off the floor, drawn in, tumbling faster as it nears the lens
  cycle(t, D, 7, S, (r) => r.range(1.3, 1.9), (age, life, r, i) => {
    const k = age / life, e = ease.inQuad(k), x0 = r.range(-15, 15);
    const x = x0 * (1 - e * 0.85) + Math.sin(age * r.range(3, 6) + r.next() * TAU) * 1.5 * (1 - e);
    const y = -1 - e * (H - 8);
    const shape = ROCKS[(i + Math.floor(age * (3 + 9 * k))) % 3], small = i % 3 === 2;
    if (small) p.rect(x, y, 2, 2, at(ROCK, 0.7));
    else p.sprite(shape, { "#": at(ROCK, 0.4 + r.next() * 0.6) }, x - 1, y - 1);
    p.px(x, y - 1, C[5]); // lit by the beam on its upper edge
    if (k > 0.92) p.px(x, y, WHITE);
  });

  // where it meets the floor: a pool of light
  for (let j = 0; j < 40; j++) {
    const a = (j / 40) * TAU;
    if (Math.sin(a) < 0 && j % 2) continue;
    p.px(Math.cos(a) * 20, Math.sin(a) * 3, Math.sin(a) > 0 ? C[5] : C[3]);
  }
  p.glow(0, 0, 24, C[4], 0.25);

  // the emitter: a dark hull with a ring of blinking lights over a glowing lens
  const hy = -H;
  p.ellipse(0, hy + 1, 17, 4.5, (d, a) => (Math.sin(a) < 0 ? (d > 0.75 ? HULL[4] : HULL[3]) : d > 0.7 ? HULL[1] : HULL[2]));
  p.ellipse(0, hy - 2, 8, 3, (d, a) => (Math.sin(a) < -0.2 && d > 0.5 ? HULL[5] : HULL[3]));
  for (let j = 0; j < 5; j++) {
    const x = -12 + j * 6, on = (Math.floor(t * 10) + j) % 5 === 0;
    p.px(x, hy + 2, on ? WHITE : C[3]);
    if (on) p.light(x, hy + 2, C[5], 0.5);
  }
  p.ellipse(0, hy + 4, 6, 1.6, (d) => (d < 0.5 ? WHITE : C[5]));
  p.glow(0, hy + 4, 14, C[5], 0.45);
}
