import { PAL, burst, seg, ease, rng, star, TAU, WHITE } from "../../core/index.js";
import { boldText, shake, fit } from "./_lib.js";

export const meta = {
  name: "Crit number",
  desc: "CRIT 128! slams in over a jagged starburst: triple size for a frame, a hard shake, white flashes, speed lines, then the burst folds away.",
  tags: ["ui", "critical", "damage", "number", "combat", "text", "one-shot"],
  size: [88, 70],
  origin: [44, 38],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, text: "128!", label: "CRIT", seed: 3 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed;
  const [sx, sy] = shake(t, 3, 0.02, 0.45, S);
  // the starburst: pops past full size, settles, turns a little, then folds away
  const grow = ease.outBack(seg(t, 0, 0.12), 3), fold = ease.inBack(seg(t, 0.85, 1.1), 2);
  const sc = grow * (1 - fold);
  if (sc > 0.02) {
    const r = rng(S, 1), rot = -Math.PI / 2 + 0.25 * seg(t, 0, 1.1);
    const pts = star(sx, sy - 2, 13 * sc, 25 * sc, 9, rot).map(([x, y], i) => {
      const j = i % 2 ? 1 : r.range(0.85, 1.08);
      return [sx + (x - sx) * j, sy - 2 + (y - sy + 2) * j];
    });
    p.poly(pts, C[2]);
    p.poly(star(sx, sy - 2, 10 * sc, 19 * sc, 9, rot), C[3]);
    p.poly(star(sx, sy - 2, 7 * sc, 12 * sc, 9, rot + 0.17), C[4]);
  }
  // speed lines flung out at the slam
  burst(10, S + 1, (r, i) => {
    const k = seg(t, 0.02, 0.32);
    if (k <= 0 || k >= 1) return;
    const a = (i / 10) * TAU + r.range(-0.15, 0.15), d0 = 14 + 26 * ease.outCubic(k), d1 = d0 + 9 * (1 - k);
    p.line(Math.cos(a) * d0, Math.sin(a) * d0 * 0.75, Math.cos(a) * d1, Math.sin(a) * d1 * 0.75, k < 0.4 ? WHITE : C[6]);
  });
  if (t > 1.04 || (t > 0.8 && Math.floor(t * 30) % 3 === 0)) return; // blinking out as the burst folds
  // the words: the number slams in at triple size, flashing white on alternate frames at first
  const flash = t < 0.2 && Math.floor(t * 30) % 2 === 0;
  const scale = t < 0.05 ? 3 : 2;
  const fill = flash ? WHITE : (gx, gy) => (gy < 2 ? C[7] : gy < 4 ? C[6] : gy < 6 ? C[5] : C[4]);
  boldText(p, o.text, sx, sy - 6 * scale + 4, fill, { scale, outline: C[1], shadow: C[0], w: 1, sh: 2 });
  const lk = seg(t, 0.08, 0.2);
  if (lk > 0) {
    const ly = sy - 18 - Math.round(4 * (1 - ease.outBack(lk, 3)));
    boldText(p, o.label, sx, ly, flash ? C[6] : (gx, gy) => (gy < 3 ? WHITE : C[6]), { outline: C[1], shadow: C[0] });
  }
  p.glow(sx, sy, 36, C[5], 0.5 * (1 - seg(t, 0, 0.5)) + 0.12);
}
