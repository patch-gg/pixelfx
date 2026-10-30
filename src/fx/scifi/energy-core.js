import { PAL, ramp, at, seg, ease, rng, rand, wrap, TAU, WHITE } from "../../core/index.js";
import { steps, jagged, brokenRing } from "./_lib.js";

export const meta = {
  name: "Energy core",
  desc: "A reactor core held in a steel cage: a swirling ball of light swells on every beat and throws off a shock ring, two tilted rings orbit it, arcs jump to the cage.",
  tags: ["scifi", "reactor", "core", "power", "machine", "prop", "loop"],
  size: [60, 68],
  origin: [30, 34],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.gold, radius: 8, seed: 35 },
};

const METAL = ramp(["#121119", "#24222f", "#3a3748", "#575369", "#7d7891", "#a7a2b8"]);
const BEAT = 0.8, RAIL = 16;

// a tilted ring: points around it with their depth (positive is toward us)
function ringPts(rx, ry, tilt, n = 96) {
  const out = [], ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([x * ct - y * st, x * st + y * ct, Math.sin(a), a]);
  }
  return out;
}

export function draw(p, t, o) {
  const C = steps(o.palette, 8), S = o.seed, ph = t / meta.duration, bt = wrap(t, BEAT), beat = Math.floor(t * 20);
  const swell = 1 - ease.outCubic(seg(bt, 0, 0.45)), R = o.radius + 1.6 * swell;
  const rings = [[17, 5, 0.38, 1], [16, 4.5, -0.42, -1]];

  // the cage: rails, then caps top and bottom
  for (const s of [-1, 1]) {
    p.rect(s * RAIL - (s > 0 ? 0 : 1), -22, 2, 44, METAL[2]);
    p.rect(s * RAIL + (s > 0 ? 1 : -1), -22, 1, 44, METAL[1]);
  }

  // far halves of the orbit rings
  const orbit = (front) => rings.forEach(([rx, ry, tilt, dir], k) => {
    for (const [x, y, z, a] of ringPts(rx, ry, tilt)) {
      if (z > 0 !== front) continue;
      const run = wrap(a / TAU - ph * dir * 2 - k * 0.5, 1), hot = run < 0.1 || (run > 0.5 && run < 0.56);
      p.px(x, y, front ? (hot ? WHITE : C[5]) : hot ? C[5] : C[3]);
    }
  });
  orbit(false);

  // the core: a swirling ball, white at the heart
  p.circle(0, 0, R, (d, a) => {
    const sw = Math.sin(a * 3 + ph * TAU * 2 + d * 6) > 0.4 && d > 0.3 ? 0.18 : 0;
    return at([C[4], C[5], C[6], C[7], WHITE], 1.05 - d * 0.95 + sw + swell * 0.15);
  });

  orbit(true);

  // the shock ring thrown off on each beat
  const sk = seg(bt, 0, 0.5);
  if (sk < 1) brokenRing(p, 0, 0, R + 2 + 11 * ease.outCubic(sk), 1, { n: 8, gap: seg(sk, 0.3, 1), seed: S + Math.floor(t / BEAT), c: sk < 0.25 ? C[7] : sk < 0.55 ? C[6] : C[4] });

  // arcs leaping from the core to the cage now and then
  if (rand(S, beat, 1) < 0.35) {
    const r = rng(S, beat, 2), s = r.sign(), y = r.range(-12, 12);
    const pts = jagged(r, s * (R - 1), y * 0.4, s * (RAIL - 1), y, { step: 3, amp: 1.6 });
    p.polyline(pts, beat % 2 ? C[6] : WHITE);
    p.px(s * (RAIL - 1), y, WHITE);
  }

  // caps with status lights that flash on the beat
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -28 : 22;
    p.poly(s < 0 ? [[-12, y0], [12, y0], [9, y0 + 6], [-9, y0 + 6]] : [[-9, y0], [9, y0], [12, y0 + 6], [-12, y0 + 6]], (x, y) =>
      (s < 0 ? y < y0 + 2 : y < y0 + 1) ? METAL[4] : x < -3 ? METAL[3] : METAL[2]);
    for (const x of [-6, 0, 6]) p.px(x, y0 + 3, swell > 0.5 ? C[7] : C[3]);
  }

  p.glow(0, 0, 30, C[4], 0.3 + 0.25 * swell);
  p.glow(0, 0, 11, C[6], 0.35 + 0.2 * swell);
}
