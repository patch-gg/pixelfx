import { ease, seg, lerp, cycle, TAU } from "../../core/index.js";
import { Grid, shades, lit, shift } from "./_lib.js";

export const meta = {
  name: "Jellyfish",
  desc: "A see-through jellyfish pulses upward: the bell snaps narrow and relaxes wide, tentacles trail and sway behind, frilly arms ripple, a soft inner glow.",
  tags: ["critter", "jellyfish", "sea", "water", "glow", "loop"],
  size: [44, 64],
  origin: [22, 20],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1d0b2e", "#5b2276", "#a24aac", "#e88ad2", "#ffdcf6"], pulses: 2, tentacles: 6, seed: 1 },
};

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), ph = t / meta.duration, N = o.tentacles;
  const f = (ph * o.pulses) % 1;
  // a pulse: a quick squeeze, then a long slow relax; it rises on the squeeze and sinks back as it relaxes
  const squeeze = f < 0.18 ? ease.outQuad(f / 0.18) : 1 - ease.inOutSine(seg(f, 0.18, 1));
  const rise = f < 0.3 ? ease.outCubic(f / 0.3) : 1 - ease.inOutSine(seg(f, 0.3, 1));
  const rx = lerp(10.5, 7.5, squeeze), ry = lerp(7, 9, squeeze), cy = -4 * rise, rimY = cy + ry * 0.3;
  // tentacles first, behind the bell: each point lags the bell, so the pulse travels down them
  for (let i = 0; i < N; i++) {
    const u = ((i + 0.5) / N) * 2 - 1, x0 = u * rx * 0.78, len = 24 + ((i * 7) % 5) * 2;
    for (let s = 1; s <= len; s++) {
      const back = ph * TAU * o.pulses - s * 0.22 + i * 1.7;
      const spread = lerp(1, 0.55, Math.max(0, Math.sin(back)) * 0.5 + squeeze * 0.5);
      const x = x0 * spread + Math.sin(back) * s * 0.09 + u * s * 0.06, y = rimY + s * (0.92 + squeeze * 0.06);
      const k = s / len;
      p.px(x, y, k > 0.7 ? S[1] : s % 3 === 0 ? S[3] : S[2]);
    }
  }
  const g = new Grid(-22, -20, 44, 64);
  // frilly oral arms in the middle, wider and shorter, rippling
  for (const side of [-1, 1]) {
    const pts = [];
    for (let s = 0; s <= 14; s += 1.5) pts.push([side * 2.2 + Math.sin(ph * TAU * o.pulses - s * 0.35 + side) * (0.5 + s * 0.13), rimY + s]);
    g.tube(pts, (u) => 1.1 * (1 - u * 0.5), (u, v) => (v < 0.5 && u < 0.6 ? S[4] : S[3]));
  }
  // the bell: a dome with a hollow underside, inner lobes, a beaded rim
  g.shade(-rx - 1, cy - ry - 1, rx + 1, rimY + 2, (x, y) => {
    const nx = x / rx, ny = (y - cy) / ry;
    if (ny > 0.3) return 0;
    if (nx * nx + ny * ny > 1 && ny < 0) return 0;
    if (Math.abs(nx) > 1) return 0;
    // the underside curves up into the bell
    const under = 0.3 - 0.55 * (1 - nx * nx);
    if (ny > under && ny > 0 - 0.6 * (1 - nx * nx)) {
      if (ny > under + 0.18) return 0;
      return S[3];
    }
    const L = lit(nx, Math.min(ny, 0));
    const lobe = Math.hypot(nx * 1.6, (ny + 0.42) * 2.2);
    if (lobe < 0.55 && lobe > 0.28) return S[4];
    if (L > 0.88) return S[4];
    if (L > 0.55) return S[3];
    return S[2];
  });
  g.outline(S[1]);
  g.draw(p);
  // glow from inside, brightest on the squeeze
  p.glow(0, cy - 1, 20, S[3], 0.18 + 0.14 * squeeze);
  p.glow(0, cy - 2, 7, S[4], 0.2 + 0.2 * squeeze);
  // specks of plankton drift past
  cycle(t, meta.duration, 5, o.seed, 2.4, (age, life, r) => {
    const x = r.range(-20, 20) + Math.sin(age * 2 + r.next() * 6), y = r.range(-16, 40) - age * 3;
    p.dot(x, y, S[2], 0.7 * Math.sin((age / life) * Math.PI));
  });
}
