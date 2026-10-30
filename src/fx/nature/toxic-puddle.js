import { ramp, cycle, noise, ease, clamp, TAU } from "../../core/index.js";

export const meta = {
  name: "Toxic puddle",
  desc: "A pool of thick green sludge on the floor: fat bubbles swell, wobble and pop with a spit and a ripple, a sheen slides across, little bubbles float up and burst.",
  tags: ["nature", "poison", "puddle", "hazard", "ground", "loop"],
  size: [56, 40],
  origin: [28, 32],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0d1a0c", "#173a14", "#265e18", "#3f8a1e", "#6cb82a", "#a8e04a", "#e0ff8a"], width: 20, seed: 13 },
};

const BIG = [".##.", "#o.#", "#..#", ".##."];
const SMALL = [".#.", "#.#", ".#."];

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, D = meta.duration, ph = t / D, RX = o.width, RY = 4.5;
  // the pool's outline: an ellipse with a few soft lobes that breathe
  const rim = (ang) => 1 + 0.07 * Math.sin(ang * 3 + 1.3 + S) + 0.04 * Math.sin(ang * 5 + ph * TAU);
  const sheen = -RX * 0.9 + ph * RX * 1.8;
  p.shade(-RX - 3, -RY - 2, RX + 3, RY + 2, (x, y) => {
    const ang = Math.atan2(y / RY, x / RX), w = rim(ang);
    const dx = x / (RX * w), dy = y / (RY * w), d = Math.sqrt(dx * dx + dy * dy);
    if (d > 1) return;
    // dark lip in front, pale bank behind, a lighter band across the far half of the surface
    if (dy > 0 && d > 0.7) return C[1];
    if (dy <= 0 && d > 0.84) return C[4];
    const s = Math.abs(x - sheen) / 4 + Math.abs(dy + 0.35) * 2;
    if (s < 1 && dy < 0) return s < 0.45 ? C[5] : C[4];
    return dy < -0.2 ? C[3] : C[2];
  });
  p.px(-RX * 0.55, -RY * 0.55, C[6]), p.px(-RX * 0.55 + 1, -RY * 0.55, C[5]);

  // fat bubbles: swell and wobble, then burst with a spit of droplets and a flat ripple
  cycle(t, D, 5, S + 2, (r) => r.range(1, 1.4), (age, life, r) => {
    const q = age / life, bx = r.range(-0.65, 0.65) * RX, by = r.range(-0.3, 0.4) * RY, big = r.next() < 0.5;
    const R = big ? r.range(3.6, 4.6) : r.range(2.2, 2.8), grow = 0.72;
    if (q < grow) {
      const s = R * ease.outCubic(q / grow), wob = 1 + 0.1 * Math.sin(age * 26 + bx), cy = by - s * 0.6;
      p.ellipse(bx, cy, s * wob + 0.3, s / wob + 0.3, (d, ang) =>
        d > 0.74 ? C[1] : ang < -0.8 && ang > -2.7 && d > 0.3 ? C[5] : ang > 0.4 && d > 0.4 ? C[3] : C[4]);
      if (s > 1.5) p.px(bx - s * 0.4, cy - s * 0.5, C[6]);
      return;
    }
    const k = (q - grow) / (1 - grow), tt = (q - grow) * life;
    // the pop: a flash of the burst skin, then a ripple spreading on the surface
    if (k < 0.1) p.ring(bx, by - R * 0.6, R + 1, 1, C[5]);
    if (k > 0.05 && k < 0.6) p.ellipse(bx, by, R + 1 + k * 7, 1.2 + k * 1.8, k < 0.3 ? C[5] : C[4], (d) => (d > 0.72 ? 1 : 0));
    for (let j = 0; j < (big ? 3 : 2); j++) {
      const a = -Math.PI / 2 + (j - (big ? 1 : 0.5)) * 0.55, sp = 30 + j * 6;
      const x = bx + Math.cos(a) * sp * tt, y = by - R + Math.sin(a) * sp * tt + 0.5 * 230 * tt * tt;
      if (y < by - 1) p.px(x, y, k < 0.4 ? C[6] : C[5]);
    }
  });
  // little bubbles break loose and float up, wobbling, then burst
  cycle(t, D, 6, S + 3, (r) => r.range(1, 1.6), (age, life, r) => {
    const q = age / life, x = r.range(-0.6, 0.6) * RX + Math.sin(age * r.range(4, 7) + r.next() * TAU) * 1.5;
    const y = -3 - ease.outQuad(q) * r.range(14, 22), s = r.range(1.2, 2);
    if (q > 0.9) {
      p.px(x - 2, y, C[5]), p.px(x + 2, y, C[5]), p.px(x, y - 2, C[5]), p.px(x, y + 2, C[5]);
      return;
    }
    if (s > 1.6) p.sprite(BIG, { "#": C[4], o: C[6] }, x - 2, y - 2);
    else p.sprite(SMALL, { "#": C[4] }, x - 1, y - 1);
    p.light(x, y, C[4], 0.25);
  });
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glow(0, -2, RX + 10, C[4], 0.18 * pulse);
}
