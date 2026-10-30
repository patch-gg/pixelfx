import { PAL, cycle, bump, clamp, TAU } from "../../core/index.js";
import { steps, geom, recolor, tone } from "./_lib.js";

export const meta = {
  name: "Bleeding",
  desc: "Dark red drops swell on the body, run a little, let go and spatter on the floor into a small pool; the target flinches red with each tick.",
  tags: ["status", "bleed", "blood", "dot", "debuff", "loop"],
  size: [36, 34],
  origin: [18, 29],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.blood, count: 5, seed: 8 },
};

const SPOTS = new WeakMap();
// where blood runs off: the outermost pixel of each row on the left and right of the body, so drops fall clear of it;
// and two wounds on the front of the torso
function wounds(a) {
  let s = SPOTS.get(a.mask);
  if (s) return s;
  const g = geom(a.mask), edges = [], front = [];
  for (let y = 7; y < a.h * 0.75; y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < a.w; x++) if (g.on(x, y)) (x0 < 0 && (x0 = x)), (x1 = x);
    if (x0 >= 0) edges.push([x0 - 0.5, y], [x1 + 1.5, y]);
  }
  for (const [x, y] of [[0.3, 0.64], [0.66, 0.54]]) front.push([Math.floor(a.w * x), Math.floor(a.h * y)]);
  s = { edges, front };
  SPOTS.set(a.mask, s);
  return s;
}

export function draw(p, t, o) {
  const B = steps(o.palette), a = o.actor, S = o.seed, D = meta.duration, ph = t / D;

  // the tick: twice a loop the target flinches red for a frame or two
  const tick = Math.max(bump(ph, 0.02, 0.1), bump(ph, 0.52, 0.6));
  if (tick > 0.3) recolor(p, a, (c) => (c ? B[clamp(Math.round(2 + tone(c) * 5), 2, 6)] : 0), (mx, my) => (p.get(a.x + mx, a.y + my) ? 1 : 0));

  // the pool at the feet, a pixel wider each time a drop lands
  const spots = wounds(a);
  let landed = 0;
  // wounds on the front: small slashes that flare on the tick
  for (const [mx, my] of spots.front) {
    const x = a.x + mx, y = a.y + my;
    p.px(x, y, tick > 0.3 ? B[6] : B[4]), p.px(x + 1, y - 1, B[3]), p.px(x - 1, y + 1, B[3]);
  }
  // drops: swell on a wound, run down a little, let go, fall, spatter
  cycle(t, D, o.count, S, (r) => r.range(0.85, 1.15), (age, life, r) => {
    const e = spots.edges, [mx, my] = e[Math.floor(r.next() * e.length)], x = a.x + mx, y0 = a.y + my + 0.5;
    const run = r.range(1, 3), swell = 0.3, slide = 0.15;
    if (age < swell) {
      p.px(x, y0, B[4]);
      if (age > swell * 0.5) p.px(x, y0 + 1, age > swell * 0.8 ? B[5] : B[4]);
      return;
    }
    if (age < swell + slide) {
      const yy = y0 + 1 + run * ((age - swell) / slide);
      p.line(x, y0, x, yy, B[3]);
      p.px(x, yy, B[5]), p.px(x, yy + 1, B[4]);
      return;
    }
    if (age < swell + slide + 0.3) p.line(x, y0, x, y0 + run, B[3]);
    const f = age - swell - slide, y = y0 + run + 1 + 160 * f * f, hit = Math.sqrt(Math.max(0, -1 - (y0 + run + 1)) / 160);
    if (f < hit) {
      p.px(x, y, B[6]), p.px(x, y - 1, B[4]);
      if (f > 0.05) p.px(x, y - 2, B[3]);
      return;
    }
    // spatter: two flecks jump out and drop
    const s = (f - hit) / 0.22;
    landed += s < 1 ? 1 : 0;
    if (s >= 1) return;
    const hop = Math.round(Math.sin(s * Math.PI) * 2);
    p.px(x - 1 - Math.round(s * 3), -1 - hop, B[4]);
    p.px(x + 1 + Math.round(s * 2), -1 - Math.round(hop * 0.6), B[3]);
    p.line(x - 1, 0, x + 1, 0, B[3]);
  });

  // the pool: dark, with a lit lip, breathing a little
  const w = 4 + Math.sin(ph * TAU) * 0.6 + landed * 0.5;
  p.ellipse(1, 0.5, w, 1.3, (d, ang) => (d > 0.7 && Math.sin(ang) < 0 ? B[3] : B[1]));
  p.light(1, 0, B[4], 0.15);
}
