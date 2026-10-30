import { cycle, fract, rand, WHITE } from "../../core/index.js";
import { steps, geom } from "./_lib.js";

export const meta = {
  name: "Invisible",
  desc: "The target vanishes, leaving only a faint outline that shimmers as a bright band runs down it, a glassy ripple, and a few sparkles.",
  tags: ["status", "invisible", "stealth", "cloak", "buff", "loop"],
  size: [36, 32],
  origin: [18, 28],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: {
    palette: ["#0a1620", "#122a3a", "#1c4258", "#2c6280", "#4a8eae", "#7cbcd6", "#c0e8f4", "#ffffff"],
    seed: 5,
  },
};

// the target itself is hidden: previews drop the stand-in character, and a game hides its own sprite
export const actorAlpha = () => 0;

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, g = geom(a.mask), ph = t / meta.duration;
  // a glassy ripple where the body was: a faint diagonal wave sliding through
  for (let my = 0; my < a.h; my++)
    for (let mx = 0; mx < a.w; mx++) {
      if (!g.on(mx, my)) continue;
      const w = fract((mx * 0.5 - my) / 9 + ph * 2);
      if (w < 0.08) p.px(a.x + mx, a.y + my, C[2]);
    }
  // the outline: dim, with a bright band running down it twice a loop
  const band = fract(ph * 2) * (a.h + 8) - 4;
  for (const [mx, my] of g.outline) {
    const d = Math.abs(my - band), x = a.x + mx, y = a.y + my;
    if (d < 1) p.px(x, y, C[7]);
    else if (d < 3) p.px(x, y, C[6]);
    else if (d < 6) p.px(x, y, C[4]);
    else if (rand(o.seed, mx, my, Math.floor(ph * 8)) < 0.75) p.px(x, y, C[3]);
    if (d < 3) p.light(x, y, C[6], 0.3);
  }
  // sparkles blinking on the outline
  cycle(t, meta.duration, 5, o.seed, (r) => r.range(0.15, 0.3), (age, life, r) => {
    const [mx, my] = g.outline[Math.floor(r.next() * g.outline.length)], x = a.x + mx, y = a.y + my, k = age / life;
    const s = k < 0.5 ? 1 : 0;
    p.px(x, y, WHITE);
    if (s) p.px(x - 1, y, C[6]), p.px(x + 1, y, C[6]), p.px(x, y - 1, C[6]), p.px(x, y + 1, C[6]);
    p.light(x, y, C[6], 0.5 * (1 - k));
  });
}
