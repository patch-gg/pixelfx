import { PAL, ramp, fit, at, cycle, tileFbm, loopNoise, clamp, TAU } from "../../core/index.js";

export const meta = {
  name: "Torch",
  desc: "A wall torch: a licking flame on a wooden handle, rising embers, warm flickering light.",
  tags: ["fire", "light", "prop", "ambient"],
  size: [36, 64],
  origin: [18, 44],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, handle: true, height: 22, seed: 1 },
};

const WOOD = ramp(["#2a160c", "#4a2a16", "#6e4222", "#8e5a30"]);
const IRON = ramp(["#1b1a22", "#34323f", "#55525f", "#807c8a"]);

export function draw(p, t, o) {
  const F = fit(o.palette, 8), S = o.seed, D = meta.duration, ph = t / D;
  const H = o.height * (0.9 + 0.1 * loopNoise(ph, 1.4, S));
  const body = F.slice(2, 7); // dark red edge .. yellow; the palest step is kept for the base of the core
  // the flame: a teardrop of heat, wide at the base, torn into tongues at the top by rising noise
  p.shade(-10, -H - 8, 10, 2, (x, y) => {
    const v = clamp(-y / H, 0, 1.4);
    const sway = (Math.sin(ph * TAU * 2 + v * 2.4) * 0.8 + loopNoise(ph, 0.8, S + 3)) * v * v * 2.4;
    const w = 6.4 * (v < 0.2 ? Math.sqrt(Math.max(0, 1 - ((0.2 - v) / 0.28) ** 2)) : Math.pow(Math.max(0, 1 - (v - 0.2) / 0.85), 0.7));
    if (w <= 0.3) return;
    const d = Math.abs(x - sway) / w;
    const n = tileFbm(x * 0.36, y * 0.24 + ph * 12, 0, 12, S, 3);
    const heat = (1 - Math.pow(d, 1.6)) * (1.08 - v * 0.8) + n * (0.3 + v * 0.35);
    if (heat < 0.12) return;
    if (heat > 1.02 && v < 0.35) return F[7];
    return at(body, (heat - 0.12) / 0.92);
  });
  // tongues tear off the tip and rise, shrinking and cooling
  cycle(t, D, 4, S + 7, 0.36, (age, life, r) => {
    const k = age / life, x = r.range(-3, 3) + Math.sin(k * 4 + r.next() * 6) * 1.6, y = -H * 0.78 - k * 11;
    const s = (1 - k) * r.range(1.3, 2);
    p.ellipse(x, y, s * 0.75, s * 1.5, k < 0.45 ? F[4] : F[3]);
    if (k < 0.3) p.px(x, y, F[5]);
  });
  // embers: single pixels drifting up and sideways, flickering out
  cycle(t, D, 7, S + 11, (r) => r.range(0.7, 1.2), (age, life, r) => {
    const k = age / life, x = r.range(-4, 4) + Math.sin(age * r.range(4, 8) + r.next() * TAU) * 3 * k, y = -H * 0.55 - age * r.range(16, 28);
    if (k > 0.5 && Math.sin(age * 38 + r.next() * 9) < -0.5) return;
    p.px(x, y, k < 0.35 ? F[5] : k < 0.7 ? F[4] : F[3]);
    p.light(x, y, F[4], 0.6 * (1 - k));
  });
  // light: a warm pool that breathes with the flame
  const flick = 0.82 + 0.18 * loopNoise(ph, 2, S + 5);
  p.glow(0, -H * 0.4, 28 * flick, F[4], 0.3 * flick);
  p.glow(0, -H * 0.3, 10, F[6], 0.3 * flick);
  if (!o.handle) return;
  // handle: iron cup on a wooden stick
  for (let y = 3; y < 17; y++) for (let x = -1; x <= 1; x++) p.px(x, y, WOOD[x === -1 ? 3 : x === 0 ? 2 : 1]);
  p.px(-1, 17, WOOD[1]), p.px(0, 17, WOOD[0]);
  for (let x = -5; x <= 5; x++) p.px(x, 0, IRON[Math.abs(x) === 5 ? 1 : x < 0 ? 3 : 2]);
  for (let x = -4; x <= 4; x++) p.px(x, 1, IRON[x < 0 ? 2 : 1]);
  for (let x = -3; x <= 3; x++) p.px(x, 2, IRON[1]);
  for (let x = -2; x <= 2; x++) p.px(x, 7, IRON[x < 0 ? 2 : 1]);
}
