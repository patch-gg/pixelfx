import { PAL, RAMP, ramp, seg, ease, lerp, burst, fly, TAU, WHITE, hex } from "../../core/index.js";
import { fit, hot, blast, paintBlast, sparks, debris, hop, shock, flash, pool } from "./_lib.js";

export const meta = {
  name: "Grenade",
  desc: "A grenade is lobbed in, bounces once, rolls to a stop and fizzes, then goes off: a flash, a squat fireball, shrapnel streaks, dust and a scorch.",
  tags: ["explosion", "grenade", "bounce", "weapon", "ground", "one-shot"],
  size: [104, 80],
  origin: [56, 68],
  duration: 2.3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, seed: 23 },
};

const BODY = [hex("#1c2414"), hex("#3a4a22"), hex("#5c7034"), hex("#8aa050")];
const CAP = [hex("#3a3a46"), hex("#8a8a9a")];
const SHRAP = hex("#d8d4e0"), CHAR = [hex("#100c10"), hex("#221a1c")];
const BOOM = 1.1, REST = 0.78;

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), SM = RAMP.smoke, DU = RAMP.dust, S = o.seed, FIRE = hot(F);
  if (t < BOOM) {
    // lobbed in from the left, one bounce, a short roll to rest; a fizzing fuse and a shiver before it goes
    const [hx, hy] = hop(-46, -32, 72, 32, t, 300, -3, 0.45, 0.6, 1);
    const roll = seg(t, REST, REST + 0.12), x = hx + 2 * ease.outCubic(roll), shiver = t > BOOM - 0.1 ? (Math.floor(t * 60) % 2 ? 1 : -1) : 0;
    const a = lerp(-TAU - 0.9, 0.3, ease.outCubic(seg(t, 0, REST + 0.12))), dx = Math.sin(a), dy = -Math.cos(a);
    const cx = x + shiver * 0.6, cy = hy;
    p.beam(cx - dx, cy - dy, cx + dx * 0.8, cy + dy * 0.8, 5.4, (u, v) => {
      const groove = (u * 3.2) % 1 < 0.22;
      return v > 0.78 ? BODY[0] : groove ? BODY[1] : v < 0.35 && u > 0.4 ? BODY[3] : BODY[2];
    });
    p.beam(cx + dx * 2.4, cy + dy * 2.4, cx + dx * 3.6, cy + dy * 3.6, 2.4, (u, v) => (v < 0.4 ? CAP[1] : CAP[0]));
    if (t > REST - 0.1) {
      const sx = cx + dx * 4.6, sy = cy + dy * 4.6;
      burst(3, S + Math.floor(t * 30), (r) => p.px(sx + r.range(-1.5, 1.5), sy + r.range(-1.5, 0.5), r.next() < 0.5 ? F[7] : F[5]));
      p.light(sx, sy, F[5], 0.6);
    }
    return;
  }
  const age = t - BOOM;
  // scorch on the floor
  const sc = seg(age, 0.03, 0.15) * (1 - seg(t, 1.8, 2.3));
  if (sc > 0) p.ellipse(0, 0.5, 18, 2.5, (d) => (d > 0.65 ? CHAR[1] : CHAR[0]), sc);
  // a squat fireball that hugs the floor and cools into smoke
  const L = blast(age, S, { y: -6, n: 12, reach: [5, 15], size: [6, 9], life: [0.7, 1.0], a: -Math.PI / 2, spread: 1.9, squash: 0.7, lift: 20, rise: 20, floor: 0 });
  // a skirt of dust thrown along the floor
  burst(8, S + 1, (r, i) => {
    const side = i % 2 ? 1 : -1, L2 = r.range(0.6, 0.9);
    if (age > L2) return;
    const q = age / L2, [x] = fly(0, 0, side * r.range(50, 90), 0, age, 0, 3.4), rad = r.range(3, 4.5) * (0.6 + q * 0.8);
    L.smoke.push({ x, y: -rad * 0.6 - age * 6, r: rad, v: (1 - q) * seg(age, 0, 0.05) });
  });
  debris(p, age, 12, S + 2, [DU[3], DU[1]], { y: -3, sp: [60, 110], spread: 1.2, g: 340, life: [0.7, 1.1], size: [1, 2], floor: 0 });
  paintBlast(p, L, FIRE, SM, S);
  // shrapnel: hard, straight, fast streaks
  burst(14, S + 3, (r) => {
    const a = -Math.PI / 2 + r.range(-1.45, 1.45), sp = r.range(220, 320), L3 = r.range(0.1, 0.18);
    if (age > L3) return;
    const d = sp * age, x = Math.cos(a) * d, y = -5 + Math.sin(a) * d, len = 4 + (1 - age / L3) * 4;
    p.line(x, y, x - Math.cos(a) * len, y - Math.sin(a) * len, (u) => (u < 0.3 ? WHITE : SHRAP));
  });
  sparks(p, age, 12, S + 4, [F[7], F[5], F[3]], { floor: 0, y: -5, a: -Math.PI / 2, spread: 1.5, sp: [80, 140], life: [0.3, 0.5], g: 200 });
  flash(p, age, 0, -8, 0, 0.07, 8, F[6], { R: 30, grow: 70 });
  shock(p, age, 0, 0, 0, 0.3, 6, 36, F[6], F[5], { sy: 0.16 });
  const lt = 1 - seg(age, 0, 0.6);
  p.glow(0, -12, 34, F[5], 0.45 * lt * lt);
  pool(p, 0, 0, 34, 5, F[4], 0.45 * lt);
}
