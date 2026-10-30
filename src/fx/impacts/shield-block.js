import { PAL, ramp, burst, fly, flyV, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { rayStar, streak } from "./_lib.js";

export const meta = {
  name: "Shield block",
  desc: "A hit lands on a half-dome energy shield: it flares white, a ripple runs out along the rim from the hit, sparks glance off, the dome dims away.",
  tags: ["impact", "shield", "block", "barrier", "defense", "sparks", "directional", "one-shot"],
  size: [64, 48],
  origin: [22, 40],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.cyber, radius: 15, hit: -0.25, seed: 14 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, N = C.length - 1;
  const R = o.radius + Math.round(2.2 * Math.sin(seg(t, 0.03, 0.4) * Math.PI * 3) * (1 - seg(t, 0.03, 0.4))); // it gives, then rings
  const cx = 1, cy = -10, H = o.hit; // dome center (the chest) and where the blow lands (angle)
  const hx = cx + Math.cos(H) * (o.radius - 1), hy = cy + Math.sin(H) * (o.radius - 1);
  const flare = 1 - seg(t, 0, 0.1), wave = (Math.PI / 2 + 0.3) * ease.outQuad(seg(t, 0.02, 0.24)), out = seg(t, 0.32, 0.6);
  // the membrane: a lattice that flashes over the dome on impact
  if (flare > 0)
    p.shade(cx, cy - R, cx + R, Math.min(0, cy + R), (x, y, o2) => {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      if (d > R - 2 || dx < 0) return;
      const lat = (Math.floor(x + y) % 5 === 0) || (Math.floor(x - y + 100) % 5 === 0);
      if (!lat) return;
      o2.c = d / R > 0.65 ? C[N - 2] : C[N - 3];
      o2.a = flare * (0.35 + 0.65 * (d / R));
    });
  // the rim: a thick bright arc, the ripple running along it from the hit, ends eaten away as it dims
  const end = (Math.PI / 2) * (1 - ease.inQuad(out));
  if (end > 0.05) {
    const a0 = -end, a1 = Math.min(end, Math.asin(clamp((0 - cy) / R)));
    p.arc(cx, cy, R, (u) => 3 - out * 1.5 - (Math.abs(u - 0.5) > 0.46 ? 1 : 0), a0, a1, (u, v) => {
      const ang = a0 + (a1 - a0) * u, phi = Math.abs(ang - H), w = Math.abs(phi - wave);
      if (flare > 0.7) return v > 0.4 ? WHITE : C[N - 1];
      if (w < 0.32 && wave < Math.PI / 2 + 0.28) return v > 0.3 ? WHITE : C[N - 1];
      return v > 0.66 ? C[N - 2] : v > 0.33 ? C[N - 3] : C[N - 4];
    }, (u, v) => (out > 0.7 && v < 0.5 ? 0 : 1));
    for (let k = -2; k <= 2; k++) {
      const a = (k / 2) * end * 0.9;
      if (cy + Math.sin(a) * R < 2) p.glow(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 9, C[N - 2], 0.12 * (1 - out));
    }
  }
  // concentric ripples around the hit
  const rp = seg(t, 0.03, 0.24);
  if (rp > 0 && rp < 1)
    p.ring(hx, hy, 3 + 8 * ease.outCubic(rp), 1, rp < 0.4 ? WHITE : C[N - 2], (v, ang) => (Math.cos(ang - H) > -0.2 + rp * 1.1 ? 1 : 0));
  // sparks glance off the shield's face
  burst(8, S, (r, i) => {
    const a = H + (i % 2 ? 1 : -1) * r.range(0.5, 1.35), sp = r.range(80, 170), born = r.range(0, 0.04), life = r.range(0.2, 0.34), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(hx + 1, hy, vx0, vy0, age, 110, 3.5), [vx, vy] = flyV(vx0, vy0, age, 110, 3.5);
    if (y > 0) return;
    const head = q < 0.45 ? WHITE : q < 0.75 ? C[N - 1] : C[N - 2];
    streak(p, x, y, vx, vy, clamp(Math.hypot(vx, vy) * 0.03, 1, 4), (u) => (u > 0.5 ? head : C[N - 3]));
    p.light(x, y, C[N - 2], 0.4 * (1 - q));
  });
  // the blow itself: a white star on the rim for two frames
  if (t < 0.07) {
    const s = t < 0.035 ? 1 : 0.55;
    rayStar(p, hx + 1, hy, [0, 1, 2, 3].map((i) => ({ a: (i * TAU) / 4, len: (i % 2 ? 7 : 9) * s, w: 1.4 })), (q) => (q < 0.5 ? WHITE : C[N - 1]));
    p.circle(hx + 1, hy, 2.2 * s, WHITE);
  }
  const L = 1 - seg(t, 0, 0.45);
  p.glow(hx, hy, 20, C[N - 2], 0.4 * L * L);
  p.glow(cx + R * 0.5, cy, R * 1.6, C[N - 3], 0.2 * L);
}
