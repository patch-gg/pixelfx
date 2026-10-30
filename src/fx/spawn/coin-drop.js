import { PAL, ramp, at, burst, seg, ease, TAU, WHITE } from "../../core/index.js";
import { cloud } from "./_lib.js";

export const meta = {
  name: "Coin drop",
  desc: "Loot: the enemy goes poof and a spray of spinning gold coins arcs out, bounces on the floor, settles with a glint, then blinks away.",
  tags: ["spawn", "death", "loot", "coins", "gold", "reward", "ground", "one-shot"],
  size: [84, 52],
  origin: [42, 46],
  duration: 2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.gold, count: 7, seed: 24 },
};

// a coin turning: face on, three-quarter, half, edge on
const SPIN = [
  ["..ddd..", ".dllld.", "dlwllmd", "dllmlmd", "dlllmmd", ".dmmmd.", "..ddd.."],
  [".ddd.", "dllmd", "dlwmd", "dllmd", "dlmmd", "dmmmd", ".ddd."],
  [".d.", "dld", "dwd", "dld", "dmd", "dmd", ".d."],
  ["d", "l", "l", "m", "m", "m", "d"],
];
const TURN = [0, 1, 2, 3, 2, 1];
const G = 420, FLOOR = -3.5, E = 0.36;

/** A coin's flight: thrown from (x0, y0), bouncing on the floor until it settles. Returns [x, y, bounces]. */
function hop(t, x0, y0, vx, vy) {
  let x = x0, y = y0, v = vy, bx = vx, tt = t;
  for (let n = 0; n < 4; n++) {
    const T = (-v + Math.sqrt(v * v + 2 * G * (FLOOR - y))) / G;
    if (tt < T) return [x + bx * tt, y + v * tt + 0.5 * G * tt * tt, n];
    tt -= T, x += bx * T, y = FLOOR, v = -(v + G * T) * E, bx *= 0.5;
    if (v > -14) break;
  }
  return [x + bx * Math.min(tt, 0.08), FLOOR, 4];
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed;
  const pal = { d: at(C, 0.3), m: at(C, 0.55), l: at(C, 0.75), w: at(C, 0.95) };
  // coins: thrown up and out, spinning while they fly, slowing their spin as they settle, blinking out at the end
  const blink = (t > 1.45 && Math.floor(t * 16) % 2 === 0) || t > 1.85;
  if (!blink) burst(o.count, S + 1, (r, i) => {
    const t0 = 0.04 + i * 0.025, age = t - t0;
    if (age < 0) return;
    const [x, y, n] = hop(age, r.range(-2, 2), -9, ((i + 0.5) / o.count - 0.5) * 80 + r.range(-6, 6), -r.range(115, 155));
    const rate = n >= 4 ? 0 : n > 1 ? 10 : 18, f = rate ? TURN[Math.floor(age * rate + r.next() * 6) % 6] : 0;
    const frame = SPIN[f], w = frame[0].length;
    p.sprite(frame, pal, Math.round(x) - (w >> 1), Math.round(y) - 3);
    // a glint pops on a settled coin now and then
    const gl = (age * 2.2 + r.next()) % 1;
    if (n >= 4 && gl < 0.12) {
      const s = gl < 0.06 ? 2 : 1, gx = Math.round(x) + 1, gy = Math.round(y) - 3;
      p.line(gx - s, gy, gx + s, gy, WHITE), p.line(gx, gy - s, gx, gy + s, WHITE);
    }
    p.light(x, y, at(C, 0.7), 0.2);
  });
  // the enemy's last poof, in front so the coins burst out of it
  const balls = [];
  burst(6, S, (r, i) => {
    const a = (i / 6) * TAU + r.range(-0.3, 0.3), e = ease.outCubic(seg(t, 0, 0.1)), gone = seg(t, 0.1 + r.range(0, 0.1), 0.32 + r.range(0, 0.1));
    balls.push({ x: Math.cos(a) * 7 * e, y: -9 + Math.sin(a) * 5 * e, r: r.range(3.5, 5) * (0.4 + 0.6 * e) * (1 - gone) });
  });
  cloud(p, balls, ramp(["#2c2840", "#5a5478", "#8e88aa", "#c4bed8", "#ecebf6"]), { inside: (x, y) => y < 0 });
}

