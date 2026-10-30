import { PAL, cycle, ease, bump, WHITE } from "../../core/index.js";
import { Layer, shadow, twinkle, bob, pillow, heartSdf, fit } from "./_lib.js";

export const meta = {
  name: "Heart pickup",
  desc: "A plump red heart floating over its shadow, beating lub-dub with a squash on each beat, tiny hearts drifting off it.",
  tags: ["pickup", "heart", "health", "life", "loop"],
  size: [36, 42],
  origin: [18, 38],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.blood, shadow: true, seed: 4 },
};

const L = new Layer(40, 40);
const MINI = [".a.a.", "abbba", ".aba.", "..a.."];

// tiny hearts float off from behind it and fade
export function drawBack(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, cy = Math.round(-17 + bob(ph, 1.5));
  cycle(t, meta.duration, 3, o.seed, 0.85, (age, life, r, i) => {
    const side = i % 2 ? 1 : -1, k = age / life;
    const x = side * r.range(6, 12) + Math.sin(age * 7 + r.next() * 6) * 1.5, y = cy - 4 - age * r.range(12, 16);
    if (k > 0.75 && Math.floor(age * 30) % 2) return;
    p.sprite(MINI, { a: k < 0.5 ? C[4] : C[3], b: k < 0.4 ? C[6] : C[5] }, Math.round(x) - 2, Math.round(y) - 2);
  });
}

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  // lub-dub: a big fast swell, a smaller echo, then rest
  const beat = 0.2 * ease.outQuad(bump(ph, 0, 0.16)) + 0.1 * bump(ph, 0.2, 0.34);
  const w = 7.5 * (1 + beat), h = 7.5 * (1 + beat * 0.55);
  const cy = Math.round(-17 + bob(ph, 1.5));
  L.begin(-16, cy - 14);
  pillow(L, -13, cy - 12, 13, cy + 12, (x, y) => heartSdf(x, y, 0, cy, w, h), (b, e) => {
    if (b > 0.93 && e > 1) return WHITE;
    return b > 0.8 ? C[6] : b > 0.55 ? C[5] : b > 0.3 ? C[4] : b > 0.1 ? C[3] : C[2];
  }, { bevel: 3.5 });
  L.outline(C[1]);
  L.draw(p);
  const g = bump(ph, 0.04, 0.3);
  if (g > 0) twinkle(p, -4, cy - 5, 1 + Math.round(g * 2.4), C[5], C[6]);
  p.glow(0, cy, 20 + 8 * beat, C[4], 0.12 + 0.5 * beat);
  if (o.shadow) shadow(p, 0, 6 + bob(ph, 0.6) + beat * 6);
}
