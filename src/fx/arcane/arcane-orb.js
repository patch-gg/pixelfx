import { PAL, cycle, TAU, WHITE } from "../../core/index.js";
import { fit, tiltedOval, sparkle } from "./_lib.js";

export const meta = {
  name: "Arcane orb",
  desc: "A floating violet orb, energy swirling inside it, bobbing gently while two tilted rings orbit it, passing behind and in front.",
  tags: ["arcane", "orb", "magic", "floating", "pickup", "loop"],
  size: [48, 48],
  origin: [24, 24],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, radius: 7, seed: 14 },
};

// the two rings: size, tilt, how fast their beads run (whole laps a loop, so it loops clean)
const RINGS = [
  { rx: 15, ry: 4.5, tilt: 0.38, laps: 1, wob: 0 },
  { rx: 13, ry: 5.5, tilt: -0.62, laps: -2, wob: 1.7 },
];

function rings(p, t, o, front) {
  const C = fit(o.palette), ph = t / meta.duration, by = Math.round(Math.sin(ph * TAU) * 1.5);
  for (const g of RINGS) {
    const tilt = g.tilt + 0.08 * Math.sin(ph * TAU + g.wob), beads = [ph * TAU * g.laps, ph * TAU * g.laps + Math.PI];
    const show = (ang) => Math.sin(ang) > 0 === front;
    tiltedOval(p, 0, by, g.rx, g.ry, tilt, (ang) => {
      for (const b of beads) {
        const d = Math.abs(Math.atan2(Math.sin(ang - b), Math.cos(ang - b)));
        if (d < 0.18) return WHITE;
        if (d < 0.5) return C[6];
      }
      return front ? C[6] : C[3];
    }, (ang) => (show(ang) ? 1 : 0));
    for (const b of beads) {
      if (Math.sin(b) > 0 !== front) continue;
      const u = Math.cos(b) * g.rx, v = Math.sin(b) * g.ry;
      const x = u * Math.cos(tilt) - v * Math.sin(tilt), y = by + u * Math.sin(tilt) + v * Math.cos(tilt);
      p.light(x, y, C[6], 0.6);
    }
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, R = o.radius, S = o.seed, by = Math.round(Math.sin(ph * TAU) * 1.5);
  rings(p, t, o, false);
  // the orb: lit from the top left, a swirl of brighter bands turning inside, a hard rim
  p.circle(0, by, R + 1, C[2]);
  p.circle(0, by, R, (d, ang) => {
    const lit = -Math.cos(ang - 0.6) * d; // brighter toward the upper left
    const swirl = Math.sin(ang * 3 + d * 5 - ph * TAU * 3) > 0.7 && d > 0.3 && d < 0.85;
    const v = (1 - d) * 1.6 + lit * 1.1 + (swirl ? 0.6 : 0);
    return v > 2.1 ? WHITE : v > 1.55 ? C[6] : v > 0.95 ? C[5] : v > 0.45 ? C[4] : C[3];
  });
  p.px(-3, by - 4, WHITE);
  p.px(-4, by - 3, C[6]);
  rings(p, t, o, true);
  // a few motes drifting up and twinkling around it
  cycle(t, meta.duration, 6, S, (r) => r.range(0.6, 1), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU), rad = r.range(9, 17);
    const x = Math.cos(a) * rad, y = by + Math.sin(a) * rad * 0.8 - age * 10;
    sparkle(p, x, y, k > 0.3 && k < 0.6 ? 1 : 0, C[5], C[5], k < 0.6 ? C[6] : C[5]);
  });
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glow(0, by, 22, C[4], 0.22 * pulse);
  p.glow(-2, by - 2, 7, C[6], 0.22 * pulse);
}

