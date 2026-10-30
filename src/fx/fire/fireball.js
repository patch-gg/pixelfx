import { PAL, RAMP, ramp, at, cycle, clamp, tileFbm, tileNoise, loopNoise, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Fireball",
  desc: "A fireball flying right: a churning white-hot head, flames streaming back into a torn tail, smoke puffs and sparks left behind.",
  tags: ["fire", "projectile", "spell", "directional", "loop"],
  size: [88, 36],
  origin: [68, 18],
  duration: 0.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, radius: 6.5, length: 48, seed: 6 },
};

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, D = meta.duration, ph = t / D, R = o.radius, L = o.length;
  const body = [F[2], F[3], F[4], F[5], F[6], F[7]];
  // smoke left behind: dark puffs that fall back fast, swell and shrink away
  cycle(t, D, 4, S + 3, (g) => g.range(0.35, 0.5), (age, life, r) => {
    const q = age / life, x = -L * 0.6 - age * r.range(60, 80), y = r.range(-3, 3) + Math.sin(age * 9 + r.next() * TAU) * 1.5 - age * 8;
    const rad = r.range(2.2, 3.4) * (q < 0.4 ? 0.6 + q : 1.0 * (1 - (q - 0.4) / 0.6) ** 0.6);
    if (rad < 0.7) return;
    p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.6 ? SM[3] : d < 0.8 ? SM[2] : SM[1]));
  });
  // the tail: a plume that narrows and cools away from the head, its noise streaming back and tearing
  // licks off its edges
  p.shade(-L - 2, -R - 7, R * 0.5, R + 7, (x, y) => {
    const u = clamp(-x / L); // 0 at the head, 1 at the end of the tail
    const wave = Math.sin(x * 0.16 + ph * TAU * 2) * 2 * u;
    const w = (R + 1) * (1.04 - u) ** 0.6 + 0.5;
    const d = Math.abs(y - wave) / w;
    if (d > 1.5) return;
    const n = tileFbm(x * 0.16 + ph * 10, y * 0.3, 10, 0, S, 2);
    const heat = (1 - d * d) * (1.15 - u * 1.05) + n * (0.3 + u * 0.35);
    if (heat < 0.1) return;
    return at(body, heat * 0.95);
  });
  // the head: a lumpy ball churning inside, white-hot at the front
  const wob = (a) => 1 + 0.12 * tileNoise((a / TAU) * 8 + ph * 8, ph * 2, 8, 2, S + 9);
  p.shade(-R - 2, -R - 2, R + 2, R + 2, (x, y) => {
    const a = Math.atan2(y, x), d = Math.hypot(x, y) / (R * wob(a));
    if (d > 1) return;
    const n = tileFbm(x * 0.4 + ph * 6, y * 0.4, 6, 0, S + 4, 2) * 0.22;
    const core = Math.hypot(x - R * 0.3, y + R * 0.15) / R;
    const h = 1.15 - core * 0.85 + n - (d > 0.82 ? 0.25 : 0);
    return h > 0.95 ? WHITE : at(body, h);
  });
  // sparks peeling off the head and whipping back
  cycle(t, D, 9, S + 5, (g) => g.range(0.2, 0.32), (age, life, r) => {
    const q = age / life, a = r.range(-2.4, 2.4), x = Math.cos(a) * R * 0.8 - age * r.range(110, 160);
    const y = Math.sin(a) * R * 0.8 + Math.sign(Math.sin(a)) * age * r.range(10, 30);
    p.px(x, y, q < 0.4 ? F[7] : q < 0.7 ? F[5] : F[3]);
    p.light(x, y, F[5], 0.5 * (1 - q));
  });
  const pulse = 0.9 + 0.1 * loopNoise(ph, 1.5, S);
  p.glow(-4, 0, 26 * pulse, F[4], 0.32 * pulse);
  p.glow(R * 0.3, 0, R + 4, F[6], 0.4);
  p.glowLine(-L * 0.6, 0, 0, 0, 9, F[4], 0.18);
}
