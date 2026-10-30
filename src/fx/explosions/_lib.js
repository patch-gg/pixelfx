// Shared by the explosions (and the fire effects that blow up): billows of fire that cool into smoke,
// sparks, bouncing debris, ground rings and flashes. Not an effect (the leading _ keeps the tools away).

import { at, burst, fly, flyV, seg, ease, clamp, noise2, TAU, WHITE } from "../../core/index.js";
export { fit, pool } from "../fire/_lib.js";

/** A blast's fire ramp from an 8-step palette: the cool edge up to a white-hot core. */
export const hot = (F) => [F[2], F[3], F[4], F[5], F[6], F[7], WHITE];

/**
 * Billows: puffs { x, y, r, v } (centre, radius, strength 0..1) painted as one lumpy mass. At each pixel the
 * strongest puff decides: color(v, lit, x, y, out, puff) picks the color (lit > 0 faces the top-left light)
 * and may set out.a / out.k. Puffs are bucketed by row, so a cloud of fifty stays fast.
 */
export function billow(p, list, color) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const P = [];
  for (const f of list) {
    if (!(f.r > 0.6 && f.v > 0)) continue;
    P.push(f);
    x0 = Math.min(x0, f.x - f.r); x1 = Math.max(x1, f.x + f.r);
    y0 = Math.min(y0, f.y - f.r); y1 = Math.max(y1, f.y + f.r);
  }
  if (!P.length) return;
  const Y0 = Math.floor(y0), rows = Array.from({ length: Math.ceil(y1) - Y0 + 2 }, () => []);
  for (const f of P) for (let r = Math.floor(f.y - f.r) - Y0, e = Math.ceil(f.y + f.r) - Y0; r <= e; r++) rows[r].push(f);
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    const row = rows[Math.floor(y) - Y0];
    if (!row) return;
    let best = 0, lit = 0, bf = null;
    for (let i = 0; i < row.length; i++) {
      const f = row[i], dx = x - f.x, dy = y - f.y, r2 = f.r * f.r, d2 = dx * dx + dy * dy;
      if (d2 >= r2) continue;
      const v = (1 - d2 / r2) * f.v;
      if (v > best) (best = v), (lit = (-dx - dy * 1.4) / f.r), (bf = f);
    }
    if (best > 0) return color(best, lit, x, y, out, bf);
  });
}

/**
 * Sparks: streaks along their velocity, thrown from (x, y) at angle a +- spread, falling and cooling
 * through cols [hot, warm, cool]. t0 delays them; with a floor (a y) they go out when they reach it.
 */
export function sparks(p, t, n, seed, cols, o = {}) {
  const { x = 0, y = 0, a = -Math.PI / 2, spread = Math.PI, sp = [60, 120], life = [0.3, 0.55], g = 160 } = o;
  const { drag = 2.5, len = 0.025, up = 0, k = 0.6, t0 = 0, glow = cols[1], floor = Infinity } = o;
  const age = t - t0;
  if (age < 0) return;
  burst(n, seed, (r) => {
    const ang = a + r.range(-spread, spread), s = r.range(sp[0], sp[1]), L = r.range(life[0], life[1]);
    if (age > L) return;
    const q = age / L, vx0 = Math.cos(ang) * s, vy0 = Math.sin(ang) * s - up;
    const [px, py] = fly(x, y, vx0, vy0, age, g, drag), [vx, vy] = flyV(vx0, vy0, age, g, drag);
    if (py > floor) return;
    p.line(px, py, px - vx * len, py - vy * len, q < 0.3 ? cols[0] : q < 0.6 ? cols[1] : cols[2]);
    if (k) p.light(px, py, glow, k * (1 - q));
  });
}

/**
 * Where a thrown thing is after t seconds: ballistic from (x, y) at (vx, vy) under gravity g, bouncing on the
 * floor line (e: bounce, f: skid) up to `hops` times, then resting. Returns [x, y, rested].
 */
export function hop(x, y, vx, vy, t, g, floor = 0, e = 0.35, f = 0.55, hops = 2) {
  for (let h = 0; ; h++) {
    const A = 0.5 * g, C = y - floor, disc = vy * vy - 4 * A * C;
    const tl = disc < 0 ? Infinity : (-vy + Math.sqrt(disc)) / (2 * A);
    if (t < tl) return [x + vx * t, y + vy * t + A * t * t, false];
    x += vx * tl; y = floor; t -= tl;
    vy = -(vy + g * tl) * e; vx *= f;
    if (h >= hops || vy > -12) return [x, floor, true];
  }
}

/**
 * Debris: chunks thrown from (x, y) at angle a +- spread. With a floor they land, hop and rest; they fade
 * out over the last fifth of their life. cols: [lit, shade]. size: [min, max] px.
 */
export function debris(p, t, n, seed, cols, o = {}) {
  const { x = 0, y = 0, a = -Math.PI / 2, spread = 1.2, sp = [50, 95], g = 260, life = [0.6, 0.9], size = [1, 2] } = o;
  const { floor = null, t0 = 0, drag = 0 } = o;
  const age = t - t0;
  if (age < 0) return;
  burst(n, seed, (r) => {
    const ang = a + r.range(-spread, spread), s = r.range(sp[0], sp[1]), L = r.range(life[0], life[1]);
    const sz = Math.min(size[1], Math.floor(r.range(size[0], size[1] + 1))), spin = r.range(8, 16) * r.sign();
    if (age > L) return;
    const vx = Math.cos(ang) * s, vy = Math.sin(ang) * s;
    const [px, py, rest] = floor === null ? [...fly(x, y, vx, vy, age, g, drag), false] : hop(x, y, vx, vy, age, g, floor);
    const al = 1 - seg(age, L * 0.8, L), turn = rest ? 0 : Math.floor(age * spin) & 1;
    const w = sz + (sz > 1 && turn ? 1 : 0), h = sz > 1 && !turn ? sz + 1 : sz;
    const top = floor !== null && rest ? floor - h : py - h / 2;
    p.rect(Math.round(px - w / 2), Math.round(top), w, h, cols[1], al);
    if (sz > 1) p.rect(Math.round(px - w / 2), Math.round(top), w - 1, 1, cols[0], al);
  });
}

/** A 1 px ellipse outline (rings lying on the floor), alpha a. */
export function oval(p, x, y, rx, ry, c, a = 1) {
  const n = Math.max(12, Math.ceil((rx + ry) * 3.2));
  let lx = NaN, ly = NaN;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU, px = Math.round(x + Math.cos(ang) * rx - 0.5), py = Math.round(y + Math.sin(ang) * ry - 0.5);
    if (px === lx && py === ly) continue;
    p.dot(px, py, c, a);
    lx = px; ly = py;
  }
}

/** Light hugging an ellipse (a ground shockwave's glow), falling off over width w. */
export function glowOval(p, x, y, rx, ry, w, c, k) {
  if (k <= 0.004 || rx < 1) return;
  p.shade(x - rx - w, y - ry - w, x + rx + w, y + ry + w, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = Math.abs(Math.sqrt(dx * dx + dy * dy) - 1) * rx / w;
    if (d >= 1) return;
    out.l = c;
    out.k = (1 - d) * (1 - d) * k;
  });
}

/** The hero frame: a solid white disc and a big glow, for `dur` seconds from t0. */
export function flash(p, t, x, y, t0, dur, r, glowC, { R = 48, k = 0.9, grow = 40 } = {}) {
  const age = t - t0;
  if (age < 0 || age >= dur) return;
  p.circle(x, y, r + grow * age, WHITE);
  p.glow(x, y, R, glowC, k);
}

/** A thin shock ring racing from r0 to r1 over [t0, t1], dithering away; sy < 1 squashes it onto the floor. */
export function shock(p, t, x, y, t0, t1, r0, r1, c, glowC, { sy = 1, k = 0.3 } = {}) {
  const s = seg(t, t0, t1);
  if (s <= 0 || s >= 1) return;
  // solid for the first frames, then it dithers away
  const r = r0 + (r1 - r0) * ease.outCubic(s), a = s < 0.4 ? 1 : 1 - ((s - 0.4) / 0.6) * 0.95;
  if (sy === 1) {
    p.ring(x, y, r, 1, c, a);
    p.glowRing(x, y, r, 4, glowC, k * (1 - s));
  } else {
    oval(p, x, y, r, r * sy, c, a);
    glowOval(p, x, y, r, r * sy, 4, glowC, k * (1 - s));
  }
}


/**
 * A blast's puffs, the small explosion's recipe made reusable: n puffs thrown from (x, y) at t0 toward angle
 * a +- spread, each a ball of fire that cools from the edge and a ball of smoke that takes over and rises.
 * Pushes into o.fire / o.smoke (pass the same lists to gather several blasts) and returns them.
 * floor: keep puffs above this y (ground blasts).
 */
export function blast(t, seed, o = {}) {
  const { x = 0, y = 0, t0 = 0, n = 12, reach = [5, 13], size = [5, 8], life = [0.75, 1.05], a = 0, spread = Math.PI } = o;
  const { squash = 0.7, lift = 26, delay = 0.07, core = 2, grow = 0.8, rise = 16, floor = null, k = 1 } = o;
  const fire = o.fire ?? [], smoke = o.smoke ?? [];
  burst(n, seed, (r, i) => {
    const ang = a + ((i + 0.5) / n - 0.5) * 2 * spread + r.range(-0.35, 0.35) * (spread / Math.PI);
    const reach0 = (i < core ? r.range(0, 3) : r.range(reach[0], reach[1])) * k;
    const age = t - t0 - (i < core ? 0 : r.range(0.01, delay)), L = r.range(life[0], life[1]);
    const r0 = r.range(size[0], size[1]) * k;
    if (age < 0 || age > L) return;
    const q = age / L, e = ease.outCubic(seg(age, 0, 0.28));
    let px = x + Math.cos(ang) * reach0 * e, py = y + Math.sin(ang) * reach0 * e * squash - age * age * lift * k;
    const rr = r0 * (0.5 + 0.7 * e);
    if (floor !== null) py = Math.min(py, floor - rr * 0.45);
    fire.push({ x: px, y: py, r: rr * (1 - 0.45 * seg(q, 0.15, 0.6)), v: 1 - seg(q, 0.05, 0.62) });
    smoke.push({ x: px, y: py - q * q * rise * k, r: rr * (1.05 + grow * q), v: seg(q, 0.12, 0.4) * (1 - seg(q, 0.62, 1)) });
  });
  return { fire, smoke };
}

/**
 * Paint blast puffs the small explosion's way: smoke behind, shaded from the top-left, then fire in front
 * with a little light. FIRE: the fire ramp (hot(F)), SM: a smoke ramp (7 steps), tone shifts the smoke
 * darker (0) or lighter.
 */
export function paintBlast(p, { fire, smoke }, FIRE, SM, seed, { tone = 0.25, k = 0.25 } = {}) {
  const S5 = SM.slice(1, 6);
  billow(p, smoke, (v, lit, x, y, out) => {
    if (v < 0.06) return;
    out.a = clamp(v * 4);
    return at(S5, tone + lit * 0.3 + v * 0.35 + noise2(x * 0.4, y * 0.4, seed) * 0.12);
  });
  billow(p, fire, (v, lit, x, y, out) => {
    if (v < 0.08) return;
    out.k = v * k;
    return at(FIRE, v * 0.95 + lit * 0.12 + noise2(x * 0.5, y * 0.5, seed + 1) * 0.1);
  });
}
