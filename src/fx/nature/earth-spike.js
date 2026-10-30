import { ramp, burst, fly, seg, ease, clamp, lerp, rand, hex } from "../../core/index.js";

export const meta = {
  name: "Earth spike",
  desc: "The floor cracks, then a jagged stone spike rams up in two frames with two smaller shards, throwing chips and dust; it holds, splits, and bursts into falling rubble.",
  tags: ["nature", "earth", "rock", "spike", "stone", "ground", "one-shot"],
  size: [72, 60],
  origin: [36, 52],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#17121a", "#2b2430", "#443a46", "#5f5359", "#806f6e", "#a39087", "#c9b6a5", "#eee2d2"], height: 34, seed: 41 },
};

const DUST = ["#3a3230", "#5a4e48", "#7e7068", "#a4968a"].map(hex);
const T_UP = 0.1, T_BREAK = 0.86;

// a jagged spike: outline points from the left foot up to the tip and down to the right foot
function spikePts(x0, w, h, lean, S) {
  const L = [], R = [];
  for (let i = 0; i <= 5; i++) {
    const v = i / 5, j = i > 0 && i < 5 ? (rand(S, i, 1) - 0.5) * 2.2 * (1 - v) : 0;
    const cx = x0 + lean * v * h * 0.25, hw = w * Math.pow(1 - v, 0.95);
    L.push([cx - hw + j, -v * h]);
    R.push([cx + hw + (rand(S, i, 2) - 0.5) * 1.6 * (1 - v), -v * h]);
  }
  return { pts: [...L, ...R.slice(0, -1).reverse()], tip: L[5], foot: x0 + w * 0.25 };
}

function spike(p, C, s, h) {
  const { pts, tip, foot } = s;
  // two faces split by the ridge from the tip to the foot: lit left, shadowed right, dark right rim
  p.poly(pts, (x, y) => {
    const v = -y / h, ridge = lerp(foot, tip[0], v);
    if (x > ridge) return x > ridge + (1 - v) * 4.5 ? C[2] : C[3];
    const band = Math.floor((-y + 2) / 6) % 2 === 1 && v < 0.8;
    return v > 0.72 ? C[6] : band ? C[4] : C[5];
  });
  p.line(tip[0], tip[1], foot, 0, C[6], (u) => (u < 0.5 ? 1 : 0));
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, H = o.height;
  // anticipation: the floor splits and pebbles hop
  const crack = seg(t, 0, 0.08) * (1 - seg(t, 1.0, 1.25));
  if (crack > 0) {
    const reach = 4 + 12 * ease.outCubic(seg(t, 0, 0.12));
    for (const sx of [-1, 1]) {
      let x = 0, y = 0;
      for (let i = 0; i < 6 && Math.abs(x) < reach; i++) {
        const nx = x + sx * (2 + rand(S, i, sx + 3) * 2), ny = rand(S, i, sx + 5) < 0.5 ? 0 : 1;
        p.line(x, y, nx, ny, C[0], crack);
        (x = nx), (y = ny);
      }
    }
  }
  if (t < T_UP) {
    burst(4, S + 9, (r) => p.px(r.range(-7, 7), -1 - Math.abs(Math.sin(t * r.range(50, 70))) * 2, C[3]));
  }
  // the spikes: ram up with a hair of overshoot, the big one first; a tremor while they settle
  const up = (d) => ease.outExpo(seg(t, T_UP + d, T_UP + d + 0.07)) * (1 + 0.06 * Math.sin(seg(t, T_UP + d + 0.07, 0.32) * Math.PI));
  const shake = t > T_UP + 0.07 && t < 0.3 ? Math.round(Math.sin(t * 90)) * 0.6 : 0;
  const crackUp = seg(t, 0.74, T_BREAK);
  if (t < T_BREAK) {
    const spikes = [[-8, 4.5, H * 0.45, -1.2, 0.05], [9, 4, H * 0.32, 1.2, 0.08], [shake, 8, H, 0.25, 0]];
    for (const [x0, w, hh, lean, d] of spikes) {
      const h = hh * up(d);
      if (h < 1) continue;
      spike(p, C, spikePts(x0, w, h, lean, S + x0), h);
    }
    // just before it goes: cracks race up the big spike and it flashes
    if (crackUp > 0) {
      const h = H * up(0);
      p.polyline([[1, -1], [-1, -h * 0.3 * crackUp], [2, -h * 0.55 * crackUp], [0, -h * 0.8 * crackUp]], C[1]);
      if (crackUp > 0.85) p.poly(spikePts(shake, 8, h, 0.25, S).pts, C[7]);
    }
  }
  // rubble ring at the foot
  if (t > T_UP && t < 1.15) {
    for (const [x, s] of [[-14, 2], [-12, 1], [14, 2], [16, 1]]) {
      p.rect(x - s / 2, -s, s, s, C[x < 0 ? 4 : 2]);
      p.px(x - s / 2, -s, C[5]);
    }
  }
  // the hit: dust bursting out low and wide, chips thrown high
  const da = t - T_UP;
  if (da > 0) {
    burst(10, S + 1, (r, i) => {
      const life = r.range(0.45, 0.7), q = da / life;
      if (q >= 1) return;
      const side = i % 2 ? 1 : -1, e = ease.outCubic(Math.min(1, q * 2));
      const x = side * (4 + r.range(6, 18) * e), y = -2 - r.range(1, 6) * q - q * 3;
      const rad = r.range(2.5, 4.5) * (1 - ease.inQuad(q) * 0.85);
      p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.3 ? DUST[3] : d < 0.85 ? DUST[2] : DUST[1]));
    });
    burst(9, S + 2, (r) => {
      const life = r.range(0.4, 0.6);
      if (da > life) return;
      const a = -Math.PI / 2 + r.range(-1, 1), sp = r.range(55, 105);
      const [x, y] = fly(Math.cos(a) * 3, -6, Math.cos(a) * sp, Math.sin(a) * sp, da, 380);
      if (y > 0) return;
      const s = r.next() < 0.4 ? 2 : 1;
      p.rect(x, y, s, s, C[r.int(3, 5)]);
    });
    if (da < 0.06) p.glow(0, -H * 0.4, 30, C[6], 0.35);
  }
  // the break: the spike bursts into chunks that tumble down and crumble
  const ba = t - T_BREAK;
  if (ba >= 0) {
    burst(14, S + 3, (r, i) => {
      const life = r.range(0.28, 0.42);
      if (ba > life) return;
      const v = (i + r.next()) / 14, y0 = -H * v, x0 = r.range(-1, 1) * 7 * (1 - v);
      const [x, y] = fly(x0, y0, x0 * r.range(4, 9) + r.range(-12, 12), -r.range(10, 45), ba, 340);
      if (y > 0) return;
      const s = Math.round((1 - v) * 2.5 + r.range(1.5, 2.5));
      p.rect(x - s / 2, y - s / 2, s, s, x0 > 0 ? C[3] : C[4]);
      p.px(x - s / 2, y - s / 2, C[6]);
    });
    burst(6, S + 4, (r, i) => {
      const life = r.range(0.3, 0.42), q = ba / life;
      if (q >= 1) return;
      const x0 = r.range(-8, 8), x = x0 + q * x0 * 0.6, y = -r.range(2, H * 0.6) - q * 6, rad = r.range(2.5, 4) * (1 - ease.inQuad(q) * 0.9);
      p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.3 ? DUST[3] : d < 0.85 ? DUST[2] : DUST[1]));
    });
  }
}
