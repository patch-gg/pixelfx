import { burst, seg, ease, clamp, lerp, TAU, WHITE } from "../../core/index.js";
import { steps, CRIMSON } from "./_lib.js";

export const meta = {
  name: "Life steal",
  desc: "A wound bursts open on a target to the right; blood-red orbs pop out, hang a beat, then whip back to the caster, who swells with each one.",
  tags: ["shadow", "drain", "blood", "vampire", "heal", "directional", "one-shot"],
  size: [88, 44],
  origin: [16, 24],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: CRIMSON, count: 6, distance: 58, seed: 8 },
};

// each orb's timeline: born, thrown out, hangs, flies home, lands
function plan(S, i, n) {
  const g = { born: 0, out: 0.16, hang: 0, fly: 0 };
  burst(1, S * 31 + i, (r) => {
    g.born = 0.04 + i * (0.36 / n) + r.range(0, 0.03);
    g.hang = r.range(0.05, 0.12);
    g.fly = r.range(0.3, 0.4);
  });
  g.land = g.born + g.out + g.hang + g.fly;
  return g;
}

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, TX = o.distance, n = o.count;

  // the wound: spikes of red snap out of the target and pull back
  const w = seg(t, 0, 0.2);
  if (w > 0 && w < 1) {
    const reach = 3 + 7 * Math.sin(Math.PI * Math.sqrt(w));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + 0.3, r0 = 1.5 + 4 * w;
      const x0 = TX + Math.cos(a) * r0, y0 = Math.sin(a) * r0, x1 = TX + Math.cos(a) * reach, y1 = Math.sin(a) * reach;
      p.beam(x0, y0, x1, y1, 2.2 * (1 - w) + 1, C[5]);
      p.line(x0, y0, x1, y1, w < 0.4 ? C[7] : C[6]);
    }
    if (w < 0.25) p.circle(TX, 0, 2.5, WHITE);
    p.glow(TX, 0, 16, C[5], 0.5 * (1 - w));
  }

  // orbs: thrown out of the wound, hang, then pulled home along a curve, faster and faster
  let fed = 0, flash = 0;
  burst(n, S, (r, i) => {
    const g = plan(S, i, n), hx = TX + r.range(-6, 10), hy = (i % 2 ? -1 : 1) * r.range(5, 14), bend = r.range(-16, 16);
    const pos = (tt) => {
      const a = tt - g.born;
      if (a < g.out) {
        const e = ease.outCubic(clamp(a / g.out));
        return [lerp(TX, hx, e), lerp(0, hy, e)];
      }
      const e = ease.inQuad(clamp((a - g.out - g.hang) / g.fly)), cx = hx / 2, cy = hy / 2 + bend;
      return [(1 - e) * (1 - e) * hx + 2 * (1 - e) * e * cx, (1 - e) * (1 - e) * hy + 2 * (1 - e) * e * cy];
    };
    if (t >= g.land) {
      fed += 1;
      flash = Math.max(flash, 1 - seg(t, g.land, g.land + 0.12));
      // sparks kicked out where it lands
      burst(3, S + 50 + i, (q) => {
        const a = t - g.land, life = q.range(0.15, 0.25);
        if (a > life) return;
        const ang = q.range(-2.2, 2.2) + Math.PI, sp = q.range(40, 70);
        p.px(Math.cos(ang) * sp * a, Math.sin(ang) * sp * a, a / life < 0.5 ? C[7] : C[5]);
      });
      return;
    }
    if (t < g.born) return;
    const [x, y] = pos(t), homing = t - g.born > g.out + g.hang;
    // a tapered streak behind it on the way home
    if (homing) {
      let [ax, ay] = [x, y];
      for (let j = 1; j <= 4; j++) {
        const [bx, by] = pos(t - j * 0.025);
        p.beam(ax, ay, bx, by, 4 - j * 0.75, j < 2 ? C[5] : j < 3 ? C[4] : C[3]);
        [ax, ay] = [bx, by];
      }
    }
    const s = t - g.born < 0.05 ? 1.2 : 2.3;
    p.circle(x, y, s, (d) => (d < 0.35 ? C[7] : d < 0.75 ? C[6] : C[4]));
    p.px(x - 1, y - 1, WHITE);
    p.light(x, y, C[5], 0.5);
    p.glow(x, y, 7, C[5], 0.25);
  });

  // the caster swells with each orb that lands, holds, then the stolen life sinks in
  const done = plan(S, n - 1, n).land, sink = ease.inCubic(seg(t, done + 0.12, 1.45));
  if (fed > 0 && sink < 1) {
    const R = (2 + Math.min(fed, 4) * 0.9 + flash * 1.5) * (1 - sink);
    p.circle(0, 0, R, (d) => (flash > 0.5 || d < 0.4 ? C[7] : d < 0.78 ? C[6] : C[4]));
    p.glow(0, 0, 14 + fed * 2, C[5], (0.3 + flash * 0.3) * (1 - sink));
  }
}
