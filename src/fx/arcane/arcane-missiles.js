import { PAL, burst, fly, seg, ease, bump, rng, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle } from "./_lib.js";

export const meta = {
  name: "Arcane missiles",
  desc: "A volley of violet bolts fans out from the hand, curls in on the target and pops one after another.",
  tags: ["arcane", "projectile", "magic", "homing", "directional", "one-shot"],
  size: [112, 56],
  origin: [12, 28],
  duration: 1.05,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, count: 4, range: 86, seed: 7 },
};

const bez = (a, b, c, d, u) => {
  const v = 1 - u;
  return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d;
};

// one missile's flight: launch time, flight time and a curve that swings out wide then hooks onto the target
function missile(o, i, n) {
  const r = rng(o.seed, i, 3), lane = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
  // alternate up and down so consecutive bolts fan apart; outer lanes swing widest
  const side = i % 2 ? 1 : -1, swing = 0.62 + 0.38 * Math.abs(lane);
  const t0 = 0.03 + i * 0.075 + r.range(-0.01, 0.015), fd = r.range(0.34, 0.42);
  const tx = o.range + r.range(-2, 2), ty = side * r.range(1, 5);
  const P = [[0, 0], [r.range(8, 18), side * swing * r.range(38, 46)], [tx - r.range(24, 34), -side * r.range(8, 16)], [tx, ty]];
  const wob = r.range(0, TAU), wf = r.range(16, 24);
  const at = (k) => {
    const u = 0.7 * k + 0.3 * k * k;
    return [bez(P[0][0], P[1][0], P[2][0], P[3][0], u), bez(P[0][1], P[1][1], P[2][1], P[3][1], u) + Math.sin(u * wf + wob) * 1.4 * (1 - u)];
  };
  return { t0, fd, at, tx, ty };
}

export function draw(p, t, o) {
  const C = fit(o.palette), n = o.count, S = o.seed;
  const ms = Array.from({ length: n }, (_, i) => missile(o, i, n));
  // the casting hand: a small orb that throbs with each launch
  const last = ms[n - 1].t0;
  if (t < last + 0.14) {
    let kick = 0;
    for (const m of ms) kick = Math.max(kick, bump(t, m.t0 - 0.02, m.t0 + 0.1));
    const fade = 1 - seg(t, last + 0.02, last + 0.14);
    p.circle(0, 0, 1.6 + 1.6 * kick, (d) => (d < 0.5 ? WHITE : d < 0.8 ? C[6] : C[5]), fade);
    p.glow(0, 0, 12, C[4], (0.25 + 0.3 * kick) * fade);
  }
  ms.forEach((m, i) => {
    const k = seg(t, m.t0, m.t0 + m.fd);
    // motes shed along the path, lingering after the bolt has passed
    burst(5, S * 31 + i, (r) => {
      const km = r.range(0.06, 0.85), age = t - (m.t0 + m.fd * km), life = r.range(0.16, 0.3);
      if (age < 0 || age > life) return;
      const [x0, y0] = m.at(km), q = age / life;
      const [x, y] = fly(x0, y0, r.range(-12, 12), r.range(-14, 10), age, 0, 5);
      p.dot(x, y, q < 0.4 ? C[6] : q < 0.75 ? C[5] : C[4], 1 - q * 0.7);
    });
    if (k > 0 && k < 1) {
      // trail: a tapering tail of older positions, cooling from white-violet to deep violet
      const TR = [C[6], C[5], C[5], C[4], C[4], C[3], C[3], C[2], C[2]];
      let [px, py] = m.at(k);
      for (let j = 1; j <= TR.length; j++) {
        const kj = k - j * 0.03;
        if (kj < 0) break;
        const [x, y] = m.at(kj), w = 3.2 - j * 0.3;
        if (w > 1.6) p.beam(px, py, x, y, w, (u, v) => (v < 0.5 ? TR[j - 1] : TR[j]));
        else p.line(px, py, x, y, TR[j - 1], j < 8 ? 1 : 0.5);
        px = x;
        py = y;
      }
      // the bolt: a small hot orb
      const [x, y] = m.at(k);
      p.circle(x, y, 2.3, (d) => (d < 0.5 ? WHITE : d < 0.85 ? C[6] : C[5]));
      p.glow(x, y, 8, C[5], 0.4);
      p.light(x, y, C[6], 0.6);
    }
    // the hit: a white star for two frames, a ring and a pinch of sparks
    const a = t - (m.t0 + m.fd);
    if (a >= 0 && a < 0.32) {
      const q = a / 0.32;
      if (a < 0.034) {
        p.circle(m.tx, m.ty, 4, WHITE);
        p.line(m.tx - 8, m.ty, m.tx + 8, m.ty, C[6]);
        p.line(m.tx, m.ty - 7, m.tx, m.ty + 7, C[6]);
      } else if (a < 0.1) {
        p.circle(m.tx, m.ty, 3, (d) => (d < 0.5 ? WHITE : C[6]));
        sparkle(p, m.tx, m.ty, 3, C[6], C[5], WHITE);
      }
      const rr = seg(a, 0.02, 0.2);
      if (rr > 0 && rr < 1) p.ring(m.tx, m.ty, 4 + 6 * ease.outCubic(rr), 1, rr < 0.4 ? C[6] : C[5], rr < 0.5 ? 1 : 2 * (1 - rr));
      burst(5, S * 17 + i, (r) => {
        const ang = r.range(0, TAU), sp = r.range(45, 85), life = r.range(0.14, 0.3);
        if (a > life) return;
        const [x, y] = fly(m.tx, m.ty, Math.cos(ang) * sp, Math.sin(ang) * sp, a, 30, 6);
        p.px(x, y, a / life < 0.5 ? C[6] : C[4]);
      });
      p.glow(m.tx, m.ty, 14, C[4], 0.55 * (1 - q) * (1 - q));
    }
  });
}
