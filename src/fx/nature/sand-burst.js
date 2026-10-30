import { ramp, burst, fly, seg, ease, clamp, rand, TAU } from "../../core/index.js";

export const meta = {
  name: "Sand burst",
  desc: "The floor bulges, then a geyser of sand blasts up: a gushing column, grains raining down in a wide fan, a dust cloud rolling out low, a mound left to slump.",
  tags: ["nature", "earth", "sand", "desert", "geyser", "ground", "one-shot"],
  size: [80, 72],
  origin: [40, 64],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a1c0c", "#4e3418", "#7a5426", "#a87a3a", "#d0a456", "#ecc87a", "#fae6b0"], height: 46, seed: 53 },
};

const T0 = 0.14; // the blast

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, H = o.height;
  // anticipation: a mound swells and trembles; after the blast it is a pile that slumps flat
  const swell = ease.outQuad(seg(t, 0, T0)), slump = seg(t, 0.95, 1.55);
  const mh = (t < T0 ? 4 * swell : 4 + 2 * ease.outCubic(seg(t, T0, 0.7))) * (1 - ease.inQuad(slump));
  const mw = (t < T0 ? 7 * swell : 7 + 7 * ease.outCubic(seg(t, T0, 0.8))) * (1 + slump * 0.3);
  if (mh > 0.5) {
    const shake = t < T0 ? Math.round(Math.sin(t * 120)) * 0.5 : 0;
    p.shade(-mw - 1, -mh - 1, mw + 1, 0, (x, y) => {
      const dx = (x - shake) / mw, dy = y / mh;
      if (dx * dx + dy * dy > 1) return;
      const lit = -dx * 0.8 - dy;
      return lit > 0.9 ? C[6] : lit > 0.3 ? C[5] : lit > -0.3 ? C[4] : C[3];
    });
  }
  if (t < T0) return;
  const a = t - T0;
  // the column: a gushing jet that shoots up, then the supply stops and it falls back into itself
  const rise = ease.outExpo(seg(a, 0, 0.1)), fall = ease.inQuad(seg(a, 0.24, 0.55));
  const top = -H * rise * (1 - fall);
  if (top < -2) {
    p.shade(-7, top - 1, 7, 0, (x, y) => {
      const v = clamp((y - top) / -top); // 0 at the top, 1 at the bottom
      // a narrow jet that widens at the foot and blooms into a ragged head at the top
      const head = y < top + 6 ? Math.sqrt(Math.max(0, 1 - ((y - top - 3) / 3.5) ** 2)) * 5 : 0;
      const w = Math.max(1.8 + 2.4 * v, head) + Math.sin(y * 0.8 + a * 45) * 0.7 + (rand(Math.floor(y), Math.floor(a * 30), S) - 0.5);
      if (Math.abs(x) > w) return;
      const u = x / w;
      return u < -0.45 ? C[6] : u < 0.15 ? C[5] : u < 0.65 ? C[4] : C[3];
    });
    // a ragged crown spraying off the top
    burst(8, S + 5, (r) => {
      const x = r.range(-6, 6), y = top - r.range(0, 4) + Math.sin(a * 50 + r.next() * TAU);
      p.px(x, y, C[6]);
    });
  }
  // the fan: grains thrown up and out, falling back in a spray
  burst(70, S, (r, i) => {
    const born = r.range(0, 0.3), age = a - born;
    if (age < 0) return;
    const ang = -Math.PI / 2 + clamp(r.gauss() * 0.42, -0.95, 0.95), sp = r.range(60, 135) * (born < 0.12 ? 1 : 0.8);
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, g = 330;
    const [x, y] = fly(r.range(-2, 2), -2, vx, vy, age, g, 0.6);
    if (y > -1 || Math.abs(x) > 37) return;
    const falling = vy + g * age > 0;
    p.px(x, y, falling ? C[4] : C[5 + (i % 2)]);
    if (i % 3 === 0) p.px(x, y - (falling ? 1 : -1), C[3]);
  });
  // dust: a low cloud rolling out both ways, lifting and thinning
  burst(10, S + 1, (r, i) => {
    const life = r.range(0.6, 0.95), q = a / life;
    if (q >= 1) return;
    const side = i % 2 ? 1 : -1, e = ease.outCubic(Math.min(1, q * 1.7));
    const x = side * r.range(4, 26) * e, y = -2 - r.range(1, 7) * e - q * 5;
    const rad = r.range(2.5, 5) * (0.6 + 0.5 * e) * (1 - 0.9 * ease.inQuad(q));
    p.circle(x, y, rad, (d, an) => (d < 0.5 && an < -0.3 ? C[5] : d < 0.85 ? C[4] : C[3]));
  });
  if (a < 0.06) p.glow(0, -10, 30, C[6], 0.3);
}
