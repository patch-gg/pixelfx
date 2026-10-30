import { PAL, cycle, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle } from "./_lib.js";

export const meta = {
  name: "Sunburst",
  desc: "A radiant sun: long and short rays turning slowly round a blazing core, breathing in and out, a ring of light and glints at the tips.",
  tags: ["holy", "sun", "light", "radiant", "icon", "background", "loop"],
  size: [72, 72],
  origin: [36, 36],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.holy, rays: 12, length: 28, seed: 41 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), n = o.rays, ph = t / meta.duration, S = o.seed, L = o.length;
  // the rays turn one long/short pair a loop, so the loop has no seam; they all breathe together
  const rot = ph * ((TAU * 2) / n) - Math.PI / 2, breathe = Math.sin(ph * TAU * 2);
  for (let i = 0; i < n; i++) {
    const a = rot + (i * TAU) / n, long = i % 2 === 0;
    const len = long ? L + 2 * breathe : L * 0.6 - 1.5 * breathe, w = long ? 3.4 : 2.4, r0 = 7;
    const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    // a light runs round the rays: brighter where it is (a function of the ray's angle, not its index)
    const lit = 0.5 + 0.5 * Math.cos(a + Math.PI / 2 - ph * TAU);
    p.poly([[dx * r0 + nx * w, dy * r0 + ny * w], [dx * len, dy * len], [dx * r0 - nx * w, dy * r0 - ny * w]], (x, y) => {
      const u = (Math.hypot(x, y) - r0) / (len - r0), v = Math.abs(x * nx + y * ny) / (w * (1 - u) + 0.01);
      if (u > 0.82) return C[3];
      if (v < 0.4 && u < 0.55 + 0.3 * lit) return long ? C[6] : C[5];
      return u > 0.6 ? C[4] : C[5];
    });
    if (long && lit > 0.85) p.light(dx * len * 0.7, dy * len * 0.7, C[5], 0.3);
  }
  // the core: blazing white heart, a gold rim, a thin ring of light just outside that turns the other way
  p.circle(0, 0, 8.5, (d) => (d < 0.55 ? WHITE : d < 0.8 ? C[6] : C[5]));
  p.ring(0, 0, 11, 1, C[6], (v, a) => (Math.sin(a * 6 - ph * TAU) > -0.2 ? 1 : 0));
  // glints winking at the tips of the long rays
  cycle(t, meta.duration, 3, S, 0.4, (age, life, r, j) => {
    const k = age / life, i = 2 * r.int(0, n / 2 - 1), a = rot + (i * TAU) / n + (age / meta.duration) * ((TAU * 2) / n), d = L + 2 * breathe + 2;
    sparkle(p, Math.cos(a) * d, Math.sin(a) * d, k < 0.25 ? 1 : k < 0.6 ? 2 : k < 0.85 ? 1 : 0, C[6], C[5], WHITE);
  });
  p.glow(0, 0, L + 8, C[4], 0.28 + 0.04 * breathe);
  p.glow(0, 0, 12, C[6], 0.45);
}
