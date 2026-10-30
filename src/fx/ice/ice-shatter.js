import { PAL, burst, rng, seg, ease, bolt, TAU, WHITE } from "../../core/index.js";
import { fit, shard, shardPts, glint } from "./_lib.js";

export const meta = {
  name: "Ice shatter",
  desc: "A block of ice cracks, shudders and bursts: a white frame, then shards spin out, bounce once on the floor and skid to nothing in a haze of ice dust.",
  tags: ["ice", "shatter", "break", "destroy", "crystal", "one-shot"],
  size: [96, 56],
  origin: [48, 48],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, size: 1, seed: 24 },
};

const BREAK = 0.2, G = 420, BW = 8, BH = 15, D = 4; // block half-width, height, depth of its top face

// where a shard is after t seconds: thrown from (x, y), one bounce off the floor, then a skid
function toss(x, y, vx, vy, t) {
  const tl = (-vy + Math.sqrt(vy * vy - 2 * G * y)) / G;
  if (t < tl) return [x + vx * t, y + vy * t + 0.5 * G * t * t, false];
  const b = t - tl, ux = vx * 0.55, uy = -(vy + G * tl) * 0.3, t2 = (-2 * uy) / G;
  if (b < t2) return [x + vx * tl + ux * b, uy * b + 0.5 * G * b * b, true];
  const s = b - t2, x2 = x + vx * tl + ux * t2;
  return [x2 + ux * 0.25 * (1 - Math.exp(-6 * s)), 0, true];
}

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, k = o.size;
  if (t < BREAK) {
    // the block: a lit top, a clear front with streaks, a dark side; cracks spread and it shudders
    const c = seg(t, 0.04, BREAK), j = t > 0.1 ? (Math.floor(t * 60) % 2 ? 1 : -1) : 0;
    const x0 = -BW * k + j, x1 = BW * k - 1 + j, top = -BH * k;
    p.rect(x0, top, x1 - x0 + 1, -top, I[5]);
    p.poly([[x0, top], [x0 + D, top - D], [x1 + 1 + D, top - D], [x1 + 1, top]], I[6]);
    p.poly([[x1 + 1, top], [x1 + 1 + D, top - D], [x1 + 1 + D, -D], [x1 + 1, 0]], I[3]);
    p.line(x0, top, x1, top, I[7]);
    p.line(x0, top, x0, -1, I[6]);
    p.line(x1, top + 1, x1, -1, I[4]);
    p.line(x0, -1, x1, -1, I[4]);
    for (const [a, b] of [[3, 3], [6, 5]]) p.line(x0 + a, top + 2, x0 + a - b + 1, top + 2 + b * 1.3, I[7]);
    p.rect(x0 + 2, top + 4, x1 - x0 - 4, -top - 6, I[4]);
    if (c > 0) {
      const path = bolt(rng(S, 1), x0 + 2, top + 3, x1 - 2, -3, { jag: 0.35, depth: 4 });
      p.polyline(path.slice(0, Math.max(2, Math.ceil(path.length * c))), WHITE);
      if (c > 0.5) p.polyline(bolt(rng(S, 2), x1 - 3, top + 2, x0 + 3, -4, { jag: 0.35, depth: 3 }).slice(0, Math.ceil(9 * (c - 0.5) * 2)), WHITE);
    }
    if (t > 0.1) p.glow(0, top * 0.5, 22, I[5], 0.2 * c);
    return;
  }
  const b = t - BREAK;
  // the break: one frame of white block, a ring of light
  if (b < 0.034) {
    p.rect(-BW * k - 1, -BH * k - D - 1, BW * 2 * k + D + 2, BH * k + D + 2, WHITE);
    p.glow(0, -BH * k * 0.5, 34, I[6], 0.6);
    return;
  }
  // shards: thrown out from the middle, spinning, one bounce, a skid, shrinking away
  burst(18, S, (r, i) => {
    const life = r.range(0.6, 0.95), q = b / life;
    if (q >= 1) return;
    const cx = r.range(-BW, BW) * k, cy = -r.range(1, BH) * k, dx = cx / (BW * k), up = (-cy / (BH * k));
    const vx = (dx * r.range(25, 55) + r.range(-10, 10)) * k, vy = -(r.range(50, 105) * (0.4 + up)) * k;
    const [x, y, landed] = toss(cx, cy, vx, vy, b);
    const spin = r.range(0, TAU) + (landed ? 1 : b) * r.range(-16, 16), size = r.range(1.6, 3.6) * k * (1 - ease.inQuad(seg(q, 0.55, 1)));
    if (size < 0.6) return;
    shard(p, x, Math.min(0, y - size * 0.5), shardPts(rng(S, i, 5), size), spin, I);
    if (i % 5 === 0 && !landed && Math.sin(b * 30 + i) > 0.6) glint(p, x, y - size, 1, I[6], WHITE);
  });
  // ice dust: fine bright specks hanging and drifting down
  burst(22, S + 1, (r) => {
    const life = r.range(0.4, 0.8);
    if (b > life) return;
    const e = (1 - Math.exp(-4 * b)) / 4, x = r.range(-BW, BW) + r.range(-60, 60) * e, y = -r.range(2, BH) - r.range(10, 50) * e + b * b * 30;
    if (y < 0) p.px(x, y, b / life < 0.5 ? I[7] : I[5]);
  });
  p.glow(0, -8, 28, I[5], 0.3 * (1 - seg(b, 0, 0.4)));
}
