import { PAL, cycle, rng, seg, ease, wrap, noise2, TAU, WHITE } from "../../core/index.js";
import { fit, glint } from "./_lib.js";

export const meta = {
  name: "Frost breath",
  desc: "An icy gust blows right in a widening cone: frost puffs swell and tear apart, streaks of wind race past and ice crystals tumble and twinkle.",
  tags: ["ice", "breath", "frost", "cone", "wind", "directional", "loop"],
  size: [104, 44],
  origin: [4, 22],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.ice, length: 92, spread: 0.2, seed: 27 },
};

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, D = meta.duration, L = o.length;
  const half = (x) => 2 + x * o.spread * (1 - 0.2 * (x / L));
  // frost puffs: blown out of the mouth, slowing, swelling, wearing away into rags
  const puffs = [];
  for (let i = 0; i < 20; i++) {
    // births spread evenly through the loop so the gust never gaps
    const r = rng(S, i), born = ((i + r.range(-0.3, 0.3)) / 20) * D, life = r.range(0.6, 0.75), age = wrap(t - born, D);
    if (age >= life) continue;
    const k = age / life, sp = r.range(150, 195), x = 5 + (sp / 1.2) * (1 - Math.exp(-1.2 * age));
    const v = (((i * 7) % 20) / 19 - 0.5) * 1.5 * Math.min(1, 0.4 + k);
    puffs.push({ x, y: v * half(x), r: 2 + 5 * ease.outCubic(k) * r.range(0.8, 1.2), f: 1 - seg(k, 0.3, 1), s: i * 5.3 });
  }
  p.shade(0, -21, L, 21, (x, y) => {
    let best = -1, lit = 0;
    for (const f of puffs) {
      const dx = x - f.x, dy = y - f.y, d2 = (dx * dx + dy * dy) / (f.r * f.r);
      if (d2 >= 1) continue;
      const v = 1 - d2 - (1 - f.f) * 0.9 + noise2(dx * 0.5 + f.s, dy * 0.5, S) * 0.35 * (1.2 - f.f);
      if (v > best) (best = v), (lit = (-dx * 0.6 - dy) / f.r);
    }
    if (best < 0.1) return;
    const l = lit + best * 0.5;
    return l > 0.75 ? I[7] : l > 0.15 ? I[6] : l > -0.45 ? I[5] : I[4];
  });
  // streaks of wind racing through
  cycle(t, D, 18, S + 1, (r) => r.range(0.22, 0.38), (age, life, r) => {
    const v = r.range(-0.95, 0.95), x = 4 + age * r.range(190, 260), y = Math.round(v * half(x)), len = r.range(4, 10) * (1 - age / life);
    if (x - len > L) return;
    p.line(Math.max(0, x - len), y, Math.min(x, L), y, age / life < 0.45 ? WHITE : I[5]);
  });
  // ice crystals tumbling along with the gust
  cycle(t, D, 12, S + 2, (r) => r.range(0.6, 0.9), (age, life, r) => {
    const k = age / life, v = r.range(-0.85, 0.85), x = 6 + age * r.range(80, 115), y = v * half(x) + Math.sin(age * 9 + r.next() * TAU) * 1.5;
    if (x > L) return;
    if (r.next() < 0.4 && k < 0.75) glint(p, x, y, Math.sin(age * 20 + r.next() * 6) > 0 ? 1 : 0, I[6], WHITE);
    else p.px(x, y, k < 0.5 ? WHITE : I[5]);
  });
  // the mouth of it: a hard white jet
  p.tri(0, -2.5, 0, 2.5, 14, 0, I[6]);
  p.tri(0, -1.5, 0, 1.5, 9, 0, WHITE);
  p.glow(2, 0, 12, I[6], 0.4);
  p.glowLine(0, 0, L * 0.6, 0, 12, I[5], 0.1);
}
