import { PAL, cycle, fract, clamp, tileNoise, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Blizzard vortex",
  desc: "A snow tornado: a swaying funnel striped with spiralling bands, flakes whipping round it in front and behind, powder churning at its foot.",
  tags: ["ice", "snow", "tornado", "vortex", "blizzard", "storm", "loop"],
  size: [80, 92],
  origin: [40, 86],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, height: 80, width: 24, seed: 29 },
};

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, ph = t / meta.duration, H = o.height, Wd = o.width;
  const hgt = (y) => clamp(-y / H);
  const cx = (y) => Math.sin(ph * TAU + y * 0.05) * 3.5 * hgt(y);
  const rad = (y) => 3 + Wd * Math.pow(hgt(y), 1.25);
  // flakes whipping round the funnel: a rising spiral, fast near the ground; far side first
  const flakes = (front) => cycle(t, meta.duration, 60, S, (r) => r.range(0.9, 1.5), (age, life, r) => {
    const k = age / life, y = -r.range(2, 12) - k * r.range(50, 70), h = hgt(y);
    const th = r.range(0, TAU) + age * (14 - 8 * h), z = Math.sin(th);
    if (z > 0 !== front) return;
    const R = rad(y) * r.range(0.95, 1.25) + k * 3, x = cx(y) + Math.cos(th) * R;
    if (y < -H - 2) return;
    if (front) {
      const pth = th - 0.12, px = cx(y) + Math.cos(pth) * R;
      p.line(px, y + 0.6, x, y, I[6]);
      p.px(x, y, k < 0.7 ? WHITE : I[6]);
    } else p.px(x, y, I[3]);
  });
  flakes(false);
  // the funnel: spiralling bands of snow, edges catching the light
  p.shade(-Wd - 8, -H - 2, Wd + 8, 0, (x, y) => {
    const R = rad(y), u = (x - cx(y)) / R, h = hgt(y);
    if (Math.abs(u) > 1) return;
    // fray the top into clumps
    const n = tileNoise((x - cx(y)) * 0.25 + ph * 0, y * 0.3 - ph * 12, 0, 12, S);
    if (h > 0.82 && n < (h - 0.82) * 6 - 0.4) return;
    const th = Math.asin(u), front = fract(th / TAU * 2 + y * 0.045 + ph * 3), back = fract((Math.PI - th) / TAU * 2 + y * 0.045 + ph * 3);
    const wid = 0.12 + 0.05 * n;
    if (Math.abs(u) > 0.9 && front < 0.5) return u < 0 ? I[5] : I[4];
    if (front < wid) return u < 0.2 ? I[6] : I[5];
    if (back < wid * 0.6 && h > 0.15) return I[2];
  });
  // powder churning at the foot
  for (let i = 0; i < 9; i++) {
    const a = ph * TAU * 2 + (i * TAU) / 9, rr = 6 + 3 * Math.sin(ph * TAU * 3 + i * 1.7);
    const x = Math.cos(a) * rr, y = Math.sin(a) * 1.8 - 1;
    p.circle(x, y, 1.6 + (i % 3) * 0.5, Math.sin(a) > 0 ? I[6] : I[5]);
  }
  p.ellipse(0, 0, 10, 1.5, I[5]);
  flakes(true);
  p.glow(cx(-H * 0.5), -H * 0.5, 40, I[4], 0.14);
}
