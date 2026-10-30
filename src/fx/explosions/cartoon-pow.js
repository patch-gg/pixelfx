import { ramp, seg, ease, rng, burst, star, TAU } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Cartoon POW",
  desc: "A comic-book hit: a jagged burst star slams in with a shake and boiling edges, POW! drops in letter by letter, action lines fly, then it all snaps away.",
  tags: ["explosion", "cartoon", "comic", "text", "impact", "ui", "one-shot"],
  size: [92, 68],
  origin: [46, 34],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1a0810", "#5a0c1c", "#b81c28", "#f0461e", "#ff9a26", "#ffd84a", "#fff6c4"], text: "POW!", seed: 26 },
};

// a jagged burst: n points with uneven tips, re-drawn every other frame so the outline boils
function burstStar(cx, cy, r0, r1, n, seed, s) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n + r.range(-0.08, 0.08), rr = (i % 2 ? r0 * r.range(0.85, 1.1) : r1 * r.range(0.82, 1.08)) * s;
    pts.push([cx + Math.cos(a) * rr * 1.18, cy + Math.sin(a) * rr]);
  }
  return pts;
}

export function draw(p, t, o) {
  const P = fit(ramp(o.palette), 7), S = o.seed;
  const pop = ease.outBack(seg(t, 0, 0.12), 2.2), out = ease.inBack(seg(t, 0.7, 0.86), 2.2), s = pop * (1 - out);
  if (s <= 0.02) return;
  // a hard shake for the first few frames
  const f = Math.floor(t * 30), shake = t < 0.2 ? [[2, -1], [-2, 1], [1, 2], [-1, -1], [1, 0], [0, 1]][f % 6] : [0, 0];
  const cx = shake[0], cy = shake[1], boil = S + Math.floor(t * 15);
  const outer = burstStar(cx, cy, 12, 22, 11, boil, s), inner = burstStar(cx, cy, 8.5, 15.5, 11, boil + 99, s);
  // a dark outline, the red outer burst, the yellow inner burst
  p.poly(outer.map(([x, y]) => [cx + (x - cx) * 1.1, cy + (y - cy) * 1.12]), P[0]);
  p.poly(outer, (x, y) => (y - cy > 6 * s ? P[2] : P[3]));
  p.poly(inner, (x, y) => (y - cy < -5 * s ? P[6] : y - cy < 3 * s ? P[5] : P[4]));
  // action lines flying out past the burst
  const al = seg(t, 0.04, 0.26);
  if (al > 0 && al < 1)
    burst(10, S + 1, (r, i) => {
      const a = (i / 10) * TAU + r.range(-0.15, 0.15), r0 = 25 + 8 * ease.outCubic(al), len = 6 * (1 - al) + 1;
      p.line(cx + Math.cos(a) * r0 * 1.15, cy + Math.sin(a) * r0 * 0.85, cx + Math.cos(a) * (r0 + len) * 1.15, cy + Math.sin(a) * (r0 + len) * 0.85, P[6]);
    });
  // POW! drops in letter by letter with a bounce
  if (out < 0.5) {
    const str = o.text, total = p.measure(str, { font: "big", scale: 2 })[0] + (str.length - 1) * 2;
    let x = cx - Math.round(total / 2);
    [...str].forEach((ch, i) => {
      const k = seg(t, 0.06 + i * 0.05, 0.24 + i * 0.05), w = p.measure(ch, { font: "big", scale: 2 })[0];
      if (k > 0) {
        const dy = Math.round(-9 * (1 - ease.outBack(k, 2.4))) + (i % 2 ? 1 : -1);
        p.text(ch, x, cy - 7 + dy, (gx, gy) => (gy < 3 ? P[6] : P[5]), { font: "big", scale: 2, outline: P[0], shadow: P[2] });
      }
      x += w + 2;
    });
  }
  p.glow(cx, cy, 34 * s, P[4], 0.3 * (1 - seg(t, 0.1, 0.8)));
}
