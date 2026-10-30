import { PAL, ramp, fit, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { swing } from "./_lib.js";

export const meta = {
  name: "Axe chop",
  desc: "A short, heavy chop: a thick steel arc drops in front of the fighter, bites with a thunk and a flash, and wood chips tumble out of the cut.",
  tags: ["melee", "chop", "axe", "heavy", "wood", "combat", "directional", "one-shot"],
  size: [68, 54],
  origin: [16, 46],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.metal, chips: PAL.wood, radius: 20, seed: 9 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), W = fit(o.chips, 7), R = o.radius, S = o.seed, top = C.length - 1;
  const cx = 5, cy = -15, A0 = -1.35, A1 = 0.38, HIT = 0.1;
  const hx = cx + Math.cos(A1) * (R - 3), hy = cy + Math.sin(A1) * (R - 3); // where the bit sinks in
  // it drops faster and faster, stops dead in the cut, then the smear lets go
  const lead = ease.inQuad(seg(t + 0.03, 0, HIT + 0.03)), tail = ease.inCubic(seg(t, 0.06, 0.24));
  swing(p, { cx, cy, r: R, w: 10, from: A0, to: A1, lead, tail, C, rimAt: 0.78, fade: seg(t, HIT + 0.04, 0.24) });
  if (t < 0.24) {
    const la = A0 + (A1 - A0) * lead;
    p.glow(cx + Math.cos(la) * (R - 4), cy + Math.sin(la) * (R - 4), 12, C[top - 3], 0.3 * (1 - seg(t, HIT, 0.24)));
  }
  const q = t - HIT;
  if (q < 0) return;
  // the bite: a white wedge for a frame, then a notch that cools
  if (q < 0.1) {
    const hot = q < 0.034, s = hot ? 1 : 0.7;
    p.tri(hx - 7 * s, hy - 5 * s, hx + 4 * s, hy + 1, hx - 4 * s, hy + 6 * s, hot ? WHITE : C[top - 1]);
    if (hot) for (const [dx, dy] of [[6, -6], [8, -1], [6, 4]]) p.line(hx + dx * 0.5, hy + dy * 0.5, hx + dx * 1.3, hy + dy * 1.3, C[top - 1]);
  }
  p.glow(hx, hy, 18, C[top - 2], 0.45 * Math.pow(1 - seg(q, 0, 0.2), 2));
  p.glow(hx, hy, 5, WHITE, 0.5 * (1 - seg(q, 0, 0.08)));
  // wood chips spat out of the cut: up and away, a few back, tumbling, falling to the floor
  burst(9, S, (r, i) => {
    const a = -Math.PI / 2 + (i < 2 ? r.range(-1.3, -0.6) : r.range(-0.3, 1.2)), sp = r.range(55, 105);
    const life = r.range(0.32, 0.46), born = r.range(0, 0.03), age = q - born;
    if (age < 0 || age > life) return;
    const [x, y] = fly(hx, hy - 1, Math.cos(a) * sp, Math.sin(a) * sp, age, 330, 0.8);
    if (y > 0) return;
    const spin = Math.floor(age * r.range(18, 30) + i) % 4, big = i % 3 !== 2, n = W.length;
    const lit = W[n - 1], mid = W[n - 2], dark = W[n - 4];
    if (spin % 2 === 0) p.rect(x, y, big ? 3 : 2, 1, spin ? mid : lit), big && p.px(x, y + 1, dark);
    else p.rect(x, y, 1, big ? 3 : 2, spin === 1 ? lit : mid), big && p.px(x + 1, y + 1, dark);
  });
  // sparks off the edge
  burst(5, S + 1, (r) => {
    const a = r.range(-1.6, 0.4), sp = r.range(70, 130), life = r.range(0.12, 0.2);
    if (q > life) return;
    const [x, y] = fly(hx, hy, Math.cos(a) * sp, Math.sin(a) * sp, q, 200, 4), k = q / life;
    p.px(x, y, k < 0.5 ? WHITE : C[top - 1]);
    p.light(x, y, C[top - 2], 0.5 * (1 - k));
  });
  // a little sawdust drifting down
  burst(6, S + 2, (r) => {
    const born = r.range(0.02, 0.1), age = q - born, life = r.range(0.3, 0.45);
    if (age < 0 || age > life) return;
    const x = hx + r.range(-4, 3) + Math.sin(age * 9 + r.next() * 6) * 1.5, y = hy + r.range(-3, 2) + age * r.range(14, 26);
    p.dot(x, y, W[W.length - 2], clamp(1.6 - age / life * 1.6));
  });
}
