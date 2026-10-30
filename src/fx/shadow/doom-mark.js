import { cycle, bump, seg, ease, fract, TAU } from "../../core/index.js";
import { steps, CRIMSON } from "./_lib.js";

export const meta = {
  name: "Doom mark",
  desc: "A crimson rune burns on the floor: a band of glyphs turning one way, a sigil the other, beating like a slow heart as embers rise.",
  tags: ["shadow", "curse", "rune", "ground", "doom", "marker", "loop"],
  size: [72, 40],
  origin: [36, 26],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: CRIMSON, radius: 26, seed: 2 },
};

const SQ = 0.4; // floor perspective: circles on the floor are squashed this much

// approximate screen-space distance from (x, y) to an ellipse with radii (rx, ry): negative inside
function edist(x, y, rx, ry) {
  const e = Math.hypot(x / rx, y / ry), gx = x / (rx * rx), gy = y / (ry * ry), g = Math.hypot(gx, gy) / (e || 1);
  return (e - 1) / (g || 1e-6);
}
// distance from (x, y) to the segment a-b
function sdist(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(ax + dx * u - x, ay + dy * u - y);
}

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, D = meta.duration, ph = t / D, R = o.radius, RB = R - 6, RS = R - 8;
  // heartbeat: two quick beats, then a long rest
  const beat = Math.max(bump(ph, 0, 0.07), 0.8 * bump(ph, 0.1, 0.17));
  const hot = beat > 0.45, line = hot ? C[7] : C[6], mid = hot ? C[6] : C[5];
  // the sigil: a triangle turning against the band, a third of a turn a loop (so it lands on itself)
  const tri = [0, 1, 2].map((k) => {
    const a = Math.PI / 2 - (ph * TAU) / 3 + (k * TAU) / 3;
    return [Math.cos(a) * RS, Math.sin(a) * RS * SQ];
  });
  const wave = seg(ph, 0.02, 0.32), WR = R + 1 + 7 * ease.outCubic(wave);

  p.shade(-WR - 1, -WR * SQ - 1, WR + 1, WR * SQ + 1, (x, y) => {
    const d1 = edist(x, y, R, R * SQ);
    // the ring thrown out by the first beat, cooling as it spreads
    if (wave > 0 && wave < 1 && Math.abs(edist(x, y, WR, WR * SQ)) < 0.55) return wave < 0.3 ? C[6] : wave < 0.65 ? C[4] : C[3];
    if (d1 > 0.6) return;
    if (d1 > -0.6) return line;
    const d2 = edist(x, y, RB, RB * SQ);
    if (d2 > 0.55) {
      // the rune band: glyph strokes on dark, 16 cells turning a quarter turn a loop (4 shapes repeat)
      const a = Math.atan2(y / SQ, x), cell = (a / TAU) * 16 + ph * 4, i = ((Math.floor(cell) % 4) + 4) % 4, u = fract(cell);
      const v = -d1 / (-d1 + d2); // 0 at the outer line, 1 at the inner
      const stroke = i === 0 ? Math.abs(u - 0.5) < 0.12
        : i === 1 ? Math.abs(u - 0.3) < 0.1 || (v > 0.4 && v < 0.65 && u > 0.3 && u < 0.75)
        : i === 2 ? Math.abs(u - 0.5 - (v - 0.5) * 0.5) < 0.1
        : Math.abs(u - 0.4) < 0.1 && v < 0.55;
      return stroke ? mid : C[1];
    }
    if (d2 > -0.55) return mid;
    // the sigil and the eye at its heart
    for (let k = 0; k < 3; k++) {
      const [ax, ay] = tri[k], [bx, by] = tri[(k + 1) % 3];
      if (sdist(x, y, ax, ay, bx, by) < 0.6) return mid;
    }
    const e = Math.hypot(x / 4.5, y / 1.8);
    if (e < 1) return e < 0.4 ? (hot ? C[7] : C[6]) : e < 0.75 ? C[4] : C[2];
  });
  p.px(0, 0, C[0]);

  // embers rising off the rune
  cycle(t, D, 14, S, (r) => r.range(0.8, 1.4), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU), x = Math.cos(a) * R * r.range(0.3, 1), y0 = Math.sin(a) * R * SQ;
    const y = y0 - age * r.range(7, 11), sway = Math.sin(age * 6 + r.next() * 6) * 1.2;
    p.px(x + sway, y, k < 0.4 ? C[7] : k < 0.75 ? C[6] : C[4]);
    p.light(x + sway, y, C[5], 0.3 * (1 - k));
  });

  p.glow(0, -1, R + 6, C[5], 0.16 + 0.24 * beat);
  p.glow(0, 0, 10, C[6], 0.2 + 0.3 * beat);
}
