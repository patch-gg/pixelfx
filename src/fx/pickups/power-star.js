import { PAL, cycle, bump, TAU } from "../../core/index.js";
import { Layer, shadow, twinkle, bob, fit } from "./_lib.js";

export const meta = {
  name: "Power star",
  desc: "A beveled five-point star rocking in the air, swelling on the beat, rays wheeling slowly behind it, twinkles popping around.",
  tags: ["pickup", "star", "power-up", "invincible", "loop"],
  size: [48, 52],
  origin: [24, 48],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.volt, shadow: true, seed: 5 },
};

const L = new Layer(40, 40);
const LIGHT = [-0.45, -0.65, 0.62];

// the facet normal of the triangle (center raised by H, tip, inner corner), dotted with the light
function facetLight(tx, ty, kx, ky, H) {
  // vectors from the raised center to the tip and to the corner
  const ax = tx, ay = ty, az = -H, bx = kx, by = ky, bz = -H;
  let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
  if (nz < 0) (nx = -nx), (ny = -ny), (nz = -nz);
  const l = Math.hypot(nx, ny, nz) || 1;
  return (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l;
}

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  const pulse = bump((ph * 2) % 1, 0, 0.35), rot = 0.14 * Math.sin(ph * TAU);
  const R = 10 * (1 + 0.1 * pulse), r = R * 0.45, H = 6;
  const cy = Math.round(-22 + bob(ph, 2));
  L.begin(-18, cy - 16);
  L.fill(-14, cy - 14, 14, cy + 14, (x, y) => {
    const dx = x, dy = y - cy, d = Math.hypot(dx, dy);
    if (d > R + 1) return 0;
    const phi = Math.atan2(dy, dx) - (-Math.PI / 2 + rot);
    // which arm, and the angle from its tip line (-36° .. 36°)
    const seg = TAU / 5, k = Math.round(phi / seg), off = phi - k * seg, half = seg / 2;
    // the star's edge between the tip (angle 0, radius R) and the corner (angle half, radius r)
    const u = Math.abs(off) / half, edgeR = (R * r) / (r + (R - r) * u * 0.92 + 0.0001);
    if (d > edgeR * (1 - 0.08 * u) + 0.25) return 0;
    const a = -Math.PI / 2 + rot + k * seg, side = off < 0 ? -1 : 1;
    const tx = Math.cos(a) * R, ty = Math.sin(a) * R, kx = Math.cos(a + side * half) * r, ky = Math.sin(a + side * half) * r;
    const b = facetLight(tx, ty, kx, ky, H);
    if (d < 1.2) return C[6];
    return b > 0.78 ? C[5] : b > 0.5 ? C[4] : C[3];
  });
  L.outline(C[1]);
  L.draw(p);
  // the beat throws a white rim for a frame or two
  if (pulse > 0.75) twinkle(p, 0, cy - Math.round(R) - 2, 2, C[5], C[6]);
  // twinkles pop around it
  cycle(t, meta.duration, 4, o.seed, 0.4, (age, life, r2) => {
    const k = age / life, a = r2.range(0, TAU), rad = r2.range(13, 18);
    twinkle(p, Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.9, Math.round(1 + 2 * bump(k, 0, 1)), C[4], C[5]);
  });
  p.glowRing(0, cy, 12, 9, C[4], 0.1 + 0.14 * pulse);
  p.glow(0, cy, 4, C[6], 0.2 * pulse);
  if (o.shadow) shadow(p, 0, 7 + bob(ph, 0.8));
}

// rays wheel slowly behind the star: eight of them, turning one gap a loop so the loop is seamless
export function drawBack(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, cy = Math.round(-22 + bob(ph, 2));
  const pulse = bump((ph * 2) % 1, 0, 0.35);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8 + ph / 8) * TAU, len = (i % 2 ? 15 : 19) + 3 * pulse;
    const x1 = Math.cos(a) * len, y1 = cy + Math.sin(a) * len;
    p.line(Math.cos(a) * 12, cy + Math.sin(a) * 12, x1, y1, C[i % 2 ? 2 : 3]);
    p.glowLine(0, cy, x1, y1, 3, C[4], 0.1);
  }
}
