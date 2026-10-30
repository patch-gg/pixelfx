import { ramp, rand, rng, loopNoise, TAU, WHITE } from "../../core/index.js";
import { steps, glowPath } from "./_lib.js";

export const meta = {
  name: "Plasma ball",
  desc: "A glass globe on a stand: pink-violet tendrils wander from the hot core out to the glass, their feet flaring where they touch it.",
  tags: ["lightning", "electric", "plasma", "prop", "ambient", "loop"],
  size: [48, 60],
  origin: [24, 57],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#12061e", "#2a0b46", "#521880", "#8a2cb8", "#c84ae0", "#f08af0", "#ffd0fa", "#ffffff"],
    radius: 17, tendrils: 6, seed: 9,
  },
};

const BASE = ramp(["#0f0d16", "#1d1a27", "#2f2b3c", "#454057", "#625c78"]);

function tendril(t, ph, i, n, R, S) {
  const g = rng(S, i);
  const th = (i / n) * TAU + g.range(-0.35, 0.35) + 0.8 * loopNoise(ph, 0.8, S + i * 7);
  const A = g.range(1.4, 2.6), k1 = g.range(6, 10), w1 = g.pick([1, 2]) * g.sign(), w2 = g.pick([2, 3]) * g.sign(), off = g.range(0, TAU);
  const dx = Math.cos(th), dy = Math.sin(th), pts = [];
  for (let j = 0; j <= 16; j++) {
    const s = j / 16, r = 3 + s * (R - 4.5);
    const wig = A * Math.sin(s * Math.PI) * (Math.sin(s * k1 + ph * TAU * w1 + off) + 0.5 * Math.sin(s * k1 * 1.9 - ph * TAU * w2 + off * 2));
    pts.push([dx * r - dy * wig, dy * r + dx * wig]);
  }
  return { th, pts };
}

export function draw(p, t, o) {
  const C = steps(o.palette, 8), S = o.seed, R = o.radius, n = o.tendrils, ph = t / meta.duration;
  const cy = -13 - R + 3, fl = Math.floor(t * 15);

  // the dark glass
  p.circle(0, cy, R, (d) => (d > 0.9 ? C[2] : d > 0.78 ? C[1] : C[0]));

  // tendrils: thin hot filaments, their softness all in the light buffer
  const ts = Array.from({ length: n }, (_, i) => tendril(t, ph, i, n, R, S));
  const shift = (pts) => pts.map(([x, y]) => [x, y + cy]);
  for (const { pts } of ts) glowPath(p, shift(pts), 4, C[4], 0.35, 2);
  ts.forEach(({ th, pts }, i) => {
    const hot = rand(S, i, fl) < 0.3;
    const sp = shift(pts);
    p.polyline(sp.slice(0, 9), hot ? C[7] : C[6]);
    p.polyline(sp.slice(8), hot ? C[6] : C[5]);
    // the foot: the tendril frays into a small fan where it meets the glass
    const [fx, fy] = sp[13];
    for (const s of [-0.13, 0, 0.13]) {
      const ex = Math.cos(th + s) * (R - 1.5), ey = Math.sin(th + s) * (R - 1.5) + cy;
      p.line(fx, fy, ex, ey, C[5]);
      p.px(ex, ey, s === 0 ? WHITE : C[6]);
    }
    p.glow(Math.cos(th) * (R - 2), Math.sin(th) * (R - 2) + cy, 7, C[5], 0.35);
  });

  // the core electrode
  p.circle(0, cy, 3.6, (d) => (d < 0.45 ? WHITE : d < 0.8 ? C[6] : C[5]));
  // glass: rim and a cold highlight top-left
  p.ring(0, cy, R + 0.5, 1, (v, a) => (a > -2.9 && a < -1.2 ? C[5] : C[3]));
  p.arc(0, cy, R - 2, 1.2, -2.55, -1.95, C[7]);
  p.px(-R * 0.42, cy - R * 0.55, WHITE);

  // the stand: a collar the globe sits in, a flared base
  p.ellipse(0, -13, 7, 2, (d, a) => (Math.sin(a) < 0 ? C[3] : d > 0.6 ? BASE[3] : BASE[2]));
  p.poly([[-6, -13], [6, -13], [11, -1], [-11, -1]], (x) => (x < -3 ? BASE[3] : x < 4 ? BASE[2] : BASE[1]));
  p.rect(-11, -1, 22, 1, BASE[1]);
  p.rect(-10, -9, 20, 1, BASE[4]);
  p.px(-8, -5, BASE[4]);

  const pulse = 0.85 + 0.15 * loopNoise(ph, 1.5, S + 3);
  p.glow(0, cy, R * 2, C[4], 0.22 * pulse);
  p.glow(0, cy, 7, C[6], 0.45 * pulse);
}
