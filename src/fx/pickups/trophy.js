import { PAL, bump, cycle, TAU, WHITE } from "../../core/index.js";
import { Layer, shadow, twinkle, bob, fit } from "./_lib.js";

export const meta = {
  name: "Trophy",
  desc: "A golden cup on a stepped foot floating over its shadow: polished bands down the bowl, a shine sweeping across it, sparkles winking around.",
  tags: ["pickup", "trophy", "cup", "reward", "loop"],
  size: [40, 44],
  origin: [20, 40],
  duration: 1.8,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.gold, shadow: true, seed: 9 },
};

const L = new Layer(40, 40);
const STAR = ["..a..", ".aba.", "aabaa", ".a.a."];

// polished metal: bands across a round surface, u from -1 (left edge) to 1 (right edge)
const band = (C, u) => (u < -0.78 ? C[4] : u < -0.4 ? C[6] : u < 0.25 ? C[5] : u < 0.62 ? C[4] : C[3]);

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  const cy = Math.round(-21 + bob(ph, 1.5)), TOP = cy - 9, H = 11;
  const hw = (y) => 7.5 * (1 - 0.58 * ((y - TOP) / H) ** 2);
  const q = L.begin(-20, cy - 16);
  // handles: half rings on each side, behind the bowl
  q.arc(-7, cy - 4, 4.5, 2, Math.PI * 0.5, Math.PI * 1.5, (u, v) => (u < 0.5 ? C[5] : C[3]));
  q.arc(7, cy - 4, 4.5, 2, -Math.PI * 0.5, Math.PI * 0.5, (u, v) => (u < 0.5 ? C[4] : C[3]));
  // the bowl
  L.fill(-9, TOP, 9, TOP + H, (x, y) => {
    const w = hw(y);
    if (Math.abs(x) > w) return 0;
    return band(C, x / w);
  });
  // the mouth: a dark opening with a bright lip
  q.ellipse(0, TOP + 0.5, 6.5, 1.6, C[2]);
  q.rect(-7, TOP - 1, 15, 1, C[6]);
  // the stamped star
  q.sprite(STAR, { a: C[6], b: WHITE }, -2, TOP + 3);
  // stem, knot and stepped foot
  for (let y = TOP + H; y < TOP + H + 5; y++) for (let x = -1; x <= 1; x++) q.px(x, y, x < 0 ? C[6] : x === 0 ? C[5] : C[3]);
  q.ellipse(0, TOP + H + 2, 2.6, 1.2, C[5]);
  L.fill(-6, TOP + H + 5, 6, TOP + H + 9, (x, y) => {
    const row = Math.floor(y) - (TOP + H + 5), w = row < 2 ? 4.5 : 6.5;
    if (Math.abs(x) > w) return 0;
    return row === 0 || row === 2 ? (x < 0 ? C[6] : C[5]) : band(C, x / w);
  });
  L.outline(C[1]);
  // a shine sweeps across: a slanted white band, then a twinkle at the lip
  const run = (ph - 0.15) / 0.3;
  if (run > 0 && run < 1) {
    const s = -16 + 32 * run;
    L.map((x, y, c) => {
      if (c === C[1]) return c;
      const d = x + 0.5 + (y - cy) * 0.7 - s;
      return Math.abs(d) < 0.6 ? WHITE : Math.abs(d) < 1.3 || Math.abs(d + 3.2) < 0.6 ? C[6] : c;
    });
  }
  L.draw(p);
  const g = bump(ph, 0.4, 0.62);
  if (g > 0) {
    twinkle(p, 6, TOP - 1, 1 + Math.round(g * 3.5), C[5], C[6]);
    p.light(6, TOP - 1, C[6], 0.6 * g);
  }
  // sparkles wink around it
  cycle(t, meta.duration, 3, o.seed, 0.45, (age, life, r) => {
    const a = r.range(0, TAU), rad = r.range(12, 16), k = age / life;
    twinkle(p, Math.cos(a) * rad, cy - 2 + Math.sin(a) * rad * 0.8, Math.round(1 + 2 * bump(k, 0, 1)), C[4], C[5]);
  });
  p.glow(0, cy - 2, 22, C[4], 0.1);
  if (o.shadow) shadow(p, 0, 7 + bob(ph, 0.6));
}
