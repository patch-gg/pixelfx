import { PAL, ramp, rng, burst, fly, seg, ease, clamp, noise, WHITE } from "../../core/index.js";
import { puff } from "./_lib.js";

export const meta = {
  name: "Heavy landing",
  desc: "Something heavy lands: the floor dents and cracks out both ways, two rings of dust spread over the floor one after the other, pebbles hop.",
  tags: ["impact", "land", "ground", "crack", "dust", "heavy", "one-shot"],
  size: [80, 32],
  origin: [40, 24],
  duration: 1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.dust, stone: PAL.stone, size: 1, seed: 16 },
};

// a crack: a jagged path along the floor face, from the dent outward, with a branch or two
function crackPaths(r, side, len) {
  const paths = [];
  let x = side * 2, y = 0;
  const main = [[x, y]];
  while (Math.abs(x) < len) {
    x += side * r.range(2, 4.5);
    y = clamp(y + r.range(-1.2, 1.6), 0, 3);
    main.push([x, Math.round(y)]);
  }
  paths.push(main);
  for (let b = 0; b < 2; b++) {
    const i = 1 + Math.floor(r.next() * (main.length - 2));
    const [bx, by] = main[i], br = [[bx, by]];
    let xx = bx, yy = by;
    for (let s = 0; s < 3; s++) (xx += side * r.range(1.5, 3)), (yy = clamp(yy + r.range(0.6, 1.6), 0, 5)), br.push([xx, Math.round(yy)]);
    paths.push(br);
  }
  return paths;
}

export function draw(p, t, o) {
  const D = ramp(o.palette), G = ramp(o.stone), S = o.seed, k = o.size, N = D.length - 1;
  // the crack runs out from the dent in a couple of frames, then sits until it fades
  const grow = ease.outCubic(seg(t, 0, 0.1)), cf = 1 - seg(t, 0.68, 0.94);
  if (cf > 0) {
    [-1, 1].forEach((side, j) => {
      for (const path of crackPaths(rng(S, j), side, (12 + j * 4) * k)) {
        const keep = path.filter(([x]) => Math.abs(x) <= 2 + grow * 20 * k);
        if (keep.length < 2) continue;
        p.polyline(keep.map(([x, y]) => [x, y + 1]), G[5], cf); // the lit lower lip
        p.polyline(keep, G[0], cf);
      }
    });
    // the dent: the floor edge knocked down at the impact
    p.rect(-3, 0, 6, 1, G[0], cf);
    p.rect(-2, 1, 4, 1, G[1], cf);
  }
  // the floor edge flashes out from the feet for a frame or two
  const fl = seg(t, 0, 0.07);
  if (fl < 1) p.line(-10 * fl - 8, 0, 10 * fl + 8, 0, (u) => (Math.abs(u - 0.5) < 0.25 ? WHITE : D[N]));
  if (t < 0.035) p.ellipse(0, -1, 9 * k, 3 * k, (d) => (d < 0.5 ? WHITE : D[N]), (d, a) => (Math.sin(a) > 0.1 ? 0 : 1));
  // two rings of dust spreading over the floor, the second smaller and later: thin far arcs that crumble,
  // with puffs riding the ends where they meet the floor
  [[0.02, 0.62, 30], [0.14, 0.8, 19]].forEach(([t0, t1, R], ri) => {
    const q = seg(t, t0, t1);
    if (q <= 0 || q >= 1) return;
    const rx = (4 + R * ease.outCubic(q)) * k, ry = Math.max(2, rx * 0.24), th = 1.6 + (1 - q) * 1.2;
    p.shade(-rx - 1, -ry - 1, rx + 1, 0, (x, y, out) => {
      const d = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2);
      if (d > 1 || d < 1 - th / ry) return;
      const ang = Math.atan2(y / ry, x / rx);
      if (noise(ang * 5 + ri * 7, S + ri) < -1 + 2.1 * ease.inQuad(q)) return;
      out.c = d > 1 - th / ry / 2 ? D[N] : D[N - 1];
    });
    burst(6, S + 3 + ri, (r, i) => {
      const side = i % 2 ? 1 : -1, x = side * rx * r.range(0.86, 1.02), y = -1 - q * r.range(1, 5);
      const rad = (1 + r.range(1, 2.4) * ease.outCubic(seg(q, 0, 0.3))) * (1 - 0.75 * ease.inQuad(seg(q, 0.35, 1))) * k;
      puff(p, x, Math.min(y, -rad * 0.7), rad, D.slice(2), 1 - seg(q, 0.85, 1), 0.5 - q * 0.6, 0.8);
    });
  });
  // pebbles knocked loose: hop out, land, roll a touch
  burst(6, S + 1, (r, i) => {
    const side = i % 2 ? 1 : -1, life = r.range(0.4, 0.6);
    if (t > life) return;
    const vx = side * r.range(25, 70) * k, vy = -r.range(45, 85), g = 380, T1 = (-2 * vy) / g;
    const x = t < T1 ? vx * t : vx * T1 + vx * 0.3 * (t - T1), y = t < T1 ? fly(0, 0, vx, vy, t, g)[1] : 0;
    p.px(side * 2 + x, y - 1, r.next() < 0.5 ? G[5] : G[4]);
  });
}
