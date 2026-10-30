import { PAL, ramp, burst, fly, seg, ease, clamp, lerp, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Boulder",
  desc: "A boulder is hurled right in a high arc, spinning, speed lines behind it; it slams into the floor and bursts into tumbling chunks and a cloud of dust.",
  tags: ["nature", "earth", "rock", "projectile", "throw", "directional", "one-shot"],
  size: [104, 60],
  origin: [14, 52],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.stone, distance: 60, size: 7, seed: 43 },
};

const DUST = ["#2c2a32", "#47444f", "#6a6672", "#928e99"].map(hex);
const FLIGHT = 0.42;

// the flight: from the hand (0, -16) up over a hump and down onto the floor at x = distance
function pos(t, o) {
  const k = clamp(t / FLIGHT), R = o.size;
  const x = o.distance * k, y = lerp(-16, -R, k) - Math.sin(k * Math.PI) * 18;
  return [x, y];
}

// a lumpy rock lit from the top left; the cracks turn with its spin
function rock(p, C, x, y, R, spin) {
  p.shade(x - R - 1, y - R - 1, x + R + 1, y + R + 1, (px, py) => {
    const dx = px - x, dy = py - y, a = Math.atan2(dy, dx);
    const lump = R * (1 + 0.1 * Math.sin(a * 3 + spin) + 0.06 * Math.sin(a * 5 - spin * 2));
    const d = Math.hypot(dx, dy);
    if (d > lump) return;
    if (d > lump - 1) return dy + dx * 0.3 > 0 ? C[1] : C[3];
    const lit = (-dx * 0.7 - dy) / R, crack = Math.abs(Math.sin(a * 2 + spin) * d - 1.2) < 0.5 && d > 1.5 && d < lump - 1.5;
    if (crack) return C[2];
    return lit > 0.6 ? C[6] : lit > 0.1 ? C[5] : lit > -0.4 ? C[4] : C[3];
  });
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, R = o.size, D = o.distance;
  if (t < FLIGHT) {
    const [x, y] = pos(t, o);
    // speed lines trailing behind, along the path
    for (let i = 0; i < 3; i++) {
      const [tx, ty] = pos(Math.max(0, t - 0.06 - (i % 2) * 0.03), o), [bx, by] = pos(Math.max(0, t - 0.02), o);
      const nx = -(by - ty), ny = bx - tx, l = Math.hypot(nx, ny) || 1, off = (i - 1) * 3.5;
      if (t > 0.04) p.line(tx + (nx / l) * off, ty + (ny / l) * off, bx + (nx / l) * off * 0.8, by + (ny / l) * off * 0.8, i === 1 ? C[6] : C[4]);
    }
    rock(p, C, x, y, R, t * 24);
    return;
  }
  const a = t - FLIGHT, gx = D, gy = 0;
  // impact: a white frame, a dent in the floor, the glow drops fast
  if (a < 0.07) {
    rock(p, C, gx, -R * 0.7, R * 1.15, 10);
    p.ellipse(gx, -R * 0.5, R + 4, R * 0.9, C[7], (d) => (d > 0.75 ? 1 : 0));
    p.glow(gx, -R * 0.5, 30, C[6], 0.45);
  }
  const crack = 1 - seg(a, 0.6, 0.85);
  if (crack > 0) {
    p.line(gx - 9, 0, gx + 9, 0, C[0], crack);
    p.line(gx - 3, 1, gx - 6, 2, C[0], crack);
    p.line(gx + 3, 1, gx + 7, 2, C[0], crack);
  }
  // dust: puffs that roll out low along the floor and lift
  burst(9, S, (r, i) => {
    const life = r.range(0.5, 0.8), q = a / life;
    if (q >= 1) return;
    const side = i % 3 === 0 ? -1 : 1, e = ease.outCubic(Math.min(1, q * 1.8));
    const x = gx + side * r.range(3, 20) * e, y = -2 - r.range(1, 8) * e - q * 4;
    const rad = r.range(2.5, 5) * (0.6 + 0.6 * e) * (1 - 0.9 * ease.inQuad(q));
    p.circle(x, y, rad, (d, an) => (d < 0.5 && an < -0.3 ? DUST[3] : d < 0.85 ? DUST[2] : DUST[1]));
  });
  // chunks: the rock splits and its pieces bounce on forward, tumbling
  burst(7, S + 1, (r, i) => {
    const life = r.range(0.55, 0.8);
    if (a > life) return;
    const vx = r.range(-35, 48), vy = -r.range(50, 105), s = r.range(2, 3.6), g = 340;
    // one bounce: after landing it hops again, lower
    const t1 = (-2 * vy) / g;
    let x, y;
    if (a < t1) [x, y] = fly(gx, -s, vx, vy, a, g);
    else [x, y] = fly(gx + vx * t1, -s, vx * 0.6, vy * 0.35, a - t1, g);
    if (y > -s) y = -s;
    const sz = s * (1 - ease.inQuad(seg(a, life * 0.6, life)));
    if (sz > 0.6) p.circle(x, y, sz, (d, an) => (an < -0.6 && an > -2.6 && d > 0.3 ? C[5] : d > 0.7 ? C[2] : C[3]));
  });
  // gravel: little bits sprayed out
  burst(12, S + 2, (r) => {
    const life = r.range(0.3, 0.5);
    if (a > life) return;
    const ang = -Math.PI / 2 + r.range(-1.2, 1), sp = r.range(45, 95);
    const [x, y] = fly(gx, -3, Math.cos(ang) * sp, Math.sin(ang) * sp, a, 360);
    if (y < 0) p.px(x, y, C[r.int(3, 6)]);
  });
}
