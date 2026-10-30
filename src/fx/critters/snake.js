import { hex, smooth, seg, fract, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, shift } from "./_lib.js";

export const meta = {
  name: "Snake",
  desc: "A banded snake slithers in place: humps roll back along its body, the head rides high on an S-curved neck and flicks a forked tongue.",
  tags: ["critter", "snake", "reptile", "slither", "loop", "ground"],
  size: [64, 32],
  origin: [30, 27],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0f2414", "#245c24", "#46a032", "#94d24c", "#e8f2a4"], tongue: "#e8344c", seed: 1 },
};

// the spine, tail to head: along the floor with humps rolling back, then up an S-curved neck
function spine(ph) {
  const pts = [];
  for (let x = -27; x <= 4; x += 0.5) {
    const r = 0.7 + 2.5 * smooth(-27, -8, x);
    const env = smooth(-26, -15, x) * (1 - smooth(-4, 3, x));
    const hump = 3.4 * env * Math.max(0, Math.sin(((x + 27) / 15) * TAU + ph * TAU * 2)) ** 1.6;
    pts.push([x, -r - hump, r]);
  }
  const hx = 14 + Math.sin(ph * TAU * 2 + 0.6) * 0.8, hy = -14 + Math.sin(ph * TAU * 2) * 1.2;
  const P = [[4, -3.2], [13, -3.2], [7, -13], [hx - 2, hy + 0.5]];
  for (let s = 0.05; s <= 1.001; s += 0.04) {
    const u = 1 - s, w = [u * u * u, 3 * u * u * s, 3 * u * s * s, s * s * s];
    pts.push([w.reduce((a, k, i) => a + k * P[i][0], 0), w.reduce((a, k, i) => a + k * P[i][1], 0), 3.2 - 0.7 * s]);
  }
  return { pts, hx, hy };
}

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), tongue = hex(o.tongue), ph = t / meta.duration;
  const { pts, hx, hy } = spine(ph);
  // each spine point's normal toward the belly (right of the direction of travel)
  const nrm = pts.map((pt, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [-dy / L, dx / L];
  });
  const g = new Grid(-32, -27, 64, 30);
  g.shade(-29, -22, 20, 0, (x, y) => {
    let best = Infinity, bi = -1;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(x - pts[i][0], y - pts[i][1]) - pts[i][2];
      if (d < best) (best = d), (bi = i);
    }
    if (best > 0) return 0;
    const [px, py, r] = pts[bi], [nx, ny] = nrm[bi], side = ((x - px) * nx + (y - py) * ny) / r; // -1 back .. 1 belly
    if (side > 0.45) return bi % 3 === 0 ? S[3] : S[4];
    // bands down the back, more like saddles than stripes
    const band = fract(bi / 10) < 0.38 && bi < pts.length - 6;
    if (side < -0.4) return band ? S[1] : S[3];
    return band && side < 0.1 ? S[1] : S[2];
  });
  // the head: a wedge tapering to a rounded snout, pale jaw, a mouth line, a brow over a beady eye
  g.shade(hx - 5, hy - 4, hx + 7, hy + 4, (x, y) => {
    const nx = (x - hx - 1) / 5.6, taper = 1 - 0.3 * Math.max(0, nx), ny = (y - hy) / (3.3 * taper);
    if (nx * nx + ny * ny > 1) return 0;
    if (ny > 0.42) return S[4];
    if (ny > 0.12 && nx > -0.2) return Math.abs(ny - 0.27) < 0.15 ? S[1] : S[4];
    return ny < -0.45 ? S[3] : S[2];
  });
  const ex = Math.round(hx + 1), ey = Math.round(hy - 1);
  g.set(ex, ey, S[0]), g.set(ex + 1, ey, S[0]), g.set(ex + 1, ey - 1, WHITE), g.set(ex, ey - 1, S[0]);
  g.set(ex - 1, ey - 2, S[1]), g.set(ex, ey - 2, S[1]), g.set(ex + 1, ey - 2, S[1]), g.set(ex + 2, ey - 2, S[1]);
  g.set(Math.round(hx + 5), Math.round(hy - 1), S[1]);
  g.outline(S[0]);
  // the tongue flicks out twice a loop: out fast, a wiggle, back in
  for (const t0 of [0.18, 0.62]) {
    const k = seg(ph, t0, t0 + 0.14);
    if (k <= 0 || k >= 1) continue;
    const len = Math.round(6 * Math.sin(Math.PI * k)), tx = Math.round(hx + 7), ty = Math.round(hy + 0.5);
    for (let i = 0; i < len; i++) g.set(tx + i, ty, tongue);
    if (len >= 4) g.set(tx + len, ty - 1, tongue), g.set(tx + len, ty + 1, tongue);
  }
  g.draw(p);
}
