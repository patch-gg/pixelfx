import { PAL, cycle, TAU, WHITE } from "../../core/index.js";
import { fit, sparkle, ovalLine } from "./_lib.js";

export const meta = {
  name: "Divine shield",
  desc: "A golden bubble round the actor: two meridians turn on it like a globe, a band of light sweeps the near side, the rim glints and sparkles.",
  tags: ["holy", "shield", "barrier", "bubble", "buff", "character", "loop"],
  size: [40, 42],
  origin: [20, 36],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.holy, radius: 13, seed: 35 },
};

const CY = -11;

// the wireframe: two meridians half a turn a loop (they swap places, so it repeats) and an equator.
// front: the near halves, drawn over the actor; otherwise the far halves, behind it.
function globe(p, t, o, front) {
  const C = fit(o.palette), R = o.radius - 0.5, ph = t / meta.duration;
  const band = -2.2 * R + 4.4 * R * ph; // the sweep of light, off the ball at both ends of the loop
  const lit = (x, y) => Math.abs((x - y) * 0.7071 - band) < 4;
  for (const th of [ph * Math.PI, ph * Math.PI + Math.PI / 2]) {
    const sx = Math.sin(th), cz = Math.cos(th), rx = R * Math.abs(sx);
    if (rx < 1) continue;
    const near = (ang) => cz * Math.cos(ang) * Math.sign(sx) > 0;
    // the near halves only show where the sweep of light catches them: the bubble stays clear over the actor
    ovalLine(p, rx, R, (ang) => (front ? (Math.abs((Math.cos(ang) * rx - Math.sin(ang) * R) * 0.7071 - band) < 1.5 ? WHITE : C[6]) : C[3]),
      (ang) => (near(ang) === front && Math.abs(Math.sin(ang)) < 0.93 && (!front || lit(Math.cos(ang) * rx, Math.sin(ang) * R)) ? 1 : 0), 0, CY);
  }
  ovalLine(p, R, R * 0.28, (ang) => (front && lit(Math.cos(ang) * R, Math.sin(ang) * R * 0.28) ? WHITE : front ? C[5] : C[3]),
    (ang) => (Math.sin(ang) > 0 === front ? 1 : 0), 0, CY);
}

export const drawBack = (p, t, o) => globe(p, t, o, false);

export function draw(p, t, o) {
  const C = fit(o.palette), R = o.radius, ph = t / meta.duration, S = o.seed;
  globe(p, t, o, true);
  // the rim: bright at the top left where the light catches it, deeper at the bottom right
  const breathe = 0.5 + 0.5 * Math.sin(ph * TAU * 2);
  p.ring(0, CY, R, 1, (v, a) => {
    const l = Math.cos(a + 2.36); // 1 at the top left
    return l > 0.75 ? WHITE : l > -0.2 ? C[5] : breathe > 0.5 ? C[4] : C[3];
  });
  p.ring(0, CY, R - 1, 1, C[4], (v, a) => (Math.cos(a + 2.36) < -0.55 ? 1 : 0));
  p.arc(0, CY, R - 3, 1, -2.75, -2.05, WHITE);
  // sparkles winking on the surface
  cycle(t, meta.duration, 4, S, 0.45, (age, life, r) => {
    const k = age / life, a = r.range(0, TAU), rr = r.range(0.35, 0.9) * R;
    sparkle(p, Math.cos(a) * rr, CY + Math.sin(a) * rr, k < 0.3 ? 1 : k < 0.6 ? 2 : k < 0.85 ? 1 : 0, C[6], C[5], WHITE);
  });
  p.glow(0, CY, R + 8, C[4], 0.14 + 0.06 * breathe);
  p.glow(-R * 0.5, CY - R * 0.5, 7, C[6], 0.2);
}
