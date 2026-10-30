import { PAL, burst, rng, seg, ease, fly, noise2, TAU, WHITE } from "../../core/index.js";
import { fit, spike, shard, shardPts, glint } from "./_lib.js";

export const meta = {
  name: "Frost nova",
  desc: "A white flash at the feet, then a ring of ice crystals bursts outward across a frosting floor, slows, shatters into spinning shards and melts away.",
  tags: ["ice", "nova", "frost", "aoe", "spell", "burst", "one-shot"],
  size: [128, 64],
  origin: [64, 48],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.ice, radius: 46, count: 18, seed: 22 },
};

const Q = 0.28; // how flat the floor looks

// the ring's radius, how tall its crystals stand, when each one shatters
const ringR = (t, R) => 4 + (R - 4) * ease.outCubic(seg(t, 0.02, 0.5));
const brk = (r) => 0.52 + r.range(0, 0.12);

export function drawBack(p, t, o) {
  const I = fit(o.palette), S = o.seed, R = ringR(t, o.radius);
  // the frosted floor inside the ring: pale, veined with cracks, melting away at the end
  const melt = ease.inQuad(seg(t, 0.7, 1.2)), fr = R * (1 - melt);
  if (t > 0.02 && fr > 2)
    p.shade(-fr, -fr * Q, fr, fr * Q, (x, y) => {
      const d = Math.hypot(x / fr, y / (fr * Q));
      if (d > 1 + noise2(Math.atan2(y / Q, x) * 3, 0, S) * 0.08) return;
      // a bright frosted band behind the ring, the floor inside only tinted, veined with frost
      const vein = Math.abs(noise2(x * 0.14, y * 0.45, S + 1)) < 0.07;
      if (d > 0.9) return I[6];
      if (d > 0.72 - melt * 0.3) return vein ? I[6] : I[5];
      return vein ? I[5] : I[3];
    });
  crystals(p, t, o, I, false);
}

export function draw(p, t, o) {
  const I = fit(o.palette);
  crystals(p, t, o, I, true);
  // the flash at the feet, and light that rides the ring then lets go
  if (t < 0.07) {
    p.ellipse(0, 0, 12, 4, WHITE);
    p.rect(-2, -26, 5, 26, WHITE);
    p.glow(0, -8, 40, I[5], 0.6);
  }
  const R = ringR(t, o.radius), L = 1 - seg(t, 0.1, 0.8);
  for (const [x, y] of [[-R, 0], [R, 0], [0, R * Q]]) p.glow(x, y - 3, 18, I[5], 0.18 * L);
  p.glow(0, -6, 30, I[4], 0.2 * L);
}

function crystals(p, t, o, I, front) {
  const S = o.seed, n = o.count, R = ringR(t, o.radius);
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), a = (i / n) * TAU + r.range(-0.12, 0.12), s = Math.sin(a);
    if (s > 0 !== front) continue;
    const cx = Math.cos(a), x = cx * R, y = s * R * Q, h = r.range(6, 13) * (front ? 1.1 : 0.85), b = brk(r);
    const up = ease.outBack(seg(t, 0.02, 0.14), 2), J = front ? I : [I[0], I[1], I[1], I[2], I[3], I[4], I[5], I[6]];
    if (t < b) {
      spike(p, x - cx * 1.5, y, 1.6, h * 0.6 * up, -cx * 2 - 1.5, J);
      spike(p, x, y, 2.2, h * up, cx * h * 0.45, J);
      if (r.next() < 0.5) spike(p, x + cx * 2, y, 1.3, h * 0.45 * up, cx * h * 0.6 + 1, J);
      if (t > 0.2 && Math.sin(t * 20 + i * 2.7) > 0.93) glint(p, x + cx * h * 0.3, y - h * 0.7, 1, I[6], WHITE);
      continue;
    }
    // shattered: shards thrown outward and up, spinning, falling, fading
    const age = t - b;
    burst(3, S + 50 + i, (rr) => {
      const life = rr.range(0.35, 0.55);
      if (age > life) return;
      const [sx, sy] = fly(x, y - h * rr.range(0.2, 0.8), cx * rr.range(15, 38) + rr.range(-8, 8), -rr.range(30, 70), age, 300, 1.5);
      if (sy > y - 1) return;
      shard(p, sx, sy, shardPts(rr, rr.range(1.4, 2.4)), rr.range(0, TAU) + age * rr.range(-14, 14), J, 1 - seg(age, life * 0.6, life));
    });
    if (age < 0.05) p.circle(x, y - h * 0.4, 2.5, WHITE);
  }
}
