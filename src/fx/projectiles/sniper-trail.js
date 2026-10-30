import { ramp, at, seg, ease, noise, noise2, clamp, WHITE } from "../../core/index.js";
import { flashPts } from "./_lib.js";

export const meta = {
  name: "Sniper trail",
  desc: "A hitscan shot: a blinding line across the canvas for a frame, a thin trace that cools, then a twisted smoke wake that loosens, drifts and breaks apart.",
  tags: ["projectile", "sniper", "hitscan", "rifle", "trail", "smoke", "directional", "one-shot"],
  size: [128, 24],
  origin: [3, 13],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#141a2a", "#26324a", "#3e5270", "#647c9c", "#9cb4cc", "#d8e8f4", "#ffffff"], seed: 17 },
};

const F = 1 / 30;

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, X1 = meta.size[0] - meta.origin[0] - 2, cy = 0.5;
  if (t < F) {
    // the shot: a fat white line all the way across, a star at the muzzle
    p.rect(0, -1, X1, 3, at(C, 0.8));
    p.rect(0, 0, X1, 1, WHITE);
    p.poly(flashPts(1, cy, [[0, 6, 20], [-1.4, 3, 40], [1.4, 3, 40]], 2.2), WHITE);
    p.glowLine(0, cy, X1, cy, 6, at(C, 0.7), 0.45);
    p.glow(2, cy, 12, WHITE, 0.4);
    return;
  }
  if (t < 3 * F) {
    // the trace: a thin bright line cooling a step a frame
    p.rect(0, 0, X1, 1, t < 2 * F ? WHITE : at(C, 0.84));
    p.glowLine(0, cy, X1, cy, 4, at(C, 0.6), t < 2 * F ? 0.3 : 0.15);
    return;
  }
  // the wake: two strands of smoke twisted round the line, loosening, drifting up and fraying into gaps
  const k = seg(t, 3 * F, meta.duration - 0.05), loose = ease.outCubic(k);
  const A = 2.6 * loose, rise = -4 * k * k;
  for (let x = 0; x < X1; x++) {
    const age = clamp(k * 1.15 - (x / X1) * 0.15); // the muzzle end goes a touch before the far end
    const gone = 0.25 + 0.75 * age;
    if (noise2(x * 0.12, k * 3, S) * 0.5 + 0.5 < gone * gone * 1.25 - 0.15) continue;
    const drift = noise(x * 0.07 + k * 2, S + 1) * 2.5 * loose + rise;
    for (const side of [1, -1]) {
      const y = cy + drift + side * Math.sin(x * 0.42 + side * 0.4) * A;
      const c = k < 0.12 ? at(C, 0.8) : k < 0.35 ? at(C, side > 0 ? 0.68 : 0.58) : at(C, side > 0 ? 0.55 : 0.45);
      p.dot(x, y, c, 1 - age * 0.55);
    }
  }
  // a breath of smoke at the muzzle
  const m = 1 - seg(t, 0.05, 0.6);
  if (m > 0) p.circle(1 + k * 6, cy - 1 - k * 6, 1.5 + k * 4, at(C, 0.5), (d) => clamp((1 - d * d) * m * 3));
}
