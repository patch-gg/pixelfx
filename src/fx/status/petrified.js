import { PAL, burst, rng, rand, seg, ease, clamp, noise } from "../../core/index.js";
import { steps, geom, recolor, tone } from "./_lib.js";

export const meta = {
  name: "Petrified",
  desc: "Stone creeps up the target from the feet with a crackling edge, holds, splits with a crack, then the shell bursts into tumbling chunks and dust.",
  tags: ["status", "stone", "petrify", "stun", "debuff", "one-shot"],
  size: [64, 44],
  origin: [32, 40],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.stone, seed: 7 },
};

const SHATTER = 1.72;
// once the statue shatters the character is gone, so the stand-in hides too
export const actorAlpha = (t) => (t < SHATTER ? 1 : 0);

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, g = geom(a.mask), S = o.seed;
  const creep = ease.inOutSine(seg(t, 0.05, 1.0));

  if (t < SHATTER) {
    // stone: everything under the creeping front turns to stone by brightness; in a sheet, shade it from the shape
    const front = a.h * (1 - creep);
    const edge = (mx) => front + noise(mx * 0.9 + t * 6, S) * 1.2;
    recolor(p, a, (c, mx, my) => {
      if (my < edge(mx)) return 0;
      if (my < edge(mx) + 1) return C[7];
      const rimPx = !g.on(mx - 1, my) || !g.on(mx + 1, my) || !g.on(mx, my - 1);
      const v = c ? tone(c) : rimPx ? 0.15 : mx < a.w / 2 ? 0.6 : 0.45;
      return C[clamp(Math.round(2 + v * 5), 2, 7)];
    });
    // dust puffing off the front as it climbs
    burst(10, S, (r) => {
      const born = r.range(0.1, 0.95), age = t - born, life = r.range(0.3, 0.5);
      if (age < 0 || age > life) return;
      const side = r.next() < 0.5 ? -1 : 1, y = a.y + a.h * (1 - ease.inOutSine(seg(born, 0.05, 1))) - age * 10;
      p.px(side * (a.w / 2 + 1 + age * r.range(8, 16)), y, age / life < 0.5 ? C[5] : C[3]);
    });
    // the crack, splitting down the chest once it's set
    const k = seg(t, 1.12, 1.24);
    if (k > 0) {
      const r = rng(S, 99), pts = [[a.chest[0] + r.range(-1, 1), a.y + 3]];
      for (let i = 1; i <= 6; i++) pts.push([pts[i - 1][0] + r.range(-1.5, 1.5), a.y + 3 + i * 2.2]);
      const n = Math.max(1, Math.round(k * 6));
      for (let i = 1; i <= n; i++) {
        p.line(pts[i - 1][0] + 1, pts[i - 1][1], pts[i][0] + 1, pts[i][1], C[7]);
        p.line(...pts[i - 1], ...pts[i], C[1]);
      }
      if (t > SHATTER - 0.12 && Math.floor(t * 30) % 2) p.outline(a.mask, a.x, a.y, C[6]);
    }
    // a glint sweeping up the statue once it's whole
    const gl = seg(t, 1.3, 1.5);
    if (gl > 0 && gl < 1) {
      const gy = a.y + a.h * (1 - gl);
      for (let mx = 0; mx < a.w; mx++) for (let d = 0; d < 2; d++) {
        const my = Math.round(gy - a.y - mx * 0.5 + d);
        if (g.on(mx, my)) p.px(a.x + mx, a.y + my, d ? C[6] : C[7]);
      }
    }
    p.glow(0, a.y + a.h * (1 - creep), 10, C[6], 0.2 * (1 - seg(t, 0.95, 1.1)));
    return;
  }

  // the shell bursts: a chunk for every 2 x 2 block of the silhouette, thrown out, bouncing once, fading
  const age = t - SHATTER, G = 320;
  for (let my = 0; my < a.h; my += 2)
    for (let mx = 0; mx < a.w; mx += 2) {
      const cnt = g.on(mx, my) + g.on(mx + 1, my) + g.on(mx, my + 1) + g.on(mx + 1, my + 1);
      if (cnt < 2) continue;
      const r = rng(S, mx, my), x0 = a.x + mx + 1, y0 = a.y + my + 1, life = r.range(0.45, 0.66);
      if (age > life) continue;
      const vx = (x0 - a.chest[0]) * r.range(3, 7) + r.range(-8, 8), vy = -r.range(30, 70) - (a.h - my) * 1.2;
      // first arc to the floor, then one small bounce, then rest
      const th = (-vy + Math.sqrt(vy * vy - 2 * G * y0)) / G;
      let x = x0 + vx * Math.min(age, th) + vx * 0.4 * Math.max(0, age - th), y;
      if (age < th) y = y0 + vy * age + 0.5 * G * age * age;
      else {
        const b = age - th, vb = -(vy + G * th) * 0.3;
        y = Math.min(-1, vb * b + 0.5 * G * b * b - 1);
      }
      const k = age / life, s = cnt === 4 && rand(S, mx, my, 3) < 0.6 ? 2 : 1;
      const top = k < 0.4 ? C[6] : k < 0.7 ? C[4] : C[3], body = k < 0.4 ? C[4] : k < 0.7 ? C[3] : C[2];
      p.rect(x - 1, y - 1, s, s, body);
      p.px(x - 1, y - 1, top);
    }
  // dust: puffs bursting from the body and settling
  burst(7, S + 1, (r) => {
    const life = r.range(0.25, 0.4);
    if (age > life) return;
    const k = age / life, x = r.range(-7, 7) * (1 + k * 1.5), y = a.y + r.range(3, a.h - 2) - k * 5, rr = (1 + 1.8 * ease.outCubic(k)) * (1 - k);
    p.circle(x, y, rr, k < 0.4 ? C[6] : C[4]);
  });
  if (age < 0.06) p.glow(0, a.y + 9, 22, C[7], 0.5);
}
