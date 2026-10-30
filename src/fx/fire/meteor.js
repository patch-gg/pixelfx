import { PAL, RAMP, ramp, at, seg, ease, clamp, burst, stream, fbm, noise2, rand, lerp, WHITE, hex } from "../../core/index.js";
import { fit, pool } from "./_lib.js";
import { billow, sparks, debris, shock, flash } from "../explosions/_lib.js";

export const meta = {
  name: "Meteor",
  desc: "A burning rock streaks down from the top left trailing fire and smoke, slams into the ground in a white flash, throws rock and flame, leaves a glowing crater.",
  tags: ["fire", "meteor", "impact", "spell", "ground", "one-shot"],
  size: [128, 116],
  origin: [84, 98],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, seed: 16 },
};

const ROCK = [hex("#160f14"), hex("#33242a"), hex("#54393a")];
const HIT = 0.38, X0 = -70, Y0 = -84;

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, DU = RAMP.dust, S = o.seed;
  const FIRE = [F[2], F[3], F[4], F[5], F[6], F[7], WHITE];
  const L0 = Math.hypot(X0, Y0), dx = -X0 / L0, dy = -Y0 / L0; // the direction of travel
  const pos = (tt) => { const s = Math.pow(clamp(tt / HIT), 1.2); return [lerp(X0, 0, s), lerp(Y0, -3, s)]; };
  // ---- smoke left along the path: puffs that hang, swell and thin away
  stream(t, 0.04, HIT, 70, S + 1, (g) => g.range(0.4, 0.6), (age, life, r) => {
    const [x, y] = pos(t - age), q = age / life, rad = r.range(2.6, 3.8) * (q < 0.3 ? 0.6 + q * 1.4 : 1.02 * (1 - (q - 0.3) / 0.7) ** 0.6);
    if (rad > 0.6) p.circle(x + r.range(-2, 2), y - age * 8, rad, (d, a) => (d < 0.5 && a < -0.5 ? SM[3] : d < 0.85 ? SM[2] : SM[1]));
  });
  if (t < HIT) {
    const [mx, my] = pos(t);
    // the trail: fire streaming back from the rock, cooling and tearing as it goes
    const TL = 42 * seg(t, 0, 0.14) + 2; // the trail grows in as the rock enters
    p.shade(mx - TL - 4, my - TL - 4, mx + 6, my + 6, (x, y) => {
      const rx = x - mx, ry = y - my, a = -(rx * dx + ry * dy), c = rx * -dy + ry * dx;
      if (a < -2 || a > TL) return;
      const u = clamp(a / TL), w = 5 * (1.02 - u) ** 0.6 + 0.4, n = fbm(a * 0.18 - t * 30, c * 0.35, S, 2);
      const d = Math.abs(c + Math.sin(a * 0.25 - t * 30) * u * 1.5) / w;
      if (d > 1.4) return;
      const heat = (1 - d * d) * (1.15 - u * 1.05) + n * (0.3 + u * 0.3);
      return heat < 0.1 ? undefined : at(FIRE, heat * 0.95);
    });
    // the rock: dark, cracked, white-hot along its leading face
    p.shade(mx - 5, my - 5, mx + 5, my + 5, (x, y) => {
      const rx = x - mx, ry = y - my, d = Math.hypot(rx, ry) / (4.2 + noise2(Math.atan2(ry, rx) * 2, 0, S) * 0.6);
      if (d > 1) return;
      const face = (rx * dx + ry * dy) / 4.2;
      if (face > 0.45 && d > 0.55) return face > 0.7 ? WHITE : F[6];
      if (rand(Math.floor(x), Math.floor(y), S + 2) > 0.8) return F[4];
      return d > 0.8 ? ROCK[0] : rx + ry < 0 ? ROCK[2] : ROCK[1];
    });
    p.glow(mx, my, 16, F[4], 0.45);
    p.glow(mx + dx * 2, my + dy * 2, 7, F[6], 0.4);
    return;
  }
  const age = t - HIT;
  // ---- the crater: a dark bowl in the floor with a molten rim that cools and fades
  const cool = seg(age, 0.1, 1.2), gone = 1 - seg(t, 1.45, 1.8);
  p.shade(-16, -2, 16, 3, (x, y, out) => {
    const d = Math.hypot(x / 15, (y - 0.5) / 2.6);
    if (d > 1) return;
    out.a = gone;
    if (d > 0.72) return at([F[5], F[4], F[3], F[2], ROCK[1]], cool + (rand(Math.floor(x), S) - 0.5) * 0.3);
    return d > 0.4 ? ROCK[1] : ROCK[0];
  });
  // ---- debris rocks thrown out of the crater, bouncing on the floor
  debris(p, age, 10, S + 3, [ROCK[2], ROCK[1]], { a: -Math.PI / 2, spread: 1.1, sp: [55, 110], g: 340, life: [0.9, 1.3], size: [1, 3], floor: 0 });
  debris(p, age, 14, S + 4, [DU[4], DU[3]], { a: -Math.PI / 2, spread: 1.3, sp: [40, 100], g: 320, life: [0.6, 1], size: [1, 1], floor: 0 });
  // ---- the fireball: thrown up and forward with the rock's momentum, cooling into rising smoke
  const fire = [], smoke = [];
  burst(13, S + 5, (r, i) => {
    const a = -Math.PI / 2 + r.range(-1.25, 1.25) + 0.2, reach = (i < 2 ? r.range(0, 4) : r.range(7, 20)) * ease.outCubic(seg(age, 0, 0.3));
    const L = r.range(0.8, 1.2), q = clamp(age / L);
    if (q >= 1) return;
    const x = Math.cos(a) * reach * 1.3, y = -4 + Math.sin(a) * reach * 0.9 - age * age * 22, r0 = r.range(6, 10) * (0.6 + 0.6 * ease.outCubic(seg(age, 0, 0.25)));
    fire.push({ x, y, r: r0 * (1 - 0.5 * seg(q, 0.15, 0.6)), v: 1 - seg(q, 0.05, 0.6) });
    smoke.push({ x, y: y - q * q * 18, r: r0 * (1 + 0.8 * q), v: seg(q, 0.1, 0.35) * (1 - seg(q, 0.6, 1)) });
  });
  billow(p, smoke, (v, lit, x, y, out) => {
    if (v < 0.06) return;
    out.a = clamp(v * 4);
    return at(SM.slice(1, 6), 0.25 + lit * 0.3 + v * 0.35 + noise2(x * 0.4, y * 0.4, S) * 0.1);
  });
  billow(p, fire, (v, lit, x, y, out) => {
    if (v < 0.08) return;
    out.k = v * 0.25;
    return at(FIRE, v * 0.95 + lit * 0.12 + noise2(x * 0.5, y * 0.5, S + 1) * 0.1);
  });
  sparks(p, age, 18, S + 6, [F[7], F[5], F[3]], { floor: 0, y: -3, a: -Math.PI / 2, spread: 1.45, sp: [80, 150], life: [0.35, 0.6], g: 200, up: 20 });
  shock(p, age, 0, 0, 0, 0.28, 6, 36, F[5], F[4], { sy: 0.16, k: 0.3 });
  flash(p, age, 0, -4, 0, 0.07, 9, F[6], { R: 34, k: 0.9, grow: 50 });
  const L = 1 - seg(age, 0, 0.7);
  p.glow(0, -14, 38, F[5], 0.5 * L * L);
  pool(p, 0, 0, 30, 5, F[4], 0.45 * (1 - cool) * gone);
}
