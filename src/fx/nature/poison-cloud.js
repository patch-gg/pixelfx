import { ramp, at, cycle, rng, noise2, clamp, ease, TAU } from "../../core/index.js";

export const meta = {
  name: "Poison cloud",
  desc: "A low toxic cloud billows on the spot: heavy puffs swell and roll, sickly pale tops over bruised purple shadows, a thin haze, wisps and motes leak out.",
  tags: ["nature", "poison", "gas", "cloud", "area", "loop"],
  size: [76, 52],
  origin: [38, 46],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#221a33", "#3a3450", "#4a5a4a", "#5f7f40", "#84a842", "#aed056", "#d6ee86", "#f4ffcc"],
    size: 1,
    seed: 7,
  },
};

// the cloud's resting lumps: [x, y, radius], a wide flat skirt along the floor, a few big billows on top
const BODY = [
  [-25, -4, 5], [-15, -6, 8], [0, -8, 10.5], [15, -6, 8], [25, -4, 5],
  [-10, -15, 8.5], [8, -16, 9],
  [-2, -24, 7.5],
];

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, D = meta.duration, ph = t / D, k = o.size;
  const puffs = [];
  BODY.forEach(([x, y, r], i) => {
    const g = rng(S, i, 3), a = g.range(0, TAU), m = 1 + (i % 2);
    puffs.push({
      x: (x + Math.cos(ph * TAU * m + a) * 1.3) * k,
      y: (y + Math.sin(ph * TAU + a) * 1.3) * k,
      r: r * k * (1 + 0.1 * Math.sin(ph * TAU * m + a * 2)),
    });
  });
  // billows: swell out of the upper surface, roll outward and up, then sink back in
  cycle(t, D, 5, S + 1, (r) => r.range(1.5, 2.3), (age, life, r) => {
    const q = age / life, th = r.range(-2.6, -0.55), rad = r.range(10, 14);
    const out = rad + 6 * q, x = Math.cos(th) * out * 1.3, y = -12 + Math.sin(th) * out - 3 * q;
    const size = r.range(5.5, 8) * Math.pow(Math.sin(Math.PI * q), 0.7);
    if (size > 1) puffs.push({ x: x * k, y: y * k, r: size * k });
  });

  const top = -34 * k;
  p.shade(-36 * k, -42 * k, 36 * k, 1, (x, y, out) => {
    let best = 0, lit = 0, bi = -1;
    for (let i = 0; i < puffs.length; i++) {
      const f = puffs[i], dx = x - f.x, dy = y - f.y, e = Math.sqrt(dx * dx + dy * dy) / f.r;
      if (e >= 1) continue;
      const v = 1 - e * e;
      if (v > best) (best = v), (lit = (-dx * 0.5 - dy) / f.r), (bi = i);
    }
    if (bi < 0) return;
    // height sets the tone (the tops catch the light); each billow darkens toward its underside, so the
    // creases read only where one billow rolls over another
    const h = clamp((y - 1) / top), f = puffs[bi];
    const n = noise2((x - f.x) * 0.25 + bi * 9.1, (y - f.y) * 0.25, S) * 0.06;
    const v = 0.2 + h * 0.6 + Math.min(0, lit) * 0.3 + Math.max(0, lit - 0.5) * 0.2 + n;
    // the skirt along the floor thins out into the ground
    if (y > -2) out.a = y > -1 ? 0.5 : 0.75;
    if (best < 0.14 && lit < 0) return at(C.slice(1, 6), v - 0.14);
    return at(C.slice(1, 8), v);
  });

  // wisps: small puffs tear off the top and thin out as they rise
  cycle(t, D, 4, S + 2, (r) => r.range(1, 1.5), (age, life, r) => {
    const q = age / life, x0 = r.range(-16, 18) * k, x = x0 + Math.sin(q * 3 + r.next() * 6) * 2 + q * Math.sign(x0) * 4;
    const y = (-25 + Math.abs(x0) * 0.4) * k - q * 13 * k, s = r.range(2.4, 3.4) * (1 - 0.8 * ease.inQuad(q));
    if (s > 0.6) p.circle(x, y, s, (d, a) => (d < 0.6 && a < -0.4 && a > -2.4 ? C[6] : C[5]));
  });
  // motes: sickly specks drifting up and out, flickering
  cycle(t, D, 9, S + 3, (r) => r.range(0.8, 1.5), (age, life, r) => {
    const q = age / life, side = r.sign(), x = (r.range(4, 28) * side + side * q * 6) * k + Math.sin(age * 5 + r.next() * TAU) * 1.5;
    const y = r.range(-30, -8) * k - age * r.range(8, 16);
    if (q > 0.6 && Math.sin(age * 31 + r.next() * 9) < -0.3) return;
    p.px(x, y, q < 0.5 ? C[7] : C[5]);
    p.light(x, y, C[5], 0.45 * (1 - q));
  });
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glow(0, -16 * k, 36 * k, C[4], 0.14 * pulse);
  p.glow(-2, -22 * k, 14 * k, C[6], 0.1 * pulse);
}
