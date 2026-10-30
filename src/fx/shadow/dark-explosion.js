import { burst, fly, flyV, seg, ease, clamp, star, tileNoise, TAU, WHITE } from "../../core/index.js";
import { steps, UMBRA } from "./_lib.js";

export const meta = {
  name: "Dark explosion",
  desc: "Motes are sucked in, then a black star of anti-light rips across a violet flash; a black sphere swells, sheds shards and smoke, and is gone.",
  tags: ["shadow", "explosion", "void", "dark", "impact", "one-shot"],
  size: [100, 100],
  origin: [50, 50],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: UMBRA, size: 1, seed: 6 },
};

const T0 = 0.16; // the moment it goes off

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, k = o.size, a = t - T0;

  // anticipation: motes streak inward to a tightening core
  if (t < T0) {
    burst(16, S, (r) => {
      const ang = r.range(0, TAU), r0 = r.range(26, 40) * k, delay = r.range(0, 0.05), q = clamp((t - delay) / (T0 - delay));
      if (q <= 0) return;
      const rr = r0 * (1 - ease.inQuad(q)), r2 = r0 * (1 - ease.inQuad(Math.max(0, q - 0.12)));
      p.line(Math.cos(ang) * r2, Math.sin(ang) * r2, Math.cos(ang) * rr, Math.sin(ang) * rr, (u) => (u > 0.6 ? C[7] : C[5]));
    });
    const c = 1.5 + 2.5 * ease.inQuad(t / T0);
    p.circle(0, 0, c + 1, C[6]);
    p.circle(0, 0, c, C[0]);
    p.glow(0, 0, 20 * k, C[5], 0.4 * (t / T0));
    return;
  }

  // smoke left as the sphere breaks up: dark puffs lit violet from the top left, darkening as they die
  const puffs = [];
  burst(12, S + 1, (r) => {
    const ang = r.range(0, TAU), born = 0.26 + r.range(0, 0.12), age = a - born, life = r.range(0.6, 0.85);
    if (age < 0 || age > life) return;
    const q = age / life, e = ease.outCubic(Math.min(1, age / 0.5)), dist = (r.range(7, 12) + r.range(6, 14) * e) * k;
    const rr = r.range(4, 7.5) * k * (1 - ease.inQuad(q));
    if (rr > 1.3) puffs.push({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist * 0.85 - age * age * 20, r: rr, q });
  });
  if (puffs.length) {
    p.shade(-38 * k, -42 * k, 38 * k, 34 * k, (x, y) => {
      let best = 0, lit = 0, q = 0;
      for (const f of puffs) {
        const dx = x - f.x, dy = y - f.y, d2 = (dx * dx + dy * dy) / (f.r * f.r);
        if (d2 >= 1) continue;
        const v = 1 - d2;
        if (v > best) (best = v), (lit = (-dx - dy) / f.r), (q = f.q);
      }
      if (best < 0.06) return;
      const tone = (best * 0.55 + lit * 0.5) * (1 - 0.55 * seg(q, 0.35, 1));
      return tone > 0.85 ? C[5] : tone > 0.55 ? C[3] : tone > 0.3 ? C[2] : C[1];
    });
  }

  // the flash: a violet halo with a white heart, hollowing out into the shockwave
  const outer = (29 + 15 * ease.outCubic(seg(a, 0, 0.32)) + 3 * seg(a, 0.3, 0.5)) * k;
  const inner = a < 0.05 ? 0 : (10 + 34 * ease.outQuart(seg(a, 0.05, 0.3))) * k;
  if (a < 0.3 && outer - inner > 0.6) p.ring(0, 0, outer, outer - inner, (v) => (v > 0.72 ? C[7] : v > 0.36 ? C[6] : C[5]));
  if (a < 0.1) p.circle(0, 0, (16 - 40 * Math.max(0, a - 0.04)) * k, (d) => (d > 0.85 ? C[7] : WHITE));
  if (a > 0.1 && a < 0.5) p.ring(0, 0, outer, 1, a < 0.3 ? C[6] : a < 0.4 ? C[4] : C[3]);

  // the black sphere: swells fast, lumpy, rimmed in violet, then shrinks away into the smoke
  const grow = ease.outExpo(seg(a, 0.02, 0.28)), shrink = ease.inCubic(seg(a, 0.3, 0.62));
  const R = (5 + 13 * grow) * (1 - shrink) * k;
  // anti-light: a black star cut across the flash, its spikes pulled back into the sphere
  const spikes = (34 - (34 - R) * ease.inQuad(seg(a, 0.06, 0.2))) * k;
  if (spikes > R + 1) p.poly(star(0, 0, Math.max(5 * k, R * 0.85), spikes, 7, -0.2 + a * 0.8), C[0]);
  if (R > 0.8) {
    p.shade(-R - 2, -R - 2, R + 2, R + 2, (x, y) => {
      const d = Math.hypot(x, y), ang = Math.atan2(y, x);
      const edge = R + 1.4 * tileNoise((ang / TAU + 0.5) * 9, a * 6, 9, 0, S);
      if (d > edge) return;
      if (d > edge - 1.2) return C[7];
      if (d > edge - 2.4) return C[5];
      return d > edge - 3.4 ? C[2] : C[0];
    });
  }

  // shards: chips of black glass tumbling out once the flash clears, one corner catching the light
  burst(10, S + 2, (r) => {
    const ang = r.range(0, TAU), sp = r.range(60, 120) * k, life = r.range(0.35, 0.6), age = a - 0.06 - r.range(0, 0.04);
    if (age < 0 || age > life) return;
    const [x, y] = fly(Math.cos(ang) * 16 * k, Math.sin(ang) * 16 * k, Math.cos(ang) * sp, Math.sin(ang) * sp, age, 70, 3.5);
    const spin = Math.floor(age * r.range(14, 24)) % 4, big = r.next() < 0.5;
    if (Math.abs(x) > 46 * k || Math.abs(y) > 46 * k) return;
    p.rect(x, y, big ? 3 : 2, 2, C[1]);
    p.px(x + (spin === 1 || spin === 2 ? (big ? 2 : 1) : 0), y + (spin > 1 ? 1 : 0), age / life < 0.5 ? C[7] : C[5]);
  });
  // sparks: violet streaks along their motion
  burst(16, S + 3, (r) => {
    const ang = r.range(0, TAU), sp = r.range(70, 125) * k, life = r.range(0.3, 0.6), age = a - 0.05;
    if (age < 0 || age > life) return;
    const vx0 = Math.cos(ang) * sp, vy0 = Math.sin(ang) * sp, [x, y] = fly(Math.cos(ang) * 14 * k, Math.sin(ang) * 14 * k, vx0, vy0, age, 80, 3), [vx, vy] = flyV(vx0, vy0, age, 80, 3);
    const q = age / life;
    if (Math.hypot(x, y) < R + 2 || Math.abs(x) > 46 * k || Math.abs(y) > 46 * k) return;
    p.line(x, y, x - vx * 0.045, y - vy * 0.045, (u) => (u < 0.3 ? (q < 0.4 ? C[7] : C[6]) : C[5]));
    p.light(x, y, C[6], 0.5 * (1 - q));
  });

  // light: a hard violet flash that lets go fast
  const L = 1 - seg(a, 0, 0.45);
  p.glow(0, 0, 50 * k, C[5], 0.5 * L * L);
  if (a < 0.07) p.glow(0, 0, 22 * k, C[7], 0.45);
}
