import { cycle, bump, rand, clamp, TAU } from "../../core/index.js";
import { steps, geom, recolor, tone } from "./_lib.js";

export const meta = {
  name: "Cursed",
  desc: "Violet wisps curl up off the target and a stain spreads under its feet; twice a loop a skull glitches in over its head and is gone.",
  tags: ["status", "curse", "shadow", "skull", "debuff", "loop"],
  size: [44, 52],
  origin: [22, 47],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#07040c", "#170b28", "#2c1049", "#481872", "#6e22a0", "#9a3acb", "#cc70ec", "#f6d2ff"], seed: 6 },
};

const SKULL = [".#####.", "#######", "#ee#ee#", "#ee#ee#", "###n###", ".#####.", ".#t#t#."];

// wisps: thin wavering trails of smoke drifting up from all around the silhouette, bright at their heads
function wisps(p, t, o, back) {
  const C = steps(o.palette), a = o.actor, g = geom(a.mask), D = meta.duration;
  const src = g.outline.filter(([, y]) => y < a.h - 3);
  cycle(t, D, back ? 6 : 5, o.seed + (back ? 0 : 50), (r) => r.range(0.9, 1.4), (age, life, r) => {
    const [mx, my] = src[Math.floor(r.next() * src.length)], x0 = a.x + mx + 0.5, y0 = a.y + my;
    const k = age / life, sway = r.range(1.2, 2.4), ph0 = r.range(0, TAU), speed = r.range(7, 11), len = r.range(5, 8);
    const out = mx < a.w / 2 ? -1 : 1, pts = [];
    for (let j = 0; j <= 6; j++) {
      const s = j / 6, yy = y0 - age * speed - (1 - s) * len * Math.min(1, k * 4);
      const x = x0 + out * age * 3 + Math.sin(yy * 0.45 + ph0 + t * 4) * sway;
      pts.push([x, yy]);
    }
    const fade = k > 0.7 ? 1 : 0;
    for (let j = 1; j < pts.length; j++) {
      const c = fade ? (j < 3 ? C[4] : C[2]) : j < 2 ? C[6] : j < 4 ? C[5] : C[3];
      if (back) p.beam(...pts[j - 1], ...pts[j], 2, j < 3 ? C[4] : C[2]);
      else p.line(...pts[j - 1], ...pts[j], c);
    }
    if (!back && !fade) p.light(...pts[0], C[5], 0.25);
  });
}

export function drawBack(p, t, o) {
  const C = steps(o.palette), a = o.actor;
  // the stain spreading under the feet
  const ph = t / meta.duration, w = a.w / 2 + 5 + Math.sin(ph * TAU) * 0.8;
  p.ellipse(0, 0.5, w, 1.6, (d) => (d > 0.75 ? C[3] : C[1]));
  wisps(p, t, o, true);
  p.glow(0, a.y + 8, 22, C[4], 0.16);
}

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, S = o.seed, ph = t / meta.duration;
  // the curse creeping up from the feet: the lowest rows darken toward violet, breathing
  const reach = a.h * (0.3 + 0.08 * Math.sin(ph * TAU));
  recolor(p, a, (c, mx, my) => (c && my > a.h - reach ? C[clamp(Math.round(1 + tone(c) * 4), 1, 5)] : 0));
  wisps(p, t, o, false);

  // the skull: glitches in twice a loop, a few frames each, jumping a pixel and splitting
  const on = Math.max(bump(ph, 0.1, 0.24), bump(ph, 0.6, 0.72));
  if (on > 0.15) {
    const f = Math.floor(t * 30), jit = rand(S, f) < 0.5 ? -1 : 1, hx = a.head[0] - 3 + (on < 0.6 ? jit : 0), hy = a.head[1] - 10;
    if (rand(S, f, 2) < 0.85) {
      if (on < 0.7) for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (SKULL[r][c] !== ".") p.px(hx + c - jit * 2, hy + r, C[3]);
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const ch = SKULL[r][c];
          if (ch === ".") continue;
          p.px(hx + c, hy + r, ch === "e" ? (r === 3 ? C[6] : C[0]) : ch === "n" || ch === "t" ? C[2] : r < 2 ? C[7] : C[6]);
        }
      p.glow(hx + 3, hy + 3, 12, C[5], 0.35 * on);
    }
  }
}
