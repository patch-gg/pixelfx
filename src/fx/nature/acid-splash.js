import { ramp, at, burst, stream, fly, flyV, seg, ease, clamp, noise, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Acid splash",
  desc: "A gob of acid drops and bursts into a crown, its tips flung off as droplets, then lies as a hissing puddle: bubbles pop, steam curls up, it eats itself away.",
  tags: ["nature", "acid", "poison", "splash", "ground", "one-shot"],
  size: [72, 52],
  origin: [36, 44],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#1d2208", "#35420c", "#55700f", "#7fa214", "#acd21c", "#d8f040", "#f6ffa6"],
    size: 1,
    seed: 11,
  },
};

const STEAM = ["#56653f", "#7a8b55", "#a3b273", "#cdd8a0"].map(hex);
const T0 = 0.1; // impact
const GROW = 0.1; // the crown rises for this long, then its tips break off

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, k = o.size;
  // the gob falls in fast, stretched by its speed
  if (t < T0) {
    const y = -36 + 36 * ease.inQuad(t / T0);
    p.line(0, y - 8, 0, y - 4, C[3]);
    p.rect(-1, y - 4, 2, 4, C[4]);
    p.px(-1, y - 4, C[6]);
    p.light(0, y - 2, C[5], 0.4);
    return;
  }
  const a = t - T0, end = 1 - seg(t, 1.3, 1.58);
  // the puddle: spreads in a blink, sits, then eats itself away from the rim inward
  const spread = ease.outCubic(seg(a, 0, 0.16)), shrink = ease.inQuad(seg(a, 0.7, 1.4));
  const rx = 16 * k * spread * (1 - 0.7 * shrink), ry = 3 * k * spread * (1 - 0.5 * shrink);
  if (rx > 1) {
    p.shade(-rx - 3, -ry - 1, rx + 3, ry + 1, (x, y, out) => {
      const ang = Math.atan2(y, x), wob = 1 + 0.16 * noise(ang * 2.2 + 9, S) + 0.05 * noise(a * 9 + ang * 4, S + 1);
      const dx = x / (rx * wob), dy = y / (ry * wob), d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) return;
      out.a = 1 - seg(a, 1.15, 1.45);
      if (d > 0.78) return dy > 0 ? C[2] : C[3];
      return dy < -0.2 && dx > -0.55 && dx < 0.2 ? C[5] : at([C[3], C[4]], 1.1 - d);
    });
  }
  // hero frame: a flat white-hot splat and a flash
  if (a < 0.067) {
    p.ellipse(0, -1, 11 * k, 4 * k, (d) => (d < 0.45 ? C[6] : d < 0.8 ? C[5] : C[4]));
    p.glow(0, -3, 28 * k, C[5], 0.6);
  }
  // the crown: horns of acid thrown up from the rim; at the top their tips pinch off and fly
  burst(7, S + 4, (r, i) => {
    const u = (i / 6) * 2 - 1, x0 = u * 9 * k, side = u < 0 ? -1 : u > 0 ? 1 : r.sign();
    const H = r.range(7, 14) * k * (1 - Math.abs(u) * 0.25), lean = side * r.range(2, 5) * (0.4 + Math.abs(u));
    const rise = ease.outCubic(seg(a, 0, GROW)), fall = ease.inQuad(seg(a, GROW, GROW + 0.12));
    const h = H * rise * (1 - fall), tx = x0 + lean * rise, ty = -1 - h;
    if (h >= 1) {
      if (h > 3) p.beam(x0, -1, x0 + (tx - x0) * 0.55, -1 - h * 0.55, 2.4, (q, v) => (v > 0.6 && q < 0.5 ? C[3] : C[4]));
      p.line(x0, -1, tx, ty, (q) => (q > 0.6 ? C[5] : C[4]));
    }
    // the tip: a droplet riding the horn, then flung up and out
    const vx = side * r.range(18, 46) * k, vy = -r.range(35, 75) * k, g = 420, y0 = -1 - H, x1 = x0 + lean;
    const land = (-vy + Math.sqrt(vy * vy - 2 * g * y0)) / g, da = a - GROW;
    if (da < 0) {
      if (rise > 0.3) p.rect(tx - 0.5, ty - 1.5, 2, 2, C[5]), p.px(tx - 0.5, ty - 1.5, C[6]);
    } else if (da < land) {
      const [x, y] = fly(x1, y0, vx, vy, da, g), [ux, uy] = flyV(vx, vy, da, g);
      p.line(x, y, x - ux * 0.03, y - uy * 0.03, C[4]);
      if (i % 3) p.rect(x - 0.5, y - 0.5, 2, 2, C[5]);
      p.px(x - 0.5, y - 0.5, C[6]);
      p.light(x, y, C[5], 0.35);
    } else if (da < land + 0.5) {
      const x = x1 + vx * land, q = (da - land) / 0.5;
      p.px(x, 0, q < 0.3 ? C[5] : C[3]);
      if (q < 0.6) p.px(x + side, 0, C[2]), p.px(x - side, 0, C[3]);
    }
  });
  // a spray of fine drops off the splat
  burst(8, S, (r, i) => {
    const side = i % 2 ? 1 : -1, vx = side * r.range(30, 70) * k, vy = -r.range(40, 90) * k, g = 420;
    const land = (-2 * vy) / g, age = a - r.range(0, 0.04);
    if (age < 0 || age > land) return;
    const [x, y] = fly(side * 3, 0, vx, vy, age, g);
    p.px(x, y, age < land * 0.5 ? C[6] : C[5]);
  });
  // sizzle: bubbles swell on the surface and pop
  stream(t, T0 + 0.2, T0 + 1.1, 18, S + 2, (r) => r.range(0.18, 0.3), (age, life, r) => {
    const q = age / life, x = r.range(-0.75, 0.75) * rx, y = r.range(-0.4, 0.3) * ry;
    if (q < 0.75) {
      const s = 0.6 + 1.4 * ease.outQuad(q / 0.75) * r.range(0.6, 1);
      p.circle(x, y - s * 0.6, s, (d, ang) => (d > 0.6 && ang > 0 ? C[3] : C[5]));
      p.px(x - s * 0.4, y - s, C[6]);
    } else {
      for (const [ox, oy] of [[-2, 0], [2, 0], [-1, -2], [1, -2]]) p.px(x + ox, y + oy - 1, C[5]);
    }
  });
  // steam: thin wavy wisps hiss up off the puddle and thin out
  stream(t, T0 + 0.15, T0 + 1.15, 10, S + 3, (r) => r.range(0.5, 0.75), (age, life, r) => {
    const q = age / life, x0 = r.range(-0.75, 0.75) * 14 * k, y0 = -4 - ease.outQuad(q) * r.range(10, 18) * k;
    const len = Math.round(r.range(5, 8) * (1 - 0.45 * q)), ph = r.range(0, TAU), al = clamp(1.8 - q * 1.9) * end;
    for (let j = 0; j < len; j++) {
      const x = x0 + Math.round(Math.sin(ph + j * 0.9 + q * 6) * 1.2);
      p.dot(x, y0 + j, j < 2 ? STEAM[3] : j < 4 ? STEAM[2] : STEAM[1], al);
    }
  });
  const L = 1 - seg(a, 0, 0.35), fade = 1 - seg(a, 0.6, 1.4);
  p.glow(0, -3, 22 * k, C[4], 0.08 * fade + 0.32 * L * L);
  p.glow(0, 0, 14 * k, C[5], 0.12 * fade);
}
