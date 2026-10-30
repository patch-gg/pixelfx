import { PAL, ramp, at, clamp, seg, ease, loopNoise, tileNoise, TAU, hex } from "../../core/index.js";
import { fit, pool } from "./_lib.js";

export const meta = {
  name: "Candle",
  desc: "A small wax candle: a calm flame with a blue root that leans and stretches, a soft glow, and a bead of wax that runs down its drip.",
  tags: ["fire", "candle", "light", "prop", "ambient", "loop"],
  size: [28, 44],
  origin: [14, 40],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, height: 14, seed: 2 },
};

const WAX = ramp(["#4a2f37", "#9a7468", "#d8bfa6", "#f1e4cc", "#fffaee"]);
const WICK = hex("#2a1716"), BLUE = hex("#3a5cd0"), BLUE_DARK = hex("#24307a");

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), S = o.seed, D = meta.duration, ph = t / D, H = o.height, top = -H;
  const flick = 0.85 + 0.15 * loopNoise(ph, 1.6, S);
  // the candle: lit from the flame above, so warm at the top and dimmer toward the floor
  for (let y = top; y < 0; y++)
    for (let x = -3; x <= 3; x++) {
      const v = (y - top) / H;
      let c = x === -3 ? WAX[2] : x === 3 ? WAX[1] : x === 2 ? WAX[2] : WAX[3];
      if (x === -2 && v < 0.5) c = WAX[4];
      if (v > 0.75 && x !== -2) c = x === 3 || x === 2 ? WAX[1] : WAX[2];
      p.px(x, y, c);
    }
  // melted lip and the pool of wax around the wick
  p.px(-3, top - 1, WAX[3]), p.px(3, top - 1, WAX[2]);
  for (let x = -2; x <= 2; x++) p.px(x, top, WAX[4]);
  // drips: a long one down the shaded side with a fat foot, a short one on the lit edge, a melted base
  const dx = 2;
  for (let y = top + 1; y <= -6; y++) p.px(dx, y, WAX[3]);
  p.px(dx, -5, WAX[4]), p.px(dx, -4, WAX[3]), p.px(dx + 1, -5, WAX[3]), p.px(dx + 1, -4, WAX[2]);
  for (let y = top + 1; y < top + 4; y++) p.px(-3, y, WAX[3]);
  p.px(-3, top + 4, WAX[4]), p.px(-4, top + 4, WAX[2]);
  for (let x = -4; x <= 4; x++) p.px(x, -1, x < 0 ? WAX[3] : WAX[2]);
  // a fresh bead swells on the lip, then runs down the drip, gathering speed, and joins its foot
  const grow = seg(ph, 0.05, 0.45), run = ease.inQuad(seg(ph, 0.45, 0.95));
  if (grow > 0 && ph < 0.95) {
    const by = Math.round(top + run * (-6 - top));
    p.px(dx, by, WAX[4]);
    if (grow > 0.6) p.px(dx + 1, by, WAX[3]);
    if (run > 0.1) p.px(dx, by - 1, WAX[4]);
    p.light(dx, by, F[6], 0.3);
  }
  // wick
  p.px(0, top - 1, WICK), p.px(0, top - 2, WICK), p.px(0, top - 3, F[3]);
  // the flame: a calm teardrop with a blue root, leaning and stretching a little
  const fh = 10 * (0.92 + 0.12 * loopNoise(ph, 1.2, S + 3)), base = top - 2;
  const lean = loopNoise(ph, 0.9, S + 7) * 1.4 + Math.sin(ph * TAU * 3) * 0.35;
  p.shade(-5, base - fh - 2, 5, base + 2, (x, y) => {
    const v = (base - y) / fh;
    if (v < -0.15 || v > 1) return;
    const w = 2.7 * (v < 0.25 ? Math.sqrt(clamp(1 - ((0.25 - v) / 0.4) ** 2)) : Math.pow(clamp(1 - (v - 0.25) / 0.8), 0.8));
    if (w < 0.35) return;
    const d = Math.abs(x - lean * v * v) / w + tileNoise(x * 0.5, y * 0.35 + ph * 9, 0, 9, S) * 0.18 * v;
    if (d > 1) return;
    if (v < 0.12) return d > 0.45 ? (d > 0.8 ? BLUE_DARK : BLUE) : F[6];
    if (d < 0.38 && v < 0.55) return F[7];
    if (d < 0.7 && v < 0.8) return F[6];
    return v > 0.82 ? F[4] : F[5];
  });
  // light: a soft halo and a warm spot at the heart of the flame
  p.glow(0, base - 4, 24 * flick, F[4], 0.22 * flick);
  p.glow(0, base - 3, 7, F[6], 0.32 * flick);
  pool(p, 0, 0, 12, 2.5, F[5], 0.2 * flick);
}
