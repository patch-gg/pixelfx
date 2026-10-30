import { ramp, at, lerp, clamp, seg, rng, bolt, forks, tileFbm, hex } from "../../core/index.js";
import { box, clip, drift } from "./_lib.js";

export const meta = {
  name: "Storm",
  desc: "Driving rain under a churning cloud deck; a bolt cracks down in a double flash that lights the whole sky, and far off, lightning glows inside the clouds.",
  tags: ["weather", "storm", "rain", "lightning", "thunder", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 36],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "sky",
  options: {
    palette: ["#0c0e16", "#161a26", "#222838", "#30384c", "#434d66", "#5e6a86", "#8a98b6", "#cfdcf2"],
    bolt: ["#3a56c8", "#8cb4ff", "#ffffff"],
    count: 90,
    seed: 73,
  },
};

// the strike: a quick pre-flicker, the bolt, a blink, then the bolt again as the flash dies
function flash(t) {
  if (t >= 1.2 && t < 1.24) return 0.25;
  if (t >= 1.3 && t < 1.4) return 1;
  if (t >= 1.44 && t < 1.64) return 0.85 * (1 - seg(t, 1.44, 1.64));
  return 0;
}

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), BO = ramp(o.bolt), S = o.seed, D = meta.duration, B = box(meta), ph = t / D;
  const f = flash(t), boltOn = (t >= 1.3 && t < 1.4) || (t >= 1.44 && t < 1.56);
  // sheet lightning: a glow deep in the clouds, far off to one side
  const sheet = t >= 2.35 && t < 2.6 ? Math.sin(seg(t, 2.35, 2.6) * Math.PI) * (t > 2.43 && t < 2.47 ? 0.4 : 1) : 0;
  const sx = B.x1 - 30;
  // rain: two depths, steep and fast; lit up while the sky flashes
  const sl = 0.42;
  drift(t, D, Math.round(o.count * 0.6), S, [5, 7], (u, r) => {
    const x0 = r.range(B.x0 - 40, B.x1), y = lerp(B.y0 - 6, B.y1 + 6, u), x = x0 + (y - B.y0) * sl;
    p.line(x, y, x - 3 * sl, y - 3, f > 0.5 ? C[5] : C[3]);
  });
  drift(t, D, o.count, S + 1, [7, 10], (u, r) => {
    const x0 = r.range(B.x0 - 40, B.x1), len = r.range(6, 10), y = lerp(B.y0 - 10, B.y1 + 12, u), x = x0 + (y - B.y0) * sl;
    p.line(x, y, x - len * sl, y - len, (q) => (q < 0.3 ? C[f > 0.5 ? 7 : 6] : C[f > 0.5 ? 6 : 4]));
  });
  // the bolt: from the cloud base down out of the bottom of the frame, with forks
  if (boltOn) {
    const r = rng(S, 5), x0 = lerp(B.x0 + 30, B.x1 - 40, r.next()), path = bolt(r, x0, B.y0 + 14, x0 + r.range(-14, 14), B.y1 + 2, { jag: 0.2, depth: 5 });
    const br = forks(r, path, { count: 3, len: 22, jag: 0.3 });
    const second = t >= 1.44;
    for (const q of [path, ...br]) {
      for (let i = 1; i < q.length; i++) p.line(q[i - 1][0] + 1, q[i - 1][1], q[i][0] + 1, q[i][1], BO[0]);
    }
    for (const q of br) p.polyline(q, BO[1]);
    p.polyline(path, second ? BO[1] : BO[2]);
    if (!second) p.polyline(path.map(([x, y]) => [x - 1, y]), BO[1]);
    for (let i = 4; i < path.length; i += 4) p.glowLine(path[i - 4][0], path[i - 4][1], path[i][0], path[i][1], 7, BO[1], 0.35);
  }
  // the cloud deck: a ragged band across the top whose texture churns; lit from below by the flashes
  const deck = (x) => 12 + tileFbm(x * 0.05, 0.5, 6.4, 0, S + 2, 2) * 6;
  p.shade(B.x0, B.y0, B.x1 + 1, B.y0 + 26, (x, y) => {
    const d = y - B.y0, edge = deck(x);
    if (d > edge) return;
    const n = tileFbm(x * 0.07, d * 0.13 + ph * 4, 0, 4, S, 3), v = d / edge; // v: 0 at the top, 1 at the base
    let k = 0.28 + n * 0.32 - v * 0.08;
    if (v > 0.82) k += f * 0.45 - 0.06; // the underside catches the flash
    k += f * 0.2 + (sheet > 0 ? sheet * 0.5 * clamp(1 - Math.abs(x - sx) / 26) : 0);
    return at(C.slice(1, 8), k);
  });
  // the flash: light over everything, strongest under the clouds
  if (f > 0) {
    p.shade(B.x0, B.y0, B.x1 + 1, B.y1 + 1, (x, y, out) => {
      out.l = BO[1];
      out.k = f * (0.08 + 0.22 * (1 - (y - B.y0) / B.h));
    });
  }
  if (sheet > 0) p.glow(sx, B.y0 + 8, 30, BO[1], 0.25 * sheet);
}
