import { PAL, ramp, at, cycle, seg, clamp, rng, rand, loopNoise, tileFbm, TAU, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, jagged, branches } from "./_lib.js";

export const meta = {
  name: "Storm cloud",
  desc: "A brooding thundercloud churning in the rain: lightning flickers inside it, lights it up from within, and once a cycle a bolt forks down out of it.",
  tags: ["lightning", "weather", "storm", "cloud", "rain", "ambient", "loop"],
  size: [88, 72],
  origin: [44, 24],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: PAL.electric, seed: 12 },
};

const STORM = ramp(["#0b0c16", "#141626", "#1e2236", "#2a2f47", "#3a405a", "#4f5670", "#6a7290"]);
const RAIN = ramp(["#34406a", "#4a5888"]);
// puffs of the cloud: [x, y, radius]; a flat belly, a lumpy top
const PUFFS = [[-27, 3, 8], [-17, 4, 10], [-5, 5, 10], [8, 4, 10], [20, 4, 9], [29, 3, 7], [-20, -4, 9], [-8, -7, 11], [6, -8, 12], [18, -4, 9], [-1, -13, 8]];
// flashes: [time, length, x, y, strength]; the big one at 1.0 throws a bolt
const FLASHES = [[0.25, 0.16, -15, 0, 0.7], [1.0, 0.26, 8, 2, 1], [1.85, 0.13, 22, -2, 0.55]];
const FLICK = [1, 0.35, 1, 0.8, 0.2, 0.9, 0.5, 0.3];

function flashAt(t) {
  for (const [t0, len, x, y, k] of FLASHES) {
    if (t < t0 || t >= t0 + len) continue;
    const i = Math.floor((t - t0) * 30), f = FLICK[i % FLICK.length] * (1 - 0.6 * seg(t, t0, t0 + len));
    return { x, y, k: k * f, big: k === 1, age: t - t0 };
  }
  return null;
}

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, ph = t / meta.duration, F = flashAt(t);

  // rain: thin slanted streaks falling out of the belly
  cycle(t, meta.duration, 22, S + 1, (r) => r.range(0.35, 0.5), (age, life, r) => {
    const x = r.range(-30, 30) - age * 14, y = 8 + age * r.range(80, 100);
    if (y > 46) return;
    p.line(x, y, x + 1, y - 3, F && F.k > 0.5 ? C[4] : RAIN[r.next() < 0.5 ? 0 : 1]);
  });

  // the bolt: forks down out of the belly on the big flash, and re-strikes once
  if (F && F.big && F.age < 0.2) {
    const strong = F.k > 0.6, main = jagged(rng(S, 2), F.x, 8, F.x + 9, 46, { step: 5, amp: 3.5 });
    for (const b of branches(rng(S, 3), main, { count: 3, len: 14, from: 0.15, to: 0.7 })) p.polyline(b, strong ? C[5] : C[3]);
    zap(p, main, strong ? WHITE : C[5], strong ? C[4] : null);
    glowPath(p, main, 10, C[4], 0.5 * F.k);
  }

  // the cloud: lumpy, lit faintly from above, churning; a flash lights it up from inside
  const puffs = PUFFS.map(([x, y, r], i) => [
    x + 1.2 * loopNoise(ph, 0.7, S + i), y + 1 * loopNoise(ph, 0.7, S + i + 40), r * (1 + 0.06 * loopNoise(ph, 0.9, S + i + 80)),
  ]);
  p.shade(-38, -24, 38, 12, (x, y, out) => {
    let best = 0, lit = 0;
    for (const [px, py, pr] of puffs) {
      const dx = x - px, dy = y - py, d2 = (dx * dx + dy * dy) / (pr * pr);
      if (d2 >= 1) continue;
      const v = 1 - d2;
      if (v > best) (best = v), (lit = (-dx * 0.3 - dy) / pr);
    }
    if (best <= 0 || y > 9) return;
    const n = tileFbm(x * 0.12 + ph * 6, y * 0.18, 6, 0, S, 2);
    let v = 0.18 + lit * 0.3 + best * 0.25 + n * 0.16 - seg(y, 2, 9) * 0.25;
    if (F) {
      const d = Math.hypot(x - F.x, (y - F.y) * 1.4) / (F.big ? 34 : 22), f = F.k * clamp(1 - d) * (0.8 + n);
      if (f > 0.55) return at(C.slice(3, 6), (f - 0.55) * 2.5);
      v += f * 1.1 + (F.big ? 0.22 * F.k : 0.08 * F.k);
    }
    return at(STORM, v);
  });

  if (F) {
    // veins of lightning running through the lit part of the cloud
    if (F.k > 0.6)
      for (let i = 0; i < 2; i++) {
        const r = rng(S, 7, Math.floor(t * 30), i), a = r.range(0, TAU), l = r.range(7, 13);
        const pts = jagged(r, F.x, F.y, F.x + Math.cos(a) * l, F.y + Math.sin(a) * l * 0.5, { step: 3, amp: 1.5 });
        p.polyline(pts, i ? C[5] : WHITE);
      }
    p.glow(F.x, F.y, F.big ? 46 : 30, C[4], 0.4 * F.k);
    p.glow(F.x, F.y + 2, 12, C[5], 0.3 * F.k);
  }
}
