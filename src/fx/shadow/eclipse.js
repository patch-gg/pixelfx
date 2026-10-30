import { cycle, tileNoise, bump, clamp, TAU, WHITE } from "../../core/index.js";
import { steps, CRIMSON } from "./_lib.js";

export const meta = {
  name: "Eclipse",
  desc: "A black moon over a hidden sun: ragged corona streamers turn and breathe, a diamond bead burns on the rim, red flares loop up and fall back.",
  tags: ["shadow", "eclipse", "sun", "moon", "sky", "omen", "loop"],
  size: [72, 72],
  origin: [36, 36],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "sky",
  options: {
    palette: ["#0a0614", "#1e1236", "#3a2066", "#5c3496", "#8a58c4", "#b88ae4", "#e2c4f8", "#ffffff"],
    radius: 12, seed: 4,
  },
};

const BEAD = -0.75; // where the last sliver of sun shows (radians)

export function draw(p, t, o) {
  const C = steps(o.palette), F = steps(CRIMSON), S = o.seed, D = meta.duration, ph = t / D, R = o.radius;
  const breathe = 1 + 0.08 * Math.sin(ph * TAU);
  const W = R * 2.8;

  // corona: streamers of light around the moon, shifting and breathing (the noise wraps once a loop)
  const CORONA = [C[2], C[3], C[4], C[5], C[6], C[7]];
  p.shade(-W, -W, W, W, (x, y) => {
    const d = Math.hypot(x, y);
    if (d < R || d > W) return;
    const a = Math.atan2(y, x), u = (a / TAU + 0.5) * 28;
    const n = 0.5 + 0.5 * (0.7 * tileNoise(u, ph * 2, 28, 2, S) + 0.3 * tileNoise(u * 2, 3 - ph * 3, 56, 3, S + 1));
    const reach = R * (0.32 + 1.7 * n * n * n) * breathe;
    const v = 1 - (d - R) / reach;
    if (v < 0.05) return;
    return CORONA[clamp(Math.floor(v * v * 6.4), 0, 5)];
  });

  // flares: loops of red that rise off the rim and fall back
  cycle(t, D, 3, S + 3, (r) => r.range(1, 1.6), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU), h = bump(k, 0, 1) * r.range(5, 8), span = r.range(0.22, 0.34);
    const pts = [];
    for (let j = 0; j <= 8; j++) {
      const s = j / 8, aa = a + (s - 0.5) * span * 2, rr = R + Math.sin(s * Math.PI) * h;
      pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]);
    }
    p.polyline(pts, k < 0.6 ? F[7] : F[6]);
    if (h > 2.5) p.polyline(pts.map(([x, y]) => [x * 0.95, y * 0.95]), F[5]);
    p.light(pts[4][0], pts[4][1], F[6], 0.35 * bump(k, 0, 1));
  });

  // the moon: black, a hair-thin crescent of sun on the bead side
  p.circle(0, 0, R, (d, a) => {
    if (d < 0.9) return C[0];
    const lit = Math.cos(a - BEAD);
    return lit > 0.55 ? WHITE : lit > 0.2 ? C[6] : C[1];
  });
  // the diamond bead: a hot point with twinkling spikes
  const bx = Math.cos(BEAD) * R, by = Math.sin(BEAD) * R, tw = 0.6 + 0.4 * Math.abs(Math.sin(ph * TAU * 3));
  p.circle(bx, by, 1.6, WHITE);
  const sp = Math.round(3 + 4 * tw);
  p.line(bx - sp, by, bx + sp, by, (u) => (Math.abs(u - 0.5) < 0.2 ? WHITE : C[6]));
  p.line(bx, by - sp, bx, by + sp, (u) => (Math.abs(u - 0.5) < 0.2 ? WHITE : C[6]));

  p.glowRing(0, 0, R + 5, 7, C[5], 0.3 * breathe);
  p.glow(bx + Math.cos(BEAD) * 2, by + Math.sin(BEAD) * 2, 9, C[7], 0.55 * tw);
  p.glowRing(0, 0, R * 1.9, R, C[4], 0.1);
}
