import { PAL, bump, TAU, WHITE } from "../../core/index.js";
import { Layer, shadow, twinkle, bob, fit } from "./_lib.js";

export const meta = {
  name: "Key glint",
  desc: "A silver key hanging in the air, bobbing and swaying on a slow swing; a glint runs from the bow to the teeth and sparks off the tip.",
  tags: ["pickup", "key", "unlock", "item", "loop"],
  size: [40, 40],
  origin: [20, 36],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.metal, shadow: true, seed: 7 },
};

const L = new Layer(40, 40);
const UPLEFT = (-3 * Math.PI) / 4;

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  const cy = -18 + bob(ph, 2), ang = -0.62 + 0.13 * Math.sin(ph * TAU + 0.8);
  const q = L.begin(-20, -36);
  q.place(0, Math.round(cy), false, ang);
  // key-local space: the bow on the left, the shaft running right, the bit hanging under the tip
  const metal = (x, y) => (y < -0.4 ? C[6] : y < 0.6 ? C[5] : C[3]);
  // the bow: a thick ring, its outer face lit top left and its inner wall lit bottom right
  q.ring(-6.5, 0, 5, 3, (v, a) => {
    const f = Math.cos(a - UPLEFT - ang);
    return v > 0.45 ? (f > 0.35 ? C[6] : f > -0.45 ? C[5] : C[3]) : f > 0.2 ? C[3] : C[5];
  });
  q.poly([[-2, -1.5], [9.5, -1.5], [9.5, 1.5], [-2, 1.5]], metal); // the shaft
  q.poly([[-2.2, -2.6], [-0.4, -2.6], [-0.4, 2.6], [-2.2, 2.6]], (x, y) => (y < 0 ? C[6] : C[4])); // the collar
  q.poly([[5, 1], [7, 1], [7, 4.5], [5, 4.5]], (x, y) => (x < 6 ? C[5] : C[3])); // the bit's two teeth
  q.poly([[8, 1], [9.5, 1], [9.5, 3.5], [8, 3.5]], (x, y) => (x < 8.8 ? C[5] : C[3]));
  L.outline(C[1]);
  // a glint runs along the key: a narrow band of white crossing it once a loop
  const run = (ph - 0.36) / 0.26, sweep = -13 + 25 * run, ca = Math.cos(ang), sa = Math.sin(ang), Y = Math.round(cy);
  if (run > 0 && run < 1)
    L.map((x, y, c) => {
      if (c === C[1]) return c;
      const d = Math.abs((x + 0.5) * ca + (y + 0.5 - Y) * sa - sweep);
      return d < 0.8 ? WHITE : d < 1.6 ? C[6] : c;
    });
  L.draw(p);
  // the tip sparks when the glint gets there
  const g = bump(ph, 0.58, 0.8);
  if (g > 0) {
    const tx = Math.cos(ang) * 10, ty = cy + Math.sin(ang) * 10;
    twinkle(p, Math.round(tx), Math.round(ty) - 1, 1 + Math.round(g * 3.5), C[5], C[6]);
    p.light(tx, ty, C[6], 0.6 * g);
  }
  p.glow(0, cy, 18, C[5], 0.08);
  if (o.shadow) shadow(p, 1, 7 + bob(ph, 0.8));
}
