import { PAL, RAMP, ramp, at, seg, ease, clamp, burst, fly, noise2, WHITE, hex } from "../../core/index.js";
import { fit, billow, debris } from "./_lib.js";

export const meta = {
  name: "Dirt explosion",
  desc: "A ground blast: a flash of fire, a fountain of dirt and dust thrown up in a V, clods arcing out and thudding down, a crater left in the floor.",
  tags: ["explosion", "dirt", "dust", "ground", "impact", "one-shot"],
  size: [108, 92],
  origin: [54, 78],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.dust, seed: 22 },
};

const HOLE = [hex("#0e0b0c"), hex("#1d1614")];

export function draw(p, t, o) {
  const D = fit(ramp(o.palette), 7), E = RAMP.earth, Fi = RAMP.fire, S = o.seed;
  const DUST = D.slice(1, 7);
  // the crater: a dark bowl with a lip of thrown-up dirt, filling back in by dither at the end
  const cr = seg(t, 0.02, 0.12) * (1 - seg(t, 1.4, 1.9));
  if (cr > 0) {
    p.ellipse(0, 0.5, 15, 2.6, (d, a) => (d > 0.75 ? (a < 0 ? D[4] : D[2]) : d > 0.45 ? HOLE[1] : HOLE[0]), cr);
    p.px(-15, -1, D[4], cr), p.px(14, -1, D[3], cr);
  }
  // the plume: dust thrown up in a V, slowing, spreading and settling, plus a skirt rolling along the floor
  const puffs = [];
  burst(34, S, (r, i) => {
    const skirt = i < 8, side = i % 2 ? 1 : -1;
    const a = skirt ? -Math.PI / 2 + side * r.range(1.2, 1.45) : -Math.PI / 2 + ((i % 13) / 12 - 0.5) * 1.1 + r.range(-0.08, 0.08);
    const sp = skirt ? r.range(60, 100) : r.range(40, 165), life = r.range(1.0, 1.45), born = r.range(0, 0.06);
    const age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life;
    let [x, y] = fly(0, -3, Math.cos(a) * sp, Math.sin(a) * sp, age, skirt ? 0 : 50, skirt ? 3.2 : 2.3);
    const rad = (skirt ? r.range(3.5, 5) : r.range(4.5, 7)) * (0.55 + 1.0 * ease.outCubic(seg(age, 0, 0.5)));
    y = Math.min(y, -rad * 0.4);
    puffs.push({ x, y, r: rad, v: (1 - q * q) * seg(age, 0, 0.04) });
  });
  billow(p, puffs, (v, lit, x, y, out) => {
    if (v < 0.08) return;
    out.a = clamp(v * 3.5);
    return at(DUST, 0.15 + lit * 0.32 + v * 0.42 + noise2(x * 0.45, y * 0.45, S) * 0.12);
  });
  // clods arcing out and thudding down, and grit raining after them
  debris(p, t, 12, S + 1, [E[4], E[2]], { y: -3, a: -Math.PI / 2, spread: 0.8, sp: [80, 122], g: 360, life: [1.1, 1.6], size: [2, 3], floor: 0 });
  debris(p, t, 22, S + 2, [E[3], E[2]], { y: -3, a: -Math.PI / 2, spread: 0.6, sp: [70, 128], g: 360, life: [0.8, 1.3], size: [1, 1], floor: 0 });
  // a quick flash of fire at the heart of the blast
  if (t < 0.1) {
    const q = t / 0.1;
    p.circle(0, -4, 4 + 6 * q, (d) => (d < 0.4 && q < 0.5 ? WHITE : d < 0.7 ? Fi[6] : Fi[4]), 1 - q * 0.7);
    p.glow(0, -6, 34, Fi[5], 0.7 * (1 - q));
  }
}
