import { burst, fly, seg, ease, clamp, rgb, red, green, blue, luma, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle, CHRONO } from "./_lib.js";

export const meta = {
  name: "Time stop",
  desc: "A clock face rings out, its hands spin and tick slower and slower, then freeze with a white flash, hang drained of color and shatter.",
  tags: ["arcane", "time", "clock", "freeze", "stop", "one-shot"],
  size: [76, 90],
  origin: [38, 37],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: CHRONO, radius: 24, seed: 17 },
};

const T_FREEZE = 0.8, T_BREAK = 1.16, STEP = TAU / 12;
// the same ramp with most of its color drained: the frozen clock
const drain = (c) => {
  const l = luma(c) * 255, k = 0.75;
  return rgb(red(c) + (l - red(c)) * k, green(c) + (l - green(c)) * k + 4, blue(c) + (l - blue(c)) * k + 14);
};

export function draw(p, t, o) {
  const C0 = fit(o.palette), F = C0.map(drain), S = o.seed;
  const frozen = t >= T_FREEZE, flash = t >= T_FREEZE && t < T_FREEZE + 0.067;
  const C = frozen ? F : C0, ink = (c) => (flash ? WHITE : c);
  const R = o.radius * ease.outBack(seg(t, 0, 0.2), 1.8);
  if (R < 1) return;
  // the hands: the minute hand snaps tick to tick, quickly at first, then slower and slower until it stops
  const tm = Math.min(t, T_FREEZE), turn = 2.25 * TAU * ease.outCubic(seg(tm, 0.12, T_FREEZE));
  const mAng = Math.floor(turn / STEP + 1e-6) * STEP - Math.PI / 2, hAng = turn / 12 + (TAU * 10) / 12 - Math.PI / 2;
  const speed = 2.25 * TAU * 3 * Math.pow(1 - seg(tm, 0.12, T_FREEZE), 2) / (T_FREEZE - 0.12); // rad/s, from outCubic
  // shattering: every twelfth of the face flies off on its own and falls
  const age = t - T_BREAK, piece = (i) => {
    if (age < 0) return [0, 0, 1];
    const mid = -Math.PI / 2 + i * STEP, r = burstRng(S, i);
    const [x, y] = fly(0, 0, Math.cos(mid) * r[0], Math.sin(mid) * r[0] - r[1], age, 420, 1);
    const life = 0.26 + r[2] * 0.18;
    return [x, y, y > 24 ? 0 : 1 - seg(age, life - 0.05, life)];
  };
  for (let i = 0; i < 12; i++) {
    const [dx, dy, a] = piece(i);
    if (a <= 0) continue;
    // whole, the face is two rings; broken, each piece carries its own two arcs
    if (age >= 0) {
      const a0 = -Math.PI / 2 + (i - 0.5) * STEP, a1 = a0 + STEP - 0.05;
      p.arc(dx, dy, R, 1, a0, a1, ink(C[5]), a);
      p.arc(dx, dy, R - 3, 1, a0, a1, ink(C[3]), a);
    } else if (i === 0) {
      p.ring(0, 0, R, 1, ink(C[5]));
      p.ring(0, 0, R - 3, 1, ink(C[3]));
    }
    // ticks appear one by one round the face as it opens; the one under the minute hand lights up
    if (t < 0.1 + i * 0.012) continue;
    const ang = -Math.PI / 2 + i * STEP, major = i % 3 === 0, r0 = R - 5, r1 = major ? R - 10 : R - 7;
    const lit = !frozen && Math.abs(Math.atan2(Math.sin(ang - mAng), Math.cos(ang - mAng))) < 0.1;
    const born = t < 0.16 + i * 0.012;
    p.line(dx + Math.cos(ang) * r0, dy + Math.sin(ang) * r0, dx + Math.cos(ang) * r1, dy + Math.sin(ang) * r1,
      ink(lit || born ? WHITE : major ? C[6] : C[5]), a);
  }
  // hands, with two fading echoes while they spin fast
  const [hx, hy, ha] = piece(12), [mx, my, ma] = piece(13);
  const hand = (ang, len, c, a, ox, oy) => {
    p.line(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len, c, a);
    p.line(ox + 1, oy, ox + 1 + Math.cos(ang) * (len - 1), oy + Math.sin(ang) * (len - 1), c, a);
  };
  if (!frozen && speed > 8) {
    hand(mAng - STEP * 1.5, R - 9, C[3], 0.8, 0, 0);
    hand(mAng - STEP * 0.75, R - 8, C[4], 1, 0, 0);
  }
  if (ha > 0) hand(hAng, R - 14, ink(C[5]), ha, hx, hy);
  if (ma > 0) hand(mAng, R - 7, ink(C[6]), ma, mx, my);
  if (ma > 0) p.circle(mx + 0.5, my, 1.6, ink(WHITE), ma);
  // motes swept round by the spin; they stop dead at the freeze and drop with the pieces
  burst(10, S + 1, (r, i) => {
    const a0 = r.range(0, TAU), rr = R + r.range(3, 8), w = r.range(0.5, 0.9);
    const ang = a0 + turn * w, [dx, dy, a] = piece(i % 12);
    if (a <= 0) return;
    const x = dx + Math.cos(ang) * rr, y = dy + Math.sin(ang) * rr;
    p.px(x, y, frozen ? (Math.floor(t * 12 + i) % 3 === 0 ? WHITE : C[5]) : C[6], a);
  });
  // the freeze: a white flash, a wave of stillness rolling out, frost glinting round the rim
  if (frozen && age < 0) {
    const wv = seg(t, T_FREEZE, T_FREEZE + 0.2);
    if (wv < 1) p.ring(0, 0, R + 2 + 9 * ease.outCubic(wv), 1, F[6], (v, ang) => (Math.sin(ang * 8) > wv * 2 - 1 ? 1 : 0));
    for (let i = 0; i < 4; i++) {
      const g = seg(t, T_FREEZE + 0.05 + i * 0.06, T_FREEZE + 0.2 + i * 0.06), ang = -Math.PI / 2 + (i * 5 + 1) * STEP * 0.6;
      if (g > 0 && g < 1) sparkle(p, Math.cos(ang) * R, Math.sin(ang) * R, g < 0.5 ? 2 : 1, WHITE, F[6], WHITE);
    }
  }
  if (flash) p.glow(0, 0, 40, C0[5], 0.55);
  const L = frozen ? clamp(1 - (t - T_FREEZE) / 0.3) * 0.6 : 0.25 * seg(t, 0, 0.2);
  p.glow(0, 0, R + 10, C0[4], L * (age > 0 ? 0 : 1));
}

// launch speed, lift and fade delay for a piece of the shattered face
function burstRng(seed, i) {
  const out = [];
  burst(1, seed * 97 + i, (r) => out.push(r.range(16, 34), r.range(0, 30), r.next()));
  return out;
}
