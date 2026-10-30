import { PAL, RAMP, ramp, at, cycle, rand, clamp, loopNoise, tileFbm, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Jetpack",
  desc: "Twin thrusters blast straight down: white-hot cores with flickering shock diamonds inside ragged orange flames, smoke billowing out below.",
  tags: ["scifi", "jetpack", "thrust", "rocket", "fire", "smoke", "flight", "loop"],
  size: [48, 76],
  origin: [24, 10],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, length: 22, gap: 5, seed: 30 },
};

const METAL = ramp(["#15141c", "#2b2936", "#47445a", "#6c6884", "#9a96b0"]);

export function draw(p, t, o) {
  const F = steps(o.palette, 8), SM = RAMP.smoke, S = o.seed, D = meta.duration, ph = t / D, fi = Math.floor(t * 30) % 30;
  const G = o.gap;

  // smoke first, so the flames sit over it: puffs shed off the flame tips, spreading and cooling as they sink
  cycle(t, D, 20, S, (r) => r.range(0.55, 0.85), (age, life, r, i) => {
    const k = age / life, side = i % 2 ? 1 : -1;
    const x = side * G + side * r.range(-0.3, 1) * age * 18, y = o.length * 0.7 + age * r.range(34, 46);
    const rad = (1.6 + 3.6 * Math.sqrt(k)) * (k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25) + 0.3;
    if (Math.abs(x) + rad > 23) return;
    // lit from the flames above: lighter on top, darker below, the whole puff darkening as it cools
    p.circle(x, y, rad, (d, a) => {
      const v = 0.85 - k * 0.65 - Math.sin(a) * d * 0.3;
      return k < 0.12 && d < 0.5 ? F[3] : at(SM.slice(1, 6), v);
    });
  });

  for (const s of [-1, 1]) {
    const cx = s * G, L = o.length * (0.9 + 0.1 * loopNoise(ph, 1.2, S + s)) + (rand(S, fi, s) - 0.5) * 2;
    const knots = rand(S, fi, s, 2) < 0.75;
    // the flame: a narrow cone of heat torn up by noise that streams downward
    p.shade(cx - 5, 0, cx + 5, L + 3, (x, y) => {
      const v = y / L, w = 2.6 + 1.6 * Math.sin(Math.min(1, v * 3) * Math.PI * 0.5) - 3.6 * Math.max(0, v - 0.35);
      if (w <= 0.2) return;
      const dx = Math.abs(x - cx) / w, n = tileFbm((x - cx) * 0.45, y * 0.3 - ph * 12, 0, 12, S + s, 2);
      const heat = (1 - dx * dx) * (1.15 - v * 0.9) + n * 0.35;
      if (heat < 0.1) return;
      // shock diamonds: bright knots down the core
      if (knots && dx < 0.35 && v < 0.6 && Math.abs(((y - 3) % 5) - 2.5) < 0.8 && heat > 0.7) return WHITE;
      return at(F.slice(2), clamp(heat * 0.95));
    });
    p.glow(cx, 4, 12, F[5], 0.4);
    // the nozzle: a steel bell
    p.poly([[cx - 2, -6], [cx + 2, -6], [cx + 3.2, 0], [cx - 3.2, 0]], (x) => (x < cx - 1 ? METAL[3] : x < cx + 1 ? METAL[2] : METAL[1]));
    p.rect(cx - 3, -1, 7, 1, METAL[4]);
    p.rect(cx - 2, -8, 5, 2, METAL[2]);
  }
  p.rect(-G + 2, -8, 2 * G - 3, 2, METAL[1]);

  // embers spat out of the plume
  cycle(t, D, 8, S + 5, (r) => r.range(0.25, 0.45), (age, life, r, i) => {
    const k = age / life, cx = i % 2 ? G : -G, x = cx + r.range(-1, 1) * age * 50, y = 6 + age * r.range(70, 110);
    if (Math.abs(x) > 23) return;
    p.px(x, y, k < 0.4 ? F[6] : k < 0.75 ? F[4] : F[3]);
  });
  p.glow(0, 10, 30, F[4], 0.28 * (0.9 + 0.1 * loopNoise(ph, 2, S)));
}
