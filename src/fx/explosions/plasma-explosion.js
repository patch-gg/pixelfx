import { PAL, RAMP, ramp, at, seg, ease, burst, fly, flyV, fbm, rng, bolt, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Plasma explosion",
  desc: "A blue-white energy blast: a white core flash, a crackling plasma sphere that swells and hollows out, three shock rings, arcs of lightning, plasma motes.",
  tags: ["explosion", "plasma", "energy", "electric", "sci-fi", "magic", "one-shot"],
  size: [104, 104],
  origin: [52, 52],
  duration: 0.95,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.electric, radius: 30, seed: 31 },
};

export function draw(p, t, o) {
  const E = fit(ramp(o.palette)), V = RAMP.arcane, S = o.seed, Rm = o.radius;
  // the sphere: swells fast, hollows from the middle, its rim crackling, then thins away by dither
  const R = 5 + Rm * ease.outExpo(seg(t, 0, 0.4)), hollow = Math.pow(seg(t, 0.1, 0.55), 0.8), fade = 1 - seg(t, 0.35, 0.68);
  if (fade > 0) {
    p.shade(-R - 3, -R - 3, R + 3, R + 3, (x, y, out) => {
      const d = Math.hypot(x, y), n = fbm(x * 0.16 + t * 4, y * 0.16 - t * 3, S, 2);
      const rim = R * (1 + n * 0.08);
      if (d > rim) return;
      const v = d / rim;
      if (v < hollow * 0.92) return;
      out.a = fade;
      out.k = 0.15;
      if (v > 0.9) return v > 0.96 ? WHITE : E[6];
      const swirl = Math.sin(Math.atan2(y, x) * 3 + d * 0.4 - t * 14 + n * 4);
      return at([E[2], E[3], E[4], E[5]], 0.45 + swirl * 0.25 + n * 0.5 + v * 0.3);
    });
  }
  // the white core flash
  if (t < 0.07) p.circle(0, 0, 8 + 60 * t, WHITE);
  // three shock rings, each a little later and slower
  const rings = [[0.02, 0.42, 48, E[6], 1], [0.08, 0.58, 42, V[5], 2], [0.16, 0.74, 34, E[5], 1]];
  for (const [t0, t1, r1, c, w] of rings) {
    const q = seg(t, t0, t1);
    if (q <= 0 || q >= 1) continue;
    const rr = 4 + (r1 - 4) * ease.outCubic(q);
    p.ring(0, 0, rr, w, c, q < 0.4 ? 1 : 1 - (q - 0.4) / 0.6);
    p.glowRing(0, 0, rr, 4, c, 0.25 * (1 - q));
  }
  // arcs of lightning jumping out to the rim, a new shape every other frame
  if (t > 0.02 && t < 0.4) {
    const r = rng(S, Math.floor(t * 15));
    for (let i = 0; i < 5; i++) {
      const a = r.range(0, TAU), L = R * r.range(0.7, 1.05);
      const path = bolt(r, Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * L, Math.sin(a) * L, { jag: 0.28, depth: 4 });
      p.polyline(path, i % 2 ? WHITE : E[6]);
      p.glowLine(0, 0, Math.cos(a) * L, Math.sin(a) * L, 5, E[4], 0.15);
    }
  }
  // plasma motes flung out on short trails, cooling to violet
  burst(18, S + 1, (r) => {
    const a = r.range(0, TAU), sp = r.range(90, 160), L = r.range(0.5, 0.9);
    if (t > L) return;
    const q = t / L, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp, [x, y] = fly(0, 0, vx, vy, t, 0, 3), [ux, uy] = flyV(vx, vy, t, 0, 3);
    p.line(x, y, x - ux * 0.04, y - uy * 0.04, q < 0.4 ? E[5] : V[4]);
    p.px(x, y, q < 0.3 ? WHITE : q < 0.6 ? E[6] : V[5]);
    p.light(x, y, E[5], 0.5 * (1 - q));
  });
  const L = 1 - seg(t, 0, 0.8);
  p.glow(0, 0, 50, E[4], 0.5 * L * L);
  p.glow(0, 0, 12, E[6], 0.6 * (1 - seg(t, 0, 0.3)));
}
