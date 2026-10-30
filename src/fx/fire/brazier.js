import { PAL, ramp, rand, loopNoise } from "../../core/index.js";
import { fit, tongue, flames, embers, pool } from "./_lib.js";

export const meta = {
  name: "Brazier",
  desc: "An iron bowl on a tripod stand holding a big, lively fire: tall licking tongues, glowing coals at the rim, sparks streaming up.",
  tags: ["fire", "brazier", "prop", "light", "dungeon", "loop"],
  size: [52, 92],
  origin: [26, 88],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, height: 34, seed: 3 },
};

const IRON = ramp(["#100f15", "#24222c", "#383542", "#55515f", "#7a7585"]);

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), S = o.seed, D = meta.duration, ph = t / D, H = o.height;
  const flick = 0.82 + 0.18 * loopNoise(ph, 2, S + 5), rim = -36;
  // stand: a back leg in shadow, two splayed front legs, a brace ring
  p.line(0, rim + 8, 0, -2, IRON[1]);
  p.beam(-7, rim + 8, -13, -1, 2.4, (u, v) => (v > 0.6 ? IRON[0] : IRON[2]));
  p.beam(7, rim + 8, 13, -1, 2.4, (u, v) => (v > 0.6 ? IRON[0] : IRON[1]));
  p.rect(-15, -1, 4, 1, IRON[2]), p.rect(11, -1, 4, 1, IRON[1]);
  p.line(-10, -14, 10, -14, IRON[1]);
  p.line(-10, -15, 10, -15, IRON[2]);
  // coals heaped above the rim, glowing in and out
  for (let x = -11; x <= 11; x++) {
    const h = 1 + Math.round(2 * (1 - Math.abs(x) / 12) + rand(x, S) * 1.2);
    for (let y = 0; y < h; y++) {
      const g = rand(x, y, S + 1) + 0.25 * Math.sin(ph * 6.283 * 2 + x * 1.3);
      p.px(x, rim - 1 - y, g > 0.75 ? F[5] : g > 0.4 ? F[4] : g > 0.15 ? F[3] : F[2]);
    }
  }
  // the fire
  const T = [
    tongue(0, rim - 1, 8, H, ph, S, { beat: 3, sway: 3 }),
    tongue(-6, rim, 5.5, H * 0.66, ph, S + 13, { beat: 3, sway: 2.6 }),
    tongue(6.5, rim, 5.5, H * 0.72, ph, S + 29, { beat: 2, sway: 2.6 }),
    tongue(-10.5, rim + 1, 3.4, H * 0.36, ph, S + 41, { beat: 4, sway: 1.6, pulse: 0.3 }),
    tongue(10.5, rim + 1, 3.4, H * 0.4, ph, S + 53, { beat: 4, sway: 1.6, pulse: 0.3 }),
  ];
  flames(p, T, { F, ph, seed: S, box: [-17, rim - H - 12, 17, rim + 2], scroll: 14, tear: 1.1 });
  // the bowl: a wide iron dish with a rolled rim catching the firelight
  p.shade(-14, rim, 14, rim + 9, (x, y) => {
    const dx = x / 14, dy = (y - rim) / 9, d = dx * dx + dy * dy;
    if (d > 1) return;
    if (d > 0.72) return IRON[0];
    return dy < 0.3 ? IRON[3] : dy < 0.62 ? IRON[2] : IRON[1];
  });
  for (let x = -14; x <= 14; x++) p.px(x, rim, Math.abs(x) > 12 ? IRON[2] : (x + 20) % 7 === 0 ? IRON[1] : F[3]);
  for (let x = -15; x <= 15; x++) p.px(x, rim + 1, Math.abs(x) === 15 ? IRON[1] : x < 3 ? IRON[4] : IRON[3]);
  for (const x of [-8, 0, 8]) p.px(x, rim + 4, IRON[4]);
  // sparks streaming up
  embers(p, t, D, 12, S + 7, [F[7], F[5], F[3]], F[4], { x: 0, y: rim - H * 0.5, w: 8, rise: [24, 38], life: [0.45, 0.8], wob: 4 });
  // light
  p.glow(0, rim - H * 0.4, 36 * flick, F[4], 0.28 * flick);
  p.glow(0, rim - 6, 12, F[6], 0.32 * flick);
  pool(p, 0, 0, 18, 3, F[4], 0.25 * flick);
}
