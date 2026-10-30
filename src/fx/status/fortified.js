import { PAL, seg, ease, rand, TAU, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Fortified",
  desc: "Three stone shields circle the target, turning edge-on as they swing round behind it; a sheen runs across them once a beat.",
  tags: ["status", "armor", "defense", "stone", "shield", "buff", "loop"],
  size: [44, 40],
  origin: [22, 36],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.stone, count: 3, radius: 11, seed: 1 },
};

// a heater shield, 6 x 8 at full face
const SHIELD = ["######", "######", "######", "######", "######", ".####.", "..##.."];

// the shields at loop phase ph: x, y, apparent width, depth (front > 0); they turn 1/n of a turn a loop
function shields(a, ph, n, R, seed) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const phi = ((i + ph) / n) * TAU, depth = Math.cos(phi);
    out.push({ x: Math.sin(phi) * R, y: a.y + 11.5 + Math.sin(phi * 2 + rand(seed, i) * TAU) * 0.6, k: Math.abs(depth), depth });
  }
  return out.sort((p, q) => p.depth - q.depth);
}

function shield(p, C, s, shine) {
  const W = Math.max(1, Math.round(6 * s.k)), x0 = Math.round(s.x - W / 2), y0 = Math.round(s.y - 3), far = s.depth < 0;
  const on = (i, j) => j >= 0 && j < 7 && i >= 0 && i < W && SHIELD[j][Math.min(5, Math.floor((i * 6) / W))] === "#";
  // dark outline first, then the face: lit left edge and top, shadowed right edge, a rivet, a sheen when it passes
  for (let j = -1; j <= 7; j++)
    for (let i = -1; i <= W; i++) if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) p.px(x0 + i, y0 + j, C[1]);
  for (let j = 0; j < 7; j++)
    for (let i = 0; i < W; i++) {
      if (!on(i, j)) continue;
      let c = W <= 2 ? C[4] : i === 0 || j === 0 ? C[7] : i === W - 1 || j >= 5 ? C[3] : i === 1 ? C[6] : C[5];
      if (W >= 4 && i === Math.floor(W / 2) && j === 2) c = C[2];
      if (far) c = c === C[7] || c === C[6] ? C[4] : c === C[5] ? C[3] : C[2];
      const band = x0 + i + (y0 + j) * 0.7 - shine;
      if (!far && W > 2 && band >= 0 && band < 2) c = band < 1 ? WHITE : C[7];
      p.px(x0 + i, y0 + j, c);
    }
}

function layer(p, t, o, front) {
  const C = steps(o.palette), a = o.actor, ph = t / meta.duration;
  const shine = -22 + 44 * ease.inOutSine(seg(ph, 0.05, 0.35));
  for (const s of shields(a, ph, o.count, o.radius, o.seed)) if (s.depth >= 0 === front) shield(p, C, s, shine);
}

export function drawBack(p, t, o) {
  layer(p, t, o, false);
}

export function draw(p, t, o) {
  layer(p, t, o, true);
  const C = steps(o.palette), a = o.actor, ph = t / meta.duration;
  p.glow(0, a.y + 11, 20, C[6], 0.08 + 0.14 * Math.sin(Math.PI * seg(ph, 0.05, 0.4)));
}
