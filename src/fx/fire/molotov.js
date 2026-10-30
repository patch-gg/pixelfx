import { PAL, RAMP, ramp, at, seg, ease, burst, stream, rng, rand, fly, WHITE, hex } from "../../core/index.js";
import { fit, tongue, flames, pool } from "./_lib.js";
import { billow, hop } from "../explosions/_lib.js";

export const meta = {
  name: "Molotov",
  desc: "A lit bottle tumbles in and shatters: glass flies, burning fuel splashes and races along the floor, flares up, then burns down to smoke and a scorch.",
  tags: ["fire", "molotov", "grenade", "splash", "area", "ground", "one-shot"],
  size: [108, 68],
  origin: [40, 58],
  duration: 2.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, reach: 34, seed: 15 },
};

const GLASS = [hex("#123a2a"), hex("#2a7a4e"), hex("#5cc48a"), hex("#c8f5d8")];
const RAG = hex("#c8b08a"), CHAR = [hex("#110c10"), hex("#231719")];
const HIT = 0.32;

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, R = o.reach;
  // ---- the throw: a bottle tumbling in on an arc, its rag alight
  if (t < HIT) {
    const [bx, by] = fly(-32, -42, 100, 83, t, 300), a = -0.7 + t * 15;
    const dx = Math.cos(a), dy = Math.sin(a);
    p.beam(bx - dx * 2.5, by - dy * 2.5, bx + dx * 1.5, by + dy * 1.5, 4.2, (u, v) => (v > 0.7 ? GLASS[0] : u < 0.5 ? GLASS[1] : GLASS[2]));
    p.beam(bx + dx * 1.5, by + dy * 1.5, bx + dx * 4.5, by + dy * 4.5, 2, GLASS[1]);
    p.px(bx - dx * 0.5 - dy, by - dy * 0.5 + dx, GLASS[3]);
    const rx = bx + dx * 5.5, ry = by + dy * 5.5;
    p.px(rx, ry, RAG);
    // the rag's flame trails behind the throw
    p.px(rx - 1, ry - 1, F[6]), p.px(rx - 2, ry - 1, F[5]), p.px(rx - 2, ry - 2, F[4]), p.px(rx - 3, ry - 2, F[3]);
    p.glow(rx, ry, 8, F[5], 0.4);
    return;
  }
  const age = t - HIT, spread = ease.outCubic(seg(age, 0, 0.45));
  const xl = -14 * spread, xr = R * spread, burnDown = seg(t, 1.5, 2.55), fadeOut = 1 - seg(t, 2.3, 2.8);
  // ---- the scorch and the burning puddle on the floor
  p.shade(xl - 3, -2, xr + 3, 3, (x, y, out) => {
    const u = (x - (xl + xr) / 2) / ((xr - xl) / 2 + 3), dy = (y - 0.5) / 2.2;
    if (u * u + dy * dy > 1) return;
    out.a = fadeOut;
    const wet = 1 - burnDown;
    if (rand(Math.floor(x / 2), Math.floor(y), S) > 0.7 && wet > 0.2) return rand(Math.floor(x), S + 1) > 0.5 * wet ? F[3] : F[4];
    return u * u + dy * dy > 0.6 ? CHAR[1] : CHAR[0];
  });
  // ---- flames ride the spreading fuel: each catches as the splash reaches it, flares, then burns out
  const T = [];
  for (let i = 0; i < 11; i++) {
    const r = rng(S, i), fx = -12 + (R + 10) * ((i + r.range(0.1, 0.9)) / 11), reachAt = HIT + Math.abs(fx) / 110;
    const k = seg(t, reachAt, reachAt + 0.12) * (1 - ease.inQuad(seg(t, r.range(1.2, 1.9), r.range(2.1, 2.5))));
    if (fx < xl || fx > xr || k <= 0.05) continue;
    const flare = 1 + 0.7 * (1 - seg(t, reachAt + 0.1, reachAt + 0.55));
    const h = r.range(6, 22) * k * flare * (1 - Math.abs(fx - R * 0.3) / (R * 1.5));
    if (h < 2) continue;
    T.push(tongue(fx, 0, r.range(2.6, 5) * Math.min(1, 0.4 + k), h, t / 0.7, S + i * 11, { beat: 2 + (i % 3), sway: 2.2, pulse: 0.3 }));
  }
  if (T.length) flames(p, T, { F, ph: t, seed: S, box: [xl - 6, -40, xr + 6, 1], scroll: 14 });
  // ---- the smash: a whoosh of fire, glass shards, splashing fuel
  if (age < 0.5) {
    const puffs = [];
    burst(6, S + 3, (r, i) => {
      const a = -Math.PI / 2 + r.range(-1.3, 1.3), reach = r.range(3, 9) * ease.outCubic(seg(age, 0, 0.2));
      const q = seg(age, 0, r.range(0.3, 0.45));
      puffs.push({ x: Math.cos(a) * reach + age * 20, y: -3 + Math.sin(a) * reach * 0.6 - age * 30, r: r.range(4, 6.5) * (1 - q * 0.6), v: 1 - q });
    });
    billow(p, puffs, (v, lit) => (v < 0.1 ? undefined : at([F[3], F[4], F[5], F[6], F[7], WHITE], v * 1.1 + lit * 0.15)));
  }
  burst(12, S + 4, (r) => {
    const a = -Math.PI / 2 + r.range(-1.4, 1.4), sp = r.range(50, 110), L = r.range(0.4, 0.7);
    if (age > L) return;
    const [x, y, rest] = hop(0, -2, Math.cos(a) * sp + 15, Math.sin(a) * sp, age, 320, 0, 0.3, 0.5);
    p.px(x, rest ? -1 : y, r.next() < 0.4 ? GLASS[3] : GLASS[2]);
  });
  burst(14, S + 5, (r) => {
    const a = -Math.PI / 2 + r.range(-1.2, 1.3), sp = r.range(40, 95), L = r.range(0.35, 0.6);
    if (age > L) return;
    const [x, y] = fly(0, -2, Math.cos(a) * sp + 30, Math.sin(a) * sp, age, 300, 0.6);
    if (y > -1) return;
    const q = age / L;
    p.px(x, y, q < 0.4 ? F[6] : F[5]), p.px(x, y + 1, F[4]);
    p.light(x, y, F[5], 0.5 * (1 - q));
  });
  // ---- smoke rolling up off the fire as it burns
  stream(t, 0.5, 2.2, 9, S + 6, (g) => g.range(0.5, 0.7), (sa, life, r) => {
    const q = sa / life, x = r.range(-6, R * 0.8) + sa * 8, y = -10 - sa * r.range(26, 36);
    const rad = r.range(2.5, 4) * (q < 0.35 ? 0.6 + q : (1 - (q - 0.35) / 0.65) ** 0.7);
    if (rad > 0.6) p.circle(x, y, rad, (d, a) => (d < 0.5 && a < -0.5 ? SM[3] : d < 0.8 ? SM[2] : SM[1]));
  });
  // ---- light: the smash, then the fire on the floor
  if (age < 0.06) p.glow(0, -6, 26, F[6], 0.8);
  const L = (seg(age, 0, 0.1) * (1 - burnDown * 0.8)) * fadeOut;
  pool(p, (xl + xr) / 2, 0, (xr - xl) / 2 + 12, 5, F[4], 0.4 * L);
  p.glow((xl + xr) / 2, -8, (xr - xl) / 2 + 14, F[4], 0.22 * L);
}
