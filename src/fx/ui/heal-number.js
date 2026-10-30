import { PAL, burst, seg, ease, bump, WHITE } from "../../core/index.js";
import { boldText, letters, fit } from "./_lib.js";

export const meta = {
  name: "Heal number",
  desc: "A green +15 rises in letter by letter and drifts gently upward, little plus signs floating up beside it, then it blinks away.",
  tags: ["ui", "heal", "number", "health", "text", "one-shot"],
  size: [44, 48],
  origin: [22, 38],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.heal, text: "+15", seed: 2 },
};

const PLUS = [".a.", "aba", ".a."];

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed;
  if (t >= 1.25) return;
  const blink = t > 0.95 && Math.floor(t * 30) % 3 === 0;
  // plus signs float up around it, swaying, popping in and out
  burst(5, S, (r, i) => {
    const born = 0.05 + i * 0.11, age = t - born, life = r.range(0.55, 0.75);
    if (age < 0 || age > life) return;
    const k = age / life, side = i % 2 ? 1 : -1;
    const x = side * r.range(10, 15) + Math.sin(age * 6 + i) * 1.5, y = -6 - age * r.range(20, 28);
    if (k > 0.7 && Math.floor(t * 30) % 2) return;
    p.sprite(PLUS, { a: k < 0.5 ? C[5] : C[4], b: k < 0.3 ? WHITE : C[6] }, Math.round(x) - 1, Math.round(y) - 1);
    p.light(x, y, C[5], 0.4 * (1 - k));
  });
  if (blink) return;
  // the number: letters rise in one after another, then the whole thing drifts up
  const drift = -16 * ease.outCubic(seg(t, 0, 1.2)), sway = Math.round(Math.sin(t * 5) * 0.8);
  const { list, w } = letters(p, o.text);
  list.forEach(({ ch, x }, i) => {
    const k = seg(t, i * 0.05 - 0.04, i * 0.05 + 0.18);
    if (k <= 0) return;
    const dy = 5 * (1 - ease.outBack(k, 2.2)), fresh = k < 0.4;
    const fill = fresh ? WHITE : (gx, gy) => (gy < 2 ? C[6] : gy < 5 ? C[5] : C[4]);
    boldText(p, ch, x - Math.round(w / 2) + sway, Math.round(drift + dy - 4), fill, { outline: C[1], shadow: C[0], align: "left" });
  });
  p.glow(0, drift, 16, C[4], 0.22 * bump(t, 0, 1.2));
}
