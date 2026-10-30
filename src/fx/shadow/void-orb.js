import { cycle, tileNoise, ease, fract, TAU } from "../../core/index.js";
import { steps, UMBRA } from "./_lib.js";

export const meta = {
  name: "Void orb",
  desc: "A ball of pure black with a crawling violet rim; a dark vortex winds into it and bright motes streak in and vanish.",
  tags: ["shadow", "void", "orb", "dark", "magic", "loop"],
  size: [48, 48],
  origin: [24, 24],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: UMBRA, radius: 8, count: 9, seed: 3 },
};

const K = 2.2; // how tightly the vortex arms wind

export function draw(p, t, o) {
  const C = steps(o.palette), R = o.radius, S = o.seed, D = meta.duration, ph = t / D, W = R + 12;

  // the vortex: three arms of dark matter winding in, thinning to points as they leave the orb
  p.shade(-W, -W, W, W, (x, y) => {
    const d = Math.hypot(x, y);
    if (d < R - 1 || d > W) return;
    const a = Math.atan2(y, x), arm = fract((3 * a) / TAU + (K * Math.log(d)) / 1.4 - ph * 2);
    const band = 1 - Math.abs(arm - 0.5) * 2, reach = 1 - (d - R) / (W - R);
    const v = band * (0.35 + 0.75 * reach);
    if (v < 0.62) return;
    return v > 0.86 && reach > 0.45 ? C[4] : reach > 0.25 ? C[3] : C[2];
  });

  // motes ride the arms in, accelerating; each is a short tail that brightens toward its head
  const at = (r0, a0, e) => {
    const rad = r0 + (R - 0.5 - r0) * e, ang = a0 + (K / 1.4) * (TAU / 3) * Math.log(r0 / rad) * 0.9;
    return [Math.cos(ang) * rad, Math.sin(ang) * rad];
  };
  cycle(t, D, o.count, S, (r) => r.range(0.6, 0.95), (age, life, r) => {
    const k = age / life, a0 = r.range(0, TAU), r0 = r.range(R + 8, R + 13);
    const pts = [0, 0.05, 0.1, 0.16].map((back) => at(r0, a0, ease.inQuad(Math.max(0, k - back * (0.4 + k)))));
    for (let i = pts.length - 1; i > 0; i--) p.line(...pts[i], ...pts[i - 1], i === 1 ? C[6] : i === 2 ? C[5] : C[4]);
    p.px(...pts[0], k > 0.55 ? C[7] : C[6]);
    p.light(...pts[0], C[6], 0.4 * k);
  });

  // the orb: black, a faint inner swirl, a rim that crawls
  p.shade(-R - 2, -R - 2, R + 2, R + 2, (x, y) => {
    const d = Math.hypot(x, y), a = Math.atan2(y, x), u = a / TAU + 0.5;
    const rim = R + 0.6 * tileNoise(u * 10 + ph * 10, ph * 3, 10, 3, S);
    if (d > rim) return;
    if (d > rim - 1) return tileNoise(u * 8 + ph * 16, 0.5, 8, 0, S + 2) > -0.25 ? C[7] : C[6];
    const thick = tileNoise(u * 6 - ph * 12, 0.5, 6, 0, S + 1) > 0.1;
    if (d > rim - 2 && thick) return C[5];
    const swirl = Math.sin(a * 2 + Math.log(d + 0.5) * 3 - ph * TAU * 2);
    return d > R * 0.35 && swirl > 0.75 ? C[1] : C[0];
  });

  // light hugs the rim and breathes
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glowRing(0, 0, R, 6, C[5], 0.4 * pulse);
  p.glow(0, 0, 24, C[4], 0.14 * pulse);
}
