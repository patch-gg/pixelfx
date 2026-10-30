import { PAL, burst, stream, seg, ease, TAU, WHITE } from "../../core/index.js";
import { fit, plus, ovalLine } from "./_lib.js";

export const meta = {
  name: "Heal",
  desc: "A healing burst: the body flashes white then green, plus signs pop up around it and float away, gold motes spiral up, a ring spreads at the feet.",
  tags: ["holy", "heal", "restore", "buff", "character", "one-shot"],
  size: [52, 56],
  origin: [26, 48],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.heal, accent: PAL.gold, count: 8, seed: 31 },
};

// gold motes spiralling up round the body; the ones on the far side go behind it
function motes(p, t, o, front) {
  const G = fit(o.accent);
  stream(t, 0, 0.75, 18, o.seed + 1, (q) => q.range(0.4, 0.7), (age, life, q) => {
    const k = age / life, ang = q.range(0, TAU) + age * 7, R = 9 - k * 3;
    if (Math.sin(ang) > 0 !== front) return;
    const x = Math.cos(ang) * R, y = -q.range(0, 6) - age * q.range(26, 40) + Math.sin(ang) * 2;
    p.px(x, y, k < 0.5 ? G[6] : G[4]);
    p.light(x, y, G[5], 0.3 * (1 - k));
  });
}

export function drawBack(p, t, o) {
  const C = fit(o.palette);
  motes(p, t, o, false);
  // a soft green column of light behind the body
  const c = 1 - seg(t, 0.1, 0.9);
  if (c > 0) p.glowLine(0, 0, 0, -26, 11, C[4], 0.3 * c * Math.min(1, t / 0.08));
}

export function draw(p, t, o) {
  const C = fit(o.palette), G = fit(o.accent), A = o.actor, S = o.seed;
  // the body lights up: the outline flashes white, then green, and fades
  const f = seg(t, 0, 0.45);
  if (f < 1) {
    p.outline(A.mask, A.x, A.y, f < 0.12 ? WHITE : f < 0.45 ? C[6] : C[5], f < 0.6 ? 1 : (1 - f) / 0.4);
    p.glow(0, -10, 22, C[5], 0.45 * (1 - f) * (1 - f));
  }
  // a ring spreading at the feet, breaking up as it goes
  const r = seg(t, 0.02, 0.45);
  if (r > 0 && r < 1) {
    const R = 5 + 14 * ease.outCubic(r);
    ovalLine(p, R, R * 0.33, r < 0.3 ? C[7] : r < 0.6 ? C[6] : r < 0.85 ? C[5] : C[4]);
  }
  motes(p, t, o, true);
  // plus signs: pop in big around the body, settle, rise and sway, shrink away; every third one gold
  burst(o.count, S, (q, i) => {
    const born = 0.04 + i * 0.065 + q.range(0, 0.04), life = q.range(0.6, 0.75), age = t - born;
    if (age < 0 || age > life) return;
    const k = age / life, side = i % 2 ? 1 : -1;
    const x = side * q.range(6, 14) + Math.sin(age * 6 + i) * 1.2, y = q.range(-18, -5) - age * q.range(18, 28);
    const size = k < 0.06 ? 1 : k < 0.3 ? 3 : k < 0.7 ? 2 : k < 0.88 ? 1 : 0;
    const gold = i % 3 === 2;
    plus(p, x, y, size, gold ? [G[3], G[5], WHITE] : [C[3], C[5], C[7]]);
    p.light(x, y, gold ? G[5] : C[5], 0.4 * (1 - k));
  });
}
