import { burst, seg, ease, rand, WHITE } from "../../core/index.js";
import { steps, UMBRA } from "./_lib.js";

export const meta = {
  name: "Shadow step",
  desc: "A body-sized blur of shadow whips to the right in a few frames, bursting smoke where it leaves and lands; the trail lingers and thins away.",
  tags: ["shadow", "dash", "blink", "teleport", "smoke", "directional", "one-shot"],
  size: [92, 48],
  origin: [16, 43],
  duration: 1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: UMBRA, distance: 56, seed: 5 },
};

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, L = o.distance, H = 18, cy = -H / 2 - 1;
  const head = L * ease.outExpo(seg(t, 0.02, 0.16)), tail = L * ease.inCubic(seg(t, 0.03, 0.22));

  // smoke: puffs left where the body passed, plus a burst at each end; one shaded field so they merge
  const puffs = [];
  const puff = (x, y, r, born, life, dx, dy) => {
    const a = t - born;
    if (a < 0 || a > life) return;
    const k = a / life, e = ease.outCubic(Math.min(1, a / 0.25));
    const rr = r * (0.5 + 0.7 * e) * (1 - ease.inQuad(k));
    if (rr > 1.3) puffs.push({ x: x + dx * e, y: y + dy * e - a * a * 16, r: rr, k });
  };
  burst(9, S, (r, i) => {
    const u = (i + r.range(0, 1)) / 9;
    puff(u * L, cy + r.range(-6, 6), r.range(2.5, 4.5), 0.03 + u * 0.12, r.range(0.4, 0.65), r.range(-3, 3), r.range(-3, 1));
  });
  burst(6, S + 1, (r) => puff(r.range(-2, 2), cy + r.range(-7, 7), r.range(3.5, 5.5), r.range(0, 0.03), r.range(0.5, 0.75), r.range(-8, -2), r.range(-4, 2)));
  burst(7, S + 2, (r) => puff(L + r.range(-2, 3), cy + r.range(-7, 7), r.range(3.5, 6), r.range(0.13, 0.17), r.range(0.55, 0.85), r.range(2, 9), r.range(-5, 2)));
  if (puffs.length) {
    p.shade(-14, -H - 16, L + 20, 0, (x, y) => {
      let best = 0, lit = 0, age = 0;
      for (const f of puffs) {
        const dx = x - f.x, dy = y - f.y, d2 = (dx * dx + dy * dy) / (f.r * f.r);
        if (d2 >= 1) continue;
        const v = 1 - d2;
        if (v > best) (best = v), (lit = (-dx * 0.6 - dy) / f.r), (age = f.k);
      }
      if (best < 0.06) return;
      const tone = (best * 0.6 + lit * 0.5) * (1 - 0.6 * seg(age, 0.45, 1));
      return tone > 0.85 ? C[5] : tone > 0.55 ? C[3] : tone > 0.3 ? C[2] : C[1];
    });
  }

  // the dash: a blur of shadow the height of a body, a streak per row, each its own length;
  // bright where it leads, black in the middle, violet wisps where it trails off
  if (head - tail > 0.5) {
    for (let row = -H / 2; row <= H / 2; row++) {
      const v = Math.abs(row) / (H / 2 + 0.5), prof = Math.sqrt(1 - v * v);
      const hx = head - (1 - prof) * 5 - rand(S, row + 40, 1) * 2.5;
      const tx = hx - (head - tail) * prof * (0.45 + 0.55 * rand(S, row + 40, 2)) - 1;
      if (hx - tx < 1) continue;
      p.line(tx, cy + row, hx, cy + row, (u) => (u > 0.93 ? C[7] : u > 0.8 ? C[5] : u > 0.3 ? (v > 0.75 ? C[2] : C[0]) : C[3]),
        (u) => (u < 0.3 ? 0.35 + u * 2 : 1));
    }
    p.glowLine(tail, cy, head, cy, 12, C[5], 0.35);
  }
  // flashes at each end
  if (t < 0.06) p.ellipse(0, cy, 3, 8, WHITE), p.glow(0, cy, 18, C[6], 0.6);
  const land = seg(t, 0.15, 0.23);
  if (land > 0 && land < 1) p.ellipse(L + 1, cy, 3 * (1 - land) + 0.5, 9 * (1 - land) + 0.5, land < 0.4 ? WHITE : C[6]);
  p.glow(L, cy, 24, C[5], 0.4 * (1 - seg(t, 0.15, 0.5)) * (t > 0.12 ? 1 : 0));
}
