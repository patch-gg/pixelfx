import { PAL, ramp, at, rng, noise, TAU, WHITE } from "../../core/index.js";
import { actorOf, actorPixels } from "./_lib.js";

export const meta = {
  name: "Disintegrate",
  desc: "The character flashes white, then comes apart pixel by pixel from the head down: each bit lights up, lifts off on the wind and winks out.",
  tags: ["spawn", "death", "disintegrate", "dissolve", "pixels", "energy", "one-shot"],
  size: [64, 50],
  origin: [20, 46],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: false,
  options: { palette: PAL.cyber, seed: 26 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, actor = actorOf(o), top = actor.y, H = actor.h;
  const flash = t >= 0.05 && t < 0.12;
  let fx = 0, fy = 0, fn = 0;
  for (const q of actorPixels(actor, C)) {
    const r = rng(S, q.mx, q.my);
    // when this pixel lets go: the head first, the front ragged
    const v = (q.y - top) / H, go = 0.22 + v * 0.78 + noise(q.mx * 0.6 + 3, S) * 0.07 + r.range(-0.05, 0.05);
    const age = t - go;
    if (age < -0.09) {
      p.px(q.x, q.y, flash ? WHITE : q.c);
      continue;
    }
    if (age < 0) {
      // the front: pixels about to go light up first
      p.px(q.x, q.y, age > -0.045 ? at(C, 0.95) : at(C, 0.72));
      (fx += q.x), (fy += q.y), fn++;
      continue;
    }
    const life = r.range(0.45, 0.8), k = age / life;
    if (k >= 1) continue;
    // on the wind: lifting, drifting right faster and faster, fluttering
    const x = q.x + age * r.range(6, 16) + age * age * r.range(20, 40);
    const y = q.y - age * r.range(8, 22) + Math.sin(age * r.range(8, 14) + r.next() * TAU) * 1.2;
    if (k > 0.55 && Math.floor(age * 24 + r.next() * 4) % 3 === 0) continue;
    p.px(x, y, k < 0.2 ? at(C, 0.95) : k < 0.5 ? at(C, 0.75) : at(C, 0.5));
    if (k < 0.35) p.light(x, y, at(C, 0.7), 0.3 * (1 - k));
  }
  if (flash) p.glow(0, -10, 22, at(C, 0.8), 0.4);
  if (fn) p.glow(fx / fn, fy / fn, 12, at(C, 0.75), 0.3);
}
