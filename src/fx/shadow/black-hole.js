import { cycle, tileNoise, ease, at, TAU } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Black hole",
  desc: "A tilted accretion disk spins around a black shadow, its far side lensed up over the top; debris spirals in and is gone.",
  tags: ["shadow", "void", "space", "gravity", "black hole", "loop"],
  size: [80, 44],
  origin: [40, 22],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#08050e", "#1a0c2c", "#34124e", "#5a1c7c", "#8a2ea6", "#c454c4", "#f496d8", "#fff2fa"],
    radius: 32, count: 6, seed: 11,
  },
};

const TILT = 0.22, RH = 7.5; // disk tilt (y squash) and the shadow's radius

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, D = meta.duration, ph = t / D, RO = o.radius, RI = RH + 3;
  const HOT = C.slice(2); // dim outer gas .. white-hot inner edge

  // the disk's brightness at radius r and disk angle th: hot inner edge, a dark lane, clumps that orbit
  // (inner rings turn faster; every ring turns a whole number of times a loop)
  const disk = (r, th) => {
    const q = (r - RI) / (RO - RI), ring = q < 0.3 ? 0 : q < 0.62 ? 1 : 2;
    const lane = Math.abs(q - 0.46) < 0.055 ? 0.2 : 0;
    const u = (th / TAU + 1) * 12 - ph * 12 * (3 - ring);
    const clump = tileNoise(u, ring * 5 + q * 2, 12, 0, S + ring);
    const beam = 1 - 0.3 * Math.cos(th); // the side turning toward us is brighter
    return Math.pow(1 - q, 1.6) * 0.98 * beam + clump * 0.14 - lane;
  };
  const diskPass = (front) => {
    p.shade(-RO, -RO * TILT - 1, RO, RO * TILT + 1, (x, y) => {
      if (y >= 0 !== front) return;
      const dy = y / TILT, r = Math.hypot(x, dy);
      if (r < RI || r > RO) return;
      const v = disk(r, Math.atan2(dy, x)) * Math.min(1, (RO - r) / 3 + 0.35);
      if (v < 0.17) return;
      return at(HOT, v);
    });
  };

  // debris: hot fragments on decaying orbits in the disk plane, each with a short tail; hidden behind the hole
  const bits = [];
  cycle(t, D, o.count, S + 5, (r) => r.range(1.5, 2.3), (age, life, r) => {
    const r0 = r.range(RO * 0.8, RO + 3), a0 = r.range(0, TAU), spin = r.range(4, 6), lift = r.range(-3, 4);
    const pos = (a) => {
      const e = ease.inQuad(Math.max(0, a) / life), rad = r0 + (RH - r0) * e, th = a0 + e * spin;
      return [Math.cos(th) * rad, Math.sin(th) * rad * TILT - (1 - e) * lift, Math.sin(th) < 0];
    };
    const [x, y, back] = pos(age), [x2, y2] = pos(age - 0.08);
    bits.push({ x, y, x2, y2, back, k: age / life });
  });
  const bitPass = (back) => {
    for (const b of bits) {
      if (b.back !== back) continue;
      p.line(b.x2, b.y2, b.x, b.y, (u) => (u > 0.7 ? (b.k > 0.5 ? C[7] : C[6]) : C[4]));
      p.light(b.x, b.y, C[6], 0.35 * b.k);
    }
  };

  diskPass(false);
  bitPass(true);

  // the far side of the disk, bent up over the shadow (and a thin image under it)
  p.shade(-RH - 7, -RH - 7, RH + 7, RH + 4, (x, y) => {
    const d = Math.hypot(x, y), a = Math.atan2(y, x), top = y < 0;
    const w = top ? 3.6 - 2 * Math.abs(Math.cos(a)) ** 3 : 1.2;
    if (d < RH + 1.2 || d > RH + 1.2 + w) return;
    const v = disk(RI + ((d - RH - 1.2) / w) * 9, top ? -a : a) * (top ? 0.9 : 0.75);
    return v < 0.15 ? undefined : at(HOT, v);
  });
  // the shadow and its photon ring
  p.circle(0, 0, RH + 1, (d) => (d > 0.88 ? C[7] : C[0]));

  bitPass(false);
  diskPass(true);

  const pulse = 0.9 + 0.1 * Math.sin(ph * TAU * 3);
  p.glowRing(0, 0, RH + 2, 5, C[6], 0.3 * pulse);
  p.glow(-10, 0, 30, C[5], 0.12 * pulse);
  p.glow(0, 0, 42, C[4], 0.07);
}
