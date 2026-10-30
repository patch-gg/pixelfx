import { PAL, stream, burst, seg, ease, clamp, tileNoise, noise2, bump, WHITE } from "../../core/index.js";
import { fit, ripple, drop, landTime } from "./_lib.js";

export const meta = {
  name: "Geyser",
  desc: "The ground burbles, then a column of water blasts skyward with a churning white head, rains droplets all around, and sinks back into a draining puddle.",
  tags: ["water", "geyser", "eruption", "column", "ground", "one-shot"],
  size: [80, 112],
  origin: [40, 106],
  duration: 2.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, height: 86, seed: 9 },
};

const ERUPT = 0.5, G = 380;

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, HMAX = o.height;
  const rise = ease.outExpo(seg(t, ERUPT, ERUPT + 0.28)), fall = ease.inQuad(seg(t, 1.38, 1.95));
  const H = HMAX * rise * (1 - fall) + 2 * Math.sin(t * 9) * rise * (1 - fall), top = -H;
  // the puddle it leaves: spreads out, then drains away by dither
  const drain = ease.inQuad(seg(t, 1.9, 2.5)), prx = (6 + 18 * ease.outCubic(seg(t, ERUPT, 1.2))) * (1 - drain);
  if (t > ERUPT && prx > 1.5) p.ellipse(0, 0.5, prx, 2.6 * (1 - drain * 0.6), (d, a) => (d > 0.78 ? (Math.sin(a) < 0 ? W[4] : W[3]) : W[2]));
  // the vent: a dark mouth in the floor
  if (t < 2.4) p.ellipse(0, 0.5, 5 * (1 - seg(t, 2.1, 2.4)), 1.5, W[0]);
  // burbling before it blows: a dome of water heaves up and drops back, bigger each time
  if (t < ERUPT) {
    const beat = [0.06, 0.2, 0.33].map((b, i) => bump(t, b, b + 0.12 + i * 0.02) * (1.5 + i)).reduce((a, b) => a + b, 0);
    const heave = beat + ease.inQuad(seg(t, 0.38, ERUPT)) * 4;
    if (heave > 0.4) p.ellipse(0, 0, 3 + heave * 0.5, heave, (d, a) => (Math.sin(a) < -0.4 && d > 0.5 ? W[6] : W[5]));
    if (heave > 0.4) p.px(-1, -heave + 0.5, W[7]);
    burst(4, S + 3, (r, i) => {
      const t0 = 0.08 + i * 0.1, a = t - t0;
      if (a < 0) return;
      const vy = -r.range(40, 70), vx = r.range(-15, 15), tl = landTime(-2, vy, G * 2, 0);
      if (a < tl) p.px(vx * a, -2 + vy * a + G * a * a, W[6]);
    });
  }
  // droplets rain out of the head while it stands, and out of what's left as it falls
  const rain = (front) => stream(t, ERUPT + 0.06, 1.62, 72, S, 1.6, (age, life, r, i) => {
    const z = r.range(-1, 1);
    if (z > 0 !== front) return;
    const born = t - age, hb = HMAX * ease.outExpo(seg(born, ERUPT, ERUPT + 0.28)) * (1 - ease.inQuad(seg(born, 1.38, 1.95)));
    const late = seg(born, 1.2, 1.62), side = r.sign(), vx = side * r.range(12, 34), vy = -r.range(-10, 50 - late * 32);
    const x0 = side * r.range(4, 9), y0 = -hb + r.range(-2, 10), land = z * 2.5;
    const tl = landTime(y0, vy, G, land);
    if (age < tl) {
      const x = x0 + vx * age, y = y0 + vy * age + 0.5 * G * age * age;
      drop(p, x, y, vx, vy + G * age, front ? W[7] : W[6], front ? W[5] : W[4], 0.03);
    } else if (age < tl + 0.2) {
      const a = (age - tl) / 0.2, lx = x0 + vx * tl;
      ripple(p, lx, land, 1 + a * 3, (1 + a * 3) * 0.3, W[5], W[4], 1.4 * (1 - a), i);
    }
  });
  rain(false);
  // the column: streaks shooting up, lit on the left, a churning lumpy head of foam on top
  if (H > 1) {
    const hw = (y) => 4.6 + 3 * clamp(-y / HMAX) + 0.9 * tileNoise(y * 0.12 + t * 14, 2, 0, 0, S + 5);
    const HR = 9 * (1 - ease.inQuad(seg(t, 1.36, 1.62))) * seg(H, 6, 20);
    p.shade(-16, top - 12, 16, 0, (x, y) => {
      const head = HR > 1 ? Math.hypot(x * 0.8, (y - top - 3) * 1.05) - (HR + 2.4 * noise2(Math.atan2(y - top - 3, x) * 2.2 + t * 5, t * 3, S + 6)) : 1;
      const cap = y - top < 3 ? Math.sqrt(Math.max(0, (y - top) / 3)) : 1, w = hw(y) * cap;
      if (head > 0 && (Math.abs(x) > w || y < top)) return;
      if (head > 0 && y - top < 2.5) return W[7];
      if (head <= 0) {
        // foam: white, shaded low on the right
        const sh = (x * 0.6 + (y - top - 3) * 0.9) / HR + 0.35 * noise2(x * 0.5, y * 0.5 + t * 4, S + 8);
        return sh > 0.8 ? W[5] : sh > 0.35 ? W[6] : W[7];
      }
      const n = tileNoise(x * 0.7, y * 0.07 + t * 6, 0, 0, S);
      if (x < -w + 1.5) return W[6];
      if (x > w - 1.5) return x > w - 0.8 ? W[3] : W[4];
      return n > 0.25 ? W[7] : n > -0.2 ? W[6] : W[5];
    });
    // the skirt: water bursting back out where the column meets the ground
    const sk = rise * (1 - fall);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI + Math.sin(t * 7 + i) * 0.2, r = 6 + 6 * sk + Math.sin(t * 11 + i * 2) * 1.2;
      p.circle(-Math.cos(a) * r, -1.5 - Math.sin(a) * 3 * sk, 1.8 + sk * 1.4, i % 2 ? W[7] : W[6]);
    }
  }
  rain(true);
  // the blast: a white flash and a ring racing out along the ground
  const fl = seg(t, ERUPT, ERUPT + 0.07);
  if (fl > 0 && fl < 1) {
    p.ellipse(0, -2, 11, 4, WHITE);
    p.rect(-5, -H, 11, H, WHITE);
  }
  const ring = seg(t, ERUPT, ERUPT + 0.45);
  if (ring > 0 && ring < 1) ripple(p, 0, 0, 7 + 26 * ease.outCubic(ring), (7 + 26 * ease.outCubic(ring)) * 0.16, ring < 0.3 ? WHITE : W[6], W[5], 1.4 * (1 - ring), S);
  const L = rise * (1 - fall);
  p.glow(0, top + 4, 26, W[5], 0.18 * L);
  p.glow(0, -2, 22, W[6], 0.45 * (1 - seg(t, ERUPT, ERUPT + 0.3)) * (t > ERUPT ? 1 : 0));
}
