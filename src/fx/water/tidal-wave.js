import { PAL, stream, seg, ease, clamp, noise2, tileNoise } from "../../core/index.js";
import { fit, drop, landTime, clip } from "./_lib.js";

export const meta = {
  name: "Tidal wave",
  desc: "A towering wall of water rolls right across the screen: a white crest curling over a dark face, spray torn off the top, foam boiling at its foot.",
  tags: ["water", "wave", "tsunami", "flood", "spell", "directional", "one-shot"],
  size: [128, 80],
  origin: [16, 74],
  duration: 2.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, height: 56, speed: 100, seed: 14 },
};

const X0 = -16, X1 = 112, BACK = 66, G = 260; // canvas edges in local x, length of the wave's back

export function draw(p, t, o) {
  clip(p, X0, -74, X1, 6, () => wave(p, t, o));
}

function wave(p, t, o) {
  const W = fit(o.palette), S = o.seed, HW = o.height, V = o.speed;
  const xf = X0 - 6 + V * t; // the foot of the front face
  const Hn = HW * (0.6 + 0.4 * ease.outCubic(seg(t, 0, 0.35))) * (1 - 0.35 * ease.inQuad(seg(t, 1.4, 2.0)));
  // the water's height above x: a plateau behind the wall, sloping away at the back
  const height = (x) => {
    const u = (xf - x) / BACK;
    return u < 0 ? Hn : Hn * (1 - ease.inOutSine(clamp((u - 0.25) / 0.75))) * (1 + 0.03 * Math.sin(x * 0.25 - t * 9));
  };
  const lean = (y) => 9 * Math.pow(clamp(-y / Hn), 2.4); // the face bulges forward toward the top
  p.shade(xf - BACK - 2, -Hn - 4, xf + 10, 1, (x, y) => {
    const front = xf + lean(y);
    if (y > 0 || x > front + 0.5) return;
    const top = -height(Math.min(x, xf));
    if (y < top) return;
    const dep = y - top, n = tileNoise(x * 0.3 - t * 12, y * 0.3 + t * 7, 0, 0, S);
    // the crest: a rolling band of white foam, thickest at the front
    if (dep < 2.5 + 3 * clamp(1 - (xf - x) / 20) + n * 1.5 && -top > Hn * 0.5) return n > -0.25 ? W[7] : W[6];
    // the face: in the shadow of the curl, streaked as the water climbs it
    if (x > xf - 3 + lean(y) * 0.5) {
      if (x > front - 1) return W[2];
      return noise2(x * 0.6, y * 0.1 - t * 7, S + 1) > 0.3 ? W[4] : W[3];
    }
    // the back: bright under the foam, deeper below, foam streaks slanting back from the crest
    const streak = Math.sin((x - xf) * 0.32 + y * 0.55 + noise2(x * 0.1, y * 0.1, S + 2) * 2.5);
    if (streak > 0.93 && dep < -top * 0.7) return W[6];
    return dep < 5 ? W[5] : dep < Hn * 0.4 ? W[4] : W[3];
  });
  // the curl: the top of the wall thrown forward over the face
  const R = 10, cx = xf + 6, cy = -Hn + R - 1.5;
  p.arc(cx, cy, R, (u) => Math.max(1.5, 8 * (1 - u * 0.8)), -Math.PI * 1.02, -Math.PI * 1.02 + 2.75,
    (u, v) => (v > 0.5 ? (noise2(u * 6 - t * 8, v, S + 3) > -0.3 ? W[7] : W[6]) : v > 0.25 ? W[5] : W[3]));
  // foam boiling at the foot of the wall
  for (let i = 0; i < 8; i++) {
    const x = xf + 3 + Math.sin(t * 13 + i * 2.1) * 3 - i * 1.6, y = -2 - (i % 3) * 2.2 - Math.sin(t * 17 + i) * 1.2;
    p.circle(x, y, 2 + (i % 2), (d, a) => (Math.sin(a) > 0.3 && d > 0.6 ? W[5] : i % 3 ? W[7] : W[6]));
  }
  // spray torn off the crest, blown up and left behind the wall
  stream(t, 0, 1.9, 44, S, 0.55, (age, life, r) => {
    const born = t - age, bx = X0 - 6 + V * born + r.range(-8, 8);
    const Hb = HW * (0.6 + 0.4 * ease.outCubic(seg(born, 0, 0.35))) * (1 - 0.35 * ease.inQuad(seg(born, 1.4, 2.0)));
    const vx = V * r.range(0.2, 0.7), vy = -r.range(30, 75), x = bx + vx * age, y = -Hb - 2 + vy * age + 0.5 * G * age * age;
    if (y > -2) return;
    drop(p, x, y, vx, vy + G * age, age / life < 0.5 ? W[7] : W[6], W[5], 0.02);
  });
  // droplets kicked out ahead of the foot
  stream(t, 0.05, 1.7, 30, S + 1, 0.5, (age, life, r) => {
    const born = t - age, bx = X0 + V * born + 8, vx = V * r.range(1.1, 1.6), vy = -r.range(30, 70);
    const tl = landTime(-2, vy, G * 1.6, 0);
    if (age <= tl) p.px(bx + vx * age, -2 + vy * age + 0.8 * G * age * age, W[6]);
  });
  // the wash it leaves: short lines of foam on the ground that shrink away
  for (let i = 0; i < 5; i++) {
    const xs = xf - BACK - 4 - i * 12, k = clamp((xf - BACK - xs) / 50 + seg(t, 1.8, 2.1)), half = 7 * (1 - k);
    if (half > 0.5) p.line(xs - half, 0, xs + half, 0, i % 2 ? W[5] : W[6]);
  }
  p.glow(xf, -Hn * 0.75, 30, W[5], 0.16);
}
