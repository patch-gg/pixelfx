import { ramp, burst, fly, flyV, seg, ease, clamp, lerp, rng, rand, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, jagged } from "./_lib.js";

export const meta = {
  name: "Spark arc",
  desc: "A climbing arc between two rods: it snaps on at the narrow gap, rises as it stretches and bows, then tears apart at the top in a spray of sparks.",
  tags: ["lightning", "electric", "arc", "machine", "prop", "loop"],
  size: [48, 64],
  origin: [24, 61],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#140a30", "#2e1a78", "#5a38c8", "#8a70ff", "#bcb0ff", "#e8e2ff", "#ffffff"], seed: 10 },
};

const METAL = ramp(["#15131c", "#2c2936", "#4a4656", "#77718a", "#b4afc4"]);
const Y0 = -9, Y1 = -54, X0 = 2.5, X1 = 17, CLIMB = 0.95;
const rodX = (y) => lerp(X0, X1, (Y0 - y) / (Y0 - Y1));

// the arc at climb u: jagged between the rods, bowed upward by the hot air it rides
function arcAt(r, u) {
  const y = lerp(Y0 - 2, Y1 + 8, u), xr = rodX(y) - 0.5, bow = 1 + 7 * u;
  const pts = jagged(r, -xr, y, xr, y, { step: 4, amp: 1.2 + 1.6 * u });
  return pts.map(([x, yy]) => [x, yy - bow * Math.sin(Math.PI * clamp((x + xr) / (2 * xr)))]);
}

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, fi = Math.floor(t * 20);

  // the rods and their insulator base
  for (const s of [-1, 1]) {
    p.line(s * X0, Y0, s * X1, Y1, METAL[3]);
    p.line(s * (X0 + 1), Y0, s * (X1 + 1), Y1, METAL[1]);
    p.px(s * X1, Y1, METAL[4]);
  }
  p.rect(-9, -9, 18, 3, METAL[2]);
  p.rect(-8, -6, 16, 6, METAL[1]);
  p.rect(-9, -9, 18, 1, METAL[3]);
  for (const x of [-6, -2, 2, 6]) p.px(x, -4, METAL[0]);

  if (t < CLIMB) {
    const u = Math.pow(t / CLIMB, 1.6), pts = arcAt(rng(S, fi), u), snap = t < 0.05;
    // it starts fat and white-hot, and thins as it stretches
    zap(p, pts, snap ? WHITE : u > 0.85 ? C[5] : C[6], snap ? C[5] : u < 0.4 ? C[4] : u < 0.75 || fi % 2 ? C[3] : null);
    const [lx, ly] = pts[0], [rx, ry] = pts[pts.length - 1];
    p.px(lx, ly, WHITE), p.px(rx, ry, WHITE);
    glowPath(p, pts, 11, C[4], snap ? 0.7 : 0.4);
    if (snap) p.glow(0, Y0 - 2, 18, C[5], 0.6);
  } else {
    // the break: the arc tears at its peak and the halves whip back to the rods
    const k = seg(t, CLIMB, CLIMB + 0.1), pts = arcAt(rng(S, 999), 1), m = pts.length >> 1;
    if (k < 1) {
      const keep = Math.max(1, Math.round(m * (1 - ease.outQuad(k))));
      p.polyline(pts.slice(0, keep + 1), k < 0.4 ? C[6] : C[4]);
      p.polyline(pts.slice(pts.length - 1 - keep), k < 0.4 ? C[6] : C[4]);
      if (k < 0.35) p.circle(pts[m][0], pts[m][1], 3 - 6 * k, WHITE);
      glowPath(p, pts, 10, C[4], 0.4 * (1 - k));
    }
    burst(7, S + 3, (r) => {
      const age = t - CLIMB, life = r.range(0.16, 0.24);
      if (age > life) return;
      const a = -Math.PI / 2 + r.sign() * r.range(0.5, 1.4), sp = r.range(45, 85), vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
      const [x, y] = fly(pts[m][0], pts[m][1], vx0, vy0, age, 420, 1.5), [vx, vy] = flyV(vx0, vy0, age, 420, 1.5), q = age / life;
      p.line(x, y, x - vx * 0.025, y - vy * 0.025, q < 0.35 ? WHITE : q < 0.7 ? C[5] : C[3]);
      p.light(x, y, C[4], 0.4 * (1 - q));
    });
    // voltage builds again at the gap: little ticks of spark before the next arc
    if (t > 1.07 && rand(S, fi, 5) < 0.7) {
      const y = Y0 - 1 - rand(S, fi, 6) * 2, xr = rodX(y) - 0.5;
      p.polyline(jagged(rng(S, fi, 7), -xr, y, xr, y, { step: 2, amp: 1 }), C[4]);
      p.glow(0, y, 8, C[4], 0.35);
    }
  }
  p.glow(0, Y0 - 2, 10, C[3], 0.2);
}
