import { PAL, cycle, rng, seg, ease, wrap, noise2, fract, WHITE } from "../../core/index.js";
import { fit, glint } from "./_lib.js";

export const meta = {
  name: "Ice lance",
  desc: "A faceted spear of ice flies right: a glint racing down its shaft, frozen fins at the tail and a trail of frost puffs, wind lines and twinkling crystals.",
  tags: ["ice", "lance", "spear", "projectile", "frost", "directional", "loop"],
  size: [96, 28],
  origin: [86, 14],
  duration: 0.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.ice, seed: 28 },
};

const TIP = 6, NECK = -8, TAIL = -28;

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, D = meta.duration, ph = t / D;
  // the frost trail: puffs shed from the tail, falling behind, swelling and wearing away
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const r = rng(S, i), born = ((i + r.range(-0.3, 0.3)) / 9) * D, life = r.range(0.4, 0.55), age = wrap(t - born, D);
    if (age >= life) continue;
    const k = age / life;
    puffs.push({ x: TAIL - 2 - age * r.range(85, 110), y: r.range(-2.5, 2.5) * (0.5 + k), r: 1.2 + 3.2 * ease.outCubic(k), f: 1 - seg(k, 0.2, 1), s: i * 4.1 });
  }
  p.shade(-86, -12, TAIL, 12, (x, y) => {
    let best = -1, lit = 0;
    for (const f of puffs) {
      const dx = x - f.x, dy = y - f.y, d2 = (dx * dx + dy * dy) / (f.r * f.r);
      if (d2 >= 1) continue;
      const v = 1 - d2 - (1 - f.f) * 0.9 + noise2(dx * 0.6 + f.s, dy * 0.6, S) * 0.35 * (1.2 - f.f);
      if (v > best) (best = v), (lit = (-dx * 0.5 - dy) / f.r);
    }
    if (best < 0.1) return;
    return lit > 0.3 ? I[6] : lit > -0.4 ? I[5] : I[4];
  });
  // wind lines streaming back off the lance
  cycle(t, D, 8, S + 1, (r) => r.range(0.15, 0.25), (age, life, r) => {
    const y = r.pick([-6, -5, 4, 5, -8, 7]), x = r.range(-14, 0) - age * r.range(200, 250), len = r.range(6, 12) * (1 - age / life);
    if (x - len < -84) return;
    p.line(x, y, x - len, y, age / life < 0.4 ? I[6] : I[4]);
  });
  // crystals left twinkling in its wake
  cycle(t, D, 10, S + 2, (r) => r.range(0.3, 0.5), (age, life, r) => {
    const k = age / life, x = TAIL + 2 - age * r.range(100, 130), y = r.range(-6, 6) + age * r.range(-6, 10);
    if (x < -84) return;
    if (Math.sin(age * 30 + r.next() * 6) > 0.3 && k < 0.7) glint(p, x, y, 1, I[5], WHITE);
    else p.px(x, y, k < 0.5 ? I[7] : I[5]);
  });
  // frozen fins at the tail: jagged spikes swept back
  for (const [dy, len, lean, c] of [[-1, 8, -4.5, 6], [1, 8, 4, 3], [0, 10, 0, 5]]) {
    const bx = TAIL + 5;
    p.tri(bx, dy - 1, bx, dy + 1, bx - len, dy + lean, I[c]);
  }
  // the shaft: thin, top facet lit, a white ridge, the underside dark
  p.shade(TAIL, -3, NECK + 1, 3, (x, y) => {
    const u = (x - TAIL) / (NECK - TAIL), w = 1.1 + 0.8 * u;
    if (Math.abs(y + 0.5) > w) return;
    const v = (y + 0.5) / w;
    if (v < -0.5) return I[6];
    if (v < 0) return I[7];
    return v < 0.6 ? I[4] : I[2];
  });
  // the head: a broad diamond point, the upper facets catching the light
  p.poly([[NECK - 3, -0.5], [NECK + 4, -5], [TIP, -0.5]], I[6]);
  p.poly([[NECK - 3, -0.5], [NECK + 4, 4], [TIP, -0.5]], I[4]);
  p.poly([[NECK + 4, -5], [TIP, -0.5], [NECK + 6, -0.5]], I[7]);
  p.line(NECK - 3, 0, NECK + 4, 4, I[2]);
  p.line(NECK + 4, 4, TIP, 0, I[2]);
  p.line(NECK - 2, -0.5, TIP - 1, -0.5, WHITE);
  // a glint racing down the shaft every loop
  const gx = TIP - fract(ph) * (TIP - TAIL + 6);
  if (gx > TAIL) glint(p, gx, -1, gx > NECK ? 2 : 1, I[6], WHITE);
  p.glowLine(TAIL, 0, TIP, 0, 9, I[5], 0.22);
  p.glow(TIP - 2, 0, 10, I[6], 0.35);
}
