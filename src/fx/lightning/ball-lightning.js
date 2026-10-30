import { PAL, rand, rng, TAU, WHITE } from "../../core/index.js";
import { steps, glowPath, jagged } from "./_lib.js";

export const meta = {
  name: "Ball lightning",
  desc: "A fizzing ball of charge drifts on a wandering path, trailing a fading wake, its shell spitting little arcs and now and then a long lash.",
  tags: ["lightning", "electric", "orb", "wisp", "ambient", "loop"],
  size: [64, 48],
  origin: [32, 24],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.cyber, radius: 4, seed: 15 },
};

const RATE = 15;
// a wandering closed path: whole numbers of turns per loop, so it comes back to where it started
const path = (ph) => [
  18 * Math.sin(ph * TAU + 0.4) + 4 * Math.sin(ph * TAU * 3),
  6 * Math.sin(ph * TAU * 2) + 3 * Math.cos(ph * TAU * 3 + 1),
];

export function draw(p, t, o) {
  const C = steps(o.palette, 8), S = o.seed, D = meta.duration, ph = t / D, R = o.radius;
  const beat = Math.floor(t * RATE), fresh = t * RATE - beat < 0.5;
  const [x, y] = path(ph);

  // the wake: where it has been, cooling and thinning out
  for (let i = 9; i >= 1; i--) {
    const [tx, ty] = path(ph - i * 0.012), k = i / 9;
    p.circle(tx, ty, R * (1 - k * 0.75), k < 0.35 ? C[4] : k < 0.7 ? C[3] : C[2], k < 0.6 ? 1 : 0.6);
  }

  // shell arcs: short kinks jumping off the surface, new ones each beat
  for (let i = 0; i < 4; i++) {
    const r = rng(S, beat, i), a = r.range(0, TAU), b = a + r.range(0.6, 1.5) * r.sign();
    const l = R + r.range(2, 5);
    const pts = jagged(r, x + Math.cos(a) * R, y + Math.sin(a) * R, x + Math.cos(b) * l, y + Math.sin(b) * l, { step: 2.5, amp: 1.4 });
    p.polyline(pts, fresh ? C[6] : C[5]);
  }
  // now and then a long lash out into the air
  if (rand(S, beat, 7) < 0.2) {
    const r = rng(S, beat, 8), a = r.range(0, TAU), l = r.range(12, 18);
    const ex = Math.max(-28, Math.min(28, x + Math.cos(a) * l)), ey = Math.max(-20, Math.min(20, y + Math.sin(a) * l * 0.7));
    const pts = jagged(r, x, y, ex, ey, { step: 3.5, amp: 2.2 });
    p.polyline(pts, fresh ? WHITE : C[5]);
    glowPath(p, pts, 6, C[5], 0.3, 2);
  }

  // the ball: a hot core in a shimmering shell that never sits still
  const wob = 0.4 * (rand(S, beat, 3) - 0.5);
  p.circle(x, y, R + 0.5 + wob, (d, a) => (d > 0.82 ? (Math.sin(a * 3 + beat) > 0 ? C[5] : C[4]) : d > 0.5 ? C[6] : WHITE));
  p.px(x - 1, y - 1, WHITE);

  const fl = 0.85 + 0.15 * rand(S, beat, 5);
  p.glow(x, y, 22, C[4], 0.38 * fl);
  p.glow(x, y, 7, C[6], 0.45 * fl);
}
