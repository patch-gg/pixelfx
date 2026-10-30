import { PAL, RAMP, ramp, at, seg, ease, clamp, burst, fly, noise2 } from "../../core/index.js";
import { fit, billow, hop } from "./_lib.js";

export const meta = {
  name: "Dust cloud",
  desc: "A cloud of dust kicked up along the ground: puffs roll out to both sides, slow, swell and drift, then settle back onto the floor and thin away.",
  tags: ["dust", "smoke", "landing", "stomp", "ground", "one-shot"],
  size: [124, 44],
  origin: [62, 38],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.dust, seed: 25 },
};

export function draw(p, t, o) {
  const D = fit(ramp(o.palette), 7), E = RAMP.earth, S = o.seed, DUST = D.slice(1, 7);
  // puffs rolling out along the floor; each carries how far it has rolled, to turn its texture
  const puffs = [];
  burst(26, S, (r, i) => {
    // most roll out to the sides; a few slow ones billow up in the middle and keep the cloud whole
    const side = i % 2 ? 1 : -1, mid = i >= 20, born = r.range(0, 0.08), life = r.range(1.2, 1.75), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, v0 = mid ? r.range(5, 25) : r.range(30, 115), [x] = fly(side * r.range(0, 4), 0, side * v0, 0, age, 0, 2.2);
    const rad = (mid ? r.range(5, 7) : r.range(3.5, 6.5)) * (0.5 + 1.0 * ease.outCubic(seg(age, 0, 0.8)));
    const settle = seg(q, 0.55, 1);
    const y = -rad * (0.75 - 0.35 * settle) - age * (mid ? r.range(8, 14) : r.range(3, 8)) * (1 - settle);
    puffs.push({ x, y, r: rad * (1 - 0.25 * settle), v: (1 - settle) * seg(age, 0, 0.05), roll: x / rad, id: i });
  });
  billow(p, puffs, (v, lit, x, y, out, f) => {
    if (v < 0.08) return;
    out.a = clamp(v * 3.2);
    // the texture turns with the puff, so it reads as rolling rather than sliding
    const dx = x - f.x, dy = y - f.y, c = Math.cos(f.roll), s = Math.sin(f.roll);
    const n = noise2((dx * c - dy * s) * 0.55 + f.id * 9.1, (dx * s + dy * c) * 0.55, S);
    return at(DUST, 0.12 + lit * 0.3 + v * 0.38 + n * 0.16);
  });
  // grit skittering along the floor
  burst(12, S + 1, (r, i) => {
    const side = i % 2 ? 1 : -1, life = r.range(0.6, 1.1);
    if (t > life) return;
    const [x, y, rest] = hop(side * 2, -1, side * r.range(40, 95), -r.range(25, 60), t, 320, 0, 0.35, 0.6, 2);
    p.px(x, rest ? -1 : y - 1, i % 3 ? E[3] : E[4]);
  });
}
