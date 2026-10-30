import { PAL, RAMP, ramp, at, cycle, rand, loopNoise, WHITE } from "../../core/index.js";
import { smoke, beat, onCanvas, steps } from "./_lib.js";

export const meta = {
  name: "Rocket",
  desc: "A rocket in flight: a roaring jet flickering out of the nozzle, a billowing smoke trail streaming back and spreading, sparks spat into it.",
  tags: ["projectile", "rocket", "missile", "explosive", "smoke", "directional", "loop"],
  size: [100, 30],
  origin: [92, 15],
  duration: 0.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, seed: 7 },
};

const BODY = [
  "dd...........",
  ".dd..........",
  "ommmllllllrr.",
  "ommmmmmmmmrrR",
  "ommsssssssrr.",
  ".dd..........",
  "dd...........",
];
const BODY_PAL = { d: "#4a5468", o: "#1c2230", m: "#6e7a90", l: "#aab4c6", s: "#4a5468", r: "#c42a30", R: "#ff6a5a" };

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 8), S = o.seed, D = meta.duration, ph = t / D, inside = onCanvas(meta, 1);
  const step = Math.floor(ph * 18) % 18, J = 8 + rand(S, step) * 5; // the jet's length jumps every frame
  // smoke: puffs leave the nozzle, stream back, swell, rise a little and thin out
  const list = [];
  beat(t, D, 18, S, (r) => r.range(0.5, 0.6), (age, life, r) => {
    const u = age / life;
    list.push({
      x: -15 - J * 0.4 - age * r.range(104, 116), y: 0.5 + r.range(-1, 1) * (0.5 + u * 3) - u * u * r.range(2, 6),
      r: 1.8 + u * r.range(3.4, 4.8), v: (1 - u) ** 0.8,
    });
  });
  smoke(p, list, RAMP.smoke, { base: 0.5, seed: S, inside });
  // the jet: white at the nozzle, cooling to red at a ragged tip
  const F = [C[3], C[4], C[5], C[6], C[7] ?? WHITE];
  p.shade(-13 - J - 1, -3, -12, 4, (x, y) => {
    const v = (-12.5 - x) / J;
    if (v < 0 || v > 1) return;
    const w = 2.4 * Math.pow(1 - v, 0.75) + 0.3, dy = Math.abs(y - 0.5);
    if (dy > w) return;
    const heat = (1 - v) * (1.15 - 0.55 * (dy / w)) + 0.12 * loopNoise(ph * 3 - Math.floor(ph * 3), 1, S + Math.round(x));
    return heat > 0.95 ? WHITE : at(F, heat);
  });
  // sparks spat out of the jet
  cycle(t, D, 6, S + 1, (r) => r.range(0.12, 0.22), (age, life, r) => {
    const k = age / life, x = -16 - age * r.range(90, 150), y = 0.5 + r.sign() * age * r.range(10, 30);
    p.px(x, y, k < 0.4 ? at(C, 0.9) : at(C, 0.62));
  });
  p.sprite(BODY, BODY_PAL, -12, -3);
  // light: the jet's glow flickers with its length
  const fl = 0.8 + 0.2 * (J - 8) / 5;
  p.glow(-15, 0.5, 18, at(C, 0.62), 0.35 * fl);
  p.glow(-13, 0.5, 6, at(C, 0.9), 0.35 * fl);
}
