import { PAL, fit, at, cycle, tileNoise, fract, ease, TAU } from "../../core/index.js";

export const meta = {
  name: "Portal",
  desc: "An oval rift: three spiral arms turning into the dark, a wobbling bright rim, motes spiralling in.",
  tags: ["arcane", "portal", "magic", "teleport", "loop"],
  size: [64, 72],
  origin: [32, 38],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, width: 14, height: 22, seed: 4 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), rx = o.width, ry = o.height, S = o.seed, ph = t / meta.duration;
  const inner = [C[0], C[1], C[2], C[3], C[4], C[5]];
  p.shade(-rx - 3, -ry - 3, rx + 3, ry + 3, (x, y, out) => {
    const dx = x / rx, dy = y / ry, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
    // the rim wobbles: noise around the oval (12 cells, wrapping) scrolling a whole number of cells a loop
    const rim = 1 + 0.07 * tileNoise((a / TAU) * 12 + ph * 12, ph * 3, 12, 3, S);
    if (d > rim) return;
    if (d > rim - 0.1) {
      // the rim, lit from the top-left: white only where the light catches it
      const lit = Math.cos(a + 2.36) > 0.25;
      out.c = d > rim - 0.045 ? (lit ? C[7] : C[6]) : C[5];
      out.k = 0.25;
      return;
    }
    // three arms that spiral inward and turn twice a loop; deeper is darker
    const arm = fract((a / TAU) * 3 - Math.log(d + 0.06) * 0.85 + ph * 2);
    const band = 0.5 + 0.5 * Math.sin(arm * TAU);
    return at(inner, d * 0.75 + band * 0.42 - 0.12);
  });
  // motes drawn in from outside, spinning faster as they fall in
  cycle(t, meta.duration, 16, S, (r) => r.range(0.7, 1.2), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU) + ease.inQuad(k) * 3.2, rad = 1.55 - 1.45 * ease.inQuad(k);
    const x = Math.cos(a) * rx * rad, y = Math.sin(a) * ry * rad;
    p.px(x, y, k < 0.75 ? C[6] : C[4]);
    p.light(x, y, C[5], 0.5);
  });
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glow(0, 0, ry * 1.7, C[4], 0.32 * pulse);
  p.glow(0, ry + 2, rx * 1.6, C[5], 0.18 * pulse);
}
