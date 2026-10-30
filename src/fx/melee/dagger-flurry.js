import { ramp, burst, rng, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { swing } from "./_lib.js";

export const meta = {
  name: "Dagger flurry",
  desc: "A flurry of quick knife cuts: small sharp crescents flick in and out at all angles in front of the fighter, the last one biggest.",
  tags: ["melee", "slash", "dagger", "flurry", "combo", "rogue", "combat", "directional", "one-shot"],
  size: [60, 48],
  origin: [14, 40],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#140a26", "#2b1252", "#4a2390", "#7440cc", "#a070f0", "#cfa8ff", "#f0e0ff", "#ffffff"], count: 10, seed: 8 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, n = clamp(Math.round(o.count), 2, 14), top = C.length - 1;
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), last = i === n - 1;
    const born = (i / n) * 0.32 + r.range(0, 0.02) - 0.035, q = t - born;
    if (q < -0.001 || q > 0.2) continue;
    // where it lands: in front of the fighter, the outer edge mostly facing out (right)
    const mx = r.range(15, 31) + (last ? 2 : 0), my = r.range(-23, -6), th = r.range(-1.3, 1.3);
    const R = last ? 13 : r.range(8.5, 11), span = r.range(2, 2.5) * (last ? 1.1 : 1), cw = r.next() < 0.5;
    const cx = mx - Math.cos(th) * R, cy = my - Math.sin(th) * R;
    const a0 = th + (cw ? -span / 2 : span / 2), a1 = th + (cw ? span / 2 : -span / 2);
    const lead = ease.outQuart(seg(q, 0, 0.045)), tail = ease.inCubic(seg(q, 0.01, 0.1));
    swing(p, { cx, cy, r: R, w: last ? 6 : 4, from: a0, to: a1, lead, tail, C, rimAt: 0.66 });
    // a pin of light where the blade leaves the cut
    const ex = cx + Math.cos(a1) * R, ey = cy + Math.sin(a1) * R, k = seg(q, 0.03, 0.05) * (1 - seg(q, 0.05, 0.12));
    if (k > 0) {
      p.px(ex, ey, WHITE);
      if (k > 0.5) p.px(ex - 1, ey, C[top - 1]), p.px(ex + 1, ey, C[top - 1]), p.px(ex, ey - 1, C[top - 1]), p.px(ex, ey + 1, C[top - 1]);
    }
    p.glow(mx, my, last ? 14 : 9, C[top - 3], 0.35 * (1 - seg(q, 0.02, 0.12)) * seg(q, -0.01, 0.01));
    // the last cut lands with a flash
    if (last && q > 0.03 && q < 0.07) p.circle(mx, my, 2.5, WHITE), p.glow(mx, my, 18, C[top - 2], 0.5);
  }
  // nicks of light thrown off the cuts
  burst(n, S + 1, (r, j) => {
    const born = (j / n) * 0.32 + 0.02 + r.range(0, 0.03), age = t - born, life = r.range(0.08, 0.14);
    if (age < 0 || age > life) return;
    const g = rng(S, j), mx = g.range(14, 30), my = g.range(-22, -6), a = r.range(-2.2, 1.2), sp = r.range(40, 80);
    const [x, y] = fly(mx, my, Math.cos(a) * sp, Math.sin(a) * sp, age, 120, 5), k = age / life;
    p.px(x, y, k < 0.4 ? WHITE : C[top - 2]);
    p.light(x, y, C[top - 3], 0.4 * (1 - k));
  });
}
