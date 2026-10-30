import { burst, cycle, seg, ease, clamp, TAU } from "../../core/index.js";
import { steps, UMBRA } from "./_lib.js";

export const meta = {
  name: "Grasping hands",
  desc: "Shadow arms burst from a black pool, fingers splayed, then clench like claws toward the middle, tremble, and are dragged back under.",
  tags: ["shadow", "hands", "grab", "root", "ground", "dark", "one-shot"],
  size: [84, 54],
  origin: [42, 48],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: UMBRA, height: 22, seed: 12 },
};

// one hand as segments [x0, y0, x1, y1, width] plus a palm, for an arm of length A leaning by `lean`,
// with grip g (0 open fan .. 1 curled claw) and facing f (+1: fingers curl to the right)
function hand(bx, by, A, lean, g, f) {
  const segs = [], ca = Math.cos(lean - Math.PI / 2), sa = Math.sin(lean - Math.PI / 2);
  const wx = bx + ca * A, wy = by + sa * A; // wrist
  segs.push([bx, by + 2, (bx + wx) / 2, (by + 2 + wy) / 2, 6], [(bx + wx) / 2, (by + 2 + wy) / 2, wx, wy, 5]);
  const px = wx + ca * 3, py = wy + sa * 3; // palm
  const fingers = [[-0.5, 3.4, 2.8], [-0.17, 4.2, 3.2], [0.17, 4, 3], [0.5, 3.2, 2.6]];
  for (const [spread, l1, l2] of fingers) {
    const a1 = lean - Math.PI / 2 + spread * (1.25 - g) + f * g * 0.9, a2 = a1 + f * (0.25 + g * 1.5);
    const rx = px + Math.cos(lean - Math.PI / 2 + spread * 1.4) * 2.6, ry = py + Math.sin(lean - Math.PI / 2 + spread * 1.4) * 2.6;
    const kx = rx + Math.cos(a1) * l1, ky = ry + Math.sin(a1) * l1;
    segs.push([rx, ry, kx, ky, 2.1], [kx, ky, kx + Math.cos(a2) * l2, ky + Math.sin(a2) * l2, 1.5]);
  }
  // thumb, curling the other way
  const ta = lean - Math.PI / 2 - f * (1.1 - g * 0.9), tx = px - f * 2.2 * Math.cos(lean), ty = py + 1;
  const kx = tx + Math.cos(ta) * 3, ky = ty + Math.sin(ta) * 3, ta2 = ta + f * g * 1.4;
  segs.push([tx, ty, kx, ky, 2], [kx, ky, kx + Math.cos(ta2) * 2.4, ky + Math.sin(ta2) * 2.4, 1.5]);
  return { segs, palm: [px, py], tips: segs.filter((_, i) => i > 1 && i % 2 === 1).map((s) => [s[2], s[3]]) };
}

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed;
  const open = ease.outCubic(seg(t, 0, 0.14)), close = ease.inQuad(seg(t, 1.45, 1.8));
  const poolR = 27 * open * (1 - close);

  if (poolR > 0.8) {
    p.ellipse(0, 0.5, poolR, poolR * 0.18 + 0.8, (d, a) => (d > 0.8 ? (Math.sin(a) < 0 ? C[6] : C[4]) : d > 0.55 ? C[1] : C[0]));
    p.glow(0, -2, 30 * (1 - close), C[5], 0.28 * open * (1 - close));
  }

  // three hands, the middle one tallest; each rises, splays, clenches toward the middle, trembles, sinks
  const hands = [];
  burst(3, S, (r, i) => {
    const side = i - 1, born = [0.1, 0.04, 0.16][i] + r.range(0, 0.04), sink = 1.08 + r.range(0, 0.12);
    const rise = ease.outBack(seg(t, born, born + 0.28), 1.8), down = ease.inQuad(seg(t, sink, sink + 0.36));
    if (rise <= 1e-3 || down >= 1) return;
    const A = o.height * (i === 1 ? 1 : r.range(0.68, 0.8)), lean = side * 0.38 + r.range(-0.08, 0.08);
    const clench = ease.outBack(seg(t, born + 0.42, born + 0.6), 2.2) - 0.25 * seg(t, born + 0.15, born + 0.38) * (1 - seg(t, born + 0.42, born + 0.5));
    const shake = t > born + 0.6 && t < sink ? Math.sin(t * 70 + i * 2) * 0.35 : 0;
    const f = side === 0 ? (r.next() < 0.5 ? -1 : 1) : -side;
    const sunk = (A + 14) * down;
    hands.push(hand(side * 21 + r.range(-2, 2) + shake, sunk + (1 - rise) * (A + 16), A, lean, clamp(clench, -0.3, 1.15), f));
  });
  // stamp in passes so a hand reads as one shape: outline, lit upper left, black body; the floor clips them
  const FLOOR = 1;
  const capsule = (x0, y0, x1, y1, r, c) => {
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-9;
    p.shade(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.min(FLOOR, Math.max(y0, y1) + r), (x, y) => {
      if (y > FLOOR) return;
      const u = clamp(((x - x0) * dx + (y - y0) * dy) / L2), ex = x0 + dx * u - x, ey = y0 + dy * u - y;
      return ex * ex + ey * ey <= r * r ? c : undefined;
    });
  };
  const pass = (dx, dy, grow, c) => {
    for (const h of hands) {
      capsule(h.palm[0] + dx, h.palm[1] + dy, h.palm[0] + dx, h.palm[1] + dy, 3.2 + grow, c);
      for (const [x0, y0, x1, y1, w] of h.segs) capsule(x0 + dx, y0 + dy, x1 + dx, y1 + dy, w / 2 + grow, c);
    }
  };
  pass(0, 0, 0.8, C[3]);
  pass(-0.6, -0.5, 0, C[6]);
  pass(0.45, 0.35, -0.05, C[1]);
  for (const h of hands) for (const [x, y] of h.tips) if (y < FLOOR) p.px(x, y, C[7]);
  for (const h of hands) if (h.palm[1] < 0) p.light(h.palm[0], h.palm[1], C[6], 0.3);

  // motes rising off the pool while it's open
  cycle(t, 1.8, 10, S + 2, (r) => r.range(0.5, 0.9), (age, life, r) => {
    if (poolR < 5) return;
    const k = age / life, x = r.range(-0.9, 0.9) * poolR, y = -age * r.range(18, 30);
    p.px(x + Math.sin(age * 9 + r.next() * TAU), y, k < 0.5 ? C[6] : C[5]);
  });
}
