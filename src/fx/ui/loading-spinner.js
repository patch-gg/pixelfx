import { PAL, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Loading spinner",
  desc: "Eight chunky blocks in a ring; a bright head steps round them like a clock hand, its tail cooling down the ramp behind it.",
  tags: ["ui", "loading", "spinner", "wait", "loop"],
  size: [32, 32],
  origin: [16, 16],
  duration: 0.8,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.cyber, count: 8, radius: 9, seed: 9 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), n = o.count, ph = t / meta.duration;
  const head = Math.floor(ph * n) % n, sub = (ph * n) % 1;
  const TAIL = [WHITE, C[6], C[5], C[4], C[3]];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2, age = (head - i + n) % n;
    const x = Math.round(Math.cos(a) * o.radius), y = Math.round(Math.sin(a) * o.radius);
    const c = TAIL[age] ?? C[2];
    // the head pops a pixel bigger for the first frame of its step
    const s = age === 0 && sub < 0.4 ? 5 : age < 3 ? 4 : 3, h = Math.floor(s / 2);
    p.rect(x - h - 1, y - h - 1, s + 2, s + 2, C[0]);
    p.rect(x - h, y - h, s, s, c);
    if (age < 3) p.px(x - h, y - h, age === 0 ? WHITE : C[6]);
    if (age === 0) p.light(x, y, C[5], 0.6), p.glow(x, y, 8, C[5], 0.3);
  }
  p.glow(0, 0, 16, C[4], 0.08);
}
