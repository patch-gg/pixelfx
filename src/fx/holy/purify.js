import { PAL, burst, stream, seg, ease, clamp, rng, WHITE } from "../../core/index.js";
import { fit, ovalLine, sparkle } from "./_lib.js";

export const meta = {
  name: "Purify",
  desc: "Cleansing light: three bright rings sweep up the body one after another, scouring off a dark taint that boils away as smoke, then a clean glint.",
  tags: ["holy", "purify", "cleanse", "dispel", "cure", "character", "one-shot"],
  size: [48, 56],
  origin: [24, 46],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.holy, taint: PAL.shadow, seed: 40 },
};

const RINGS = [0.08, 0.26, 0.44], RISE = 0.42, TOPY = -25;
// the height of ring i at time t (null when it isn't up)
const ringY = (t, i) => {
  const k = seg(t, RINGS[i], RINGS[i] + RISE);
  return k <= 0 || k >= 1 ? null : 2 + (TOPY - 2) * ease.inOutSine(k);
};

function rings(p, t, o, front) {
  const C = fit(o.palette);
  for (let i = 0; i < 3; i++) {
    const y = ringY(t, i);
    if (y === null) continue;
    const k = seg(t, RINGS[i], RINGS[i] + RISE), rx = 10 - 3 * k, ry = 3 - k;
    const show = (ang) => (Math.sin(ang) > 0 === front ? 1 : 0);
    ovalLine(p, rx, ry, front ? (k > 0.8 ? C[5] : WHITE) : C[4], show, 0, y);
    if (front) ovalLine(p, rx, ry, C[5], show, 0, y + 1);
    if (front) p.glow(0, y, 12, C[5], 0.3 * (1 - k * 0.5));
  }
}

// taint blots stuck to the body; each one lets go when the first ring reaches it
function blots(o) {
  const A = o.actor, out = [];
  for (let i = 0, tries = 0; out.length < 7 && tries < 400; tries++) {
    const r = rng(o.seed, tries, 7), n = out.length, band = A.h / 7;
    const my = Math.min(A.h - 2, Math.floor(1 + n * band + r.range(0, band - 1))), mx = n % 2 ? r.int(A.w / 2, A.w - 2) : r.int(1, A.w / 2 - 1);
    if (!A.mask.data[my * A.w + mx]) continue;
    const y = A.y + my, k = Math.acos(1 - 2 * clamp((y - 2) / (TOPY - 2))) / Math.PI; // when ring 0 passes y
    out.push({ x: A.x + mx, y, free: RINGS[0] + RISE * k, r: r.range(1.3, 2.3), i: i++ });
  }
  return out;
}

export const drawBack = (p, t, o) => rings(p, t, o, false);

export function draw(p, t, o) {
  const C = fit(o.palette), T = fit(o.taint), A = o.actor, S = o.seed;
  // the taint: dark blots that wobble on the body, then tear off and boil away as smoke
  for (const b of blots(o)) {
    const a = t - b.free;
    if (a < 0) {
      const wob = Math.sin(t * 20 + b.i * 2) * 0.3;
      p.circle(b.x, b.y, b.r + wob, (d) => (d > 0.7 ? T[3] : d > 0.35 ? T[2] : T[4]));
      continue;
    }
    // torn off: puffs of dark smoke that rise, swell a little, then shrink to nothing
    burst(3, S * 5 + b.i, (r) => {
      const life = r.range(0.35, 0.55);
      if (a > life) return;
      const q = a / life, x = b.x + r.range(-6, 6) * ease.outCubic(q), y = b.y - a * r.range(22, 36);
      p.circle(x, y, b.r * 0.9 * Math.sin(Math.PI * (0.25 + 0.75 * q)), (d) => (d > 0.6 ? T[2] : q < 0.5 ? T[4] : T[3]));
    });
    if (a < 0.08) sparkle(p, b.x, b.y, 2, WHITE, C[6], WHITE);
  }
  // as a ring passes, the slice of body it touches lights up
  for (let i = 0; i < 3; i++) {
    const y = ringY(t, i);
    if (y === null) continue;
    p.mask(A.mask, A.x, A.y, (mx, my) => (Math.abs(A.y + my - y) < 0.8 ? WHITE : C[6]), (mx, my) => (Math.abs(A.y + my - y) < 1.6 ? 1 : 0));
  }
  rings(p, t, o, true);
  // clean: a glint over the head and motes rising
  const g = seg(t, 0.86, 1.22);
  if (g > 0 && g < 1) {
    sparkle(p, 4, A.head[1] - 3, g < 0.2 ? 2 : g < 0.6 ? 3 : g < 0.85 ? 1 : 0, WHITE, C[6], WHITE);
    p.outline(A.mask, A.x, A.y, C[5], 1 - g);
  }
  stream(t, 0.3, 0.8, 14, S + 2, (r) => r.range(0.35, 0.48), (age, life, r) => {
    const k = age / life, x = r.range(-9, 9), y = -r.range(2, 20) - age * r.range(20, 34);
    p.px(x, y, k < 0.5 ? C[6] : C[4]);
  });
}
