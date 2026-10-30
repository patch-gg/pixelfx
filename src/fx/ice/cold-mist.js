import { PAL, tileFbm, clamp, seg, cycle, WHITE } from "../../core/index.js";
import { fit, glint } from "./_lib.js";

export const meta = {
  name: "Cold mist",
  desc: "Low freezing fog rolls along the floor in two layers drifting right at different speeds, thick at the ground, wispy on top, with ice glints winking in it.",
  tags: ["ice", "mist", "fog", "cold", "ambient", "ground", "loop"],
  size: [128, 32],
  origin: [64, 26],
  duration: 4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, width: 60, height: 15, seed: 32 },
};

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, ph = t / meta.duration, HW = o.width, H = o.height;
  // thick at the floor, thinning upward, and thinning out toward the ends so it has no hard edge
  const body = (x, y) => Math.pow(clamp(1 - -y / H), 0.8) * (y > 2 ? clamp(1 - (y - 2) / 3) : 1) - seg(Math.abs(x), HW * 0.55, HW) * 0.9;
  p.shade(-HW - 2, -H - 6, HW + 2, 5, (x, y) => {
    const b = body(x, y);
    if (b < -0.3) return;
    // the front layer: pale streaks, faster
    const f = b * 0.62 + tileFbm(x * 0.055 - ph * 11, y * 0.34 + 5, 11, 0, S + 1, 3) * 0.8;
    if (f > 0.74) return I[6];
    if (f > 0.58) return I[5];
    // the back layer: dimmer, slower, showing through the gaps
    const k = b * 0.55 + tileFbm(x * 0.04 - ph * 5, y * 0.28, 5, 0, S, 3) * 0.75;
    if (k > 0.55) return I[3];
    if (k > 0.45) return I[2];
  });
  // ice glints winking in the fog
  cycle(t, meta.duration, 9, S + 2, (r) => r.range(0.3, 0.5), (age, life, r) => {
    const x = r.range(-HW * 0.6, HW * 0.6) + age * 20, y = -r.range(1, H * 0.6), k = Math.sin((age / life) * Math.PI);
    glint(p, x, y, k > 0.7 ? 1 : 0, I[6], WHITE);
  });
  p.glow(0, -4, HW * 0.9, I[4], 0.08);
}
