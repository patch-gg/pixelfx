import { hex, loopNoise, cycle, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, shift } from "./_lib.js";

export const meta = {
  name: "Fish school",
  desc: "A small school of silver fish holds its place in the current: tails beating out of step, each fish nosing about its slot, bubbles rising.",
  tags: ["critter", "fish", "school", "sea", "water", "swim", "loop"],
  size: [64, 44],
  origin: [32, 22],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0a1a2c", "#17496c", "#2b88aa", "#70ccd8", "#dcfbff"], fin: "#f2b33c", count: 6, seed: 3 },
};

// formation slots: [x, y, size, depth (1 = behind)]
const SLOTS = [[12, -6, 1, 0], [-2, -11, 0.8, 1], [17, 7, 0.9, 0], [3, 2, 1.05, 0], [-12, -1, 0.85, 1], [-6, 10, 0.95, 0]];

function fish(g, S, fin, x, y, k, wag, deep) {
  const rx = 5 * k, ry = 2.7 * k, C = deep ? [S[0], S[1], S[1], S[2], S[3]] : S;
  // tail: a forked fin swinging behind
  const tx = x - rx - 0.5, tip = wag * 1.6 * k;
  g.poly([[tx + 1, y - 0.6], [tx - 3.6 * k, y - 2.6 * k + tip], [tx - 2.2 * k, y + tip * 0.6], [tx - 3.6 * k, y + 2.6 * k + tip], [tx + 1, y + 0.6]], deep ? C[2] : fin);
  // dorsal fin
  g.poly([[x - 1.5 * k, y - ry + 0.6], [x - 0.5 * k, y - ry - 2 * k], [x + 1.6 * k, y - ry + 0.4]], deep ? C[2] : fin);
  // body: dark back, bright belly, a pointed nose
  g.shade(x - rx, y - ry, x + rx + 1, y + ry, (px, py) => {
    const nx = (px - x) / rx, ny = (py - y) / ry, w = nx > 0 ? 1 - nx * nx * 0.25 : 1;
    if (nx * nx + (ny / w) * (ny / w) > 1) return 0;
    if (ny < -0.45) return C[1];
    if (ny < 0.05) return nx > 0.55 ? C[3] : C[2];
    if (ny < 0.5) return C[3];
    return C[4];
  });
  // eye
  const ex = Math.round(x + rx * 0.55), ey = Math.round(y - ry * 0.25);
  g.set(ex, ey, deep ? C[1] : S[0]);
  g.set(ex - 1, ey, deep ? C[3] : WHITE);
}

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), fin = hex(o.fin), ph = t / meta.duration, n = Math.min(o.count, SLOTS.length);
  // bubbles behind everything
  cycle(t, meta.duration, 6, o.seed, (r) => r.range(1, 1.8), (age, life, r) => {
    const k = age / life, x = r.range(-6, 24) + Math.sin(age * 5 + r.next() * 6) * 1.2, y = r.range(-4, 10) - age * r.range(14, 22);
    if (y < -20) return;
    if (r.next() < 0.5) p.px(x, y, S[3]);
    else p.px(x, y, S[2]), p.px(x + 1, y, S[2]), p.px(x, y - 1, S[2]), p.px(x + 1, y - 1, S[4]);
  });
  // back row first, darker; each fish noses around its slot and beats its tail at its own rate
  const school = [];
  for (let i = 0; i < n; i++) {
    const [sx, sy, k, d] = SLOTS[i];
    const x = sx + loopNoise(ph, 1.1, o.seed + i) * 3.5, y = sy + loopNoise(ph, 0.9, o.seed + 20 + i) * 2.2;
    school.push({ i, x: Math.round(x), y: Math.round(y), k, d });
  }
  school.sort((a, b) => b.d - a.d || a.y - b.y);
  for (const f of school) {
    // each fish gets its own outline, so overlapping fish stay apart
    const g = new Grid(f.x - 14, f.y - 8, 26, 16);
    const wag = Math.sin(ph * TAU * (6 + (f.i % 3)) + f.i * 1.3);
    fish(g, S, fin, f.x, f.y, f.k, Math.round(wag * 2) / 2, f.d);
    g.outline(S[0]);
    g.draw(p);
  }
}
