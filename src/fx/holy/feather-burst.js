import { burst, fly, flyV, seg, ease, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle, feather, FEATHER } from "./_lib.js";

export const meta = {
  name: "Feather burst",
  desc: "A white puff throws out a spray of feathers that brake hard, then rock from side to side as they drift slowly down and fade.",
  tags: ["holy", "feathers", "burst", "angelic", "soft", "one-shot"],
  size: [88, 92],
  origin: [44, 36],
  duration: 2.1,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: FEATHER, count: 16, seed: 38 },
};

export function draw(p, t, o) {
  const F = fit(o.palette, 6), S = o.seed;
  // the puff: a white ball that blows open into a ring and thins away
  if (t < 0.05) p.circle(0, 0, 5, WHITE);
  const pf = seg(t, 0.02, 0.3);
  if (pf > 0 && pf < 1) p.ring(0, 0, 5 + 14 * ease.outCubic(pf), 2 - pf, pf < 0.4 ? WHITE : F[4], (v, a) => (Math.sin(a * 7 + pf * 3) > pf * 2 - 1 ? 1 : 0));
  p.glow(0, 0, 24, F[5], 0.5 * Math.pow(1 - seg(t, 0, 0.35), 2));
  // feathers: flung out, braking hard, then rocking as they settle into a slow fall
  burst(o.count, S, (r, i) => {
    const a = (i / o.count) * TAU + r.range(-0.35, 0.35), sp = r.range(70, 200), life = r.range(1.5, 2.0);
    if (t > life) return;
    const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - 50;
    const [x0, y0] = fly(0, 0, vx, vy, t, 0, 7), [ux, uy] = flyV(vx, vy, t, 0, 7);
    const settle = seg(t, 0.15, 0.6), w = r.range(4.5, 6.5), ph0 = r.range(0, TAU), amp = r.range(3, 6);
    const sway = Math.sin(t * w + ph0), fall = r.range(14, 26) * Math.max(0, t - 0.25);
    // the fall: a slow sink that lifts a little at each end of the swing, like a real feather
    const x = x0 + sway * amp * settle, y = y0 + fall - Math.abs(Math.cos(t * w + ph0)) * 1.5 * settle;
    // early on it points along its flight; once settled it tips with the sway, quill end leading the fall
    const flight = Math.atan2(uy, ux), rock = (Math.cos(t * w + ph0) > 0 ? 0 : Math.PI) + sway * 0.7;
    const ang = settle < 0.5 ? flight : rock, end = seg(t, life - 0.3, life);
    // it doesn't dither away: it thins to a sliver of light, then a mote
    if (end === 0) feather(p, x, y, ang, F);
    else if (end < 0.5) p.line(x - Math.cos(ang) * 1.5, y - Math.sin(ang) * 1.5, x + Math.cos(ang) * 1.5, y + Math.sin(ang) * 1.5, F[4]);
    else p.px(x, y, F[3]);
  });
  // a few glints in the puff
  burst(6, S + 1, (r) => {
    const a = r.range(0, TAU), sp = r.range(40, 70), life = r.range(0.3, 0.5);
    if (t > life) return;
    const q = t / life, [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 0, 5);
    sparkle(p, x, y, q < 0.4 ? 1 : 0, F[4], F[3], WHITE);
  });
}
