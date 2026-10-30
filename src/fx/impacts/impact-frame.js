import { ramp, rng, clamp, TAU } from "../../core/index.js";

export const meta = {
  name: "Impact frame",
  desc: "An anime impact frame: two frames of white with black burst lines rushing at the hit, two frames inverted, then the lines snap back out and vanish.",
  tags: ["impact", "hit", "anime", "manga", "flash", "speed-lines", "screen", "one-shot"],
  size: [96, 64],
  origin: [48, 32],
  duration: 0.2,
  loop: false,
  fps: 30,
  bg: "black",
  options: { palette: ["#000000", "#ffffff"], lines: 26, seed: 19 },
};

// the burst lines: wedges pointing at the origin from past the canvas edge, each with its own reach
function wedges(n, r) {
  const out = [];
  for (let i = 0; i < n; i++)
    out.push({ a: ((i + r.range(0.1, 0.9)) / n) * TAU, inner: r.range(10, 26), w: r.range(0.9, 3) });
  return out; // wedge i sits in the i-th slice of the circle, so a pixel only has to test its slice and the two beside it
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, DARK = C[0], LIGHT = C[C.length - 1];
  const [W, H] = meta.size, [OX, OY] = meta.origin, x0 = -OX, y0 = -OY, x1 = W - OX - 1, y1 = H - OY - 1;
  const f = Math.floor(t * meta.fps + 1e-6);
  if (f >= 6) return;
  const inverted = f >= 2, field = f <= 3, set = wedges(o.lines, rng(S, f % 2 && field ? 2 : 1));
  const back = field ? 0 : f === 4 ? 0.3 : 0.65; // after the field drops, the lines pull back out for two frames
  const ink = inverted ? LIGHT : DARK, paper = inverted ? DARK : LIGHT;
  // the jagged hit at the middle, in the line color, only while the field is up
  const spikes = (ang) => 7 + 4 * Math.abs(Math.sin(ang * 6 + S)) + 2 * Math.sin(ang * 13 + S * 3);
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    const ex = x, ey = y * 1.45, rho = Math.hypot(ex, ey), ang = Math.atan2(ey, ex);
    let line = false;
    const n = set.length, slot = Math.floor(((ang + TAU) % TAU) / (TAU / n));
    for (let j = -1; j <= 1; j++) {
      const w = set[(slot + j + n) % n];
      let d = (((ang - w.a) % TAU) + TAU) % TAU;
      if (d > Math.PI) d = TAU - d;
      const inner = w.inner + back * 40, hw = Math.max(0.8, w.w * clamp((rho - inner) / 30) * (1 - back * 0.5));
      if (rho > inner && d * rho < hw) {
        line = true;
        break;
      }
    }
    if (line) return ink;
    if (field && rho < spikes(ang + f * 0.4)) return ink;
    if (field) return paper;
  });
}
