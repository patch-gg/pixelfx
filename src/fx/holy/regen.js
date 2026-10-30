import { PAL, cycle, seg, bump, ease, WHITE } from "../../core/index.js";
import { fit, plus } from "./_lib.js";

export const meta = {
  name: "Regen",
  desc: "Steady regeneration: the body beats green twice, a wave of light climbs through it with each beat, small crosses and motes float up beside it.",
  tags: ["holy", "heal", "regen", "hot", "buff", "character", "loop"],
  size: [44, 48],
  origin: [22, 42],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.heal, seed: 42 },
};

const BEATS = [0, 0.2]; // lub-dub, then a long rest

export function drawBack(p, t, o) {
  const C = fit(o.palette);
  // a soft green pool behind the body that swells on each beat
  let beat = 0;
  for (const b of BEATS) beat = Math.max(beat, bump(t, b, b + 0.3));
  p.glowLine(0, 0, 0, -20, 9, C[4], 0.12 + 0.2 * beat);
}

export function draw(p, t, o) {
  const C = fit(o.palette), A = o.actor, S = o.seed;
  // each beat: the outline flashes, and a wave of light climbs the body from the feet to the head
  for (const [i, b] of BEATS.entries()) {
    const k = seg(t, b, b + 0.08);
    if (k > 0 && k < 1) p.outline(A.mask, A.x, A.y, k < 0.5 ? C[6] : C[5]);
    const w = seg(t, b + 0.02, b + 0.6);
    if (w <= 0 || w >= 1) continue;
    const y = -A.h * ease.inOutSine(w) + 1, hot = i === 0 ? C[6] : C[5];
    p.mask(A.mask, A.x, A.y, (mx, my) => (Math.abs(A.y + my - y) < 0.8 ? hot : C[4]), (mx, my) => (Math.abs(A.y + my - y) < 1.8 ? 1 : 0));
  }
  // crosses floating up beside the body, steady as a drip
  cycle(t, meta.duration, 5, S, (r) => r.range(0.9, 1.3), (age, life, r, i) => {
    const k = age / life, side = i % 2 ? 1 : -1, x = side * r.range(7, 11) + Math.sin(age * 5 + i) * 1, y = -r.range(2, 12) - age * r.range(14, 20);
    plus(p, x, y, k < 0.08 ? 0 : k < 0.35 ? 2 : k < 0.8 ? 1 : 0, [C[3], C[5], WHITE]);
    p.light(x, y, C[5], 0.3 * (1 - k));
  });
  // motes
  cycle(t, meta.duration, 7, S + 1, (r) => r.range(0.6, 0.9), (age, life, r) => {
    const k = age / life, x = r.range(-8, 8), y = -r.range(0, 6) - age * r.range(20, 30);
    p.px(x, y, k < 0.5 ? C[6] : C[4]);
  });
}
