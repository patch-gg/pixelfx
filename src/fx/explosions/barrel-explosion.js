import { PAL, RAMP, ramp, seg, ease, burst, WHITE, hex } from "../../core/index.js";
import { fit, hot, blast, paintBlast, sparks, hop, shock, flash, pool } from "./_lib.js";
import { tongue, flames } from "../fire/_lib.js";

export const meta = {
  name: "Barrel explosion",
  desc: "An explosive barrel shudders and spits flame, then blows: a white flash, a tall fireball under black smoke, staves and the lid flying, fuel left burning.",
  tags: ["explosion", "barrel", "prop", "fire", "debris", "ground", "one-shot"],
  size: [128, 124],
  origin: [64, 110],
  duration: 2.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, seed: 32 },
};

const RED = [hex("#2a0c10"), hex("#6a1418"), hex("#a82424"), hex("#d84a3a")];
const METAL = [hex("#24222c"), hex("#4a4856"), hex("#8a8898")];
const HAZ = [hex("#1a1418"), hex("#f0c020")], CHAR = [hex("#0e0a0c"), hex("#201618")];
const BOOM = 0.42;

function barrel(p, dx, bulge) {
  for (let y = -16; y < 0; y++) {
    const mid = y > -13 && y < -3 ? bulge : 0;
    for (let x = -6 - mid; x <= 5 + mid; x++) {
      const e = x - mid * Math.sign(x + 0.5);
      let c = e <= -6 || e >= 5 ? RED[0] : e === -5 ? RED[2] : e <= -2 ? RED[3] : e <= 2 ? RED[2] : RED[1];
      if (y === -16 || y === -12 || y === -2) c = e <= -6 || e >= 5 ? METAL[0] : e <= -3 ? METAL[2] : METAL[1];
      else if (y >= -10 && y <= -7 && e > -6 && e < 5) c = (x + y + 40) % 4 < 2 ? HAZ[1] : HAZ[0];
      p.px(x + dx, y, c);
    }
  }
  for (let x = -4; x <= 3; x++) p.px(x + dx, -17, x < -1 ? METAL[2] : METAL[1]);
}

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, S = o.seed, FIRE = hot(F);
  if (t < BOOM) {
    // it shudders, swells, and spits a jet of flame from a split seam
    const tense = seg(t, 0.1, BOOM), f = Math.floor(t * 30);
    const dx = tense > 0 ? (f % 2 ? 1 : -1) * (tense > 0.5 ? 1 : f % 4 < 2 ? 1 : 0) : 0;
    barrel(p, dx, tense > 0.6 ? 1 : 0);
    if (tense > 0.25) {
      const k = seg(t, 0.2, 0.3);
      for (let i = 0; i < 6 * k; i++) p.px(dx + 7 + i, -9 - (i > 3 ? 1 : 0), i < 2 ? WHITE : i < 4 ? F[6] : F[4]);
      p.glow(dx + 8, -9, 10, F[5], 0.5 * k);
    }
    return;
  }
  const age = t - BOOM;
  const sc = seg(age, 0.03, 0.15) * (1 - seg(t, 2.0, 2.5));
  if (sc > 0) p.ellipse(0, 0.5, 22, 2.6, (d) => (d > 0.6 ? CHAR[1] : CHAR[0]), sc);
  // fuel left burning where the barrel stood, dying down
  const burn = seg(age, 0.3, 0.5) * (1 - ease.inQuad(seg(t, 1.3, 2.2)));
  if (burn > 0.05) {
    const T = [-9, -4, 1, 6, 10].map((x, i) => tongue(x, 0, 3 + (i % 2), (8 + (i % 3) * 4) * burn, t / 0.6, S + i * 9, { beat: 3, sway: 1.6, pulse: 0.3 }));
    flames(p, T, { F, ph: t, seed: S, box: [-15, -26, 15, 1], scroll: 14 });
  }
  // a tall fireball under a heavy black cloud
  const L = blast(age, S, { y: -10, n: 15, reach: [8, 18], size: [8, 11], life: [0.95, 1.3], a: -Math.PI / 2, spread: 1.85, squash: 0.75, lift: 28, rise: 24, floor: 0 });
  paintBlast(p, L, FIRE, SM, S, { tone: 0.02 });
  // staves tumbling out, landing flat; the lid shot straight up, flipping like a coin
  burst(8, S + 1, (r, i) => {
    const a = -Math.PI / 2 + (i % 2 ? 1 : -1) * r.range(0.35, 1.2), sp = r.range(75, 115), life = r.range(1.3, 1.8);
    if (age > life) return;
    const [x, y, rest] = hop(0, -8, Math.cos(a) * sp, Math.sin(a) * sp, age, 380, 0, 0.3, 0.45, 1);
    const rot = rest ? 0 : age * r.range(10, 18) * r.sign(), cx = Math.cos(rot) * 3, cy = Math.sin(rot) * 3;
    const al = 1 - seg(age, life * 0.8, life), yy = rest ? -1 : y;
    p.beam(x - cx, yy - cy, x + cx, yy + cy, 2, (u, v) => (v > 0.5 ? RED[1] : RED[3]), al);
  });
  {
    const [x, y, rest] = hop(0, -16, 16, -165, age, 340, 0, 0.25, 0.4, 1), life = 1.9;
    if (age < life) {
      const ry = rest ? 1 : Math.max(0.6, 4.5 * Math.abs(Math.cos(age * 14)));
      p.ellipse(x, rest ? -1 : y, 4.5, ry, (d) => (d > 0.72 ? METAL[2] : METAL[1]), 1 - seg(age, life * 0.8, life));
    }
  }
  sparks(p, age, 22, S + 2, [F[7], F[5], F[3]], { floor: 0, y: -10, a: -Math.PI / 2, spread: 1.6, sp: [90, 170], life: [0.35, 0.7], g: 200 });
  flash(p, age, 0, -10, 0, 0.08, 11, F[6], { R: 40, grow: 80 });
  shock(p, age, 0, 0, 0, 0.35, 8, 50, F[5], F[4], { sy: 0.15 });
  const lt = 1 - seg(age, 0, 0.8);
  p.glow(0, -20, 46, F[5], 0.5 * lt * lt);
  pool(p, 0, 0, 44, 6, F[4], 0.5 * Math.max(lt, burn * 0.6));
}
