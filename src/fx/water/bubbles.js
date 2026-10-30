import { PAL, rng, seg, wrap, TAU } from "../../core/index.js";
import { fit, oval } from "./_lib.js";

export const meta = {
  name: "Bubbles",
  desc: "Underwater bubbles rise and wobble, big ones faster and squashier, beside a fizzing chain of tiny ones; each pops into a ring of specks.",
  tags: ["water", "bubbles", "underwater", "ambient", "loop"],
  size: [40, 64],
  origin: [20, 60],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.water, count: 8, seed: 5 },
};

const SMALL = { 1: ["b"], 2: [".b.", "w.b", ".c."], 3: [".bb.", "bw.b", "b..c", ".cc."] };

function bubble(p, x, y, r, sq, W) {
  if (r <= 3) {
    const s = SMALL[r];
    p.sprite(s, { b: W[5], c: W[4], w: W[7] }, Math.round(x) - (s[0].length >> 1), Math.round(y) - (s.length >> 1));
    return;
  }
  // a crisp rim, lit from the top left, a white shine inside it and a faint bounce of light opposite
  const rx = r + sq, ry = r - sq;
  oval(p, x, y, rx, ry, (a) => (Math.cos(a - 3.9) > 0.55 ? W[6] : Math.cos(a - 0.8) > 0.4 ? W[4] : W[5]));
  p.px(x - rx * 0.45, y - ry * 0.45, W[7]);
  p.px(x - rx * 0.45 + 1, y - ry * 0.45, W[6]);
  p.px(x - rx * 0.45, y - ry * 0.45 + 1, W[6]);
  p.line(x + rx * 0.35, y + ry * 0.62, x + rx * 0.62, y + ry * 0.3, W[4]);
}

export function draw(p, t, o) {
  const W = fit(o.palette), S = o.seed, D = meta.duration, n = o.count;
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), rad = [5, 2, 3, 4, 2, 3, 6, 2, 3, 4][i % 10], born = ((i + r.range(-0.3, 0.3)) / n) * D;
    const life = r.range(1.5, 1.9) - rad * 0.08, x0 = r.range(-8, 8), top = -r.range(42, 49);
    const age = wrap(t - born, D);
    if (age >= life + 0.1) continue;
    // rises from rest, then at a steady speed; wobbles more the bigger it is
    const k = Math.min(age, life), v = -top / (life - 0.2), y = -(v * k - v * 0.2 * (1 - Math.exp(-k / 0.2))) - 2;
    const w = r.range(5, 8), ph = r.range(0, TAU), x = x0 + Math.sin(k * w + ph) * (0.5 + rad * 0.35);
    const g = seg(age, 0, 0.25), size = Math.max(1, Math.round(rad * (0.5 + 0.5 * g)));
    if (age < life) bubble(p, x, y, size, rad > 3 ? Math.sin(k * w * 2 + ph) * 0.5 : 0, W);
    else {
      // pop: the rim flies apart into specks for three frames
      const u = (age - life) / 0.1, R = size + 1 + u * 3;
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + ph;
        p.px(x + Math.cos(a) * R, y + Math.sin(a) * R * 0.9, u < 0.5 ? W[7] : W[5]);
      }
      p.light(x, y, W[5], 0.3 * (1 - u));
    }
  }
  // a fizzing chain of tiny bubbles from one spot on the floor
  for (let i = 0; i < 10; i++) {
    const r = rng(S + 9, i), period = D / 2, age = wrap(t - (i / 10) * period, period) + period * (i % 2);
    const life = r.range(1.3, 1.7);
    if (age > life) continue;
    const y = -2 - age * r.range(30, 36), x = 9 + Math.sin(age * 9 + i * 2.3) * (0.4 + age * 1.1);
    p.px(x, y, age < life * 0.75 ? W[5] : W[4]);
  }
}
