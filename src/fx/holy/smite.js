import { PAL, RAMP, burst, fly, seg, ease, rng, bolt, TAU, WHITE } from "../../core/index.js";
import { fit, ovalLine, sparkle } from "./_lib.js";

export const meta = {
  name: "Smite",
  desc: "A hammer of light slams down on the target: a glint above, a heavy white-gold block crashing in, a flat shockwave, cracks of light and flying stone.",
  tags: ["holy", "smite", "strike", "impact", "light", "ground", "one-shot"],
  size: [92, 108],
  origin: [46, 94],
  duration: 0.85,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.holy, seed: 36 },
};

const T_FALL = 0.12, T_HIT = 0.19;

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, top = -meta.origin[1] + 4, ST = RAMP.stone;
  // 1. the mark: a ring on the floor closing on the target, a glint high above
  const m = seg(t, 0, T_HIT);
  if (m < 1) {
    const R = 20 - 12 * ease.inQuad(m);
    ovalLine(p, R, R * 0.3, m > 0.6 ? C[6] : C[5], (a) => (Math.sin(a * 6 + t * 30) > -0.3 ? 1 : 0));
    if (t < T_FALL + 0.02) sparkle(p, 0, top + 6, t < 0.05 ? 1 : 3, WHITE, C[6], WHITE);
  }
  // 2. the hammer: a long haft and a heavy head, dropping in two frames, squashing on the hit
  const fall = ease.inQuad(seg(t, T_FALL, T_HIT)), hit = t >= T_HIT, after = seg(t, T_HIT + 0.03, 0.45);
  if (t >= T_FALL && after < 1) {
    const yb = hit ? 0 : top + 12 + (0 - top - 12) * fall;
    const squash = hit ? 1 - ease.outCubic(seg(t, T_HIT, T_HIT + 0.08)) : 0;
    const hw = (11 + 5 * squash) * (1 - after * 0.6), hh = hit ? (12 - 5 * squash) * (1 - after) : 12;
    const shaft = 4 * (1 - ease.outCubic(after));
    const white = hit && t < T_HIT + 0.07;
    const fill = (v, u) => (white ? WHITE : v < 0.35 ? WHITE : v < 0.7 ? C[6] : v < 0.9 ? C[5] : C[4]);
    if (shaft > 0.4) p.shade(-shaft, top, shaft, yb - hh, (x, y) => fill(Math.abs(x) / shaft));
    if (hh > 0.5) p.shade(-hw, yb - hh, hw, yb, (x, y) => fill(Math.max(Math.abs(x) / hw, (yb - y) / hh * 0.8)));
    // speed lines while it falls
    if (!hit) for (const x of [-hw - 3, -hw + 2, hw - 2, hw + 3]) p.line(x, yb - hh - 4, x, Math.max(top, yb - hh - 22), C[5]);
    p.glowLine(0, top + 20, 0, yb, 14, C[5], 0.3 * (1 - after));
  }
  if (!hit) return;
  const a = t - T_HIT;
  // 3. the hit: a flat white burst along the floor, a big light that drops fast
  if (a < 0.067) {
    p.ellipse(0, 0, 26, 4, WHITE);
    p.glow(0, -10, 34, C[5], 0.7);
  }
  // 4. shockwave rolling out over the floor
  const sw = seg(a, 0, 0.32);
  if (sw < 1) {
    const R = 14 + 24 * ease.outCubic(sw);
    ovalLine(p, R, R * 0.28, sw < 0.3 ? WHITE : sw < 0.6 ? C[6] : C[4], (ang) => (Math.sin(ang * 8) > sw * 2.4 - 1.4 ? 1 : 0));
  }
  // 5. cracks of light split the floor, glow, then cool and close
  const cr = seg(a, 0, 0.06), cool = seg(a, 0.16, 0.55);
  if (cool < 1)
    for (let i = 0; i < 6; i++) {
      const r = rng(S, i, 4), ang = (i / 6) * TAU + r.range(-0.35, 0.35), L = r.range(14, 24) * cr;
      const path = bolt(r, 0, 0, Math.cos(ang) * L, Math.sin(ang) * L * 0.3, { jag: 0.18, depth: 3 });
      const flat = path.map(([x, y]) => [x, Math.max(-1, y)]);
      p.polyline(flat, cool < 0.3 ? C[6] : cool < 0.65 ? C[4] : C[2]);
    }
  // 6. stone chunks and gold sparks thrown up
  burst(8, S + 1, (r) => {
    const ang = -Math.PI / 2 + r.range(-1.2, 1.2), sp = r.range(60, 110), life = r.range(0.4, 0.6);
    if (a > life) return;
    const [x, y] = fly(r.range(-8, 8), -1, Math.cos(ang) * sp, Math.sin(ang) * sp, a, 340, 0.5);
    if (y > 1) return;
    const s = r.next() < 0.4 ? 2 : 1;
    p.rect(x, y, s, s, r.next() < 0.5 ? ST[4] : ST[3]);
  });
  burst(12, S + 2, (r) => {
    const ang = -Math.PI / 2 + r.range(-1.4, 1.4), sp = r.range(70, 140), life = r.range(0.2, 0.4);
    if (a > life) return;
    const q = a / life, [x, y] = fly(0, -2, Math.cos(ang) * sp, Math.sin(ang) * sp, a, 200, 3);
    p.px(x, y, q < 0.3 ? WHITE : q < 0.6 ? C[6] : C[4]);
    p.light(x, y, C[5], 0.4 * (1 - q));
  });
  p.glow(0, -4, 30, C[4], 0.45 * Math.pow(1 - seg(a, 0, 0.5), 2));
}
