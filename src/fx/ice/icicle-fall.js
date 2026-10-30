import { PAL, burst, seg, ease, fly, TAU, WHITE } from "../../core/index.js";
import { fit, shard, shardPts } from "./_lib.js";

export const meta = {
  name: "Icicle fall",
  desc: "An icicle trembles, cracks loose, drops like a dart and smashes point first: a white burst, shards flung up in a V, frost dust settling.",
  tags: ["ice", "icicle", "falling", "trap", "hazard", "shatter", "one-shot"],
  size: [64, 88],
  origin: [32, 82],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, length: 26, seed: 25 },
};

const LOOSE = 0.42, G = 1500, TOP = -80;

function icicle(p, x, y, L, I, white) {
  // a long cone with ripples down its sides: lit left, shaded right, a white ridge
  p.shade(x - 6, y, x + 6, y + L, (px, py) => {
    const v = (py - y) / L, w = 4.4 * (1 - v) + 0.4 + Math.sin((py - y) * 0.9) * 0.5 * (1 - v);
    const dx = px - x;
    if (Math.abs(dx) > w) return;
    if (white) return WHITE;
    if (dx > w - 1) return I[2];
    if (Math.abs(dx + 0.5) < 0.6 && v < 0.85) return I[7];
    return dx < 0 ? (dx < -w + 1 ? I[5] : I[6]) : I[4];
  });
  if (!white) p.px(x, y + L, I[7]);
}

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, L = o.length, tipY = TOP + L, fallT = Math.sqrt((2 * -tipY) / G), HIT = LOOSE + fallT;
  if (t < HIT) {
    // hanging: it starts to shiver and a crack opens at the root; then it drops
    const shiver = t > 0.15 && t < LOOSE ? (Math.floor(t * 30) % 2 ? 1 : 0) : 0;
    const f = Math.max(0, t - LOOSE), dy = 0.5 * G * f * f;
    icicle(p, shiver, TOP + dy, L, I, f > 0 && f < 0.034);
    if (t > 0.25 && t < LOOSE) p.line(-3 + shiver, TOP + 2, 3 + shiver, TOP + 1, WHITE);
    // flakes shaken loose from the root
    burst(4, S, (r, i) => {
      const a = t - 0.18 - i * 0.05;
      if (a < 0 || a > 0.5) return;
      p.px(r.range(-3, 3) + Math.sin(a * 12 + i) * 1.5, TOP + 3 + a * r.range(40, 70), a < 0.3 ? I[6] : I[5]);
    });
    // speed lines while it falls
    if (f > 0.05) {
      const v = G * f;
      for (const [sx, k] of [[-5, 0.03], [5, 0.022], [-2, 0.015]]) p.line(sx, TOP + dy - v * k, sx, TOP + dy - 3, I[4]);
    }
    return;
  }
  const b = t - HIT;
  // the smash: a white star on the floor, frost blown along it
  if (b < 0.07) {
    p.ellipse(0, -2, 10, 3, WHITE);
    p.line(0, -1, 0, -16, WHITE);
    p.line(-6, -6, 6, -6, WHITE);
    p.glow(0, -10, 24, I[6], 0.6);
  }
  const frost = 1 - ease.inQuad(seg(b, 0.3, 0.62));
  if (b > 0.03 && frost > 0) p.ellipse(0, 0.5, (6 + 10 * ease.outCubic(seg(b, 0, 0.2))) * frost, 2 * frost + 0.5, (d) => (d > 0.7 ? I[6] : I[5]));
  // shards flung up and out in a V, the body's chunks tumbling out low
  burst(16, S + 1, (r, i) => {
    const big = i < 6, life = r.range(0.45, 0.7);
    if (b > life) return;
    const side = r.sign(), ang = -Math.PI / 2 + side * (big ? r.range(0.3, 1.0) : r.range(0.15, 0.5)), sp = big ? r.range(45, 80) : r.range(90, 140);
    const [x, y] = fly(side * r.range(0, 3), -2 - (big ? r.range(0, 8) : 0), Math.cos(ang) * sp, Math.sin(ang) * sp, b, 520, 0.4);
    if (y > 0) return;
    const sz = (big ? r.range(2.4, 3.6) : r.range(1.2, 2)) * (1 - ease.inQuad(seg(b / life, 0.6, 1)));
    if (sz > 0.6) shard(p, x, y, shardPts(r, sz), r.range(0, TAU) + b * r.range(-18, 18), I);
  });
  // frost dust: a low puff of bright specks
  burst(18, S + 2, (r) => {
    const life = r.range(0.35, 0.6);
    if (b > life) return;
    const [x, y] = fly(r.range(-3, 3), -1, r.range(-70, 70), -r.range(10, 50), b, 60, 4);
    p.px(x, y, b / life < 0.4 ? I[7] : I[5]);
  });
  p.glow(0, -10, 20, I[5], 0.3 * (1 - seg(b, 0, 0.4)));
}
