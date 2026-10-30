import { PAL, RAMP, ramp, at, burst, stream, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { smoke, puffs, onCanvas, steps } from "./_lib.js";

export const meta = {
  name: "Cannonball",
  desc: "Cannon fire: a round blast of flame at the muzzle, the iron ball arcing away trailing a wisp, and a big cloud of gunsmoke rolling out and up.",
  tags: ["projectile", "cannon", "cannonball", "smoke", "directional", "one-shot"],
  size: [128, 52],
  origin: [6, 32],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, speed: 270, seed: 10 },
};

const IRON = ["#141820", "#262c3a", "#3a4254", "#5a6478", "#9aa6ba"];

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 8), S = o.seed, V = o.speed, inside = onCanvas(meta, 1), cy = 0.5;
  const I = ramp(IRON);
  const ball = (tt) => fly(5, cy, V, -45, tt, 130, 0);
  // the wisp: small puffs the ball leaves in the air, gone in a blink
  const wisp = [];
  stream(t, 0.04, 0.5, 80, S + 5, (r) => r.range(0.16, 0.26), (age, life, r, i) => {
    const [x, y] = ball(0.04 + i / 80), k = age / life;
    wisp.push({ x: x - 3, y: y - age * 8, r: 1.3 + k * 1.6, v: (1 - k) * 0.85 });
  });
  puffs(p, wisp, RAMP.smoke, { base: 0.55, inside });
  // gunsmoke: a big cloud shoved out of the barrel, rolling forward, rising, slowly thinning
  const cloud = [];
  burst(12, S + 4, (r, i) => {
    const age = t - 0.03 - r.range(0, 0.07), life = r.range(1.1, 1.45);
    if (age < 0 || age > life) return;
    const u = age / life, e = ease.outQuart(seg(age, 0, 0.45)), reach = 3 + (i / 11) * 30 + r.range(-3, 3);
    cloud.push({
      x: 4 + reach * e + age * 6, y: cy + r.range(-5, 5) * e - u * r.range(12, 22) - (i / 11) * 2,
      r: (3 + reach * 0.13) * (0.5 + 0.5 * e) * (1 + 0.7 * u), v: (1 - u) ** 1.2,
    });
  });
  smoke(p, cloud, RAMP.smoke, { base: 0.54, lit: 0.14, seed: S, inside });
  // the blast: a white ball of flame, then a fireball rolling forward and cooling into the cloud
  if (t < 0.035) {
    p.circle(6, cy, 7, at(C, 0.62));
    p.circle(5.5, cy, 4.6, WHITE);
  } else {
    const fire = [];
    burst(5, S + 2, (r, i) => {
      const life = r.range(0.14, 0.22), age = t - 0.035;
      if (age > life) return;
      const q = age / life, e = ease.outCubic(seg(age, 0, 0.15));
      fire.push({ x: 6 + (i * 3 + r.range(0, 3)) * (0.4 + e), y: cy + r.range(-3, 3) * e - q * 3, r: r.range(3, 4.5) * (1 - q * 0.6), v: 1 - q });
    });
    smoke(p, fire, [C[2], C[3], C[4], C[5], C[6], C[7] ?? WHITE], { base: 0, lit: 0.12, dens: 0.95, grain: 0.1, seed: S + 1, inside });
  }
  // the ball: dark iron with a hard highlight, arcing off the canvas
  if (t > 0.02 && t < 0.6) {
    const [x, y] = ball(t);
    p.circle(x, y, 3.2, (d, a) => {
      const l = -d * (Math.cos(a) + Math.sin(a) * 1.2);
      return l > 0.55 && d > 0.25 ? I[4] : at(I.slice(1, 4), 0.45 + l * 0.5);
    }, (d, a) => (inside(x + Math.cos(a) * d * 3.2, y + Math.sin(a) * d * 3.2) ? 1 : 0));
  }
  // embers: burning wadding thrown out with the ball
  burst(8, S + 3, (r) => {
    const a = r.range(-0.6, 0.5), v = r.range(70, 170), life = r.range(0.25, 0.5);
    if (t > life) return;
    const k = t / life, [x, y] = fly(7, cy, Math.cos(a) * v, Math.sin(a) * v, t, 160, 3);
    if (k > 0.6 && Math.floor(t * 30 + r.next() * 3) % 3 === 0) return;
    p.px(x, y, k < 0.35 ? at(C, 0.9) : k < 0.7 ? at(C, 0.66) : at(C, 0.45));
    p.light(x, y, at(C, 0.7), 0.35 * (1 - k));
  });
  const L = clamp(1 - t / 0.3);
  p.glow(10, cy, 34, at(C, 0.62), 0.6 * L * L);
  if (t < 0.035) p.glow(6, cy, 10, WHITE, 0.5);
}
