import { PAL, ramp, at, seg, clamp, rng, rand, TAU, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, jagged, branches, fence } from "./_lib.js";

export const meta = {
  name: "Tesla coil",
  desc: "A copper-wound coil under a steel crown: branching arcs lash out from the crown every few frames, now and then grounding with a white flash.",
  tags: ["lightning", "electric", "machine", "prop", "ground", "loop"],
  size: [80, 88],
  origin: [40, 84],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.electric, arcs: 3, seed: 11 },
};

const COPPER = ramp(["#2e140c", "#5c2a14", "#91481f", "#c4733a", "#eaa76a"]);
const STEEL = ramp(["#17161e", "#2f2d3a", "#4e4b5c", "#7b788c", "#b2afc2", "#e2e0ec"]);
const TOP = -52, RATE = 15;

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, beat = Math.floor(t * RATE), sub = t * RATE - beat;

  // base plinth
  p.rect(-12, -6, 24, 6, STEEL[1]);
  p.rect(-12, -6, 24, 1, STEEL[3]);
  p.rect(-10, -9, 20, 3, STEEL[2]);
  p.rect(-10, -9, 20, 1, STEEL[4]);
  // the coil: a wound copper cylinder, lit from the left
  for (let y = TOP + 5; y < -9; y++)
    for (let x = -5; x <= 5; x++) {
      const lit = 1 - (x + 5) / 11, wire = y % 2 === 0 ? 0.2 : 0;
      p.px(x, y, at(COPPER, clamp(0.25 + lit * 0.75 - wire + (x === -3 ? 0.15 : 0))));
    }
  // the crown: a steel torus
  p.ellipse(0, TOP, 14, 4.5, (d, a) => {
    const top = -Math.sin(a);
    if (d < 0.38) return STEEL[0];
    return at(STEEL, clamp(0.45 + top * 0.4 - Math.cos(a) * 0.15 + (d > 0.85 && top > 0.3 ? 0.3 : 0)));
  });
  p.line(-8, TOP - 3, -3, TOP - 4, STEEL[5]);

  // arcs: each beat (two frames) new ones lash out from the crown's rim; a fresh arc is white-hot, then dims
  const fresh = sub < 0.5;
  let grounded = false;
  for (let i = 0; i < o.arcs; i++) {
    const r = rng(S, beat, i);
    if (i > 1 && !r.chance(0.7)) continue;
    const side = r.sign(), ra = r.range(-0.5, 0.3), sx = side * 13 * Math.cos(ra), sy = TOP + 4 * Math.sin(ra);
    let ex, ey;
    if (i === 0 && rand(S, beat, 50) < 0.22) {
      // a ground strike: one long arc down to the floor
      grounded = true;
      ex = side * r.range(22, 33), ey = 0;
    } else {
      const a = (side > 0 ? 0 : Math.PI) + side * r.range(-1.25, 0.3), len = r.range(16, 30);
      ex = clamp(sx + Math.cos(a) * len, -35, 35), ey = clamp(sy + Math.sin(a) * len, -80, -16);
    }
    const pts = fence(jagged(r, sx, sy, ex, ey, { step: 4.5, amp: 2.4 }), -38, 38, -82, 0);
    for (const b of branches(r, pts, { count: grounded && i === 0 ? 3 : 2, len: 9, from: 0.35, to: 0.9 })) p.polyline(fence(b, -38, 38, -82, 0), fresh ? C[4] : C[3]);
    zap(p, pts, fresh ? WHITE : C[5], fresh && i === 0 ? C[3] : null);
    glowPath(p, pts, 9, C[4], fresh ? 0.4 : 0.22);
    if (grounded && i === 0) {
      if (fresh) p.ellipse(ex, 0, 5, 1.5, WHITE);
      p.glow(ex, -1, 16, C[5], fresh ? 0.6 : 0.3);
    }
  }
  // the crown glows with the charge; brighter on a grounding beat
  p.glow(0, TOP, 26, C[4], grounded ? 0.4 : 0.25);
  p.glow(0, TOP - 1, 9, C[5], 0.3);
}
