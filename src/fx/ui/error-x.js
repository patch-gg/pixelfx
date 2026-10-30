import { PAL, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";

export const meta = {
  name: "Error X",
  desc: "A fat red X slashes in stroke by stroke, white-hot at the tips, then shakes its head no, flashing, with chips flying off; it blinks out.",
  tags: ["ui", "error", "fail", "wrong", "deny", "one-shot"],
  size: [56, 52],
  origin: [28, 24],
  duration: 1.1,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.blood, seed: 13 },
};

const L = new Layer(56, 48);
const A = 8; // half-size of the X

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed;
  if (t >= 1.05 || (t > 0.8 && Math.floor(t * 30) % 3 === 0)) return;
  // a "no" shake: fast, side to side, dying away
  const sh = t > 0.2 ? Math.round(4 * Math.sin((t - 0.2) * 44) * Math.max(0, 1 - (t - 0.2) / 0.45)) : 0;
  const flash = (t > 0.18 && t < 0.24) || (t > 0.3 && t < 0.33);
  const q = L.begin(-28, -24);
  const stroke = (x0, y0, x1, y1, k) => {
    if (k <= 0) return;
    const ex = x0 + (x1 - x0) * k, ey = y0 + (y1 - y0) * k;
    q.beam(x0 + sh, y0 + 1, ex + sh, ey + 1, 5, C[1]);
    q.beam(x0 + sh, y0, ex + sh, ey, 5, (u, v) => (flash ? WHITE : v > 0.55 && u * k > 0.02 ? C[5] : C[4]));
    if (k < 1) q.beam(ex + sh - (x1 - x0) * 0.12, ey - (y1 - y0) * 0.12, ex + sh, ey, 5, WHITE); // the hot tip
  };
  stroke(-A, -A, A, A, ease.outQuart(seg(t, 0, 0.09)));
  stroke(A, -A, -A, A, ease.outQuart(seg(t, 0.1, 0.19)));
  L.outline(C[0]);
  L.draw(p);
  // chips fly off when the second stroke lands
  burst(7, S, (r, i) => {
    const age = t - 0.19, life = r.range(0.22, 0.32);
    if (age < 0 || age > life) return;
    const a = (i / 7) * TAU + r.range(-0.3, 0.3), sp = r.range(36, 52);
    const x = Math.cos(a) * (5 + sp * age), y = Math.sin(a) * (5 + sp * age) + 60 * age * age;
    p.rect(Math.round(x), Math.round(y), 2, 2, age / life < 0.5 ? C[5] : C[3]);
  });
  // a red ring snaps out
  const rk = seg(t, 0.19, 0.4);
  if (rk > 0 && rk < 1) p.ring(sh, 0, 12 + 10 * ease.outCubic(rk), rk < 0.4 ? 2 : 1, rk < 0.5 ? C[6] : C[4], rk < 0.7 ? 1 : 0.5);
  p.glow(sh, 0, 24, C[4], flash ? 0.5 : 0.15);
}
