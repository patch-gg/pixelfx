import { PAL, RAMP, ramp, at, cycle, tileFbm, loopNoise, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Fire breath",
  desc: "A roaring cone of fire blowing right: white-hot at the mouth, billows rolling out and widening, edges choking into smoke.",
  tags: ["fire", "breath", "dragon", "cone", "directional", "loop"],
  size: [104, 68],
  origin: [4, 34],
  duration: 0.8,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, length: 92, spread: 0.25, seed: 7 },
};

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, D = meta.duration, ph = t / D, L = o.length, k = o.spread;
  const FIRE = [F[2], F[3], F[4], F[5], F[6], F[7], WHITE];
  const roar = 0.92 + 0.08 * loopNoise(ph, 1.2, S);
  // smoke puffs boiling off the far end and the edges, rising as they go
  cycle(t, D, 8, S + 2, (g) => g.range(0.45, 0.7), (age, life, r) => {
    const q = age / life, side = r.sign(), x0 = r.range(L * 0.5, L * 0.85);
    const x = x0 + age * r.range(30, 50), y = side * (2 + x0 * k * 0.8) - age * r.range(14, 24) + side * age * 6;
    const rad = r.range(3, 4.5) * (q < 0.4 ? 0.5 + q * 1.25 : (1 - (q - 0.4) / 0.6) ** 0.6);
    if (rad < 0.6 || x + rad > L + 6 || Math.abs(y) + rad > 32) return;
    p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.4 ? SM[3] : d < 0.8 ? SM[2] : SM[1]));
  });
  // the cone: heat falls off across and along it, big billows rolling outward with the noise
  p.shade(0, -L * k - 6, L + 4, L * k + 6, (x, y) => {
    const u = x / L;
    if (u > 1.06) return;
    const n = tileFbm(x * 0.085 - ph * 8, y * 0.14, 8, 0, S, 2);
    const w = (2.2 + x * k) * roar * (1 + 0.35 * n);
    const d = Math.abs(y + Math.sin(x * 0.07 - ph * TAU * 2) * u * 2.5) / w;
    if (d > 1.3) return;
    const heat = (1 - Math.pow(d, 1.6)) * (1.15 - u * 0.9) + n * (0.2 + u * 0.3) - Math.max(0, u - 0.85) * 2.5;
    // the outer, cooler fringe chokes into smoke along the back half of the cone
    if (heat < 0.1) return heat > -0.14 && u > 0.4 ? (heat > -0.03 && y < 0 ? SM[3] : SM[2]) : undefined;
    return at(FIRE, heat);
  });
  // embers flung forward along the cone
  cycle(t, D, 12, S + 5, (g) => g.range(0.3, 0.5), (age, life, r) => {
    const q = age / life, a = r.range(-k, k) * 0.9, sp = r.range(110, 170);
    const x = Math.cos(a) * sp * age, y = Math.sin(a) * sp * age - age * age * 30;
    if (x > L + 4 || Math.abs(y) > 32) return;
    p.px(x, y, q < 0.4 ? F[7] : q < 0.7 ? F[5] : F[3]);
    p.light(x, y, F[5], 0.5 * (1 - q));
  });
  p.glowLine(4, 0, L * 0.75, 0, 22, F[4], 0.3 * roar);
  p.glow(4, 0, 12, F[6], 0.45);
}
