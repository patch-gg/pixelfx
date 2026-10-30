import { ramp, cycle, clamp, tileFbm, loopNoise, TAU } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Spirit flame",
  desc: "A ghostly blue-teal flame floating in the air: a slow wave running up its wispy tail, curls breaking off and drifting away, motes rising.",
  tags: ["fire", "spirit", "ghost", "wisp", "magic", "floating", "loop"],
  size: [40, 60],
  origin: [20, 46],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0c0a2a", "#182462", "#1e4d9a", "#2584c4", "#38bede", "#7ceeea", "#d2fff6", "#ffffff"], height: 26, seed: 9 },
};

export function draw(p, t, o) {
  const C = fit(ramp(o.palette)), S = o.seed, D = meta.duration, ph = t / D, H = o.height;
  const bob = Math.sin(ph * TAU) * 2, by = bob; // it floats: the whole flame rises and sinks
  const body = [C[2], C[3], C[4], C[5], C[6]];
  // curls that break off the tip and drift up, shrinking away
  cycle(t, D, 5, S + 3, (g) => g.range(0.8, 1.2), (age, life, r) => {
    const q = age / life, x = Math.sin(age * 3 + r.next() * TAU) * 3 + r.range(-2, 2), y = by - H * 0.85 - age * r.range(10, 16);
    const s = (1 - q) * r.range(1.4, 2.2);
    if (s < 0.5) return;
    p.ellipse(x, y, s * 0.7, s * 1.4, q < 0.4 ? C[5] : C[4]);
    if (q < 0.3) p.px(x, y, C[6]);
    p.light(x, y, C[4], 0.3 * (1 - q));
  });
  // the flame: a teardrop whose tail carries a slow S-wave upward. Lit from its rim like a ghost: a bright
  // edge, a dim hollow body, a white heart low down
  p.shade(-12, by - H - 8, 12, by + 4, (x, y) => {
    const v = (by - y) / H;
    if (v < -0.12 || v > 1.1) return;
    const w = 6.5 * (v < 0.22 ? Math.sqrt(clamp(1 - ((0.22 - v) / 0.34) ** 2)) : Math.pow(clamp(1 - (v - 0.22) / 0.9), 0.85));
    if (w < 0.3) return;
    const sway = (Math.sin(v * 4.2 - ph * TAU * 2) * 2.6 + loopNoise(ph, 0.7, S) * 1.2) * v * v;
    const d = Math.abs(x - sway) / w;
    const n = tileFbm(x * 0.3, y * 0.18 + ph * 6, 0, 6, S, 2);
    const heat = (1 - Math.pow(d, 1.8)) * (1.05 - v * 0.75) + n * (0.22 + v * 0.4);
    if (heat < 0.14) return;
    if (heat < 0.3) return v > 0.75 ? C[4] : C[5]; // the rim
    const core = Math.hypot(x - sway, (y - by + 3.5) * 0.7) / 2.8;
    if (core < 0.6) return C[7];
    if (core < 1) return C[6];
    if (heat < 0.46) return C[4];
    return heat > 0.8 && v < 0.35 ? C[3] : C[2]; // a hollow, darker heart
  });
  // motes drifting up around it, twinkling
  cycle(t, D, 10, S + 7, (g) => g.range(1, 1.6), (age, life, r) => {
    const q = age / life, x = r.range(-12, 12) + Math.sin(age * 2 + r.next() * TAU) * 2, y = by + r.range(-6, 4) - age * r.range(8, 14);
    if (Math.sin(age * 20 + r.next() * TAU) < -0.3) return;
    p.px(x, y, q < 0.5 ? C[6] : C[4]);
    p.light(x, y, C[5], 0.35 * (1 - q));
  });
  const pulse = 0.88 + 0.12 * Math.sin(ph * TAU * 2);
  p.glow(0, by - H * 0.35, 26, C[4], 0.3 * pulse);
  p.glow(0, by - 3, 8, C[6], 0.3 * pulse);
}
