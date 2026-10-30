import { PAL, RAMP, ramp, at, burst, stream, fly, flyV, rand, seg, ease, lerp, TAU, WHITE, hex } from "../../core/index.js";
import { bez, bezAngle, rotSprite, puffs, smoke, onCanvas, steps } from "./_lib.js";

export const meta = {
  name: "Homing missile",
  desc: "A missile launches, curves up and over and dives onto a locked target, a white smoke trail hanging along its path, then a fiery hit.",
  tags: ["projectile", "missile", "homing", "explosive", "smoke", "one-shot"],
  size: [128, 80],
  origin: [8, 62],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, seed: 8 },
};

const PATH = [[0, 0], [10, -66], [80, -72], [98, -12]];
const HIT = 0.9;
const MISSILE = ["dd........", "ommmmmmllr", "dd........"];
const MPAL = { d: "#4a5468", o: "#1c2230", m: "#9aa6ba", l: "#d0d8e6", r: "#d42a30" };
const LOCK = hex("#ff4a48");

/** How far along the path at time t: it leaves the rail slowly and accelerates into the dive. */
const prog = (t) => {
  const u = seg(t, 0, HIT);
  return 0.3 * u + 0.7 * u * u;
};

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 8), S = o.seed, inside = onCanvas(meta, 1), [tx, ty] = PATH[3];
  // the trail: puffs dropped behind the tail, swelling, sinking a touch and thinning; the newest on top
  const list = [];
  stream(t, 0.03, HIT - 0.02, 70, S, (r) => r.range(0.7, 0.95), (age, life, r, i) => {
    const u = prog(0.03 + i / 70), [x, y] = bez(PATH, u), a = bezAngle(PATH, u), k = age / life;
    list.push({ x: x - Math.cos(a) * 10 + r.range(-0.5, 0.5), y: y - Math.sin(a) * 10 + age * 4, r: 1 + 2.4 * ease.outCubic(k) * r.range(0.8, 1.2), v: (1 - k) ** 1.4 });
  });
  puffs(p, list, RAMP.smoke, { base: 0.62, inside });
  // the lock-on reticle: brackets closing on the target, blinking until they lock
  if (t < HIT) {
    const lock = ease.outCubic(seg(t, 0.05, 0.6)), s = Math.round(lerp(15, 6, lock));
    if (lock >= 1 || Math.floor(t * 14) % 2 === 0) {
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const cx = tx + sx * s, cy = ty + sy * s;
        p.line(cx, cy, cx - sx * 3, cy, LOCK);
        p.line(cx, cy, cx, cy - sy * 3, LOCK);
      }
      if (lock >= 1) p.px(tx, ty, LOCK);
    }
  }
  // the missile, its jet flickering behind it
  if (t < HIT) {
    const u = prog(t), [x, y] = bez(PATH, u), a = bezAngle(PATH, u), ca = Math.cos(a), sa = Math.sin(a);
    const jl = 2 + Math.floor(rand(S, Math.floor(t * 30)) * 3);
    for (let j = 0; j <= jl; j++) p.px(x - ca * (10.5 + j), y - sa * (10.5 + j), j < 1 ? WHITE : j < 2 ? at(C, 0.84) : at(C, 0.6));
    rotSprite(p, MISSILE, MPAL, x, y, a, 10, 1.5);
    p.glow(x - ca * 11, y - sa * 11, 9, at(C, 0.62), 0.35);
  }
  // the hit: a white frame, a fireball cooling into smoke, a shockwave, sparks
  const te = t - HIT;
  if (te < 0) return;
  const fire = [], smk = [];
  burst(7, S + 3, (r, i) => {
    const ang = (i / 7) * TAU + r.range(-0.4, 0.4), reach = i === 0 ? 0 : r.range(3, 8), life = r.range(0.6, 0.85);
    const age = te - (i ? r.range(0, 0.05) : 0);
    if (age < 0 || age > life) return;
    const q = age / life, e = ease.outCubic(seg(age, 0, 0.2)), r0 = r.range(3.5, 5.5) * (0.5 + 0.6 * e);
    const x = tx + Math.cos(ang) * reach * e, y = ty + Math.sin(ang) * reach * e * 0.8 - age * age * 22;
    fire.push({ x, y, r: r0 * (1 - 0.5 * seg(q, 0.1, 0.5)), v: 1 - seg(q, 0.04, 0.5) });
    smk.push({ x, y: y - q * 8, r: r0 * (1.1 + 0.6 * q), v: seg(q, 0.1, 0.32) * (1 - seg(q, 0.6, 1)) });
  });
  smoke(p, smk, RAMP.smoke, { base: 0.38, seed: S + 2, inside });
  smoke(p, fire, [C[2], C[3], C[4], C[5], C[6], C[7] ?? WHITE, WHITE], { base: 0, lit: 0.12, dens: 0.95, grain: 0.1, seed: S + 1, inside });
  if (te < 0.07) p.circle(tx, ty, 4 + 30 * te, WHITE);
  const sw = seg(te, 0.02, 0.22);
  if (sw > 0 && sw < 1) p.ring(tx, ty, 7 + 10 * ease.outCubic(sw), 1, at(C, 0.9), 1 - sw * 0.8);
  burst(10, S + 4, (r) => {
    const a = r.range(0, TAU), v = r.range(60, 120), life = r.range(0.25, 0.45);
    if (te > life) return;
    const q = te / life, [x, y] = fly(tx, ty, Math.cos(a) * v, Math.sin(a) * v - 30, te, 150, 2.5), [vx, vy] = flyV(Math.cos(a) * v, Math.sin(a) * v - 30, te, 150, 2.5);
    if (!inside(x, y) || !inside(x - vx * 0.02, y - vy * 0.02)) return;
    p.line(x, y, x - vx * 0.02, y - vy * 0.02, q < 0.35 ? at(C, 0.92) : q < 0.7 ? at(C, 0.7) : at(C, 0.45));
  });
  const L = 1 - seg(te, 0, 0.45);
  p.glow(tx, ty, 30, at(C, 0.65), 0.55 * L * L);
}
