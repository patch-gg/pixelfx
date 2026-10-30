import { rand, wrap, TAU, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Radar ping",
  desc: "A round amber scope: the sweep turns, its afterglow trailing; blips flare as it passes and slowly die, each pinging out a small ring.",
  tags: ["scifi", "radar", "sonar", "ui", "screen", "detect", "loop"],
  size: [56, 56],
  origin: [28, 28],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#140802", "#2e1604", "#4e2806", "#7c440c", "#b46a14", "#e89a2a", "#ffcc66", "#fff0c8"], radius: 25, blips: 5, seed: 32 },
};

export function draw(p, t, o) {
  const C = steps(o.palette, 8), S = o.seed, R = o.radius, D = meta.duration, ph = t / D;
  const th = ph * TAU - Math.PI / 2; // the sweep's angle: starts straight up, turns clockwise

  // the scope: dark glass, range rings, crosshair, the trailing afterglow of the sweep
  p.shade(-R, -R, R, R, (x, y) => {
    const d = Math.hypot(x, y);
    if (d > R) return;
    if (d > R - 2) return d > R - 1 ? C[3] : C[2];
    const behind = wrap(th - Math.atan2(y, x), TAU);
    if (behind < 0.09) return d < 1.5 ? WHITE : C[6];
    if (behind < 0.35) return C[4];
    if (behind < 0.8) return C[2];
    const ring = Math.abs(d - R * 0.33) < 0.5 || Math.abs(d - R * 0.66) < 0.5, cross = Math.abs(x) < 0.5 || Math.abs(y) < 0.5;
    if (ring || cross) return behind < 1.6 ? C[2] : C[1];
    return behind < 1.6 ? C[1] : C[0];
  });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    p.px(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3), C[3]);
  }

  // blips: lit as the sweep passes, then dying over most of a turn; one drifts as it's tracked
  for (let i = 0; i < o.blips; i++) {
    const a0 = rand(S, i, 1) * TAU, d0 = R * (0.2 + 0.68 * rand(S, i, 2)), drift = i === 0 ? 4 : 0;
    const x = Math.round(Math.cos(a0) * d0 + drift * Math.cos(ph * TAU)), y = Math.round(Math.sin(a0) * d0 + drift * Math.sin(ph * TAU));
    const age = (wrap(th - Math.atan2(y, x), TAU) / TAU) * D;
    if (age < 0.07) {
      p.rect(x - 1, y - 1, 3, 3, C[6]);
      p.px(x, y, WHITE);
    } else if (age < 0.6) p.rect(x, y, 2, 2, C[6]);
    else if (age < 1.3) p.rect(x, y, 2, 2, C[5]);
    else if (age < 1.9) p.px(x, y, C[4]);
    else continue;
    if (age > 0.03 && age < 0.3) p.ring(x + 0.5, y + 0.5, 2.5 + age * 14, 1, age < 0.15 ? C[6] : C[4]);
    p.light(x, y, C[5], age < 0.1 ? 0.7 : 0.3 * (1 - age / 1.9));
  }

  // the sweep's tip and the scope's glow
  p.glow(Math.cos(th) * R * 0.7, Math.sin(th) * R * 0.7, 14, C[5], 0.3);
  p.glow(0, 0, R + 6, C[3], 0.15);
  p.px(0, 0, WHITE);
}
