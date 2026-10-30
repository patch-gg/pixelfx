import { PAL, ramp, at, burst, fly, seg, ease, WHITE } from "../../core/index.js";
import { ARROW, arrowPal, rotSprite, puffs, onCanvas } from "./_lib.js";

export const meta = {
  name: "Arrow hit",
  desc: "An arrow streaks in and thunks into the floor, kicking up dirt, quivers back and forth as the wobble dies, then fades.",
  tags: ["projectile", "arrow", "impact", "ground", "one-shot"],
  size: [60, 32],
  origin: [36, 26],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.dust, tilt: 0.55, seed: 13 },
};

const TH = 0.1; // the moment it lands
const FLETCH = ["#ffffff", "#e4dccc", "#c42a30", "#7a1820"];

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, inside = onCanvas(meta), above = (x, y) => y < 1 && inside(x, y);
  const pal = arrowPal(FLETCH), rest = o.tilt, dx = Math.cos(rest), dy = Math.sin(rest);
  const fade = 1 - seg(t, 1.1, 1.36);
  if (t < TH) {
    // in flight: a streak and the arrow, sliding down its line into the floor
    const back = 36 * (1 - t / TH), x = -dx * back, y = -dy * back;
    p.line(x - dx * 24, y - dy * 24, x - dx * 40, y - dy * 40, (u) => (u < 0.4 ? at(C, 0.85) : at(C, 0.6)), (u) => (inside(x - dx * (24 + u * 16), y - dy * (24 + u * 16)) ? 1 : 0));
    rotSprite(p, ARROW, pal, x, y, rest, 24.5, 2.5, { inside: above });
    return;
  }
  const te = t - TH;
  // the floor takes a small dent
  if (fade > 0) {
    p.dot(-1, 0, C[1], fade), p.dot(1, 0, C[1], fade), p.dot(0, 1, C[0], fade);
  }
  // dirt: a low puff spreading along the floor, clods tossed up and falling back
  const dust = [];
  burst(5, S + 1, (r, i) => {
    const life = r.range(0.35, 0.55), age = te - r.range(0, 0.03);
    if (age < 0 || age > life) return;
    const k = age / life, e = ease.outCubic(seg(age, 0, 0.25)), side = i % 2 ? 1 : -1;
    dust.push({ x: side * (1 + r.range(2, 7) * e), y: -1 - r.range(0.5, 2) * e - k * 2, r: (1.4 + 2 * e) * (1 - k * 0.3), v: 1 - k });
  });
  puffs(p, dust, C, { base: 0.5, inside: above });
  burst(7, S + 2, (r) => {
    const a = -Math.PI / 2 + r.range(-1.1, 0.7), v = r.range(40, 80), life = r.range(0.3, 0.5);
    if (te > life) return;
    const [x, y] = fly(0, -1, Math.cos(a) * v, Math.sin(a) * v, te, 300, 0.5);
    if (y > 0) return;
    p.rect(x, y, r.chance(0.4) ? 2 : 1, 1, te / life < 0.6 ? C[3] : C[2]);
  });
  // stuck fast, quivering: the shaft swings about the buried tip as the wobble dies
  const wob = 0.2 * Math.exp(-te * 5.5) * Math.sin(te * Math.PI * 2 * 9);
  rotSprite(p, ARROW, pal, 0, 0, rest + wob, 21.5, 2.5, { inside: above, a: fade });
  // the thunk: a white tick where it bit in, for a frame or two
  if (te < 0.06) {
    p.px(-2, -1, WHITE), p.px(2, -1, WHITE), p.px(-3, 0, at(C, 0.9)), p.px(3, 0, at(C, 0.9));
    p.glow(0, -1, 8, at(C, 0.8), 0.25);
  }
}
