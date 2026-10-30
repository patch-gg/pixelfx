import { PAL, fract, ease, seg, rng } from "../../core/index.js";
import { fit, oval, ripple } from "./_lib.js";

export const meta = {
  name: "Ripples",
  desc: "Rings spread over still water from a bobbing point: bright crests over dark troughs, slowing and breaking into dashes as they fade.",
  tags: ["water", "ripple", "surface", "pond", "ambient", "loop"],
  size: [80, 24],
  origin: [40, 12],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.water, count: 3, radius: 36, squash: 0.28, seed: 1 },
};

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, ph = t / meta.duration, R = o.radius, q = o.squash, n = o.count;
  for (let i = 0; i < n; i++) {
    const k = fract(ph + i / n); // this ring's age 0..1: the newest is born as the oldest dies
    const r = 1.5 + (R - 1.5) * ease.outQuad(k), keep = 1 - seg(k, 0.25, 1);
    // the trough: a dark arc just inside the crest on the near side, gone before the crest
    if (r > 5 && k < 0.6) oval(p, 0, 0.7, r - 2.5, (r - 2.5) * q, W[2], (a) => (Math.sin(a) > 0.35 ? 1 : 0));
    ripple(p, 0, 0, r, r * q, k < 0.2 ? W[7] : W[6], k < 0.2 ? W[6] : W[5], keep * 1.25, S * 13 + i);
  }
  // flecks of foam floating on the surface, lifted a pixel as each crest passes under them
  for (let i = 0; i < 5; i++) {
    const r = rng(S, i), ang = r.range(0, Math.PI * 2), rho = r.range(8, R - 4), x = Math.cos(ang) * rho, y = Math.sin(ang) * rho * q;
    let lift = 0;
    for (let j = 0; j < n; j++) {
      const k = fract(ph + j / n), rr = 1.5 + (R - 1.5) * ease.outQuad(k);
      if (Math.abs(rr - rho) < 1.6) lift = 1;
    }
    p.px(x, y - lift, lift ? W[7] : W[5]);
    if (r.next() < 0.5) p.px(x + 1, y - lift, W[4]);
  }
  // the source: each time a ring is born the point dips and kicks up a bead of water
  const beat = fract(ph * n) * (meta.duration / n), hop = beat < 0.3 ? Math.sin((beat / 0.3) * Math.PI) : 0;
  oval(p, 0, 0, 2.5 - hop, 0.8, W[6]);
  if (hop > 0.05) {
    p.px(0, -1 - Math.round(hop * 4), W[7]);
    if (hop > 0.5) p.px(0, -Math.round(hop * 4), W[5]);
  }
  p.glow(0, 0, 10, W[5], 0.1 + 0.1 * hop);
}
