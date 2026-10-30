import { PAL, TAU, fract, WHITE } from "../../core/index.js";
import { fit, glint } from "./_lib.js";

export const meta = {
  name: "Ice crystal",
  desc: "A floating six-sided ice crystal turns slowly and bobs: its facets catch the light in turn, a shine sweeps across, a star winks at its tip, motes circle.",
  tags: ["ice", "crystal", "gem", "floating", "pickup", "magic", "loop"],
  size: [48, 64],
  origin: [24, 32],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.ice, size: 1.2, seed: 31 },
};

// toward the light: up, left and toward the viewer (y is down, -z comes out of the screen)
const TILT = 0.32, LIGHT = (() => { const v = [-0.6, -0.7, -0.4], l = Math.hypot(...v); return v.map((c) => c / l); })();

export function draw(p, t, o) {
  const I = fit(o.palette), k = o.size, ph = t / meta.duration, bob = Math.round(Math.sin(ph * TAU) * 2);
  const rot = (ph * TAU) / 6; // a sixth of a turn a loop: the crystal looks the same after it, so it loops
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  const P = (x, y, z) => [x, y * ct - z * st + bob, y * st + z * ct]; // tilt toward the viewer
  const top = P(0, -17 * k, 0), bot = P(0, 13 * k, 0);
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = rot + (i * TAU) / 6;
    return P(Math.cos(a) * 8.5 * k, -1 * k, Math.sin(a) * 8.5 * k);
  });
  // motes circling it, the far ones behind
  const motes = (front) => {
    for (let i = 0; i < 5; i++) {
      const a = ph * TAU * 2 + (i * TAU) / 5, z = Math.sin(a);
      if (z > 0 !== front) continue;
      const x = Math.cos(a) * 17, y = bob + Math.sin(a) * 4 + Math.sin(ph * TAU * 3 + i) * 7;
      p.px(x, y, front ? (Math.sin(t * 20 + i) > 0 ? WHITE : I[6]) : I[3]);
    }
  };
  motes(false);
  // faces: only those turned toward us, shaded by the light, a shine band sweeping across them
  const faces = [];
  for (let i = 0; i < 6; i++) {
    const a = ring[i], b = ring[(i + 1) % 6];
    faces.push([top, a, b], [bot, b, a]);
  }
  const sweep = fract(ph * 2) * 70 - 30;
  for (const f of faces) {
    const [a, b, c] = f, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    (nx /= nl), (ny /= nl), (nz /= nl);
    if (nz > 0) continue; // facing away from us
    const lit = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
    const base = lit > 0.75 ? 6 : lit > 0.45 ? 5 : lit > 0.1 ? 4 : lit > -0.25 ? 3 : 2;
    p.poly([[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]], (x, y) => (Math.abs(x + y * 0.6 - sweep) < 2 ? I[Math.min(7, base + 2)] : I[base]));
  }
  // edges: the silhouette in the dark step, the ridges between faces lighter
  for (let i = 0; i < 6; i++) {
    const a = ring[i], b = ring[(i + 1) % 6];
    if (a[2] > 0.5 || b[2] > 0.5) continue; // only the near half's edges show
    p.line(top[0], top[1], a[0], a[1], a[0] < 0 ? I[7] : I[5]);
    p.line(a[0], a[1], b[0], b[1], I[6]);
  }
  const xs = ring.map((v) => v[0]), L = ring[xs.indexOf(Math.min(...xs))], R = ring[xs.indexOf(Math.max(...xs))];
  p.polyline([[top[0], top[1]], [R[0], R[1]], [bot[0], bot[1]], [L[0], L[1]], [top[0], top[1]]], I[2]);
  // a star winks at the tip now and then
  const wink = Math.sin(ph * TAU * 2 + 1);
  if (wink > 0.6) glint(p, top[0], top[1], wink > 0.9 ? 3 : 2, I[6], WHITE);
  motes(true);
  p.glow(0, bob, 26, I[4], 0.22);
  p.glow(0, bob - 3, 9, I[6], 0.2);
}
