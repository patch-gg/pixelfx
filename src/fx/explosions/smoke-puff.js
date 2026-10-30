import { ramp, seg, ease, rng, burst, TAU } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Smoke puff",
  desc: "A cartoon poof: round outlined puffs pop out with a bounce, drift apart and blink away one by one, with speed lines and a couple of twinkles.",
  tags: ["smoke", "poof", "cartoon", "teleport", "vanish", "one-shot"],
  size: [60, 52],
  origin: [30, 30],
  duration: 0.75,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#241e38", "#4c4668", "#8a84a8", "#c8c4dc", "#ffffff"], size: 1, seed: 24 },
};

export function draw(p, t, o) {
  const P = fit(ramp(o.palette), 5), S = o.seed, k = o.size;
  // seven puffs: one in the middle, six around it; each pops in with an overshoot and blinks out on its own beat
  const puffs = [];
  for (let i = 0; i < 7; i++) {
    const r = rng(S, i), a = i === 0 ? 0 : ((i - 1) / 6) * TAU + r.range(-0.3, 0.3);
    const d0 = i === 0 ? 0 : r.range(5, 7.5), drift = i === 0 ? 0 : 6 * ease.outCubic(seg(t, 0.04, 0.6));
    const pop = ease.outBack(seg(t, 0.01 * i, 0.12 + 0.01 * i), 2.6);
    const out = i === 0 ? 0.56 : 0.34 + r.range(0, 0.12) + (i % 3) * 0.04, gone = ease.inBack(seg(t, out, out + 0.15), 2);
    const rad = (i === 0 ? 7 : r.range(4.5, 6)) * k * pop * (1 - gone);
    if (rad < 0.6) continue;
    puffs.push({ x: Math.cos(a) * (d0 + drift) * k, y: Math.sin(a) * (d0 + drift) * k * 0.8 - t * 6, r: rad });
  }
  // outline first, under everything, so the puffs merge into one cartoon cloud
  for (const f of puffs) p.circle(f.x, f.y, f.r + 1, P[1]);
  for (const f of puffs)
    p.circle(f.x, f.y, f.r, (d, a) => {
      const lit = Math.cos(a + 2.3); // +1 facing the top-left
      if (d > 0.62 && lit < -0.35) return P[2];
      if (d < 0.62 && d > 0.28 && lit > 0.62 && f.y < 2) return P[4];
      return P[3];
    });
  // speed lines bursting outward
  const sl = seg(t, 0.02, 0.18);
  if (sl > 0 && sl < 1)
    burst(8, S + 1, (r, i) => {
      const a = (i / 8) * TAU + r.range(-0.2, 0.2), r0 = (11 + 14 * ease.outCubic(sl)) * k, len = 4 * (1 - sl) + 1;
      p.line(Math.cos(a) * r0, Math.sin(a) * r0 * 0.72, Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len) * 0.72, P[4]);
    });
  // two twinkles pop at the edge
  burst(2, S + 2, (r, i) => {
    const b = seg(t, 0.12 + i * 0.12, 0.34 + i * 0.12);
    if (b <= 0 || b >= 1) return;
    const a = r.range(0, TAU), x = Math.cos(a) * 15 * k, y = Math.sin(a) * 12 * k, s = Math.round(2 * Math.sin(b * Math.PI));
    p.line(x - s, y, x + s, y, P[4]), p.line(x, y - s, x, y + s, P[4]);
  });
}
