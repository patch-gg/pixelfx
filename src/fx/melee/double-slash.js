import { PAL, ramp, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { cut, glint } from "./_lib.js";

export const meta = {
  name: "Double slash",
  desc: "Two quick cuts cross in an X in front of the fighter: down, then up, a white flash where they meet, then the X dissolves.",
  tags: ["melee", "slash", "sword", "combo", "combat", "directional", "one-shot"],
  size: [64, 52],
  origin: [16, 40],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.neon, size: 1, seed: 3 },
};

// a point on a cut's bowed center line, u 0..1
const along = (c, u) => {
  const dx = c.x1 - c.x0, dy = c.y1 - c.y0, L = Math.hypot(dx, dy), s = Math.sign(c.bulge), m = Math.abs(c.bulge) * 0.8 * 4 * u * (1 - u);
  return [c.x0 + dx * u + (dy / L) * s * m, c.y0 + dy * u - (dx / L) * s * m];
};

export function draw(p, t, o) {
  const C = ramp(o.palette), k = o.size, S = o.seed, top = C.length - 1;
  const X = 20 * k, Y = -13 * k, h = 14 * k; // the X's center and half its span
  const cuts = [
    { x0: X - h, y0: Y - h, x1: X + h, y1: Y + h, bulge: 4 * k, t0: -0.015 }, // down
    { x0: X - h, y0: Y + h, x1: X + h, y1: Y - h, bulge: -4 * k, t0: 0.11 },  // up
  ];
  // where the two bowed lines really cross
  let cx = X, cy = Y, best = Infinity;
  for (let i = 0; i <= 40; i++)
    for (let j = 0; j <= 40; j++) {
      const [ax, ay] = along(cuts[0], i / 40), [bx, by] = along(cuts[1], j / 40), d = (ax - bx) ** 2 + (ay - by) ** 2;
      if (d < best) (best = d), (cx = (ax + bx) / 2), (cy = (ay + by) / 2);
    }
  const T2 = cuts[1].t0 + 0.07; // the second cut lands: the hero frame
  const hot = t >= T2 && t < T2 + 0.034;
  for (const c of cuts) {
    const q = t - c.t0;
    if (q < 0) continue;
    const lead = ease.outQuart(seg(q, 0, 0.07)), tail = ease.inCubic(seg(q, 0.015, 0.15));
    cut(p, c.x0, c.y0, c.x1, c.y1, { bulge: c.bulge, w: 7 * k, lead, tail, C, rim: WHITE });
    // the line it leaves in the air: a thin scar that holds, flashes white when the X closes, then shrinks to the middle
    const scar = seg(q, 0.06, 0.1) * (1 - seg(t, 0.3, 0.46));
    if (scar <= 0) continue;
    const L = Math.hypot(c.x1 - c.x0, c.y1 - c.y0);
    for (let i = 0; i <= L * 1.5; i++) {
      const u = i / (L * 1.5), [x, y] = along(c, u), keep = Math.sin(Math.PI * u) - (1 - scar) * 1.05;
      if (keep <= 0) continue;
      if (hot) {
        p.px(x, y, WHITE), p.px(x + 1, y, WHITE);
        continue;
      }
      p.dot(x, y, keep > 0.4 ? C[top - 1] : C[top - 3], clamp(keep * 4));
    }
  }
  // the crossing: a white burst the frame the X closes, then a twinkle that shrinks
  const fl = t >= T2 ? 1 - seg(t, T2, T2 + 0.16) : 0;
  if (fl > 0) {
    glint(p, cx, cy, Math.round(1 + 6 * ease.outCubic(fl)), hot ? WHITE : C[top - 2]);
    if (hot) p.circle(cx, cy, 3 * k, WHITE);
    p.glow(cx, cy, 20 * k, C[top - 3], 0.5 * fl * fl);
  }
  // sparks thrown from the crossing
  burst(9, S, (r) => {
    const age = t - T2 - r.range(0, 0.03), life = r.range(0.12, 0.24);
    if (age < 0 || age > life) return;
    const a = r.range(0, Math.PI * 2), sp = r.range(50, 100) * k;
    const [x, y] = fly(cx, cy, Math.cos(a) * sp, Math.sin(a) * sp, age, 110, 6), q = age / life;
    p.px(x, y, q < 0.4 ? WHITE : q < 0.75 ? C[top - 2] : C[top - 4]);
    p.light(x, y, C[top - 3], 0.4 * (1 - q));
  });
  // the edge light rides each cut as it passes
  for (const c of cuts) {
    const q = t - c.t0;
    if (q < 0.005 || q > 0.16) continue;
    const [x, y] = along(c, ease.outQuart(seg(q, 0, 0.07)));
    p.glow(x, y, 14 * k, C[top - 3], 0.4 * (1 - seg(q, 0.05, 0.16)));
  }
}
