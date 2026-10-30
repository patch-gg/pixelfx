import { PAL, RAMP, ramp, at, seg, ease, clamp, lerp, stream, rng, noise2, TAU, WHITE } from "../../core/index.js";
import { fit, hot, billow, shock, oval, pool } from "./_lib.js";

export const meta = {
  name: "Nuke",
  desc: "A blinding white flash, then a fireball lifts off on a rising stem and rolls into a mushroom cloud, cooling to smoke as a ring of dust surges out along the ground.",
  tags: ["explosion", "nuke", "mushroom", "cloud", "big", "ground", "one-shot"],
  size: [176, 172],
  origin: [88, 156],
  duration: 4.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, size: 1, seed: 35 },
};

// the cap, in units of its radius: a dome, a ring of puffs that turns (the roll), and a tucked-under lip
const DOME = [[0, -0.5, 0.62], [-0.48, -0.36, 0.5], [0.48, -0.36, 0.5], [0, -0.05, 0.66], [-0.85, -0.08, 0.44], [0.85, -0.08, 0.44]];
const LIP = [[-0.95, 0.3, 0.36], [-0.5, 0.36, 0.36], [0, 0.38, 0.36], [0.5, 0.36, 0.36], [0.95, 0.3, 0.36]];

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, DU = RAMP.dust, S = o.seed, k = o.size, FIRE = hot(F);
  const SMK = SM.slice(1, 7), DST = DU.slice(1, 7), gone = 1 - seg(t, 3.3, 4.3);
  // ---- the flash: two frames of white over everything
  if (t < 0.067) {
    p.rect(-meta.origin[0], -meta.origin[1], meta.size[0], meta.size[1], WHITE);
    return;
  }
  // ---- the cap: a ball of fire on the ground that lifts off, swells and flattens into a rolling cap
  const lift = ease.inOutCubic(seg(t, 0.25, 2.6)), cy = lerp(-12, -104, lift) * k, R = (11 + 19 * ease.outCubic(seg(t, 0.05, 1.7))) * k;
  const flat = ease.inOutSine(seg(t, 0.35, 1.9)), sx = 1 + 0.42 * flat, sy = 1 - 0.22 * flat;
  const coolOut = seg(t, 0.15, 2.3), coolIn = seg(t, 0.4, 3.0), drift = seg(t, 3.0, 4.3);
  const cloud = [];
  const put = (x, y, r, h) => cloud.push({ x, y, r, v: gone, h });
  for (const [u, w, rr] of DOME) put(u * R * sx * (1 + drift * 0.2), cy + w * R * sy - drift * 8, rr * R * (1 + drift * 0.25), 1 - (u === 0 ? coolIn : coolOut));
  const roll = t * 1.3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + roll, x = Math.cos(a) * R * 0.95 * sx, y = cy + Math.sin(a) * R * (0.42 - 0.2 * flat) + R * 0.1;
    put(x * (1 + drift * 0.2), y - drift * 8, R * (0.4 + 0.06 * Math.sin(a * 3 + t * 4)) * (1 + drift * 0.25), 1 - coolOut);
  }
  if (flat > 0.2) for (const [u, w, rr] of LIP) put(u * R * sx, cy + w * R * sy, rr * R * flat, (1 - coolOut) * 0.8);
  // ---- the stem: puffs boiling up from the ground into the cap's belly, flared at the foot, narrowest mid-way
  stream(t, 0.3, 3.2, 30, S + 1, 1.1, (age, life, r) => {
    const q = age / life, top = cy + R * 0.3 * sy, y = lerp(-4, top, Math.pow(q, 0.85));
    const waist = 1 - 0.38 * Math.sin(Math.min(1, q * 1.3) * Math.PI) + 0.5 * (1 - seg(q, 0, 0.15));
    const rad = (5.5 + 4 * flat) * k * waist * r.range(0.85, 1.15);
    put(r.range(-2.5, 2.5) * k + Math.sin(age * 4 + r.next() * TAU) * 1.5, y, rad, (1 - seg(t, 0.4, 1.6)) * (1 - q) * 0.9);
  });
  // ---- the base surge: a thick ring of dust rolling out along the floor, an inner ring a beat behind
  const surge = [], sg = ease.outCubic(seg(t, 0.22, 2.6)), sfade = 1 - seg(t, 2.6, 3.9);
  if (t > 0.22 && sfade > 0) {
    for (let i = 0; i < 44; i++) {
      const inner = i >= 28, g = rng(S + 2, i), n = inner ? 16 : 28, a = ((inner ? i - 28 : i) / n) * TAU + g.range(-0.12, 0.12);
      const Rb = (8 + 58 * sg * (inner ? 0.62 : 1)) * k, front = Math.sin(a);
      const rad = (4 + (inner ? 7 : 6) * sg) * k * g.range(0.8, 1.2);
      surge.push({ x: Math.cos(a) * Rb, y: -rad * 0.7 + front * Rb * 0.09, r: rad, v: sfade * seg(t, 0.22, 0.3) });
    }
  }
  billow(p, surge, (v, lit, x, y, out) => {
    if (v < 0.06) return;
    out.a = clamp(v * 4);
    return at(DST, 0.08 + lit * 0.3 + v * 0.35 + noise2(x * 0.3, y * 0.4, S) * 0.12);
  });
  // ---- the cloud: white-hot to red to smoke; the smoke's belly glows with the heat still in it
  billow(p, cloud, (v, lit, x, y, out, f) => {
    if (v < 0.06) return;
    out.a = clamp(v * 4);
    const n = noise2(x * 0.22 + t * 0.6, y * 0.22 - t * 0.9, S);
    const heat = f.h * (0.55 + 0.6 * v) + n * 0.08;
    if (heat > 0.46) {
      out.k = heat * 0.3;
      return at(FIRE.slice(1), (heat - 0.46) / 0.54 + lit * 0.08);
    }
    // cooling: smoke that still smoulders red from inside, brightest on its belly
    if (heat > 0.2) {
      out.l = F[3];
      out.k = (heat - 0.2) * (lit < 0 ? 1.6 : 0.9);
    }
    return at(SMK, 0.18 + lit * 0.3 + v * 0.3 + n * 0.12);
  });
  // ---- the shockwave: a dome racing out and a ring along the floor
  const sw = seg(t, 0.07, 0.75);
  if (sw > 0 && sw < 1) {
    const r = (16 + 64 * ease.outCubic(sw)) * k;
    p.arc(0, 0, r, 1, Math.PI, TAU, F[7], sw < 0.4 ? 1 : 1 - (sw - 0.4) / 0.6);
  }
  shock(p, t, 0, 0, 0.07, 0.8, 14 * k, 84 * k, F[6], F[5], { sy: 0.1 });
  // ---- light: the glare after the flash, then the fireball's heat on the ground
  const glare = 1 - seg(t, 0.067, 0.6);
  p.glow(0, -40, 110, F[6], 0.7 * glare * glare);
  const heat = 1 - seg(t, 0.2, 2.2);
  p.glow(0, cy, R * 2.2, F[5], 0.4 * heat);
  pool(p, 0, 0, 70 * k, 8, F[4], 0.5 * heat * gone);
  if (t < 0.6) oval(p, 0, 0, (8 + 58 * sg) * k * 0.6, (8 + 58 * sg) * k * 0.06, F[6], 1 - t / 0.6);
}
