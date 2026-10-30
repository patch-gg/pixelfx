import { PAL, cycle, clamp, rng, rand, TAU, WHITE } from "../../core/index.js";
import { steps, glowPath, jagged } from "./_lib.js";

export const meta = {
  name: "Electrified",
  desc: "Static crawls over the body: short arcs jump between points on the silhouette, sparks spit off, and every so often the whole outline flares.",
  tags: ["lightning", "electric", "status", "shock", "debuff", "loop"],
  size: [40, 44],
  origin: [20, 40],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.volt, arcs: 3, seed: 13 },
};

const RATE = 15;
const rims = new WeakMap();

// points just outside the silhouette, with the outward direction at each
function rim(a) {
  let list = rims.get(a.mask);
  if (list) return list;
  const m = a.mask, inside = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.data[y * m.w + x];
  list = [];
  for (let y = -1; y <= m.h; y++)
    for (let x = -1; x <= m.w; x++) {
      if (inside(x, y)) continue;
      const nx = inside(x - 1, y) - inside(x + 1, y), ny = inside(x, y - 1) - inside(x, y + 1);
      if (nx || ny || inside(x - 1, y) || inside(x, y - 1)) list.push([a.x + x, a.y + y, nx, ny]);
    }
  rims.set(a.mask, list);
  return list;
}

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, a = o.actor, R = rim(a), beat = Math.floor(t * RATE);
  const fresh = t * RATE - beat < 0.5;
  // the flare: twice a cycle the whole body lights up for a frame, then just its outline for one more
  const flare = beat % 9 === 4 ? (fresh ? 2 : 1) : 0;
  if (flare === 2) p.mask(a.mask, a.x, a.y, C[5]);
  if (flare) p.outline(a.mask, a.x, a.y, flare === 2 ? WHITE : C[5]);
  // arcs: each beat a few short zigzags hop between two points on the rim, bowing out from the body
  for (let i = 0; i < o.arcs; i++) {
    const r = rng(S, beat, i), A = R[Math.floor(r.next() * R.length)];
    let best = null;
    for (let k = 0; k < 6; k++) {
      const B = R[Math.floor(r.next() * R.length)], d = Math.hypot(B[0] - A[0], B[1] - A[1]);
      if (d >= 5 && d <= 12) { best = B; break; }
    }
    if (!best) continue;
    const pts = jagged(r, A[0], A[1], best[0], best[1], { step: 2.5, amp: 1.6 });
    const nx = (A[2] + best[2]) * 0.6, ny = (A[3] + best[3]) * 0.6;
    const bowed = pts.map(([x, y], j) => {
      const s = Math.sin((Math.PI * j) / (pts.length - 1));
      return [x + nx * s * 2, y + ny * s * 2];
    });
    p.polyline(bowed, fresh ? WHITE : C[5]);
    if (fresh) for (const [x, y] of [bowed[0], bowed[bowed.length - 1]]) p.px(x, y, C[6]);
    glowPath(p, bowed, 6, C[4], fresh ? 0.35 : 0.2, 2);
  }
  // sparks spit off the rim and fall
  cycle(t, meta.duration, 10, S + 5, (r) => r.range(0.12, 0.22), (age, life, r) => {
    const P = R[Math.floor(r.next() * R.length)], k = age / life;
    const vx = (P[2] || r.range(-1, 1)) * r.range(30, 60), vy = (P[3] || 0) * 30 - r.range(20, 50);
    const x = P[0] + vx * age, y = P[1] + vy * age + 200 * age * age;
    if (y > 0) return;
    p.line(x, y, x - vx * 0.03, y - vy * 0.03, k < 0.5 ? WHITE : C[4]);
  });
  // a jittery glow that never settles
  const j = 0.75 + 0.25 * rand(S, beat, 9);
  p.glow(a.chest[0], a.chest[1] - 1, 20, C[4], (flare ? 0.32 : 0.18) * j);
}
