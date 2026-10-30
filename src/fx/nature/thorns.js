import { ramp, burst, fly, seg, ease, clamp, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Thorns",
  desc: "A line of bramble thorns punches up out of the floor, one after another to the right, each hooked spike snapping up with a puff of dirt, then sinking back.",
  tags: ["nature", "plant", "thorns", "spikes", "ground", "directional", "one-shot"],
  size: [100, 44],
  origin: [8, 36],
  duration: 1.1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1a0c10", "#341420", "#56202a", "#7a3030", "#a04c38", "#c87a52", "#f0bc8c"], count: 7, spacing: 12, seed: 19 },
};

const DIRT = ["#2e2418", "#4c3a26", "#6e5638"].map(hex);
const MOSS = ["#22401c", "#3a6a26", "#6a9a36"].map(hex);

// one thorn: a curved horn, wide at the root, hooked forward at the tip; h is its height, lean its curl
function thorn(p, C, x0, h, w, lean, barb) {
  if (h < 1) return;
  const cx = (v) => x0 + lean * v * v * h * 0.45, hw = (v) => w * Math.pow(1 - v, 0.85);
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push([cx(i / 8) - hw(i / 8), -(i / 8) * h]);
  for (let i = 8; i >= 0; i--) pts.push([cx(i / 8) + hw(i / 8), -(i / 8) * h]);
  // lit from the left: a bright ridge, a deep right flank, a pale tip
  p.poly(pts, (x, y) => {
    const v = -y / h, u = (x - cx(v)) / Math.max(0.6, hw(v));
    if (v > 0.8) return C[6];
    return u < -0.5 ? C[5] : u < 0.1 ? C[4] : u < 0.6 ? C[3] : C[2];
  });
  // the hooked tip stays one connected pixel line
  const tip = [];
  for (let i = 6; i <= 10; i++) tip.push([cx(Math.min(1, i / 10)), -Math.min(1, i / 10) * h]);
  p.polyline(tip, C[6]);
  // a barb on the back, angled down
  if (barb && h > 9) {
    const v = 0.42, bx = cx(v) - hw(v), by = -v * h;
    p.tri(bx + 1, by - 2, bx + 1, by + 1, bx - 3, by + 1.5, C[4]);
    p.px(bx - 3, by + 1, C[5]);
  }
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, n = o.count, gap = o.spacing;
  burst(n, S, (r, i) => {
    const x0 = 4 + i * gap + r.range(-2, 2), born = 0.04 + i * 0.07, a = t - born;
    if (a < 0) return;
    const H = (11 + i * 1.7 + r.range(-2, 3)) * (i === n - 1 ? 1.25 : 1), W = r.range(2.8, 3.6) + i * 0.18, lean = r.range(0.25, 0.6);
    // up fast with an overshoot, hold, then sink back
    const up = ease.outBack(seg(a, 0, 0.09), 2.2), down = ease.inQuad(seg(t, 0.62 + i * 0.035, 0.86 + i * 0.03));
    const h = H * up * (1 - down);
    // the floor cracks open under it first
    const crack = 1 - seg(t, 0.85, 1.05);
    if (crack > 0) {
      p.line(x0 - W - 1, 0, x0 + W + 1, 0, DIRT[0], crack);
      p.px(x0 - W - 2, 1, DIRT[0]), p.px(x0 + W + 2, 1, DIRT[0]);
    }
    thorn(p, C, x0, h, W, lean, i % 2 === 0);
    // moss at the root of the bigger ones
    if (h > 6) p.line(x0 - W, -1, x0 - W + 2, -1, MOSS[1]), p.px(x0 - W + 1, -2, MOSS[2]);
    // a puff of dirt as it breaks through
    burst(5, S + 10 + i, (q) => {
      const life = q.range(0.25, 0.4);
      if (a > life) return;
      const [x, y] = fly(x0 + q.range(-W, W), -1, q.range(-35, 35), -q.range(25, 65), a, 260);
      if (y < 1) p.px(x, y, DIRT[q.int(0, 2)]);
    });
    if (a < 0.07) {
      p.line(x0 - W - 2, -1, x0 + W + 2, -1, C[6]);
      p.glow(x0, -4, 12, C[5], 0.4);
    }
  });
}
