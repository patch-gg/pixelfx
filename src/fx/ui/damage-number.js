import { PAL, seg, ease, WHITE } from "../../core/index.js";
import { boldText, fit } from "./_lib.js";

export const meta = {
  name: "Damage number",
  desc: "A hit number punches out double size in white, snaps down to red, hops up and to the right with an overshoot, then sinks and blinks out.",
  tags: ["ui", "damage", "number", "combat", "text", "one-shot"],
  size: [48, 40],
  origin: [18, 30],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.blood, text: "-27", scale: 1, pop: true, seed: 1 },
};

export function draw(p, t, o) {
  const C = fit(o.palette);
  // it blinks out at the end: pixel text dissolves badly, so it flickers instead
  if (t >= 0.86 || (t > 0.6 && Math.floor(t * 30) % 3 === 0)) return;
  // a hop: up fast with an overshoot, a hang, then a slow sink while it fades
  const x = 9 * ease.outCubic(seg(t, 0, 0.5));
  const y = -15 * ease.outBack(seg(t, 0, 0.28), 2.4) + 6 * ease.inQuad(seg(t, 0.45, 0.88));
  const big = o.pop && t < 0.05, scale = o.scale * (big ? 2 : 1), h = 7 * scale;
  const fill = t < 0.1 ? WHITE : (gx, gy) => (gy < 2 ? C[6] : gy < 5 ? C[5] : C[4]);
  boldText(p, o.text, Math.round(x), Math.round(y - h / 2), fill, { scale, outline: C[1], shadow: C[0] });
  if (t < 0.1) p.glow(x, y, 16, C[5], 0.4);
}
