import { PAL, fit, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Stunned",
  desc: "Three stars circle the head, passing behind it and in front, twinkling as they turn.",
  tags: ["status", "stun", "dizzy", "debuff", "loop"],
  size: [40, 40],
  origin: [20, 36],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.gold, count: 3, seed: 6 },
};

const STAR = ["..a..", ".aba.", "abbba", ".aba.", ".a.a."];

function stars(p, t, o, front) {
  const G = fit(o.palette, 8), a = o.actor, n = o.count, ph = t / meta.duration;
  const cy = a.head[1] - 3;
  for (let i = 0; i < n; i++) {
    const th = ph * TAU + (i * TAU) / n, depth = Math.sin(th);
    if (depth >= 0 !== front) continue;
    const x = Math.round(Math.cos(th) * 10), y = Math.round(cy + depth * 2.5);
    const twinkle = Math.sin(th * 3) > 0.6;
    p.sprite(STAR, { a: front ? G[5] : G[4], b: twinkle ? WHITE : front ? G[6] : G[5] }, x - 2, y - 2);
    p.light(x, y, G[5], front ? 0.5 : 0.25);
  }
}

export const drawBack = (p, t, o) => stars(p, t, o, false);
export const draw = (p, t, o) => stars(p, t, o, true);
