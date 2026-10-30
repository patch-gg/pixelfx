import { cycle, ease, fract, clamp, TAU } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Slowed",
  desc: "A clock dial stands behind the target, its rim turning slowly and its hands ticking in heavy steps, while drops of time sink off it.",
  tags: ["status", "slow", "time", "clock", "debuff", "loop"],
  size: [44, 46],
  origin: [22, 42],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: {
    palette: ["#060c1c", "#0c1a38", "#14305e", "#1e4c8c", "#2c70bc", "#4a9ae0", "#86c8f8", "#d8f0ff"],
    radius: 14, seed: 4,
  },
};

const center = (a) => [0, a.y + 5];

// behind the body: the dial
export function drawBack(p, t, o) {
  const C = steps(o.palette), a = o.actor, ph = t / meta.duration, R = o.radius, [cx, cy] = center(a);
  // rim: four arcs with gaps, a quarter turn a loop
  for (let i = 0; i < 4; i++) {
    const a0 = ph * (TAU / 4) + (i * TAU) / 4 - Math.PI / 2 + 0.2;
    p.arc(cx, cy, R, 2, a0, a0 + 1.15, (u, v) => (v > 0.5 ? (u > 0.85 ? C[7] : C[6]) : C[4]));
  }
  // ticks
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * TAU, big = i % 3 === 0, r0 = R - (big ? 5 : 4), r1 = R - 3;
    p.line(cx + Math.cos(th) * r0, cy + Math.sin(th) * r0, cx + Math.cos(th) * r1, cy + Math.sin(th) * r1, big ? C[5] : C[3]);
  }
  // hands: tick forward a twelfth at a time and settle with a heavy bounce; the long one laps once a loop
  const hand = (laps, len, c) => {
    const s = ph * 12 * laps, k = fract(s), th = ((Math.floor(s) + ease.outBack(clamp(k / 0.3), 2.6)) / 12) * TAU - Math.PI / 2;
    p.line(cx, cy, cx + Math.cos(th) * len, cy + Math.sin(th) * len, c);
    p.light(cx + Math.cos(th) * len, cy + Math.sin(th) * len, C[6], 0.35);
  };
  hand(1 / 12, R - 8, C[6]);
  hand(1, R - 5, C[7]);
  p.px(cx, cy, C[7]);
  p.glow(cx, cy, R + 8, C[4], 0.16);
}

// in front: drops of time leaving the bottom of the dial, sinking slowly then faster, splatting
export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, R = o.radius, [cx, cy] = center(a);
  cycle(t, meta.duration, 6, o.seed, (r) => r.range(0.9, 1.3), (age, life, r) => {
    const th = r.range(0.25, Math.PI - 0.25), x = cx + Math.cos(th) * (R - 1), y0 = cy + Math.sin(th) * (R - 1);
    if (Math.abs(x) < a.w / 2 + 1 && y0 < -1) return; // hidden behind the body
    const k = age / life, fall = ease.inQuad(clamp(k / 0.85)), y = y0 + (-1 - y0) * fall;
    if (k < 0.85) {
      p.px(x, y, C[6]), p.px(x, y - 1, C[4]);
      if (fall > 0.25) p.px(x, y - 2, C[3]);
    } else {
      const s = (k - 0.85) / 0.15, w = Math.round(1 + s * 2);
      p.line(x - w, -1, x + w, -1, s < 0.5 ? C[5] : C[3]);
    }
  });
}
