import { hex, ramp, at, clamp, cycle, tileFbm, PAL, TAU } from "../../core/index.js";
import { Grid, lit, shift } from "./_lib.js";

export const meta = {
  name: "Flying skull",
  desc: "A flaming skull bobs in the air, jaw chattering, eye sockets lit from inside; fire streams off its crown and embers rise.",
  tags: ["critter", "skull", "undead", "fire", "flying", "spooky", "loop"],
  size: [48, 64],
  origin: [24, 52],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, seed: 1 },
};

const BONE = ["#2a2018", "#6e6250", "#ada186", "#e0d6bc", "#fffaf0"].map(hex);
const HOLE = hex("#140c10");

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const F = ramp(o.palette), n = F.length, ph = t / meta.duration;
  const by = Math.round(Math.sin(ph * TAU) * 2.5), cy = -8 + by;
  // jaw chatters four times a loop
  const jaw = Math.sin(ph * TAU * 4) > 0.3 ? 2 : Math.sin(ph * TAU * 4) > -0.2 ? 1 : 0;
  // fire streaming up off the crown (behind the skull)
  const body = F.slice(2, n - 1);
  p.shade(-14, cy - 30, 14, cy + 2, (x, y) => {
    const v = clamp((cy - 3 - y) / 26, 0, 1.2);
    const w = 10.5 * (1 - v * 0.8) + 1.2 * Math.sin(v * 7 - ph * TAU * 2);
    const sway = Math.sin(ph * TAU + v * 3) * v * 3;
    const d = Math.abs(x - sway) / Math.max(1, w);
    const nz = tileFbm(x * 0.32, y * 0.22 + ph * 14, 0, 14, o.seed, 3);
    const heat = (1 - d * d) * (1.05 - v * 0.9) + nz * (0.32 + v * 0.22);
    // the thinnest wisps at the top are dropped, so the tips tear off in clean tongues
    if (heat < 0.16 + v * 0.14) return;
    return at(body, (heat - 0.14) / 0.85);
  });
  const g = new Grid(-24, -52, 48, 64);
  // cranium and cheeks
  g.ellipse(0, cy - 3, 8, 7, (nx, ny) => BONE[lit(nx, ny) > 0.8 ? 4 : lit(nx, ny) > 0.5 ? 3 : lit(nx, ny) > 0.25 ? 2 : 1]);
  g.shade(-6, cy + 1, 6, cy + 5, (x, y) => {
    const nx = x / 6.5, L = lit(nx, 0.35);
    if (Math.abs(nx) > 0.92 && y > cy + 3) return 0;
    return BONE[L > 0.5 ? 3 : L > 0.25 ? 2 : 1];
  });
  // sockets with a burning pupil, a nose hole
  for (const side of [-1, 1]) {
    g.ellipse(side * 3.2 - 0.5 + 0.5, cy + 0.2, 2.3, 2.5, HOLE);
    g.set(side * 3.2 - (side < 0 ? 1 : 0), cy + 0.5, F[n - 2]);
  }
  g.set(-1, cy + 3, HOLE), g.set(0, cy + 3, HOLE), g.set(-1, cy + 4, BONE[1]), g.set(0, cy + 4, BONE[1]);
  // upper teeth
  for (let x = -4; x <= 3; x++) g.set(x, cy + 6, x % 2 ? BONE[3] : BONE[2]);
  // the jaw, hinged: it drops and snaps back
  const jy = cy + 7 + jaw;
  g.shade(-5, jy, 5, jy + 3, (x, y) => {
    const nx = x / 5.5, ny = (y - jy) / 3.5;
    if (nx * nx * 0.7 + ny * ny > 1 && y > jy + 1) return 0;
    if (y < jy + 1) return Math.floor(x) % 2 ? BONE[3] : BONE[2];
    return BONE[lit(nx, 0.6) > 0.35 ? 2 : 1];
  });
  if (jaw > 0) for (let x = -4; x <= 3; x++) for (let k = 0; k < jaw; k++) g.set(x, cy + 7 + k, HOLE);
  g.outline(BONE[0]);
  g.draw(p);
  // eye glow and embers
  p.light(-3.7, cy + 0.5, F[n - 2], 0.6), p.light(2.7, cy + 0.5, F[n - 2], 0.6);
  cycle(t, meta.duration, 8, o.seed + 4, (r) => r.range(0.5, 0.9), (age, life, r) => {
    const k = age / life, x = r.range(-6, 6) + Math.sin(age * 7 + r.next() * 6) * 2, y = cy - 14 - age * r.range(22, 34);
    if (y < -50 || (k > 0.6 && Math.sin(age * 40 + r.next() * 9) < -0.4)) return;
    p.px(x, y, k < 0.4 ? F[n - 2] : F[n - 4]);
    p.light(x, y, F[n - 3], 0.5 * (1 - k));
  });
  p.glow(0, cy - 10, 26, F[n - 4], 0.25);
  p.glow(0, cy - 6, 9, F[n - 2], 0.18);
}
