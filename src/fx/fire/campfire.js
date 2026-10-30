import { PAL, RAMP, ramp, cycle, fly, loopNoise, rand } from "../../core/index.js";
import { fit, tongue, flames, embers, wisps, pool } from "./_lib.js";

export const meta = {
  name: "Campfire",
  desc: "Two crossed logs with a crackling fire: tongues that lick and sway, popping sparks, embers, smoke wisps and a warm pool of light on the ground.",
  tags: ["fire", "camp", "prop", "light", "ambient", "loop"],
  size: [56, 72],
  origin: [28, 60],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, height: 24, seed: 1 },
};

const BARK = ramp(["#170d0b", "#3a2318", "#5c3a24", "#835a37"]);
const GRAIN = ramp(["#6e4428", "#b4824f", "#e2b77c"]);

// a log lying on the floor from its near end (x0, y0) to its far end (x1, y1), r px thick: outlined, lit
// from above, bark lines along it, charred near the far end with embers glowing in the cracks
function log(p, x0, y0, x1, y1, r, F, flick, S, u0 = 0, u1 = 1.04) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, side = ny > 0 ? -1 : 1;
  p.shade(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, (x, y) => {
    const u = ((x - x0) * dx + (y - y0) * dy) / (L * L), s = (((x - x0) * nx + (y - y0) * ny) / r) * side;
    if (u < u0 || u > u1 || Math.abs(s) > 1) return;
    if (Math.abs(s) > 0.7 || u > 1) return BARK[0];
    const burnt = u > 0.55, along = Math.floor(u * L);
    if (burnt && s > -0.2 && rand(along, Math.round(s * 3), S) > 0.62) return rand(along, S) > 0.5 * flick ? F[4] : F[3];
    if (rand(along >> 1, Math.round(s * 2), S + 3) > 0.8) return BARK[1];
    return s < -0.25 ? BARK[burnt ? 2 : 3] : s < 0.3 ? BARK[burnt ? 1 : 2] : BARK[1];
  });
  // end grain at the near end
  if (u0 === 0) p.ellipse(x0, y0, r * 0.62, r * 0.9, (d) => (d > 0.75 ? GRAIN[0] : d > 0.4 ? GRAIN[1] : GRAIN[2]));
}

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, D = meta.duration, ph = t / D, H = o.height;
  const flick = 0.82 + 0.18 * loopNoise(ph, 2, S + 5);
  // smoke curls up from above the flames, behind everything
  wisps(p, t, D, 4, S + 20, SM, { x: 1, y: -H - 8, w: 2, rise: [8, 12], drift: 5, life: [1.4, 1.9], r0: 1, r1: 2.4, tone: 1 });
  // two logs crossed in an X: their far halves behind the fire, their near halves over its base
  const A = [13.5, -1.5, -10, -12], B = [-13.5, -1.5, 10, -12];
  log(p, ...A, 2.8, F, flick, S + 1, 0.5);
  log(p, ...B, 2.8, F, flick, S + 2, 0.5);
  const T = [
    tongue(0, -7, 6.5, H, ph, S, { beat: 2, sway: 2.6 }),
    tongue(-4.5, -6, 4.2, H * 0.62, ph, S + 11, { beat: 3, sway: 2 }),
    tongue(4.5, -6, 4.4, H * 0.7, ph, S + 23, { beat: 3, sway: 2.2 }),
    tongue(-8, -6, 2.6, H * 0.34, ph, S + 31, { beat: 4, sway: 1.4, pulse: 0.3 }),
    tongue(8.5, -6, 2.6, H * 0.38, ph, S + 47, { beat: 4, sway: 1.4, pulse: 0.3 }),
  ];
  flames(p, T, { F, ph, seed: S, box: [-13, -H - 12, 13, -2], scroll: 20 });
  log(p, ...A, 2.8, F, flick, S + 1, 0, 0.5);
  log(p, ...B, 2.8, F, flick, S + 2, 0, 0.5);
  // crackle: sparks that pop out of the logs and arc down
  cycle(t, D, 4, S + 40, 0.42, (age, life, r) => {
    const q = age / life, vx = r.range(14, 30) * r.sign(), vy = -r.range(45, 70);
    const [x, y] = fly(r.range(-4, 4), -7, vx, vy, age, 220, 0.5);
    if (y > -1) return;
    p.px(x, y, q < 0.4 ? F[7] : q < 0.75 ? F[6] : F[4]);
    p.light(x, y, F[5], 0.6 * (1 - q));
  });
  embers(p, t, D, 9, S + 7, [F[6], F[5], F[3]], F[4], { x: 0, y: -H * 0.6, w: 6, rise: [16, 26], life: [0.9, 1.5] });
  // light: a warm pool on the floor and a glow that breathes with the flames
  pool(p, 0, 0, 27 * flick, 6, F[4], 0.42 * flick);
  p.glow(0, -H * 0.45, 30 * flick, F[4], 0.26 * flick);
  p.glow(0, -8, 10, F[6], 0.3 * flick);
}
