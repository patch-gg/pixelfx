import { PAL, burst, seg, ease, clamp, noise2, WHITE } from "../../core/index.js";
import { fit, drop, landTime, ripple } from "./_lib.js";

export const meta = {
  name: "Wave crash",
  desc: "A wave swells and rolls right, its lip curls over into a tube and slams down: a white flash, a plume of spray and foam that boils away.",
  tags: ["water", "wave", "surf", "crash", "foam", "directional", "one-shot"],
  size: [100, 80],
  origin: [30, 72],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, height: 38, seed: 13 },
};

const HIT = 0.66, G = 300;

// the wave at time t: crest x, height, how far the lip has thrown (0..1); and the lip's arc
function wave(t, H) {
  const xc = -12 + 26 * ease.inOutSine(seg(t, 0, HIT)) + 6 * ease.outCubic(seg(t, HIT, 1.1));
  const h = H * (0.22 + 0.78 * ease.outCubic(seg(t, 0, 0.42))) * (1 - ease.inOutSine(seg(t, HIT, 1.05)));
  const lip = ease.inOutSine(seg(t, 0.2, HIT));
  const R = h * 0.46, cx = xc + h * 0.12, cy = -h + R, a0 = -Math.PI / 2 - 0.35, a1 = a0 + 0.3 + lip * 3.1;
  return { xc, h, lip, R, cx, cy, a0, a1 };
}

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, H = o.height, w = wave(t, H), { xc, h, lip } = w;
  const wh = wave(HIT, H), hitX = wh.cx + Math.cos(wh.a1) * wh.R, after = t >= HIT;
  // the body: a long back slope and a steep face, foam riding the crest, streaks slanting up the back
  if (h > 1) {
    const surf = (x) => -h * Math.exp(-(((x - xc) / (x < xc ? h * 0.7 + 4 : 4 + h * 0.18)) ** 2));
    p.shade(-30, -h - 2, xc + h * 0.6 + 4, 1, (x, y) => {
      const sy = surf(x);
      if (y < sy || y > 0) return;
      const dep = y - sy, back = x < xc;
      if (sy < -h * 0.6 && dep < 2 + 2 * clamp(1 - Math.abs(x - xc) / 8)) return noise2(x * 0.5 + t * 8, y * 0.5, S) > -0.35 ? W[7] : W[6];
      if (dep < 1.2) return back ? W[6] : W[5];
      if (!back) return dep > h * 0.45 ? W[2] : (x - xc) * 3 + dep < 6 ? W[4] : W[3];
      const streak = noise2((x * 0.9 - y * 1.4) * 0.16 - t * 2.5, (x + y) * 0.05, S + 1);
      return streak > 0.5 ? W[6] : dep < 5 ? W[5] : dep < h * 0.42 ? W[4] : W[3];
    });
    // the lip: thick at the crest, thrown forward and curling down, white outside, dark on the underside
    if (!after && lip > 0) {
      const { R, cx, cy, a0, a1 } = w;
      p.arc(cx, cy, R + 1.5, (u) => Math.max(1.5, R * 0.75 * (1 - u * 0.8)), a0, a1,
        (u, v) => (v > 0.7 ? (noise2(u * 10 + t * 5, v * 2, S + 2) > -0.25 ? W[7] : W[6]) : v > 0.4 ? W[5] : v > 0.18 ? W[4] : W[3]));
      // spray streaming off the tip
      const tx = cx + Math.cos(a1) * (R + 0.5), ty = cy + Math.sin(a1) * (R + 0.5);
      burst(6, S + 4, (r, i) => {
        const k = (t * 7 + i / 6) % 1;
        p.px(tx + r.range(-1, 3) + k * r.range(3, 7), ty - r.range(0, 2) + k * r.range(-4, 2), k < 0.5 ? W[7] : W[6]);
      });
    }
  }
  if (!after) return;
  const a = t - HIT;
  // foam: the lip and the tube under it burst into a heap of foam that boils forward and wears away,
  // and a plume of it is thrown up where the lip hit
  burst(18, S + 5, (r, i) => {
    const plume = i >= 12, life = plume ? r.range(0.55, 0.8) : r.range(0.6, 0.9), k = a / life;
    if (k >= 1) return;
    let x0, y0, up, fwd;
    if (plume) (x0 = hitX + r.range(-3, 3)), (y0 = -3), (up = r.range(45, 95)), (fwd = r.range(-5, 30));
    else {
      const u = r.range(0.15, 1), ang = wh.a0 + (wh.a1 - wh.a0) * u;
      x0 = lerpN(wh.cx + Math.cos(ang) * wh.R, hitX - r.range(0, 10), r.range(0, 0.6));
      y0 = Math.min(-3, wh.cy + Math.sin(ang) * wh.R * r.range(0.5, 1));
      up = r.range(5, 25), fwd = r.range(10, 40);
    }
    const e = (1 - Math.exp(-3.2 * a)) / 3.2, x = x0 + fwd * e, y = Math.min(-2, y0 - up * e + a * a * (plume ? 40 : 30));
    const rad = (plume ? 4 : 5.5) * r.range(0.8, 1.2) * (0.55 + 0.6 * ease.outCubic(seg(a, 0, 0.2))) * (1 - 0.3 * k), wear = seg(k, 0.25, 1);
    p.shade(x - rad, y - rad, x + rad, y + rad, (px, py) => {
      const dx = px - x, dy = py - y, d = (dx * dx + dy * dy) / (rad * rad);
      if (d > 1 - wear * 0.95 + noise2(dx * 0.6 + i * 9, dy * 0.6, S + 6) * 0.4 * wear) return;
      return dx + dy * 1.2 > rad * 0.45 ? W[5] : dx + dy > -rad * 0.25 ? W[6] : W[7];
    });
  });
  // spray droplets flung up and forward, ringing the water where they land
  burst(24, S + 6, (r, i) => {
    const ang = -Math.PI / 2 + r.range(-0.6, 1.0), sp = r.range(60, 110), vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
    const x0 = hitX + r.range(-5, 5), tl = landTime(-4, vy, G, 0);
    if (a > tl) {
      const u = (a - tl) / 0.2;
      if (u < 1) ripple(p, x0 + vx * tl, 0.5, 1 + u * 3, 0.8, W[5], W[4], 1.4 * (1 - u), i);
      return;
    }
    drop(p, x0 + vx * a, -4 + vy * a + 0.5 * G * a * a, vx, vy + G * a, i % 3 ? W[6] : W[7], W[5], 0.025);
  });
  // the hit: the lip slams down white, a spout of white shoots up, light that lets go fast
  if (a < 0.07) {
    p.arc(wh.cx, wh.cy, wh.R + 2, (u) => Math.max(2, wh.R * 0.8 * (1 - u * 0.7)), wh.a0, wh.a1, WHITE);
    p.ellipse(hitX, -3, 11, 4, WHITE);
    p.beam(hitX, -3, hitX + 2, -wh.h * 0.8, 6, WHITE);
    p.glow(hitX - 4, -10, 32, W[6], 0.5);
  }
  p.glow(hitX, -10, 26, W[5], 0.22 * (1 - seg(a, 0, 0.5)));
}

const lerpN = (a, b, k) => a + (b - a) * k;
