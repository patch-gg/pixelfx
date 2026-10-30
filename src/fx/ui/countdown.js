import { PAL, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { boldText, shake, fit } from "./_lib.js";

export const meta = {
  name: "Countdown",
  desc: "3, 2, 1 slam in one by one inside a draining timer ring and zoom away; GO! bursts out white with rays and a shockwave, then blinks off.",
  tags: ["ui", "countdown", "start", "timer", "text", "one-shot"],
  size: [76, 60],
  origin: [38, 30],
  duration: 2.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.volt, from: 3, go: "GO!", seed: 5 },
};

const STEP = 0.55;

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, n = o.from, goAt = n * STEP;
  const fill = (gx, gy) => (gy < 2 ? WHITE : gy < 4 ? C[5] : gy < 6 ? C[4] : C[3]);
  if (t < goAt) {
    const i = Math.floor(t / STEP), k = (t - i * STEP) / STEP, label = String(n - i);
    // the timer ring drains clockwise around the number
    const left = 1 - ease.inOutSine(seg(k, 0.05, 0.85));
    if (k < 0.85) {
      p.ring(0, -1, 19, 2, C[1]);
      if (left > 0.01) p.arc(0, -1, 19, 2, -Math.PI / 2, -Math.PI / 2 + TAU * left, (u, v) => (v > 0.5 ? C[5] : C[4]));
    }
    // the slam: a frame big and white, then held; it zooms away down the scales at the end
    const scale = k < 0.06 ? 4 : k < 0.78 ? 3 : k < 0.86 ? 2 : k < 0.93 ? 1 : 0;
    if (!scale) return;
    // a pulse ring on the slam, behind the number
    const rk = seg(k, 0, 0.35);
    if (rk < 1) p.ring(0, -1, 12 + 14 * ease.outCubic(rk), rk < 0.5 ? 2 : 1, rk < 0.5 ? C[5] : C[3], rk < 0.7 ? 1 : 0.5);
    const [sx, sy] = shake(t, 2, i * STEP + 0.02, 0.18, S + i);
    boldText(p, label, sx, sy - Math.round(3.5 * scale) - 1, k < 0.06 ? WHITE : fill, { scale, outline: C[1], shadow: C[0], w: scale > 2 ? 2 : 1, sh: 2 });
    p.glow(0, -1, 26, C[4], 0.35 * (1 - seg(k, 0, 0.4)));
    return;
  }
  // GO!
  const g = t - goAt, k = g / (meta.duration - goAt);
  if (k >= 0.97) return;
  // rays and a shockwave
  burst(12, S, (r, i) => {
    const rk = seg(g, 0, 0.35);
    if (rk >= 1) return;
    const a = (i / 12) * TAU + r.range(-0.12, 0.12), d0 = 16 + 14 * ease.outCubic(rk), d1 = d0 + (6 + r.range(0, 6)) * (1 - rk);
    p.line(Math.cos(a) * d0, Math.sin(a) * d0 * 0.8 - 1, Math.cos(a) * d1, Math.sin(a) * d1 * 0.8 - 1, rk < 0.4 ? WHITE : C[5]);
  });
  const wk = seg(g, 0, 0.3);
  if (wk < 1) p.ellipse(0, -1, 14 + 22 * ease.outCubic(wk), 10 + 16 * ease.outCubic(wk), wk < 0.4 ? WHITE : C[4], (d) => (d > 0.9 ? (wk < 0.7 ? 1 : 0.5) : 0));
  if (k > 0.7 && Math.floor(t * 30) % 2) return;
  const scale = g < 0.07 ? 4 : 3, flash = g < 0.12 || (g < 0.3 && Math.floor(t * 30) % 4 === 0);
  const [sx, sy] = shake(t, 3, goAt + 0.02, 0.3, S + 9);
  boldText(p, o.go, sx, sy - Math.round(3.5 * scale) - 1, flash ? WHITE : fill, { scale, outline: C[1], shadow: C[0], w: 2, sh: 2 });
  p.glow(0, -1, 34, C[4], 0.5 * (1 - seg(g, 0, 0.5)) + 0.1);
}
