import { PAL, RAMP, hex, burst, seg, ease, bump, WHITE } from "../../core/index.js";
import { Layer, twinkle, fit } from "./_lib.js";

export const meta = {
  name: "Chest open",
  desc: "A treasure chest rattles, light leaking from the seam, then the lid flies back: beams fan up, coins and gems pop out, bounce and twinkle.",
  tags: ["pickup", "chest", "treasure", "loot", "reward", "one-shot"],
  size: [88, 76],
  origin: [44, 68],
  duration: 2.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.gold, loot: 7, seed: 15 },
};

const L = new Layer(48, 44);
const W = RAMP.wood;
const GEMS = [["#6e1030", "#e0304a", "#ffb4a8"], ["#0f3d2e", "#2fb86a", "#b4ffcc"], ["#14306e", "#3a7ae8", "#b4dcff"]].map((g) => g.map(hex));
const X0 = -13, X1 = 12, BASE = -11, LID = -20;

// gold trim at the corners, lit on the left
const strap = (C, x) => (x === X0 || x === X1 - 1 ? C[5] : x <= X0 + 1 || x >= X1 - 1 ? C[3] : 0);

// the chest in one of four poses: 0 closed, 1 lid lifted off the seam, 2 swinging back, 3 open
function chest(q, pose, C) {
  // the box: planks, gold straps, a gold rim, the lock plate
  for (let y = BASE; y <= -1; y++)
    for (let x = X0; x <= X1; x++) {
      let c = (y - BASE) % 4 === 3 ? W[2] : x === X0 + 2 ? W[5] : x >= X1 - 4 ? W[3] : W[4];
      c = strap(C, x) || c;
      if (y === BASE) c = x < 0 ? C[5] : C[4];
      if (y === -1) c = C[2];
      q.px(x, y, c);
    }
  q.rect(-2, BASE, 5, 5, C[4]);
  q.rect(-2, BASE, 5, 1, C[6]);
  q.rect(-2, BASE, 1, 5, C[5]);
  q.px(0, BASE + 2, W[0]), q.px(0, BASE + 3, W[0]), q.px(1, BASE + 2, W[1]);
  if (pose < 2) {
    const up = pose === 1 ? 2 : 0;
    // the closed lid: a rounded top, planks, a gold rim along the front edge
    for (let y = LID - up; y <= BASE - 1 - up; y++) {
      const row = y - LID + up, inset = row === 0 ? 3 : row === 1 ? 1 : 0;
      for (let x = X0 + inset; x <= X1 - inset; x++) {
        let c = row < 2 ? W[5] : row === 4 ? W[3] : row > 6 ? W[3] : W[4];
        c = strap(C, x) || c;
        if (row === 8) c = x < 0 ? C[5] : C[4];
        q.px(x, y, c);
      }
    }
    q.rect(-1, BASE - 2 - up, 3, 3, C[4]), q.px(-1, BASE - 2 - up, C[6]); // the latch
    if (up) for (let x = X0 + 1; x < X1; x++) q.px(x, BASE - 1, C[6]), q.px(x, BASE - 2, x % 4 ? C[6] : WHITE);
    return;
  }
  // open: the glowing mouth, then the inside of the lid standing up behind it
  for (let x = X0 + 1; x < X1; x++) q.px(x, BASE - 1, C[6]), q.px(x, BASE - 2, WHITE);
  const top = pose === 2 ? BASE - 7 : BASE - 12;
  for (let y = top; y <= BASE - 3; y++)
    for (let x = X0; x <= X1; x++) {
      const row = y - top;
      let c = row === 1 ? W[3] : row % 3 === 0 ? W[1] : W[2];
      c = strap(C, x) || c;
      if (row === 0) c = x < 0 ? C[5] : C[4];
      q.px(x, y, c);
    }
}

// where a piece of loot is after `age` seconds: tossed, then bouncing to a stop on the floor
function hop(vx, vy, age) {
  const g = 360;
  let x = 0, y = BASE - 2, t = age;
  for (let b = 0; b < 3; b++) {
    const land = (-vy + Math.sqrt(vy * vy - 2 * g * y)) / g;
    if (t < land) return [x + vx * t, y + vy * t + 0.5 * g * t * t, b];
    x += vx * land;
    y = -1;
    t -= land;
    vy = -(b ? 0.2 : 0.4) * (vy + g * land);
    vx *= 0.5;
  }
  return [x, -1, 3];
}

const COIN = [[".aa.", "abba", "abba", ".bb."], [".a.", "aba", "aba", ".b."], [".a", "ab", "ab", ".b"]];

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, OPEN = 0.52, fade = 1 - seg(t, 1.75, 2.15);
  if (fade <= 0) return;
  // the rattle: faster and harder until it bursts open
  const rattle = t < OPEN ? Math.round(Math.sin(t * (40 + 90 * t)) * seg(t, 0.08, 0.3)) : 0;
  const peek = (t > 0.22 && t < 0.27) || (t > 0.38 && t < 0.45);
  const pose = t < OPEN ? (peek ? 1 : 0) : t < OPEN + 0.05 ? 2 : 3;
  // beams fan up out of the mouth: solid wedges, white at the core, shrinking away
  const bk = ease.outCubic(seg(t, OPEN, OPEN + 0.16)), bOut = 1 - ease.inQuad(seg(t, 0.95, 1.5));
  if (bk > 0 && bOut > 0) {
    burst(5, S + 3, (r, i) => {
      const a = -Math.PI / 2 + (i - 2) * 0.36 + r.range(-0.05, 0.05), len = (24 + r.range(0, 12) - Math.abs(i - 2) * 4) * bk * (0.4 + 0.6 * bOut);
      const x0 = (i - 2) * 3, y0 = BASE - 2, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
      const w0 = 1.2 * bOut, w1 = (i % 2 ? 2.4 : 3.6) * bOut;
      const wedge = (k, c) =>
        p.poly([[x0 + nx * w0 * k, y0 + ny * w0 * k], [x0 + ca * len + nx * w1 * k, y0 + sa * len + ny * w1 * k], [x0 + ca * len - nx * w1 * k, y0 + sa * len - ny * w1 * k], [x0 - nx * w0 * k, y0 - ny * w0 * k]], c);
      wedge(1, C[5]);
      wedge(0.45, WHITE);
      p.glowLine(x0, y0, x0 + ca * len, y0 + sa * len, 6, C[5], 0.2 * bOut);
    });
  }
  // the chest
  const q = L.begin(-24, -34);
  q.place(rattle, 0);
  chest(q, pose, C);
  L.outline(W[0]);
  L.draw(p, 0, 0, fade);
  if (peek) p.glowLine(X0, BASE - 1, X1, BASE - 1, 7, C[5], 0.5);
  // loot: coins and gems arc out to both sides, bounce, settle and twinkle
  burst(o.loot, S, (r, i) => {
    const born = OPEN + 0.04 + i * 0.045, age = t - born;
    if (age < 0) return;
    const side = i % 2 ? 1 : -1, vx = side * r.range(12, 34), vy = -r.range(110, 150);
    const [x, y, b] = hop(vx, vy, age), X = Math.round(x), Y = Math.round(y);
    if (i % 3 === 2) {
      const G = GEMS[i % GEMS.length];
      p.sprite([".a.", "abc", "bbc", "bcc", ".c."], { a: G[2], b: G[1], c: G[0] }, X - 1, Y - 4, { a: fade });
    } else {
      const spin = b < 3 ? Math.floor(age * 14 + i) % 3 : 0;
      p.sprite(COIN[spin], { a: C[6], b: C[4] }, X - (spin === 0 ? 2 : 1), Y - 3, { a: fade });
    }
    p.light(X, Y - 2, C[5], 0.3 * fade);
    const tw = bump(age, 0.8 + r.range(0, 0.25), 1.1 + r.range(0, 0.25));
    if (tw > 0) twinkle(p, X + 1, Y - 5, Math.round(1 + tw * 2), C[5], C[6]);
  });
  // the flash as the lid flies, then a warm light that lingers
  const fl = 1 - seg(t, OPEN, OPEN + 0.5);
  if (t >= OPEN && t < OPEN + 0.07) p.ellipse(0, BASE - 2, 15, 5, WHITE);
  if (t >= OPEN && fl > 0) p.glow(0, BASE - 4, 44, C[5], 0.55 * fl * fl);
  p.glow(0, BASE, 26, C[4], 0.14 * fade * (t < OPEN ? seg(t, 0.15, OPEN) : 1));
}
