import { PAL, ramp, at, burst, fly, seg, ease, lerp, TAU, WHITE } from "../../core/index.js";
import { actorOf } from "./_lib.js";

export const meta = {
  name: "Teleport sparkle",
  desc: "Sparkles spiral in around an empty spot, tightening into a whirling helix, then flash into the character's white silhouette, which fades to reveal them.",
  tags: ["spawn", "teleport", "sparkle", "magic", "arrive", "one-shot"],
  size: [52, 56],
  origin: [26, 50],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.neon, count: 14, seed: 30 },
};

const ARRIVE = 0.62;

/** The stand-in (or your own sprite) isn't here until the sparkles arrive; a white copy covers it, then fades off. */
export const actorAlpha = (t) => (t < ARRIVE ? 0 : 1);

/** A twinkle: a 4-point star of size s (0: one pixel, 1: a plus, 2: long arms). */
function twinkle(p, x, y, s, c, core) {
  if (s >= 1) for (let i = 1; i <= s; i++) p.px(x + i, y, c), p.px(x - i, y, c), p.px(x, y + i, c), p.px(x, y - i, c);
  p.px(x, y, core);
}

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, a = actorOf(o), m = a.mask, n = o.count;
  // on arrival a white copy of the character covers it, then fades off to reveal it
  if (t >= ARRIVE) {
    const reveal = seg(t, ARRIVE + 0.06, ARRIVE + 0.38);
    if (reveal < 1) p.mask(m, a.x, a.y, t < ARRIVE + 0.06 ? WHITE : at(C, 0.86), 1 - reveal);
  }
  // the helix: sparkles wheel in around the spot, tightening and speeding up, the far side dimmer
  const conv = ease.inQuad(seg(t, 0, ARRIVE));
  if (t < ARRIVE)
    for (let i = 0; i < n; i++) {
      const h = -2 - (i / (n - 1)) * (m.h - 3), base = (i / n) * TAU * 2.3;
      const pos = (tt) => {
        const cv = ease.inQuad(seg(tt, 0, ARRIVE)), th = base + tt * 6 + tt * tt * 14, R = lerp(16, 2, cv);
        return [Math.cos(th) * R, h + Math.sin(th) * R * 0.22 - (1 - cv) * 3, Math.sin(th)];
      };
      const [x, y, z] = pos(t), front = z > 0;
      for (let j = 2; j >= 1; j--) {
        const [qx, qy] = pos(Math.max(0, t - j * 0.025));
        p.px(qx, qy, j === 1 ? at(C, front ? 0.62 : 0.45) : at(C, front ? 0.45 : 0.32));
      }
      const tw = Math.floor(t * 20 + i * 1.7) % 4;
      twinkle(p, x, y, front ? (tw === 0 ? 2 : 1) : tw === 0 ? 1 : 0, front ? at(C, 0.8) : at(C, 0.55), front ? WHITE : at(C, 0.7));
    }
  // the arrival: a flash ring, sparkles flung out, twinkling as they slow and fade
  const te = t - ARRIVE;
  if (te >= 0) {
    const ring = seg(te, 0, 0.22);
    if (ring < 1) p.ring(0, -10, 6 + 9 * ease.outCubic(ring), 1, at(C, 0.86), 1 - ring);
    burst(12, S, (r, i) => {
      const ang = r.range(0, TAU), v = r.range(50, 100), life = r.range(0.35, 0.6);
      if (te > life) return;
      const k = te / life, [x, y] = fly(0, -10, Math.cos(ang) * v, Math.sin(ang) * v * 0.8, te, 20, 4.5);
      if (y > -1 || (k > 0.6 && Math.floor(te * 24 + i) % 2)) return;
      twinkle(p, x, y, k < 0.25 ? 2 : k < 0.6 ? 1 : 0, at(C, 0.8), k < 0.5 ? WHITE : at(C, 0.7));
    });
  }
  // light: gathers with the sparkles, bursts on arrival, lets go
  const L = t < ARRIVE ? conv * 0.35 : 0.6 * Math.max(0, 1 - te / 0.45) ** 2;
  p.glow(0, -10, 22, at(C, 0.62), L);
}
