import { PAL, ramp, burst, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { puff } from "./_lib.js";

export const meta = {
  name: "Blunt hit",
  desc: "A dull, heavy thud: no sparks, just a dim flash, fat comic impact dashes that pop out and pull back, and a ring of dust that rolls out and settles.",
  tags: ["impact", "hit", "blunt", "dust", "combat", "comic", "one-shot"],
  size: [56, 48],
  origin: [28, 24],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.dust, count: 9, size: 1, seed: 9 },
};

export function draw(p, t, o) {
  const D = ramp(o.palette), S = o.seed, k = o.size, N = D.length - 1, n = clamp(Math.round(o.count), 5, 14);
  // dust ring: lumpy puffs pushed out in a ring, slowing, some sinking, some lifting, shrinking as they thin
  burst(16, S, (r, i) => {
    const a = ((i + r.range(-0.4, 0.4)) / 16) * TAU, born = r.range(0.02, 0.07), life = r.range(0.3, 0.44), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, e = ease.outCubic(seg(age, 0, r.range(0.16, 0.26)));
    const reach = r.range(9, 19) * k, drift = r.range(-3, 5) * k;
    const x = Math.cos(a) * (4 * k + reach * e), y = Math.sin(a) * (3 * k + reach * 0.75 * e) + q * q * drift;
    const rad = (1.2 + r.range(1.4, 3.6) * ease.outQuad(seg(q, 0, 0.4))) * k * (1 - 0.65 * ease.inQuad(seg(q, 0.35, 1)));
    puff(p, x, y, rad, D.slice(2), 1 - seg(q, 0.75, 1), 0.45 - q * 0.6);
  });
  // impact dashes: fat outside, pointed toward the hit; out fast, then they pull back in and vanish
  const go = ease.outExpo(seg(t, 0, 0.08)), back = ease.inQuad(seg(t, 0.1, 0.22));
  if (back < 1)
    burst(n, S + 1, (r, i) => {
      const a = ((i + r.range(-0.25, 0.25)) / n) * TAU, len = r.range(6, 10) * k * (1 - back), w = r.range(1.5, 2.2) * k * (1 - back * 0.6);
      const r0 = (5 + 6 * go + r.range(0, 2)) * k + back * 4 * k;
      if (len < 1) return;
      const dx = Math.cos(a), dy = Math.sin(a), nx = -dy * w, ny = dx * w;
      const x0 = dx * r0, y0 = dy * r0, x1 = dx * (r0 + len), y1 = dy * (r0 + len);
      p.poly([[x0, y0], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny]], (px, py) =>
        (px * dx + py * dy - r0) / len > 0.45 ? WHITE : D[N]);
      p.line(x0, y0, x0 + dx * len * 0.7, y0 + dy * len * 0.7, WHITE);
    });
  // the dull flash: a pale disc for a frame, a dusty ring for the next
  if (t < 0.035) p.circle(0, 0, 6 * k, (d) => (d < 0.6 ? WHITE : D[N]));
  else if (t < 0.075) p.ring(0, 0, 7 * k, 2 * k, D[N], 0.8);
  const L = 1 - seg(t, 0, 0.18);
  p.glow(0, 0, 18 * k, D[N], 0.32 * L * L);
}
