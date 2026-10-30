import { PAL, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { Layer, twinkle, fit } from "./_lib.js";

export const meta = {
  name: "Checkmark",
  desc: "A green badge pops in, a white check draws itself across it in one stroke, the badge thumps bigger and settles while a ring and sparkles fly off.",
  tags: ["ui", "check", "success", "confirm", "done", "one-shot"],
  size: [56, 56],
  origin: [28, 28],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.heal, seed: 12 },
};

const L = new Layer(56, 56);
const PTS = [[-6, 0], [-2, 4.5], [6.5, -5]];
const L1 = Math.hypot(4, 4.5), L2 = Math.hypot(8.5, 9.5);

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed;
  // the badge pops in, thumps when the check lands, shrinks away at the end
  const inK = ease.outBack(seg(t, 0, 0.16), 2.2), thump = 1 + 0.22 * Math.sin(Math.PI * seg(t, 0.36, 0.5));
  const sc = inK * thump * (1 - ease.inBack(seg(t, 1.1, 1.28), 2));
  if (sc <= 0.03) return;
  const R = 11 * sc;
  const q = L.begin(-28, -28);
  q.circle(0, 0, R, (d, a) => (d > 0.82 ? (Math.sin(a) < -0.3 ? C[5] : C[3]) : Math.sin(a) < -0.45 && d > 0.45 ? C[4] : C[3]));
  // the stroke draws itself: down the short leg, then up the long one
  const k = ease.outQuad(seg(t, 0.14, 0.36)) * (L1 + L2);
  if (k > 0) {
    const [a, b, c] = PTS.map(([x, y]) => [x * sc, y * sc]), w = 3.4 * sc;
    const u1 = Math.min(1, k / L1), u2 = Math.max(0, (k - L1) / L2);
    const ex = a[0] + (b[0] - a[0]) * u1, ey = a[1] + (b[1] - a[1]) * u1;
    q.beam(a[0], a[1] + 1, ex, ey + 1, w, C[1]); // the cast shadow
    if (u2 > 0) q.beam(b[0], b[1] + 1, b[0] + (c[0] - b[0]) * u2, b[1] + (c[1] - b[1]) * u2 + 1, w, C[1]);
    q.beam(a[0], a[1], ex, ey, w, WHITE);
    if (u2 > 0) q.beam(b[0], b[1], b[0] + (c[0] - b[0]) * u2, b[1] + (c[1] - b[1]) * u2, w, WHITE);
  }
  L.outline(C[0]);
  L.draw(p);
  // the ring and sparkles fly off on the thump
  const rk = seg(t, 0.36, 0.62);
  if (rk > 0 && rk < 1) p.ring(0, 0, 13 + 11 * ease.outCubic(rk), rk < 0.4 ? 2 : 1, rk < 0.5 ? C[6] : C[4], rk < 0.7 ? 1 : 0.5);
  burst(6, S, (r, i) => {
    const sk = seg(t, 0.38, 0.38 + r.range(0.35, 0.5));
    if (sk <= 0 || sk >= 1) return;
    const a = (i / 6) * TAU + r.range(-0.25, 0.25) - Math.PI / 2, d = 14 + 10 * ease.outCubic(sk);
    twinkle(p, Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d), Math.round(1 + 2 * (1 - sk)), C[5], C[6]);
  });
  p.glow(0, 0, 26, C[4], 0.12 + 0.3 * Math.sin(Math.PI * seg(t, 0.36, 0.7)));
}
