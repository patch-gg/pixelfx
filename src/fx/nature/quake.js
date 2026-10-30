import { PAL, ramp, burst, fly, seg, ease, clamp, rand, hex } from "../../core/index.js";

export const meta = {
  name: "Quake",
  desc: "Three jolts: a crack tears along the floor both ways, slabs of ground jump and slam down, pebbles bounce and dust rises along the rift; then it settles.",
  tags: ["nature", "earth", "quake", "earthquake", "crack", "area", "ground", "one-shot"],
  size: [112, 44],
  origin: [56, 30],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.earth, width: 48, seed: 47 },
};

const DUST = ["#2e2620", "#4e4236", "#76664f", "#a08c6c"].map(hex);
const JOLTS = [0.0, 0.32, 0.62];

// the rift: a jagged path along the floor from the center outward, one per side
function rift(S, side, W) {
  const pts = [[0, 0]];
  let x = 0;
  for (let i = 0; x * side < W; i++) {
    x += side * (2 + rand(S, i, side + 7) * 3);
    pts.push([x, Math.round(rand(S, i, side + 9) * 2)]);
  }
  return pts;
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, W = o.width;
  const jolt = JOLTS.reduce((m, j) => (t >= j ? j : m), 0), ja = t - jolt, n = JOLTS.filter((j) => t >= j).length;
  const settle = 1 - seg(t, 1.15, 1.48);
  // how far the rift has torn: a step further each jolt
  const reach = W * (0.35 + 0.65 * ease.outCubic(seg(t, 0, 0.8)));
  for (const side of [-1, 1]) {
    const pts = rift(S, side, W);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      if (Math.abs(x1) > reach) break;
      // the gap: black in the middle, a lit lip above, closing up as it settles
      p.line(x0, y0, x1, y1, C[0], settle);
      p.line(x0, y0 + 1, x1, y1 + 1, C[0], settle * (i < 6 ? 1 : 0.5));
      p.line(x0, y0 - 1, x1, y1 - 1, C[4], settle * 0.75);
      // branches down the face of the floor
      if (i % 3 === 0) p.line(x1, y1 + 1, x1 + side * 2, y1 + 4 + (i % 2), C[0], settle);
    }
  }
  // the heave: each jolt sends a wave out from the center that throws the floor tiles up as it passes
  for (let x = -W; x <= W; x += 6) {
    let lift = 0;
    JOLTS.forEach((j, k) => {
      const at = j + Math.abs(x) / 160, q = (t - at) / 0.16;
      if (q > 0 && q < 1) lift = Math.max(lift, Math.sin(q * Math.PI) * (4 + k * 1.5) * (1 - Math.abs(x) / (W * 1.3)));
    });
    if (lift < 0.6 || Math.abs(x) > reach + 4) continue;
    const r = rand(S, x, 5), tilt = (r - 0.5) * lift * 0.5, w = 6, y = -lift;
    p.rect(x - w / 2, 0, w, 2, C[0]); // the hole it left
    p.poly([[x - w / 2, y + tilt], [x + w / 2, y - tilt], [x + w / 2, y - tilt + 3], [x - w / 2, y + tilt + 3]], (px, py) =>
      py < Math.min(y + tilt, y - tilt) + 1.2 ? C[5] : px > x + w / 2 - 1.2 ? C[2] : C[3]);
  }
  // pebbles: bounce up on every jolt
  burst(16, S + 2, (r, i) => {
    const x0 = r.range(-reach, reach), vx = r.range(-20, 20), vy = -r.range(45, 95) * (0.6 + 0.4 * (n / 3)), g = 420;
    const air = (-2 * vy) / g;
    if (ja > air || t > 1.4) return;
    const [x, y] = fly(x0, 0, vx, vy, ja, g);
    const s = i % 4 === 0 ? 2 : 1;
    p.rect(x, y - s, s, s, C[r.int(3, 5)]);
  });
  // dust kicked up along the rift each jolt, lifting and shrinking away
  for (let j = 0; j < JOLTS.length; j++) {
    const da = t - JOLTS[j];
    if (da < 0) continue;
    const span = W * (0.35 + 0.65 * ease.outCubic(seg(JOLTS[j] + 0.1, 0, 0.8)));
    burst(6, S + 10 + j, (r, i) => {
      const x0 = ((i + r.next()) / 6 * 2 - 1) * span, life = r.range(0.45, 0.7), q = (da - Math.abs(x0) / 160) / life;
      if (q <= 0 || q >= 1) return;
      const x = x0 + q * r.range(-5, 5), y = -2 - ease.outQuad(q) * r.range(5, 11);
      const rad = r.range(2.5, 4.2) * (0.7 + 0.5 * ease.outQuad(Math.min(1, q * 3))) * (1 - ease.inQuad(q) * 0.9) * settle;
      p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.3 ? DUST[3] : d < 0.85 ? DUST[2] : DUST[1]));
    });
  }
}
