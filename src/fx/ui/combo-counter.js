import { PAL, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { Layer, boldText, blitSlant, shake, fit } from "./_lib.js";

export const meta = {
  name: "Combo counter",
  desc: "A slanted x5 COMBO punches in from the left on speed lines, lands with a white flash, a jolt and a ring, pulses, then hops up and blinks out.",
  tags: ["ui", "combo", "counter", "streak", "text", "directional", "one-shot"],
  size: [88, 52],
  origin: [44, 30],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.neon, count: 5, label: "COMBO", seed: 4 },
};

const L = new Layer(96, 48);
const LAND = 0.12;

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed;
  // in from the left with an overshoot; at the end a hop up while it blinks out
  const inK = ease.outBack(seg(t, 0, LAND), 1.4), outK = seg(t, 1.0, 1.25);
  if (t >= 1.25) return;
  const x = Math.round(-22 * (1 - inK)), y = Math.round(-7 * ease.outCubic(outK));
  const [sx, sy] = shake(t, 2.5, LAND, 0.3, S);
  // speed lines stream behind it on the way in
  const sl = 1 - seg(t, LAND, LAND + 0.2);
  if (sl > 0)
    burst(5, S, (r, i) => {
      const ly = -14 + i * 6 + Math.round(r.range(-1, 1)), x1 = x - 20 + (i % 2) * 3, len = Math.min((8 + r.range(0, 10)) * sl, x1 + 42);
      if (len >= 2) p.line(x1 - len, ly, x1, ly, (u) => (u > 0.6 ? C[6] : C[i % 2 ? 3 : 4]));
    });
  if (outK > 0 && Math.floor(t * 30) % 2) return;
  // the ring and sparks of the landing, behind the words
  const lk = seg(t, LAND, LAND + 0.24);
  if (lk > 0 && lk < 1) {
    const rx = 18 + 12 * ease.outCubic(lk), ry = 12 + 7 * ease.outCubic(lk);
    p.ellipse(sx, sy - 4, rx, ry, lk < 0.45 ? WHITE : C[5], (d) => (d > 1 - 1.4 / ry ? (lk < 0.75 ? 1 : 0.5) : 0));
    burst(6, S + 2, (r, i) => {
      const a = (i / 6) * TAU + r.range(-0.3, 0.3), d = 1.1 + 0.25 * ease.outCubic(lk), e = d + 0.2 * (1 - lk);
      p.line(sx + Math.cos(a) * rx * d * 0.9, sy - 4 + Math.sin(a) * ry * d * 0.9, sx + Math.cos(a) * rx * e * 0.9, sy - 4 + Math.sin(a) * ry * e * 0.9, C[6]);
    });
  }
  // the number pulses as it lands, flashing white
  const beat = t > LAND && t < LAND + 0.07 ? 3 : 2;
  const flash = t > LAND - 0.02 && t < LAND + 0.07;
  const fill = flash ? WHITE : (gx, gy) => (gy < 2 ? C[7] : gy < 4 ? C[6] : gy < 6 ? C[5] : C[4]);
  const q = L.begin(-48, -30);
  boldText(q, "x" + o.count, 0, -14 - (beat - 2) * 8, fill, { scale: beat, outline: C[1], shadow: C[0], sh: 2 });
  boldText(q, o.label, 0, 3, flash ? C[6] : (gx, gy) => (gy < 3 ? WHITE : C[6]), { outline: C[1], shadow: C[0] });
  blitSlant(p, L, 0.25, 0, x + sx, y + sy);
  p.glow(x, y - 4, 34, C[4], 0.1 + 0.4 * (t > LAND ? 1 - seg(t, LAND, LAND + 0.4) : 0));
}
