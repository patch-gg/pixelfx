import { PAL, RAMP, ramp, at, cycle, smooth, wrap, tileFbm, fly, TAU, WHITE, hex } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Flamethrower",
  desc: "A pressurised jet shooting right: a blue-white core at the nozzle, surges racing down a drooping stream, a sputter, burning drips.",
  tags: ["fire", "flamethrower", "jet", "weapon", "directional", "loop"],
  size: [112, 48],
  origin: [4, 20],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, length: 96, seed: 8 },
};

const BLUE = [hex("#2438a8"), hex("#4f7cff"), hex("#b8dcff")];

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, D = meta.duration, ph = t / D, L = o.length;
  const FIRE = [F[2], F[3], F[4], F[5], F[6], F[7], WHITE];
  const V = 190; // how fast the stream travels, px/s
  // nozzle pressure as a function of when the fuel left it: steady surges, and a short sputter once a loop
  const pressure = (e) => {
    const q = wrap(e / D, 1);
    const surge = 0.82 + 0.18 * Math.sin(q * TAU * 4);
    const sput = 1 - 0.85 * smooth(0.55, 0.6, q) * (1 - smooth(0.66, 0.72, q));
    return surge * sput;
  };
  // the stream droops under its own weight, then the slowing tip curls up as the burning gas rises
  const droop = (x) => x * x * 0.0016 - Math.max(0, x - L * 0.62) ** 2 * 0.012;
  // smoke boiling off the end of the stream
  cycle(t, D, 7, S + 2, (g) => g.range(0.45, 0.65), (age, life, r) => {
    const q = age / life, x = L * r.range(0.75, 0.95) + age * r.range(10, 25), y = droop(L * 0.85) - 6 - age * r.range(16, 26);
    const rad = r.range(3, 4.5) * (q < 0.4 ? 0.5 + q * 1.25 : (1 - (q - 0.4) / 0.6) ** 0.6);
    if (rad < 0.6 || y - rad < -17) return;
    p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.4 ? SM[3] : d < 0.8 ? SM[2] : SM[1]));
  });
  // the jet: narrow and hard at the nozzle, swelling and churning as it slows, each slice as strong as the
  // pressure was when it left the nozzle, so surges and the sputter travel down the stream
  p.shade(0, -16, L + 6, 22, (x, y) => {
    const u = x / L;
    if (u > 1.05) return;
    const s = pressure(t - x / V), n = tileFbm(x * 0.1 - ph * 24, y * 0.22, 24, 0, S, 2);
    const w = (0.8 + x * 0.1) * (0.35 + 0.65 * s) * (1 + 0.3 * n * u * 2) * (1 + Math.max(0, u - 0.6) * 1.6);
    const d = Math.abs(y - droop(x)) / w;
    if (d > 1.3) return;
    if (x < 13 && d < 0.55 && s > 0.4) return x < 4 ? BLUE[2] : d < 0.25 ? WHITE : BLUE[1];
    if (x < 8 && d < 1) return BLUE[0];
    const heat = (1 - d * d) * (1.1 - u * 0.8) * (0.55 + 0.45 * s) + n * (0.2 + u * 0.3) - Math.max(0, u - 0.9) * 3;
    if (heat < 0.1) return;
    return at(FIRE, heat * 1.02);
  });
  // burning fuel dripping off the stream and falling away
  cycle(t, D, 8, S + 5, (g) => g.range(0.3, 0.45), (age, life, r) => {
    const q = age / life, x0 = r.range(L * 0.3, L * 0.8);
    const [x, y] = fly(x0, droop(x0) + 2, V * 0.35, r.range(-10, 10), age, 260, 1);
    if (y > 23) return;
    p.px(x, y, q < 0.4 ? F[6] : q < 0.75 ? F[5] : F[3]);
    if (q < 0.5) p.px(x, y - 1, F[4]);
    p.light(x, y, F[5], 0.5 * (1 - q));
  });
  const s0 = pressure(t);
  p.glowLine(6, 0, L * 0.8, droop(L * 0.8), 18, F[4], 0.28);
  p.glow(2, 0, 10, BLUE[1], 0.5 * s0);
}
