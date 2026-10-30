import { PAL, cycle, clamp, bump, ease, TAU } from "../../core/index.js";
import { steps, geom, recolor, tone } from "./_lib.js";

export const meta = {
  name: "Poisoned",
  desc: "Sickly green seeps through the target in slow pulses, darkest parts first; bubbles rise off it and pop, drips fall and splash.",
  tags: ["status", "poison", "toxic", "dot", "debuff", "loop"],
  size: [40, 44],
  origin: [20, 40],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.poison, seed: 5 },
};

const BUBBLE_S = [".#.", "#.#", ".#."];
const BUBBLE_L = [".##.", "#..#", "#..#", ".##."];

const DRIPS = new WeakMap();
// where drips fall from: outline spots under the chin and hands (edges that face down, off the ground)
function dripSpots(a) {
  let s = DRIPS.get(a.mask);
  if (s) return s;
  const g = geom(a.mask);
  s = g.outline.filter(([x, y]) => {
    const nr = g.near(x, y);
    return nr && nr[2] > 0.5 && y < a.h - 5;
  });
  DRIPS.set(a.mask, s);
  return s;
}

export function draw(p, t, o) {
  const P = steps(o.palette), a = o.actor, S = o.seed, D = meta.duration, ph = t / D;
  // the seep: everything darker than a rising threshold turns green; two pulses a loop
  const pulse = Math.max(bump(ph, 0, 0.42), bump(ph, 0.5, 0.92));
  const th = 0.22 + 0.56 * ease.inOutSine(pulse);
  recolor(p, a, (c) => (c && tone(c) < th ? P[clamp(Math.round(1 + tone(c) * 6), 1, 6)] : 0));

  // bubbles rise off the body, wobbling, then pop
  cycle(t, D, 7, S, (r) => r.range(0.7, 1.1), (age, life, r) => {
    const k = age / life, big = r.next() < 0.4, x = a.x + r.range(1, a.w - 2) + Math.sin(age * 8 + r.next() * TAU) * 1.2;
    const y = a.y + r.range(4, 12) - age * r.range(10, 16);
    if (k < 0.85) {
      const rows = big ? BUBBLE_L : BUBBLE_S;
      p.sprite(rows, { "#": k < 0.5 ? P[6] : P[5] }, Math.round(x) - 1, Math.round(y) - 1);
      p.px(Math.round(x) - (big ? 0 : 1) + (big ? 0 : 1), Math.round(y) - 1 + 1, big ? P[7] : 0);
    } else {
      const s = big ? 2 : 1;
      p.px(x - s, y, P[6]), p.px(x + s + 1, y, P[6]), p.px(x, y - s, P[6]), p.px(x, y + s + 1, P[5]);
    }
  });

  // drips: a drop swells under the chin or a hand, lets go, falls and splashes
  const spots = dripSpots(a);
  cycle(t, D, 3, S + 1, 0.9, (age, life, r) => {
    const [mx, my] = spots[Math.floor(r.next() * spots.length)], x = a.x + mx, y0 = a.y + my;
    const fall = age - 0.35;
    if (fall < 0) {
      const s = age / 0.35;
      p.px(x, y0, P[5]);
      if (s > 0.5) p.px(x, y0 + 1, s > 0.8 ? P[6] : P[4]);
      return;
    }
    const y = y0 + 1 + 140 * fall * fall;
    if (y < -0.5) {
      p.px(x, y, P[6]), p.px(x, y - 1, P[4]);
      return;
    }
    const sp = (fall - Math.sqrt((-1.5 - y0) / 140)) / 0.25;
    if (sp > 0 && sp < 1) {
      const w = Math.round(1 + sp * 3);
      p.px(x - w, -1 - Math.round(bump(sp, 0, 1) * 2), P[5]), p.px(x + w, -1 - Math.round(bump(sp, 0, 1) * 2), P[5]);
      p.line(x - 1, 0, x + 1, 0, P[4]);
    }
  });

  p.glow(0, a.y + 9, 20, P[4], 0.12 + 0.2 * pulse);
}
