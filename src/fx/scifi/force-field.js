import { PAL, ramp, at, burst, fly, flyV, seg, clamp, rand, wrap, TAU, WHITE } from "../../core/index.js";
import { steps, hexCell } from "./_lib.js";

export const meta = {
  name: "Force field",
  desc: "A hex-plated energy dome over the floor: faint cells shimmer, the rim glows, and a shot from the right strikes it in a white flare that ripples across the plates.",
  tags: ["scifi", "shield", "barrier", "defense", "hex", "ground", "loop"],
  size: [88, 60],
  origin: [44, 54],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.electric, width: 36, height: 34, cell: 5, seed: 25 },
};

const SHOT = ramp(["#a8301a", "#ff8a2a", "#ffd27a", "#ffffff"]);
const HIT = 0.55; // when the shot lands, each loop

// longitude/latitude on the dome, as arc lengths, so the hex plates keep their size as the surface turns away
function surf(nx, ny, R) {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  return [Math.atan2(nx, nz) * R, Math.atan2(-ny, Math.sqrt(nx * nx + nz * nz)) * R];
}

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, RX = o.width, RY = o.height, D = meta.duration, ph = t / D;
  const R = (RX + RY) / 2, hitN = [0.74, -0.5], [hu, hv] = surf(hitN[0], hitN[1], R);
  const hx = hitN[0] * RX, hy = hitN[1] * RY, age = t - HIT;
  const ripple = age > 0 && age < 0.9 ? age : -1;

  p.shade(-RX - 1, -RY - 1, RX + 1, 0, (x, y, out) => {
    const nx = x / RX, ny = y / RY, d = Math.sqrt(nx * nx + ny * ny);
    if (d > 1) return;
    if (d > 0.955) {
      // the rim: brightest along the top, a slow shimmer running round it
      const a = Math.atan2(ny, nx), sh = Math.sin(a * 5 + ph * TAU * 2);
      out.c = sh > 0.6 ? C[6] : ny < -0.5 ? C[5] : C[4];
      out.k = 0.25;
      return;
    }
    const [u, v] = surf(nx, ny, R), [q, r, e] = hexCell(u, v, o.cell);
    // how lit this plate is: a little toward the rim (the dome turns away), twinkles, and the ripple
    let I = 0.12 + 0.45 * d * d * d;
    const tw = wrap(t - rand(S, q, r) * D, D);
    if (rand(S, q, r, 1) < 0.18 && tw < 0.18) I += 0.45 * (1 - tw / 0.18);
    let fill = 0;
    if (ripple >= 0) {
      const s = Math.hypot(u - hu, v - hv), front = 4 + ripple * 62, k = 1 - ripple / 0.9;
      const band = Math.exp(-(((s - front) / 3.5) ** 2));
      I += band * 1.1 * k;
      fill = band * k;
      if (ripple < 0.07 && s < 6) (I += 1), (fill = 1.2);
    }
    if (e > 0.8) {
      if (I < 0.2) return;
      out.c = at([C[2], C[3], C[4], C[5], C[6], WHITE], (I - 0.2) * 1.2);
      out.k = 0.1 + 0.25 * clamp(I - 0.3);
      return;
    }
    if (fill > 0.45) out.c = fill > 1 ? WHITE : fill > 0.75 ? C[4] : C[3];
    out.l = C[3];
    out.k = 0.07 + 0.12 * d * d + 0.3 * fill;
  });

  // where the dome meets the floor
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU, x = Math.cos(a) * RX, y = Math.sin(a) * 3.5;
    if (y < 0) continue;
    p.px(x, y, Math.abs(Math.cos(a)) > 0.9 ? C[5] : C[4]);
  }
  p.glow(0, 0, RX, C[3], 0.2);

  // the shot: a hot bolt from the right, gone in a flare where it lands, sparks glancing off
  const sk = seg(t, HIT - 0.12, HIT);
  if (sk > 0 && sk < 1) {
    const sx = hx + (36 - hx) * (1 - sk), sy = hy - 5 * (1 - sk);
    p.line(sx, sy, Math.min(43, sx + 7), sy - 1, SHOT[1]);
    p.line(sx, sy, sx + 3, sy, SHOT[2]);
    p.px(sx, sy, WHITE);
    p.glow(sx, sy, 8, SHOT[1], 0.4);
  }
  if (age >= 0 && age < 0.1) {
    p.circle(hx, hy, 3.5 - age * 20, WHITE);
    p.glow(hx, hy, 20, C[5], 0.5 * (1 - age / 0.1));
  }
  burst(8, S + 3, (r) => {
    const life = r.range(0.2, 0.4);
    if (age < 0 || age > life) return;
    const a = r.range(-1.6, 0.4), sp = r.range(40, 90), vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(hx + 1, hy, vx0, vy0, age, 200, 2), [vx, vy] = flyV(vx0, vy0, age, 200, 2), q = age / life;
    if (x > 43 || y > 0) return;
    p.line(x, y, x - vx * 0.03, y - vy * 0.03, q < 0.4 ? SHOT[3] : q < 0.7 ? SHOT[2] : SHOT[1]);
  });
  if (ripple >= 0) p.glow(hx, hy, 30, C[4], 0.3 * (1 - ripple / 0.9));
}
