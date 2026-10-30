import { PAL, fract, tileNoise, TAU, bump } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Water orb",
  desc: "A floating sphere of water that bobs and jiggles, a current swirling inside it, a hard shine on top and droplets circling it.",
  tags: ["water", "orb", "sphere", "magic", "floating", "loop"],
  size: [52, 52],
  origin: [26, 26],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.water, radius: 13, seed: 12 },
};

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, ph = t / meta.duration, R0 = o.radius;
  const cy = Math.round(Math.sin(ph * TAU) * 1.6);
  // it breathes: a squash and stretch that turns, plus a small ripple running round the edge
  const R = (a) => R0 * (1 + 0.06 * Math.sin(ph * TAU * 2) * Math.cos(2 * a)) + 0.3 * Math.sin(4 * a + ph * TAU * 2);
  // droplets on a tilted orbit: the far half goes behind the orb
  const orbit = (front) => {
    for (let i = 0; i < 3; i++) {
      const th = ph * TAU + (i * TAU) / 3 + i * 0.4, z = Math.sin(th);
      if (z > 0 !== front) continue;
      const x = Math.cos(th) * (R0 + 6), y = cy + Math.sin(th) * 4 - Math.cos(th) * 3;
      p.px(x, y, front ? W[7] : W[4]);
      if (front) p.px(x - 1, y, W[5]);
    }
  };
  orbit(false);
  // the body: a ball lit from the top left, deep in the middle, light bending through the bottom right
  p.shade(-R0 - 2, cy - R0 - 2, R0 + 2, cy + R0 + 2, (x, y) => {
    const dx = x, dy = y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), rr = R(a), d = r / rr;
    if (d > 1) return;
    const nz = Math.sqrt(1 - d * d), nx = dx / rr, ny = dy / rr;
    if (d > 0.91) return nx + ny > 0.55 ? W[4] : nx + ny < -0.6 ? W[3] : W[2];
    if (d > 0.72 && nx + ny > 0.75) return W[5];
    // the current: two thin arms curling round the middle, turning once a loop
    const sw = fract((a / TAU) * 2 + d * 1.1 - ph * 2);
    const lit = -nx * 0.5 - ny * 0.6 + nz * 0.55;
    if (d > 0.22 && d < 0.84 && sw < 0.07 + 0.03 * tileNoise((a / TAU) * 8 - ph * 8, d * 3, 8, 0, S)) return lit > 0.45 ? W[6] : W[5];
    return lit > 0.72 ? W[5] : lit > 0.38 ? W[4] : lit > -0.05 ? W[3] : W[2];
  });
  // bubbles drifting up inside it
  for (let i = 0; i < 3; i++) {
    const k = fract(ph + i / 3), x = (i - 1) * 4 + Math.sin(k * 9 + i) * 1.2, y = cy + R0 * 0.7 - k * R0 * 1.4;
    if (Math.hypot(x, y - cy) < R0 - 2.5) p.px(x, y, W[6]);
  }
  // the shine: a hard white highlight and a small kick of light opposite
  const hx = -Math.round(R0 * 0.42), hy = cy - Math.round(R0 * 0.5);
  p.rect(hx - 1, hy, 3, 2, W[7]);
  p.px(hx + 2, hy + 1, W[6]);
  p.px(hx - 1, hy + 2, W[6]);
  p.px(hx + 3, hy - 1, W[7]);
  p.px(Math.round(R0 * 0.5), cy + Math.round(R0 * 0.55), W[6]);
  // a drip sags off the bottom and gets pulled back in
  const sag = bump(fract(ph + 0.3), 0.1, 0.6), by = cy + R0 + 0.5;
  if (sag > 0.05) {
    const len = Math.round(sag * 4);
    p.line(1, by, 1, by + len, W[3]);
    p.px(1, by + len, sag > 0.7 ? W[5] : W[4]);
  }
  orbit(true);
  p.glow(0, cy, R0 * 2.2, W[4], 0.2);
  p.glow(hx, hy, 6, W[6], 0.25);
}
