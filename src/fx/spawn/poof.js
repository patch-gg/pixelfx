import { ramp, at, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { cloud } from "./_lib.js";

export const meta = {
  name: "Poof",
  desc: "A cartoon poof: a ring of fat smoke balls pops out with an overshoot behind a white flash and speed lines, puffs up, then shrinks away ball by ball.",
  tags: ["spawn", "despawn", "smoke", "poof", "cartoon", "one-shot"],
  size: [52, 42],
  origin: [26, 38],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2c2840", "#5a5478", "#8e88aa", "#c4bed8", "#ecebf6", "#ffffff"], size: 1, seed: 21 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, k = o.size, cy = -11 * k;
  // the balls: a ring around a core, popped out with an overshoot, then each shrinks away on its own beat
  const balls = [];
  burst(10, S, (r, i) => {
    const core = i < 2, a = ((i - 2) / 8) * TAU + r.range(-0.25, 0.25), reach = core ? r.range(0, 2.5) : r.range(8, 11) * k;
    const pop = ease.outBack(seg(t, 0, 0.14 + r.range(0, 0.04)), 2.4);
    const gone = ease.inQuad(seg(t, 0.3 + r.range(0, 0.18), 0.66 + r.range(0, 0.1)));
    const R = r.range(4.5, 6.5) * k * (0.3 + 0.7 * pop) * (1 - gone);
    const x = Math.cos(a) * reach * pop, y = Math.min(cy + Math.sin(a) * reach * pop * 0.72 - t * r.range(5, 11), -R + 1);
    balls.push({ x, y, r: R });
  });
  cloud(p, balls, C, { inside: (x, y) => y < 0 });
  // the pop: a white flash for two frames
  if (t < 0.07) {
    p.circle(0, cy, (5 + t * 60) * k, WHITE);
    p.glow(0, cy, 26 * k, at(C, 0.8), 0.5);
  }
  // speed lines bursting out from under the cloud
  const sl = seg(t, 0.02, 0.18);
  if (sl > 0 && sl < 1) {
    burst(7, S + 1, (r, i) => {
      const a = (i / 7) * TAU + r.range(-0.2, 0.2) - 0.3, d0 = (12 + 10 * ease.outCubic(sl)) * k, len = 5 * (1 - sl) + 1;
      const x0 = Math.cos(a) * d0, y0 = cy + Math.sin(a) * d0 * 0.75;
      if (y0 > -1) return;
      p.line(x0, y0, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len * 0.75, at(C, 0.99));
    });
  }
  // twinkles left in the air as it clears
  burst(3, S + 2, (r) => {
    const tw = seg(t, r.range(0.25, 0.4), r.range(0.55, 0.7));
    if (tw <= 0 || tw >= 1) return;
    const x = r.range(-14, 14) * k, y = cy + r.range(-10, 4) * k, s = tw < 0.5 ? 2 : 1;
    p.line(x - s, y, x + s, y, at(C, 0.8)), p.line(x, y - s, x, y + s, at(C, 0.8)), p.px(x, y, WHITE);
  });
}
