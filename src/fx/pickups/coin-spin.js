import { PAL, TAU, bump } from "../../core/index.js";
import { Layer, shadow, twinkle, bob, fit } from "./_lib.js";

export const meta = {
  name: "Coin spin",
  desc: "A fat gold coin turning on its edge in ten hand-timed poses, bobbing over its shadow, a glint when it faces you.",
  tags: ["pickup", "coin", "gold", "money", "loop"],
  size: [32, 36],
  origin: [16, 32],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.gold, radius: 7, poses: 10, shadow: true, seed: 1 },
};

const L = new Layer(40, 40);

export function draw(p, t, o) {
  const C = fit(o.palette), R = o.radius, T = 3, ph = t / meta.duration;
  // poses are held like hand-drawn frames; the bob runs smooth underneath
  const pose = Math.floor(ph * o.poses) / o.poses, th = pose * TAU;
  const cs = Math.cos(th), sn = Math.sin(th), rx = Math.max(0.6, R * Math.abs(cs));
  const xf = (T / 2) * sn * Math.sign(cs || 1), a = Math.abs(xf);
  const cy = Math.round(-R - 8 + bob(ph, 2));
  // the face leans toward the light (top left) or away from it as it turns
  const lean = -sn * Math.sign(cs || 1) * 0.5;
  L.begin(-R - 4, cy - R - 3);
  L.fill(-R - 3, cy - R - 2, R + 3, cy + R + 2, (x, y) => {
    const v = (y - cy) / R;
    if (Math.abs(v) > 1) return 0;
    const half = rx * Math.sqrt(1 - v * v);
    if (Math.max(0, Math.abs(x) - a) > half) return 0;
    if (Math.abs(x - xf) > half) {
      // the reeded rim: ticks on alternate rows, lit on the left
      const side = x < xf ? 1 : 0;
      return (Math.floor(y) & 1) ? C[2 + side] : C[3 + side];
    }
    // distance in px to the face's edge (ellipse gradient estimate), so the lip stays a pixel wide however thin
    const X = x - xf, Y = y - cy, U = X / rx;
    const g = 2 * Math.sqrt((X * X) / rx ** 4 + (Y * Y) / R ** 4) || 1e-6, e = (1 - U * U - v * v) / g;
    const nd = Math.hypot(U, v) || 1e-6, lit = -(U * 0.6 + v * 0.8) / nd;
    if (e < 1.3) return lit > 0.6 ? C[6] : lit > -0.3 ? C[5] : C[3]; // the raised lip, lit top left
    if (e < 2.3) return lit > 0.1 ? C[3] : C[5]; // its inner wall: in shadow top left, catching light bottom right
    if (Math.abs(U) < 0.26 && Math.abs(v) < 0.42) return U < 0 ? C[6] : C[5]; // a stamped bar
    return lean < -0.2 ? C[3] : C[4];
  });
  L.outline(C[1]);
  L.draw(p);
  // a glint when it faces you
  const g = bump(ph, 0.02, 0.24);
  if (g > 0) {
    const gx = Math.round(R * 0.55), gy = cy - Math.round(R * 0.6);
    twinkle(p, gx, gy, 1 + Math.round(g * 3), C[5], C[6]);
    p.light(gx, gy, C[6], 0.6 * g);
  }
  p.glow(0, cy, R * 2.2, C[4], 0.08 + 0.05 * Math.abs(cs));
  if (o.shadow) shadow(p, 0, (Math.max(rx, a + 1) + 1) * (0.9 + 0.1 * Math.sin(ph * TAU)));
}
