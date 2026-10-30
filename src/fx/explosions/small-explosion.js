import { PAL, RAMP, fit, at, burst, fly, flyV, seg, ease, clamp, noise2, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Small explosion",
  desc: "A quick blast: a white flash frame, a lumpy fireball that cools from the edges into rising smoke, a shockwave, sparks and debris.",
  tags: ["explosion", "fire", "smoke", "impact", "one-shot"],
  size: [84, 88],
  origin: [42, 48],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, size: 1, seed: 3 },
};

export function draw(p, t, o) {
  const F = fit(o.palette, 8), SM = RAMP.smoke, S = o.seed, k = o.size;
  const FIRE = [F[2], F[3], F[4], F[5], F[6], F[7], WHITE]; // cool edge .. white-hot core

  // puffs: pushed out fast then drifting up; each is both a ball of heat and, later, a ball of smoke
  const puffs = [];
  burst(12, S, (r, i) => {
    const ang = (i / 12) * TAU + r.range(-0.35, 0.35), reach = (i < 2 ? r.range(0, 3) : r.range(5, 13)) * k;
    const age = t - (i < 2 ? 0 : r.range(0.01, 0.07)), life = r.range(0.75, 1.05);
    if (age < 0 || age > life) return;
    const q = age / life, e = ease.outCubic(seg(age, 0, 0.28));
    const x = Math.cos(ang) * reach * e, y = Math.sin(ang) * reach * e * 0.7 - age * age * 26 * k;
    const r0 = r.range(5, 8) * k * (0.5 + 0.7 * e);
    puffs.push({
      x, y,
      fr: r0 * (1 - 0.45 * seg(q, 0.15, 0.6)), heat: 1 - seg(q, 0.05, 0.62),
      sx: x, sy: y - q * q * 16 * k, sr: r0 * (1.05 + 0.8 * q), smoke: seg(q, 0.12, 0.4) * (1 - seg(q, 0.62, 1)),
    });
  });
  // the field: the strongest puff at each pixel decides, with light from the top-left
  const field = (x, y, rk, vk, xk, yk) => {
    let best = 0, lit = 0;
    for (const f of puffs) {
      const dx = x - f[xk], dy = y - f[yk], d = Math.sqrt(dx * dx + dy * dy) / f[rk];
      if (d >= 1) continue;
      const v = (1 - d * d) * f[vk];
      if (v > best) (best = v), (lit = (-dx - dy * 1.4) / f[rk]);
    }
    return [best, lit];
  };
  // debris: dark chunks tossed up and falling (behind the fire, so they show once they're clear of it)
  burst(6, S + 2, (r) => {
    const a = -Math.PI / 2 + r.range(-1.2, 1.2), sp = r.range(50, 95) * k, life = r.range(0.4, 0.55);
    if (t > life) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 260, 0.5), s = r.next() < 0.5 ? 2 : 1;
    p.rect(x, y, s, s, SM[1], 1 - seg(t, life * 0.7, life));
  });
  // smoke behind
  p.shade(-36, -42, 36, 30, (x, y, out) => {
    const [v, lit] = field(x, y, "sr", "smoke", "sx", "sy");
    if (v < 0.06) return;
    out.c = at(SM.slice(1, 6), 0.25 + lit * 0.3 + v * 0.35 + noise2(x * 0.4, y * 0.4, S) * 0.12);
    out.a = clamp(v * 4);
  });
  // fire in front
  p.shade(-36, -42, 36, 30, (x, y, out) => {
    const [v, lit] = field(x, y, "fr", "heat", "x", "y");
    if (v < 0.08) return;
    out.c = at(FIRE, v * 0.95 + lit * 0.12 + noise2(x * 0.5, y * 0.5, S + 1) * 0.1);
    out.k = v * 0.25;
  });
  // flash: one or two frames of solid white, the frame that sells the hit
  if (t < 0.07) {
    p.circle(0, 0, (6 + 40 * t) * k, WHITE);
    p.glow(0, 0, 48 * k, F[6], 0.9);
  }
  // shockwave: a thin ring racing out, dithering away
  const sw = seg(t, 0.02, 0.24);
  if (sw > 0 && sw < 1) {
    const r = (8 + 22 * ease.outCubic(sw)) * k;
    p.ring(0, 0, r, 1, F[7], 1 - sw * 0.9);
    p.glowRing(0, 0, r, 4, F[5], 0.3 * (1 - sw));
  }
  // sparks: streaks along their velocity, falling, cooling yellow to red
  burst(14, S + 1, (r) => {
    const a = r.range(0, TAU), sp = r.range(60, 120) * k, life = r.range(0.3, 0.55);
    if (t > life) return;
    const q = t / life, vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp - 30;
    const [x, y] = fly(0, 0, vx0, vy0, t, 160, 2.5), [vx, vy] = flyV(vx0, vy0, t, 160, 2.5);
    p.line(x, y, x - vx * 0.025, y - vy * 0.025, q < 0.3 ? F[7] : q < 0.6 ? F[5] : F[3]);
    p.light(x, y, F[5], 0.6 * (1 - q));
  });
  // the blast lights everything up, then lets go fast
  const L = 1 - seg(t, 0, 0.5);
  p.glow(0, -2, 42 * k, F[5], 0.55 * L * L);
}
