import { PAL, clamp, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle } from "./_lib.js";

export const meta = {
  name: "Sparkle swirl",
  desc: "Sparkles spiral up around the actor in two twisting ribbons, passing behind and in front, twinkling as they rise and narrow.",
  tags: ["arcane", "sparkle", "aura", "buff", "magic", "character", "loop"],
  size: [44, 46],
  origin: [22, 40],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.arcane, count: 14, radius: 11, height: 30, seed: 20 },
};

function swirl(p, t, o, front) {
  const C = fit(o.palette), D = meta.duration, ph = t / D, R0 = o.radius, H = o.height;
  // where a sparkle is at rise k: on one of two helices that also turn once a loop
  const at = (k, strand) => {
    const th = strand * Math.PI + k * TAU * 1.3 + ph * TAU, R = R0 * (1 - 0.4 * k);
    return [Math.cos(th) * R, -k * H + Math.sin(th) * R * 0.32, Math.sin(th)];
  };
  // two strands, sparkles evenly strung along each, all rising one full height a loop (seamless)
  const n = Math.max(2, Math.round(o.count / 2));
  for (let strand = 0; strand < 2; strand++)
    for (let i = 0; i < n; i++) {
      const k = (ph + i / n + (strand * 0.5) / n) % 1;
      const [x, y, depth] = at(k, strand);
      // a tail along the helix, drawn on whichever side of the body it falls
      for (let s = 1; s <= 4; s++) {
        const kk = k - s * 0.03;
        if (kk < 0) break;
        const [tx, ty, td] = at(kk, strand);
        if (td > 0 === front) p.px(tx, ty, front ? (s < 3 ? C[5] : C[4]) : s < 3 ? C[3] : C[2]);
      }
      if (depth > 0 !== front) continue;
      const tw = Math.sin(ph * TAU * 3 + i * 2.3 + strand), size = k < 0.08 || k > 0.92 ? 0 : tw > 0.5 ? 2 : 1;
      if (front) sparkle(p, x, y, size, C[6], C[5], WHITE);
      else sparkle(p, x, y, Math.min(size, 1), C[4], C[4], C[5]);
      p.light(x, y, C[5], front ? 0.45 : 0.2);
    }
}

export const drawBack = (p, t, o) => swirl(p, t, o, false);
export function draw(p, t, o) {
  swirl(p, t, o, true);
  const C = fit(o.palette), ph = t / meta.duration;
  p.glow(0, -12, 20, C[4], clamp(0.16 + 0.04 * Math.sin(ph * TAU * 2)));
}
